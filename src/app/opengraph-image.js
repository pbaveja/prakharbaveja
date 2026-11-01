import { ImageResponse } from 'next/og'

import { AvatarStrip, Card, SIZE, loadAvatar, loadFonts } from '@/lib/og/card'

export const alt =
  'Prakhar Baveja — thoughts on software I build, things I learn'
export const size = SIZE
export const contentType = 'image/png'

export default async function Image() {
  let [fonts, avatar] = await Promise.all([loadFonts(), loadAvatar()])

  // No title: the domain in the top rail already says whose site this is, so
  // the header's avatar square repeats in its place.
  return new ImageResponse(
    (
      <Card
        eyebrow="prakharbaveja.com"
        art={<AvatarStrip src={avatar} />}
        footer="Thoughts on software I build, things I learn"
        plate={null}
      />
    ),
    { ...SIZE, fonts },
  )
}
