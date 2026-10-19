"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"

// 登录表单的状态类型
export type LoginState = { error?: string }

// 登录 Server Action：由登录页的 useActionState 调用
export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = (formData.get("email") as string)?.trim()
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "请填写邮箱和密码" }
  }

  try {
    // 使用 Credentials 登录，成功后跳转到首页
    await signIn("credentials", { email, password, redirectTo: "/" })
    return {}
  } catch (error) {
    // 账号或密码错误时，Auth.js 会抛出 AuthError
    if (error instanceof AuthError) {
      return { error: "邮箱或密码错误" }
    }
    // 登录成功时 signIn 内部会抛 NEXT_REDIRECT 实现跳转，这里需要原样抛出
    throw error
  }
}
