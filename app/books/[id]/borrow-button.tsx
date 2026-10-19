"use client"

import { useActionState } from "react"
import { borrowBook } from "./actions"

// 借阅按钮（客户端组件）：触发借阅 Server Action，并展示加载态和错误信息
export default function BorrowButton({
  bookId,
  disabled,
  borrowed,
}: {
  bookId: string
  disabled: boolean
  borrowed: boolean
}) {
  const [state, formAction, pending] = useActionState(borrowBook, {})

  const buttonText = borrowed
    ? "已借阅，请先归还"
    : disabled
      ? "已借完"
      : pending
        ? "借阅中..."
        : "借阅"

  return (
    <form action={formAction}>
      <input type="hidden" name="bookId" value={bookId} />
      <button
        type="submit"
        className="borrow-btn"
        disabled={disabled || borrowed || pending}
      >
        {buttonText}
      </button>
      {state.error && <p className="error-text">{state.error}</p>}
    </form>
  )
}
