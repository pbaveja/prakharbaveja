/**
 * Renders a structured-data block. `<` is escaped because a string inside the
 * payload could otherwise close the script tag early.
 */
export function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
