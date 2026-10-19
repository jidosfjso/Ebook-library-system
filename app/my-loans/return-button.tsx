"use client"

import { useActionState } from "react"
import { returnBook } from "./actions"

// 归还按钮（客户端组件）：触发归还 Server Action
export default function ReturnButton({ loanId }: { loanId: string }) {
  const [state, formAction, pending] = useActionState(returnBook, {})

  return (
    <form action={formAction}>
      <input type="hidden" name="loanId" value={loanId} />
      <button type="submit" className="return-btn" disabled={pending}>
        {pending ? "处理中..." : "归还"}
      </button>
      {state.error && <span className="error-text">{state.error}</span>}
    </form>
  )
}
