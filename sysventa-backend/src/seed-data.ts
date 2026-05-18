import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  const connectionString = process.env.DATABASE_URL as string
  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter } as any)

  console.log('🌱 Iniciando seed de farmacia...')

  // CATEGORIAS nuevas (skipDuplicates evita pisar las que ya tienes)
  await prisma.categoria.createMany({
    skipDuplicates: true,
    data: [
      { nombre: 'Antibioticos' },
      { nombre: 'Vitaminas' },
      { nombre: 'Antiinflamatorios' },
      { nombre: 'Antigripales' },
      { nombre: 'Dermicos' },
      { nombre: 'Gastricos' },
      { nombre: 'Higiene Personal' },
      { nombre: 'Material de Curacion' },
    ],
  })
  console.log('✅ Categorias creadas')

  const categorias = await prisma.categoria.findMany()
  const cat = (nombre: string) => categorias.find(c => c.nombre === nombre)?.id

  // PRODUCTOS de farmacia
  await prisma.producto.createMany({
    skipDuplicates: true,
    data: [
      // Antibioticos
      { nombre: 'Amoxicilina 500mg x21', precio: 15.00, stock: 50, stockMinimo: 10, categoriaId: cat('Antibioticos')! },
      { nombre: 'Azitromicina 500mg x3', precio: 18.00, stock: 40, stockMinimo: 8, categoriaId: cat('Antibioticos')! },
      { nombre: 'Ciprofloxacino 500mg x10', precio: 12.00, stock: 35, stockMinimo: 8, categoriaId: cat('Antibioticos')! },

      // Antiinflamatorios
      { nombre: 'Ibuprofeno 400mg x10', precio: 2.00, stock: 80, stockMinimo: 20, categoriaId: cat('Antiinflamatorios')! },
      { nombre: 'Naproxeno 500mg x10', precio: 3.50, stock: 60, stockMinimo: 15, categoriaId: cat('Antiinflamatorios')! },
      { nombre: 'Diclofenaco 50mg x10', precio: 2.50, stock: 55, stockMinimo: 12, categoriaId: cat('Antiinflamatorios')! },

      // Antigripales
      { nombre: 'Paracetamol 500mg x10', precio: 1.50, stock: 100, stockMinimo: 25, categoriaId: cat('Antigripales')! },
      { nombre: 'Desloratadina 5mg x10', precio: 5.00, stock: 45, stockMinimo: 10, categoriaId: cat('Antigripales')! },
      { nombre: 'NyQuil Jarabe 180ml', precio: 22.00, stock: 20, stockMinimo: 5, categoriaId: cat('Antigripales')! },

      // Vitaminas
      { nombre: 'Vitamina C 1000mg x30', precio: 12.00, stock: 40, stockMinimo: 10, categoriaId: cat('Vitaminas')! },
      { nombre: 'Vitamina D3 2000UI x30', precio: 15.00, stock: 30, stockMinimo: 8, categoriaId: cat('Vitaminas')! },
      { nombre: 'Complejo B x30', precio: 10.00, stock: 35, stockMinimo: 8, categoriaId: cat('Vitaminas')! },
      { nombre: 'Omega 3 1000mg x30', precio: 18.00, stock: 25, stockMinimo: 6, categoriaId: cat('Vitaminas')! },

      // Dermicos
      { nombre: 'Hidrocortisona Crema 1% 20g', precio: 8.00, stock: 30, stockMinimo: 8, categoriaId: cat('Dermicos')! },
      { nombre: 'Clotrimazol Crema 1% 20g', precio: 7.50, stock: 28, stockMinimo: 8, categoriaId: cat('Dermicos')! },
      { nombre: 'Betametasona Crema 0.05% 20g', precio: 9.00, stock: 22, stockMinimo: 6, categoriaId: cat('Dermicos')! },

      // Gastricos
      { nombre: 'Omeprazol 20mg x14', precio: 6.00, stock: 60, stockMinimo: 15, categoriaId: cat('Gastricos')! },
      { nombre: 'Ranitidina 150mg x10', precio: 3.50, stock: 50, stockMinimo: 12, categoriaId: cat('Gastricos')! },
      { nombre: 'Metoclopramida 10mg x10', precio: 2.50, stock: 40, stockMinimo: 10, categoriaId: cat('Gastricos')! },

      // Higiene Personal
      { nombre: 'Alcohol 70% 1L', precio: 8.00, stock: 45, stockMinimo: 10, categoriaId: cat('Higiene Personal')! },
      { nombre: 'Agua Oxigenada 1L', precio: 5.00, stock: 40, stockMinimo: 10, categoriaId: cat('Higiene Personal')! },
      { nombre: 'Jabon Antibacterial x3', precio: 6.00, stock: 35, stockMinimo: 8, categoriaId: cat('Higiene Personal')! },

      // Material de Curacion
      { nombre: 'Gasas Esteriles x10', precio: 3.50, stock: 50, stockMinimo: 15, categoriaId: cat('Material de Curacion')! },
      { nombre: 'Venda Elastica 4"', precio: 5.00, stock: 30, stockMinimo: 8, categoriaId: cat('Material de Curacion')! },
      { nombre: 'Esparadrapo 5m', precio: 4.50, stock: 25, stockMinimo: 6, categoriaId: cat('Material de Curacion')! },
      { nombre: 'Guantes Latex x10', precio: 8.00, stock: 40, stockMinimo: 10, categoriaId: cat('Material de Curacion')! },
    ],
  })
  console.log('✅ Productos de farmacia creados')

  // CLIENTES
  await prisma.cliente.createMany({
    skipDuplicates: true,
    data: [
      { nombre: 'Ana Garcia', dni: '45678901', telefono: '987654321', email: 'ana@gmail.com' },
      { nombre: 'Pedro Ramirez', dni: '32456789', telefono: '976543210' },
      { nombre: 'Maria Torres', dni: '56789012', telefono: '965432109' },
      { nombre: 'Juan Flores', dni: '67890123', telefono: '954321098' },
      { nombre: 'Rosa Mendez', dni: '78901234', telefono: '943210987' },
      { nombre: 'Carlos Lopez', dni: '89012345', telefono: '932109876' },
      { nombre: 'Elena Vargas', dni: '90123456', telefono: '921098765' },
    ],
  })
  console.log('✅ Clientes creados')

  // PROVEEDORES
  await prisma.proveedor.createMany({
    skipDuplicates: true,
    data: [
      { nombre: 'Farmaceutica Nacional SAC', ruc: '20456789012', telefono: '073-123456', email: 'ventas@farmanacional.com' },
      { nombre: 'Medifarma Peru', ruc: '20567890123', telefono: '073-234567', contacto: 'Ventas Medifarma' },
      { nombre: 'Laboratorios AC Farma', ruc: '20678901234', telefono: '073-345678', email: 'contacto@acfarma.com' },
    ],
  })
  console.log('✅ Proveedores creados')

  console.log('🎉 Seed de farmacia completado!')
  await prisma.$disconnect()
}

main().catch(console.error)