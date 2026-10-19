"use client"

import { useActionState } from "react"
import Link from "next/link"
import { login } from "./actions"

// 登录页
export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, {})

  return (
    <main className="auth-page">
      <form className="auth-card" action={formAction}>
        <h1>登录</h1>
        <p className="auth-subtitle">电子书借阅管理系统</p>

        <label>
          邮箱
          <input name="email" type="email" placeholder="请输入邮箱" required />
        </label>

        <label>
          密码
          <input
            name="password"
            type="password"
            placeholder="请输入密码"
            required
          />
        </label>

        {state.error && <p className="auth-error">{state.error}</p>}

        <button type="submit" disabled={pending}>
          {pending ? "登录中..." : "登录"}
        </button>

        <p className="auth-switch">
          没有账号？<Link href="/register">去注册</Link>
        </p>
      </form>
    </main>
  )
}
