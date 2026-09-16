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
 * Commits one or more files (text and/or binary, e.g. an article's page.mdx
 * alongside any images it references) as a SINGLE atomic commit, using
 * GitHub's low-level Git Data API rather than the one-file-per-request
 * Contents API. This is what lets an article edit that also adds new images
 * land as one commit instead of several.
 *
 * `files` is `[{ path, content, encoding }]` where `encoding` is 'utf-8'
 * (default) or 'base64'. Fails if the branch moved since we read its HEAD
 * (the ref update is a fast-forward-only PATCH), which doubles as the
 * concurrent-edit guard.
 */
export async function commitFiles(files, { message } = {}) {
  const { owner, name, branch } = getConfig()
  const repoPath = `/repos/${owner}/${name}`

  const refResponse = await githubFetch(`${repoPath}/git/ref/heads/${branch}`)
  if (!refResponse.ok) {
    throw new Error(`Failed to read branch ref: ${refResponse.status} ${await refResponse.text()}`)
  }
  const { object: ref } = await refResponse.json()

  const baseCommitResponse = await githubFetch(`${repoPath}/git/commits/${ref.sha}`)
  if (!baseCommitResponse.ok) {
    throw new Error(
      `Failed to read base commit: ${baseCommitResponse.status} ${await baseCommitResponse.text()}`,
    )
  }
  const baseCommit = await baseCommitResponse.json()

  const treeEntries = []
  for (const file of files) {
    const blobResponse = await githubFetch(`${repoPath}/git/blobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: file.content, encoding: file.encoding || 'utf-8' }),
    })
    if (!blobResponse.ok) {
      throw new Error(
        `Failed to create blob for "${file.path}": ${blobResponse.status} ${await blobResponse.text()}`,
      )
    }
    const blob = await blobResponse.json()
    treeEntries.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha })
  }

  const treeResponse = await githubFetch(`${repoPath}/git/trees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree: treeEntries }),
  })
  if (!treeResponse.ok) {
    throw new Error(`Failed to create tree: ${treeResponse.status} ${await treeResponse.text()}`)
  }
  const tree = await treeResponse.json()

  const commitResponse = await githubFetch(`${repoPath}/git/commits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, tree: tree.sha, parents: [ref.sha] }),
  })
  if (!commitResponse.ok) {
    throw new Error(`Failed to create commit: ${commitResponse.status} ${await commitResponse.text()}`)
  }
  const commit = await commitResponse.json()

  const updateRefResponse = await githubFetch(`${repoPath}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sha: commit.sha }),
  })
  if (!updateRefResponse.ok) {
    throw new Error(
      `Branch changed since this was loaded — refresh and try again. ` +
        `(${updateRefResponse.status} ${await updateRefResponse.text()})`,
    )
  }

  return { commitSha: commit.sha }
}
