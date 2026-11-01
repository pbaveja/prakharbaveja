import { ImageResponse } from 'next/og'

import { Card, SIZE, loadFonts } from '@/lib/og/card'

export const alt =
  'Articles — thoughts on programming, product and everything tech'
export const size = SIZE
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <Card
        title="Articles"
        eyebrow="prakharbaveja.com/articles"
        footer="Programming, product, and everything tech"
        plate={2}
      />
    ),
    { ...SIZE, fonts: await loadFonts() },
  )
}
