import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import LogoutButton from "./logout-button"
import { prisma } from "@/lib/prisma"

// 首页：登录后才能访问，展示当前用户信息 + 功能入口
export default async function HomePage() {
  const session = await auth()

  // 未登录则跳转登录页（双保险，中间件已做路由级拦截）
  if (!session?.user) {
    redirect("/login")
  }

  const isAdmin = session.user.role === "ADMIN"

  // 读者首页展示「待还/逾期」提醒；管理员不借书，跳过
  let loanSummary: { active: number; overdue: number } | null = null
  if (!isAdmin) {
    const userId = session.user.id

    // 懒更新逾期状态，保证提醒里的逾期数量是新的
    await prisma.loan.updateMany({
      where: { userId, status: "BORROWED", dueDate: { lt: new Date() } },
      data: { status: "OVERDUE" },
    })

    // 一次 groupBy 同时拿到「未归还」和「逾期」数量，比两次 count 少一次数据库往返
    const grouped = await prisma.loan.groupBy({
      by: ["status"],
      where: { userId, status: { in: ["BORROWED", "OVERDUE"] } },
      _count: { _all: true },
    })
    const overdue =
      grouped.find((g) => g.status === "OVERDUE")?._count._all ?? 0
    const active = grouped.reduce((sum, g) => sum + g._count._all, 0)
    loanSummary = { active, overdue }
  }

  return (
    <main className="home-page">
      <header className="home-header">
        <h1>电子书借阅管理系统</h1>
        <div className="home-user">
          <span>{session.user.name}</span>
          <span className="role-badge">{isAdmin ? "管理员" : "普通读者"}</span>
          <LogoutButton />
        </div>
      </header>

      <section className="home-content">
        <h2>欢迎，{session.user.name}！</h2>
        <p>
          您当前的角色是：<strong>{isAdmin ? "管理员" : "普通读者"}</strong>
        </p>

        {/* 待还/逾期提醒：仅有未归还图书的读者显示 */}
        {loanSummary && loanSummary.active > 0 && (
          <div
            className={`loan-reminder ${
              loanSummary.overdue > 0 ? "warning" : ""
            }`}
          >
            {loanSummary.overdue > 0 ? (
              <span>
                您有 <strong>{loanSummary.overdue}</strong> 本书已逾期，请尽快归还
                （当前共借出 {loanSummary.active} 本）
              </span>
            ) : (
              <span>
                您当前共借出 <strong>{loanSummary.active}</strong>{" "}
                本书，请留意应还时间
              </span>
            )}
            <Link href="/my-loans">查看我的借阅 →</Link>
          </div>
        )}

        {/* 功能入口 */}
        <div className="home-actions">
          <Link className="action-card" href="/books">
            <span className="action-title">📖 浏览图书</span>
            <span className="action-desc">搜索、查看馆藏图书与库存</span>
          </Link>
          {isAdmin ? (
            <>
              <Link className="action-card" href="/admin/books">
                <span className="action-title">➕ 管理图书</span>
                <span className="action-desc">上架图书、管理库存</span>
              </Link>
              <Link className="action-card" href="/admin/loans">
                <span className="action-title">📋 借阅管理</span>
                <span className="action-desc">查看全站借阅记录与逾期情况</span>
              </Link>
            </>
          ) : (
            <Link className="action-card" href="/my-loans">
              <span className="action-title">📚 我的借阅</span>
              <span className="action-desc">查看借阅记录、归还图书</span>
            </Link>
          )}
        </div>
      </section>
    </main>
  )
}
