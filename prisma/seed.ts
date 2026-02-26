import { PrismaClient } from "../src/generated/prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const password_hash = await bcrypt.hash("password123", 12)

  const user = await prisma.user.upsert({
    where: { email: "admin@saladillo.gob.ar" },
    update: {},
    create: {
      email: "admin@saladillo.gob.ar",
      password_hash,
      name: "Admin",
      role: "admin",
    },
  })

  console.log("Seed user created:", user.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
