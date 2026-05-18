import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  const connectionString = process.env.DATABASE_URL as string
  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter } as any)

  const passwordHash = await bcrypt.hash('admin123', 10)

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@sysventa.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@sysventa.com',
      password: passwordHash,
      rol: 'ADMIN',
    },
  })

  console.log('✅ Usuario admin creado:', admin.email)
  await prisma.$disconnect()
}

main()
