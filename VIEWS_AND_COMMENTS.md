# Article views & comments

What the feature does, how to set it up on Vercel, and where the code lives.
Requires Node 20+ (run `nvm use`; the repo has an `.nvmrc`).

## What visitors see

Every article shows an exact view count and a comment count on its header, on
`/articles` and on the home page cards. A view counts once per visitor per UTC day.
Bots and your own Studio session are not counted.

Counts are shortened and **always truncated, never rounded up**, so the short form never
overstates the real number. Hovering shows the exact value.

| Shown   | Exact      |
| ------- | ---------- |
| `999`   | 999        |
| `1.9K`  | 1,999      |
| `2K`    | 2,000      |
| `12.3K` | 12,345     |
| `12.3M` | 12,345,678 |

Comments allow one level of replies and a safe subset of Markdown (links, code, bold,
italics and lists; raw HTML is removed). Visitors can sign in with GitHub or Google, or
comment as a guest. Guest comments carry a **Guest** tag, and your own accounts get an
**Author** badge.

## Comment setting per article

Set with the **Comments** field in the Studio editor and saved in the article's
`page.mdx`. The default, `open`, isn't written to the file, so existing articles don't
change.

| Value       | Behaviour                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| `open`      | Default. Signed-in users and guests can comment.                                                        |
| `auth-only` | Only signed-in users can comment. Guests see only the sign-in buttons, and the API rejects guest posts with 401. |
| `off`       | No comment section and no comment count. The API returns 403 or 404.                                    |

## Moderation & spam

`/studio/comments` is protected by your existing Studio passphrase. It lists recent
comments, which you can filter by status or article. From there you can **hide**,
**restore** or **delete** comments, and **block** a guest's hashed IP or a signed-in
account. Blocks can be undone at the bottom of the page.

Signed-in commenters can delete their own comments. A deleted comment that has replies
stays as a `[deleted]` placeholder so the thread still reads correctly.

How guest comments are protected:

- A hidden honeypot field. Bots that fill it get a fake success response, and nothing is
  stored.
- At most 2 links per guest comment.
- Duplicates are rejected: the same author posting the same text within 1 hour gets a 409.
- Guests can't use reserved names (Prakhar, Prakhar Baveja, pbaveja, admin, author,
  moderator), and names can't contain links.
- The Studio block list.

> **Rate limits are written but switched off.** To enable them, uncomment
> `src/lib/rateLimit.js` and its call site in `src/app/api/comments/[slug]/route.js`.
> The limits are 3 per 10 min and 10 per day for guests, and 10 per 10 min and 50 per
> day for signed-in users. The form already shows a message for 429 responses.

## One-time setup

1. **Database (Neon).** In Vercel, go to **Storage → Neon**, connect it to this
   project, and let it add `DATABASE_URL`. In Neon, create a `dev` branch and use its
   connection string for the Preview and Development environments (and in
   `.env.local`). Then create the tables. This is safe to re-run:

   ```bash
   npm run db:migrate
   ```

2. **GitHub sign-in.** Create **two** OAuth apps at GitHub → Settings → Developer
   settings, because GitHub allows only one callback URL per app:

   - Production callback: `https://<your-domain>/api/auth/callback/github`
   - Local callback: `http://localhost:3000/api/auth/callback/github`

   Put the production app's keys in Vercel and the local app's keys in `.env.local`,
   as `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`.

3. **Google sign-in.** In Google Cloud Console, create an OAuth client of type *Web
   application* with both of these authorised redirect URIs:

   - `https://<your-domain>/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google`

   Then set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.

4. **Secrets.** Set these in Vercel (all environments) and in `.env.local`. They're
   also listed in `.env.example`.

   | Variable         | Value                                                                                                                                                                                                   |
   | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `AUTH_SECRET`    | Generate with `openssl rand -base64 32`                                                                                                                                                                 |
   | `HASH_SECRET`    | Generate with `openssl rand -hex 32`. Changing it later resets view dedup and invalidates IP blocks.                                                                                                    |
   | `CRON_SECRET`    | Any random string. Vercel Cron sends it to `/api/cron/prune-views`, which runs daily at 03:00 UTC (set in `vercel.json`) and removes old dedup rows.                                                    |
   | `ADMIN_USER_IDS` | Your accounts that get the Author badge, in the form `github:<numeric id>,google:<sub>`. Your GitHub numeric ID is shown at `https://api.github.com/users/<username>`. For Google, sign in once and read `user.id` from `/api/auth/session`. |

5. **Deploy.** Push the branch. The build runs `scripts/build-article-manifest.mjs`
   first, which records every article's slug and comment setting for the API routes.
   Studio publishes are commits, so every publish triggers a redeploy that refreshes
   this list.

> Sign-in doesn't work on `*.vercel.app` preview URLs, because the OAuth callbacks point
> at your real domain. Guest comments and views still work on previews.

## Where things live

| Path                               | Role                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------ |
| `db/migrations/001_init.sql`       | Tables: `article_views`, `view_dedup`, `comments`, `blocks`              |
| `src/auth.js`                      | Auth.js with GitHub and Google, JWT sessions (no session table)          |
| `src/app/api/views/[slug]`         | Records a view in one atomic SQL statement and returns the counts        |
| `src/app/api/stats`                | Counts for a whole list of articles in one request                       |
| `src/app/api/comments/[slug]`      | List and post comments, and delete your own (`/[id]`)                    |
| `src/app/api/studio/*`             | Moderation and blocks, behind the existing Studio middleware             |
| `src/components/ArticleStats.jsx`  | The view and comment counters                                            |
| `src/components/comments/`         | Comment section, form, items and Markdown renderer                       |
| `src/lib/formatCount.js`           | Truncating number formatter                                              |
| `src/lib/rateLimit.js`             | Rate limiter (commented out)                                             |

Raw IP addresses are never stored. Views use a daily-rotating salted hash, and comments
store a stable salted IP hash so blocks keep working. Database queries skip Next's fetch
cache, so counts are never served stale.

## Testing locally

```bash
npm test          # unit tests: formatting, validation, hashing
npm run dev       # regenerates the article manifest first
```

To run against a local Postgres instead of Neon, use a Neon-compatible HTTP proxy such
as `ghcr.io/timowilhelm/local-neon-http-proxy`. Set
`NEON_FETCH_ENDPOINT=http://localhost:4444/sql` and point `DATABASE_URL` at the proxy.

Without the Spotify keys set, a local `npm run build` can fail while prerendering
`/spotify`. That failure predates this feature.
