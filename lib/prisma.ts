import { PrismaClient } from "@prisma/client"

// Neon 等 Serverless 数据库空闲一段时间后会自动休眠，
// 休眠后首次连接会直接报 P1001（Can't reach database server），
// 等数据库完成唤醒（通常几秒）再连就能成功。
// 这里通过 Client 扩展给所有查询加「有限次重试」，自动扛过冷启动。
const MAX_RETRIES = 2 // 最多重试 2 次（即最多执行 3 次）
const RETRY_DELAY_MS = 1000 // 每次重试前等待 1 秒，给数据库唤醒留时间

// 只重试「连接不上」（P1001）这一类错误，业务错误（如唯一约束冲突）直接抛出
function isConnectionError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P1001"
  )
}

function createPrismaClient() {
  return new PrismaClient().$extends({
    query: {
      async $allOperations({ args, query }) {
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
            return await query(args)
          } catch (error) {
            // 非连接错误，或重试次数已用完 -> 不再重试
            if (!isConnectionError(error) || attempt === MAX_RETRIES) {
              throw error
            }
            await new Promise((resolve) =>
              setTimeout(resolve, RETRY_DELAY_MS)
            )
          }
        }
        // 理论上不会走到这里（循环内要么 return 要么 throw）
        throw new Error("unreachable")
      },
    },
  })
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>

// Prisma Client 单例：
// 开发环境下 Next.js 热更新会反复执行模块，如果每次都 new 一个 PrismaClient，
// 会创建大量数据库连接、耗尽连接池。这里用 globalThis 缓存实例，避免重复创建。
const globalForPrisma = globalThis as unknown as {
  prisma?: ExtendedPrismaClient
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// 生产环境不需要缓存（进程只启动一次）
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
