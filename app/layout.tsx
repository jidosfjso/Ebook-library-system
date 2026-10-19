import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "电子书借阅管理系统",
  description: "Next.js 15 + Auth.js + Prisma 电子书借阅管理系统（课程作业）",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
