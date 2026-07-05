import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import connectDB from "./mongodb"
import User from "../models/User"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        await connectDB()

        const user = await User.findOne({ email: credentials.email })
        if (!user || !user.isActive) {
           throw new Error("User not found or inactive")
        }

        const isPasswordMatch = await user.comparePassword(credentials.password)
        if (!isPasswordMatch) {
            throw new Error("Invalid credentials")
        }

        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
        if (user) {
            token.role = user.role
            token.id = user.id
        }
        return token
    },
    async session({ session, token }) {
        if (token) {
            session.user.role = token.role
            session.user.id = token.id
        }
        return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
      strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)
