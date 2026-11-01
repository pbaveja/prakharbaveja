import { SITE_URL } from '@/lib/site'

const PERSON_ID = `${SITE_URL}#person`

const PERSON = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: 'Prakhar Baveja',
  url: SITE_URL,
  image: `${SITE_URL}/apple-icon.png`,
  jobTitle: 'Full Stack Software Engineer',
  sameAs: [
    'https://github.com/pbaveja',
    'https://www.linkedin.com/in/prakhar-baveja-244907106',
  ],
}

/** Person + WebSite for the homepage, linked by @id so they aren't duplicated. */
export function siteJsonLd(description) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      PERSON,
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}#website`,
        url: SITE_URL,
        name: 'Prakhar Baveja',
        description,
        publisher: { '@id': PERSON_ID },
      },
    ],
  }
}

/**
 * BlogPosting for an article. `dateModified` mirrors `datePublished`: the
 * articles don't track edits, and inventing a date would be worse than
 * repeating one.
 */
export function articleJsonLd(article, slug) {
  let url = `${SITE_URL}/articles/${slug}`

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    dateModified: article.date,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: `${SITE_URL}/og/articles/${slug}`,
    author: { '@type': 'Person', name: article.author, url: SITE_URL },
    // The full node, not a bare @id: the Person is only defined on the
    // homepage, so a reference would dangle on an article page.
    publisher: PERSON,
  }
}
