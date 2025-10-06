// This comment is added to force Turbopack to re-evaluate this module.
import NextAuth, { NextAuthOptions, User as NextAuthUser } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { Adapter } from "next-auth/adapters";
import prisma from "./prisma";
import * as bcrypt from "bcryptjs";

// Augment the default session and user types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & NextAuthUser;
  }
  interface User {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    role: string;
  }
}

// Custom adapter that extends PrismaAdapter to include the role field
function CustomPrismaAdapter(p: typeof prisma): Adapter {
  return {
    ...PrismaAdapter(p),
    async createUser(data: { name?: string | null; email: string; emailVerified?: Date | null; image?: string | null }) {
      const user = await p.user.create({
        data: {
          ...data,
          role: "USER",
        },
      });
      return {
        ...user,
        role: user.role,
        emailVerified: user.emailVerified ?? null,
      };
    },
    async getUser(id: string) {
      const user = await p.user.findUnique({ where: { id } });
      if (!user) return null;
      return {
        ...user,
        role: user.role,
        emailVerified: user.emailVerified ?? null,
      };
    },
    async getUserByEmail(email: string) {
      const user = await p.user.findUnique({ where: { email } });
      if (!user) return null;
      return {
        ...user,
        role: user.role,
        emailVerified: user.emailVerified ?? null,
      };
    },
    async getUserByAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }) {
      const account = await p.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { user: true },
      });
      if (!account) return null;
      return {
        ...account.user,
        role: account.user.role,
        emailVerified: account.user.emailVerified ?? null,
      };
    },
    async updateUser({ id, ...data }: { id: string; name?: string | null; email?: string | null; emailVerified?: Date | null; image?: string | null }) {
      const user = await p.user.update({ where: { id }, data });
      return {
        ...user,
        role: user.role,
        emailVerified: user.emailVerified ?? null,
      };
    },
  } as Adapter;
}

export const authConfig: NextAuthOptions = {
  adapter: CustomPrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
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
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { auth, signIn, signOut } = NextAuth(authConfig);