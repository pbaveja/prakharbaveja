-- Views: one exact counter per article, plus a per-day dedup table so a
-- visitor is only counted once per UTC day. Dedup rows are pruned daily.
create table if not exists article_views (
  slug text primary key,
  views bigint not null default 0
);

create table if not exists view_dedup (
  slug text not null,
  visitor_hash text not null,
  day date not null,
  primary key (slug, visitor_hash, day)
);

-- Comments: one level of replies (parent_id always points at a top-level
-- comment). Counts are computed from this table, never stored separately.
create table if not exists comments (
  id bigint generated always as identity primary key,
  slug text not null,
  parent_id bigint references comments(id) on delete cascade,
  user_id text,
  author_name text not null,
  author_image text,
  body text not null,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'deleted')),
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_slug_created_idx on comments (slug, created_at);
create index if not exists comments_ip_hash_created_idx on comments (ip_hash, created_at);
create index if not exists comments_user_id_created_idx on comments (user_id, created_at);

create table if not exists blocks (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('ip_hash', 'user_id')),
  value text not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (kind, value)
);
