import { compare } from "bcrypt";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        // @ts-ignore - We know that user.role exists in our database
        token.role = user.role;
      }

      // If this is a sign-in or the token is being refreshed, fetch the latest user data
      if (trigger === "signIn" || trigger === "update") {
        try {
          const latestUser = await prisma.user.findUnique({
            where: {
              id: token.id as string,
            },
            select: {
              role: true,
            },
          });

          if (latestUser) {
            token.role = latestUser.role;
          }
        } catch (error) {
          console.error("Error fetching user data for JWT:", error);
        }
      }

      return token;
    },
  },
};
