import { auth } from "@/auth"
import { redirect } from "next/navigation"

// 校验当前用户是管理员，否则重定向：
// - 未登录 -> /login
// - 已登录但非管理员 -> /
// 通过校验后返回 session（含用户信息）
export async function requireAdmin() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/")
  return session
}
