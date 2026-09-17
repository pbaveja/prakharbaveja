import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'

// Commenter sign-in only — the Studio keeps its own passphrase session
// (src/lib/session.js). JWT sessions, so no database adapter is needed.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub, Google],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, account }) {
      if (account) {
        // Stable, provider-scoped id: "github:12345" / "google:1098…"
        token.uid = `${account.provider}:${account.providerAccountId}`
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid
      }
      return session
    },
  },
})
