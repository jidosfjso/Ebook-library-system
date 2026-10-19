import type { NextAuthConfig } from "next-auth"

// 基础认证配置（Edge 安全）：
// Next.js 中间件运行在 Edge 运行时，不能引入 Prisma 等 Node 专用模块。
// 所以把「不依赖数据库」的配置单独放在这里，供 middleware.ts 复用。
export const authConfig = {
  // 未登录时跳转到的登录页
  pages: {
    signIn: "/login",
  },
  // 这里不写 providers，真正的 providers 在 auth.ts 里（依赖 Prisma）
  providers: [],
  callbacks: {
    // authorized 回调：中间件每次请求都会调用，用于做路由级鉴权
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAuthPage =
        nextUrl.pathname === "/login" || nextUrl.pathname === "/register"

      // 未登录访问受保护页面 -> 返回 false，自动跳转到登录页
      if (!isLoggedIn && !isAuthPage) return false

      // 已登录访问登录/注册页 -> 重定向到首页
      if (isLoggedIn && isAuthPage) {
        return Response.redirect(new URL("/", nextUrl))
      }

      // 其余情况放行
      return true
    },
  },
} satisfies NextAuthConfig
