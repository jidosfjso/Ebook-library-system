import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

// 种子数据脚本：用于初始化一个可运行的系统
// 运行方式：npm run db:seed（会通过 dotenv 加载 .env.local 里的 DATABASE_URL）
const prisma = new PrismaClient()

async function main() {
  console.log("开始写入种子数据...")

  // ===== 1. 创建管理员账号（管理员由种子创建，注册接口只创建普通读者） =====
  const adminPassword = await hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "管理员",
      password: adminPassword,
      role: "ADMIN",
    },
  })
  console.log(`✅ 管理员：${admin.email} / admin123`)

  // ===== 2. 创建一个普通读者账号（方便测试借阅流程） =====
  const readerPassword = await hash("reader123", 10)
  const reader = await prisma.user.upsert({
    where: { email: "reader@example.com" },
    update: {},
    create: {
      email: "reader@example.com",
      name: "读者小明",
      password: readerPassword,
      role: "USER",
    },
  })
  console.log(`✅ 读者：${reader.email} / reader123`)

  // ===== 3. 创建示例图书（用 upsert + 唯一 isbn 保证可重复执行不重复插入） =====
  const books = [
    {
      title: "三体",
      author: "刘慈欣",
      isbn: "9787536692930",
      description: "地球文明与三体文明的信息交流、生死搏杀及两个文明在宇宙中的兴衰历程。",
      totalCopies: 5,
    },
    {
      title: "活着",
      author: "余华",
      isbn: "9787506365437",
      description: "讲述一个人一生的故事，展现人在苦难面前的坚韧与对生命的执着。",
      totalCopies: 3,
    },
    {
      title: "百年孤独",
      author: "加西亚·马尔克斯",
      isbn: "9787544253994",
      description: "布恩迪亚家族七代人的传奇故事，魔幻现实主义文学的代表作。",
      totalCopies: 4,
    },
    {
      title: "小王子",
      author: "圣埃克苏佩里",
      isbn: "9787020042494",
      description: "来自外星球的小王子在旅行中领悟爱与责任的童话。",
      totalCopies: 2,
    },
    {
      title: "围城",
      author: "钱钟书",
      isbn: "9787020024759",
      description: "以方鸿渐为主人公，讽刺知识分子众生相的长篇小说。",
      totalCopies: 3,
    },
  ]

  for (const book of books) {
    await prisma.book.upsert({
      where: { isbn: book.isbn },
      update: {},
      create: {
        ...book,
        availableCopies: book.totalCopies, // 上架时可借数量 = 总库存
      },
    })
  }
  console.log(`✅ 示例图书 ${books.length} 本已就绪`)

  console.log("种子数据写入完成 🎉")
}

main()
  .catch((e) => {
    console.error("种子数据写入失败：", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
