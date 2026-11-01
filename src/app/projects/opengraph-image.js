import { ImageResponse } from 'next/og'

import { Card, SIZE, loadFonts } from '@/lib/og/card'

export const alt = 'Projects — things I have built, shipped, and sidelined'
export const size = SIZE
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <Card
        title="Projects"
        eyebrow="prakharbaveja.com/projects"
        footer="Built, shipped, and sidelined"
        plate={3}
      />
    ),
    { ...SIZE, fonts: await loadFonts() },
  )
}
