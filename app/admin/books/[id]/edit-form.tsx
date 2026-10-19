"use client"

import { useActionState, useEffect, useState } from "react"
import { updateBook } from "./actions"

// 编辑图书表单的 props（只传原始类型字段，避免 Date 等对象的序列化问题）
export type EditBookFormProps = {
  id: string
  title: string
  author: string
  isbn: string
  description: string
  coverUrl: string
  totalCopies: number
  availableCopies: number
}

// 编辑图书表单（客户端组件）
export default function EditBookForm({
  id,
  title,
  author,
  isbn,
  description,
  coverUrl,
  totalCopies,
  availableCopies,
}: EditBookFormProps) {
  const [state, formAction, pending] = useActionState(updateBook, {})

  // 本地选择的封面预览（objectURL），保存前即可看到新封面效果
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  // 更换选择或组件卸载时，释放上一个 objectURL，避免内存泄漏
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  // 选择本地图片后生成预览
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setLocalPreview(file ? URL.createObjectURL(file) : null)
  }

  return (
    <form className="book-form" action={formAction}>
      <input type="hidden" name="id" value={id} />

      <label>
        书名
        <input name="title" type="text" defaultValue={title} required />
      </label>

      <label>
        作者
        <input name="author" type="text" defaultValue={author} required />
      </label>

      <label>
        ISBN
        <input name="isbn" type="text" defaultValue={isbn} required />
      </label>

      <label>
        简介
        <textarea name="description" rows={4} defaultValue={description} />
      </label>

      <label>
        封面图片
        {localPreview ? (
          // 优先展示刚选择的本地图片
          // eslint-disable-next-line @next/next/no-img-element
          <img className="cover-preview" src={localPreview} alt="新封面预览" />
        ) : coverUrl ? (
          // 展示当前封面
          // eslint-disable-next-line @next/next/no-img-element
          <img className="cover-preview" src={coverUrl} alt="当前封面" />
        ) : (
          <span className="cover-preview-empty">暂无封面</span>
        )}
        <input
          name="cover"
          type="file"
          accept="image/*"
          onChange={handleCoverChange}
        />
      </label>

      <label>
        总库存
        <input
          name="totalCopies"
          type="number"
          min={0}
          defaultValue={totalCopies}
          required
        />
      </label>

      <label>
        可借库存（不能超过总库存）
        <input
          name="availableCopies"
          type="number"
          min={0}
          defaultValue={availableCopies}
          required
        />
      </label>

      {state.error && <p className="error-text">{state.error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "保存中..." : "保存修改"}
      </button>
    </form>
  )
}
