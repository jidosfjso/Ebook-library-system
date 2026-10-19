import { DefaultSession } from "next-auth"

// 扩展 Auth.js 的默认类型，让 User / Session / JWT 都带上我们自定义的字段

declare module "next-auth" {
  // User 增加 role 字段（在 Credentials 的 authorize 里返回）
  interface User {
    role: "USER" | "ADMIN"
  }

  // Session 的 user 增加 id 和 role
  interface Session {
    user: {
      id: string
      role: "USER" | "ADMIN"
    } & DefaultSession["user"]
  }
}

// 注意：JWT 类型实际声明在 @auth/core/jwt（next-auth/jwt 只是 re-export），
// 因此这里直接增强 @auth/core/jwt 才能正确合并
declare module "@auth/core/jwt" {
  // JWT token 增加 id 和 role（在 jwt 回调里写入）
  interface JWT {
    id: string
    role: "USER" | "ADMIN"
  }
}
