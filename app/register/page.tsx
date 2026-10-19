"use client"

import { useActionState } from "react"
import Link from "next/link"
import { register } from "./actions"

// 注册页：普通读者在这里创建账号
export default function RegisterPage() {
  // useActionState：调用 Server Action，并拿到返回的状态（含错误信息）和加载状态
  const [state, formAction, pending] = useActionState(register, {})

  return (
    <main className="auth-page">
      <form className="auth-card" action={formAction}>
        <h1>注册账号</h1>
        <p className="auth-subtitle">电子书借阅管理系统</p>

        <label>
          姓名
          <input name="name" type="text" placeholder="请输入姓名" required />
        </label>

        <label>
          邮箱
          <input name="email" type="email" placeholder="请输入邮箱" required />
        </label>

        <label>
          密码
          <input
            name="password"
            type="password"
            placeholder="至少 6 位"
            required
          />
        </label>

        {state.error && <p className="auth-error">{state.error}</p>}

        <button type="submit" disabled={pending}>
          {pending ? "注册中..." : "注册"}
        </button>

        <p className="auth-switch">
          已有账号？<Link href="/login">去登录</Link>
        </p>
      </form>
    </main>
  )
}
