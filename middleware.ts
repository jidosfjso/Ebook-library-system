import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

// 中间件使用「Edge 安全」的 authConfig（不含 Prisma），
// 避免把数据库代码引入 Edge 运行时导致报错。
export default NextAuth(authConfig).auth

// 匹配除 API、静态资源外的所有路由
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
