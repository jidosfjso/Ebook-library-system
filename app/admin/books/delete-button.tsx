"use client"

import { useActionState } from "react"
import { deleteBook } from "./actions"

// 删除图书按钮（客户端组件）：带二次确认，有未归还借阅时禁用
export default function DeleteBookButton({
  bookId,
  activeLoans,
}: {
  bookId: string
  activeLoans: number
}) {
  const [state, formAction, pending] = useActionState(deleteBook, {})
  const blocked = activeLoans > 0

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        // 删除是不可逆操作，先弹确认框；取消则阻止提交
        if (!window.confirm("确定删除这本书吗？已归还的借阅记录也会一并删除。")) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="bookId" value={bookId} />
      <button
        type="submit"
        className="delete-btn"
        disabled={pending || blocked}
        title={blocked ? `还有 ${activeLoans} 本未归还，无法删除` : undefined}
      >
        {pending ? "删除中..." : "删除"}
      </button>
      {state.error && <p className="error-text">{state.error}</p>}
    </form>
  )
}
