import assert from 'assert'
import * as cheerio from 'cheerio'
import { Feed } from 'feed'

import { SITE_URL } from '@/lib/site'

const AUTHOR = {
  name: 'Prakhar Baveja',
  email: 'prakhar.baveja@gmail.com',
  link: SITE_URL,
}

/** Protocol-relative URLs also start with a slash, and are already absolute. */
function isRootRelative(value) {
  return (
    typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//')
  )
}

export async function GET(req) {
  let feed = new Feed({
    title: AUTHOR.name,
    description: 'Thoughts on software I build, things I learn.',
    language: 'en',
    author: AUTHOR,
    id: SITE_URL,
    link: SITE_URL,
    // The generated share card, so readers that show a channel image get a
    // real PNG rather than a favicon scaled up.
    image: `${SITE_URL}/opengraph-image`,
    favicon: `${SITE_URL}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}`,
    feedLinks: {
      rss2: `${SITE_URL}/feed.xml`,
    },
  })

  // Resolved by webpack at build time, so the slug list doesn't depend on the
  // MDX files being on disk inside a serverless function.
  let articleIds = require
    .context('../articles', true, /\/page\.mdx$/)
    .keys()
    .filter((key) => key.startsWith('./'))
    .map((key) => key.slice(2).replace(/\/page\.mdx$/, ''))

  // Each article is rendered by this same deployment and scraped back, which
  // is why these are fetched rather than imported. Done in parallel: they're
  // independent, and the list grows with every post.
  let items = await Promise.all(
    articleIds.map(async (id) => {
      let html = await (
        await fetch(String(new URL(`/articles/${id}`, req.url)))
      ).text()
      let $ = cheerio.load(html)

      let article = $('article').first()
      let title = article.find('h1').first().text()
      let date = article.find('time').first().attr('datetime')
      let description = $('meta[name="description"]').attr('content')

      // This HTML is rendered inside a reader, not on the site, so any
      // root-relative URL would resolve against the reader's own origin and
      // break. srcset is covered too, for articles that use next/image.
      let body = article.find('[data-mdx-content]').first()
      body.find('[src], [href], [srcset]').each((_, element) => {
        let node = $(element)

        for (let attribute of ['src', 'href']) {
          let value = node.attr(attribute)
          if (isRootRelative(value)) node.attr(attribute, SITE_URL + value)
        }

        let srcset = node.attr('srcset')
        if (srcset) {
          node.attr(
            'srcset',
            srcset
              .split(',')
              .map((candidate) => {
                let [url, ...rest] = candidate.trim().split(/\s+/)
                return [
                  isRootRelative(url) ? SITE_URL + url : url,
                  ...rest,
                ].join(' ')
              })
              .join(', '),
          )
        }
      })

      let content = body.html()

      assert(typeof title === 'string')
      assert(typeof date === 'string')
      assert(typeof content === 'string')

      let publicUrl = `${SITE_URL}/articles/${id}`

      return {
        title,
        id: publicUrl,
        link: publicUrl,
        description,
        content,
        author: [AUTHOR],
        date: new Date(date),
      }
    }),
  )

  // Newest first — the glob above returns slugs alphabetically.
  for (let item of items.sort((a, z) => z.date - a.date)) {
    feed.addItem(item)
  }

  return new Response(feed.rss2(), {
    status: 200,
    headers: {
      'content-type': 'application/xml',
      'cache-control': 's-maxage=31556952',
    },
  })
}
