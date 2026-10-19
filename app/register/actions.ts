"use server"

import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"
import { redirect } from "next/navigation"

// 注册表单的状态类型（用于在页面上显示错误信息）
export type RegisterState = { error?: string }

// 注册 Server Action：由注册页的 useActionState 调用
export async function register(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const name = (formData.get("name") as string)?.trim()
  const password = formData.get("password") as string

  // 1. 基础校验
  if (!email || !name || !password) {
    return { error: "请填写完整的注册信息" }
  }
  if (password.length < 6) {
    return { error: "密码至少需要 6 位" }
  }

  // 2. 检查邮箱是否已被注册
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    return { error: "该邮箱已被注册，请直接登录" }
  }

  // 3. 用 bcrypt 加密密码（加盐 10 轮），绝不存明文
  const hashedPassword = await hash(password, 10)

  // 4. 创建用户（角色固定为普通读者 USER；管理员由后台/种子数据创建）
  await prisma.user.create({
    data: { email, name, password: hashedPassword, role: "USER" },
  })

  // 5. 注册成功，跳转到登录页
  redirect("/login")
}
