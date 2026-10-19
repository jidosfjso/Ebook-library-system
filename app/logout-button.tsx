"use client"

import { signOut } from "next-auth/react"

// 退出登录按钮：客户端组件（signOut 是客户端 API），点击后清除会话并跳回登录页
export default function LogoutButton() {
  return (
    <button
      type="button"
      className="logout-btn"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      退出登录
    </button>
  )
}
