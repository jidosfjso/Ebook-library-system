import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"

// 完整认证配置：在 authConfig 基础上加入 Credentials 登录（邮箱 + 密码）
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Credentials 登录必须使用 JWT 会话策略（不依赖数据库 Adapter）
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "邮箱密码登录",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      // 校验邮箱和密码：成功返回用户信息，失败返回 null
      authorize: async (credentials) => {
        const email = (credentials?.email as string)?.trim().toLowerCase()
        const password = credentials?.password as string

        if (!email || !password) return null

        // 1. 根据邮箱查用户
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return null

        // 2. 用 bcrypt 比对密码（user.password 存的是加密后的哈希）
        const valid = await compare(password, user.password)
        if (!valid) return null

        // 3. 返回给 JWT 的信息（注意：不要返回 password）
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    // 保留 authConfig 里的 authorized 回调
    ...authConfig.callbacks,
    // 登录成功时，把 id 和 role 写入 JWT token
    jwt({ token, user }) {
      if (user) {
        // user.id 在类型上标记为可选，但 authorize 一定返回了 id，这里安全断言
        token.id = user.id as string
        token.role = user.role
      }
      return token
    },
    // 每次取 session 时，把 token 里的 id/role 暴露给 session.user
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
})
