// The editor sits behind the middleware, but /studio/login still answers 200
// to anyone, so keep the whole segment out of the index.
export const metadata = {
  robots: { index: false, follow: false },
}

export default function StudioLayout({ children }) {
  return children
}
