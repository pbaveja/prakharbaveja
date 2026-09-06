const ARTICLES_DIR = 'src/app/articles'
const API_ROOT = 'https://api.github.com'

function getConfig() {
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPO
  const branch = process.env.GITHUB_BRANCH || 'main'

  if (!token || !repo) {
    throw new Error('Missing GITHUB_TOKEN or GITHUB_REPO environment variable')
  }

  const [owner, name] = repo.split('/')
  if (!owner || !name) {
    throw new Error('GITHUB_REPO must be in the form "owner/repo"')
  }

  return { token, owner, name, branch }
}

async function githubFetch(path, options = {}) {
  const { token } = getConfig()

  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
    cache: 'no-store',
  })

  return response
}

/** Lists article slugs (directory names under src/app/articles) from the live repo. */
export async function listArticleSlugs() {
  const { owner, name, branch } = getConfig()
  const response = await githubFetch(
    `/repos/${owner}/${name}/contents/${ARTICLES_DIR}?ref=${branch}`,
  )

  if (!response.ok) {
    throw new Error(`Failed to list articles: ${response.status} ${await response.text()}`)
  }

  const entries = await response.json()
  return entries.filter((entry) => entry.type === 'dir').map((entry) => entry.name)
}

/** Fetches one article's page.mdx content + blob sha, or null if it doesn't exist. */
export async function getArticleFile(slug) {
  const { owner, name, branch } = getConfig()
  const path = `${ARTICLES_DIR}/${slug}/page.mdx`
  const response = await githubFetch(
    `/repos/${owner}/${name}/contents/${path}?ref=${branch}`,
  )

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch article "${slug}": ${response.status} ${await response.text()}`)
  }

  const data = await response.json()
  const content = Buffer.from(data.content, 'base64').toString('utf-8')
  return { content, sha: data.sha }
}

/**
 * Creates or updates an article's page.mdx via a direct commit to the
 * configured branch. Vercel's existing GitHub integration picks up the push
 * and deploys automatically — no separate deploy call needed.
 */
export async function putArticleFile(slug, content, { sha, message } = {}) {
  const { owner, name, branch } = getConfig()
  const path = `${ARTICLES_DIR}/${slug}/page.mdx`

  const response = await githubFetch(`/repos/${owner}/${name}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message || (sha ? `Update article: ${slug}` : `Publish article: ${slug}`),
      content: Buffer.from(content, 'utf-8').toString('base64'),
      branch,
      ...(sha ? { sha } : {}),
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to publish article "${slug}": ${response.status} ${await response.text()}`)
  }

  return response.json()
}
