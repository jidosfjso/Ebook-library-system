// 临时诊断脚本：直接调用 Blob API，绕过业务代码定位真实错误
import { put } from "@vercel/blob"

async function main() {
  try {
    const blob = await put("covers/diagnostic-test.txt", "hello blob", {
      access: "public",
    })
    console.log("SUCCESS:", blob.url)
  } catch (error) {
    console.error("FAIL:", error)
    process.exit(1)
  }
}

main()
