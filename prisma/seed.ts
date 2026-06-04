import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const salaryData = [
  { company: 'Google India', role: 'Software Engineer', level: 'L3', location: 'Bangalore', baseSalary: 1800000, bonus: 300000, stock: 400000, yearsExp: 1 },
  { company: 'Google India', role: 'Software Engineer', level: 'L4', location: 'Bangalore', baseSalary: 2400000, bonus: 400000, stock: 600000, yearsExp: 3 },
  { company: 'Google India', role: 'Software Engineer', level: 'L5', location: 'Bangalore', baseSalary: 3500000, bonus: 600000, stock: 1000000, yearsExp: 6 },
  { company: 'Google India', role: 'Data Scientist', level: 'L4', location: 'Hyderabad', baseSalary: 2600000, bonus: 450000, stock: 700000, yearsExp: 4 },
  { company: 'Google India', role: 'Product Manager', level: 'L5', location: 'Bangalore', baseSalary: 3800000, bonus: 700000, stock: 1200000, yearsExp: 7 },

  { company: 'Microsoft India', role: 'Software Engineer', level: 'SDE1', location: 'Hyderabad', baseSalary: 1600000, bonus: 250000, stock: 300000, yearsExp: 1 },
  { company: 'Microsoft India', role: 'Software Engineer', level: 'SDE2', location: 'Hyderabad', baseSalary: 2200000, bonus: 350000, stock: 500000, yearsExp: 4 },
  { company: 'Microsoft India', role: 'Software Engineer', level: 'SDE2', location: 'Bangalore', baseSalary: 2000000, bonus: 300000, stock: 450000, yearsExp: 3 },
  { company: 'Microsoft India', role: 'Data Scientist', level: 'SDE2', location: 'Hyderabad', baseSalary: 2300000, bonus: 380000, stock: 520000, yearsExp: 4 },
  { company: 'Microsoft India', role: 'Product Manager', level: 'L61', location: 'Hyderabad', baseSalary: 3200000, bonus: 600000, stock: 900000, yearsExp: 6 },

  { company: 'Amazon India', role: 'Software Engineer', level: 'SDE1', location: 'Bangalore', baseSalary: 1500000, bonus: 200000, stock: 350000, yearsExp: 1 },
  { company: 'Amazon India', role: 'Software Engineer', level: 'SDE2', location: 'Bangalore', baseSalary: 2100000, bonus: 320000, stock: 480000, yearsExp: 3 },
  { company: 'Amazon India', role: 'Software Engineer', level: 'SDE3', location: 'Hyderabad', baseSalary: 3200000, bonus: 550000, stock: 900000, yearsExp: 7 },
  { company: 'Amazon India', role: 'Data Scientist', level: 'SDE2', location: 'Bangalore', baseSalary: 2200000, bonus: 340000, stock: 500000, yearsExp: 3 },

  { company: 'Flipkart', role: 'Software Engineer', level: 'SDE1', location: 'Bangalore', baseSalary: 1400000, bonus: 180000, stock: 250000, yearsExp: 1 },
  { company: 'Flipkart', role: 'Software Engineer', level: 'SDE2', location: 'Bangalore', baseSalary: 1900000, bonus: 280000, stock: 400000, yearsExp: 3 },
  { company: 'Flipkart', role: 'Data Scientist', level: 'SDE2', location: 'Bangalore', baseSalary: 2000000, bonus: 300000, stock: 420000, yearsExp: 4 },

  { company: 'Swiggy', role: 'Software Engineer', level: 'SDE1', location: 'Bangalore', baseSalary: 1300000, bonus: 150000, stock: 200000, yearsExp: 1 },
  { company: 'Swiggy', role: 'Software Engineer', level: 'SDE2', location: 'Bangalore', baseSalary: 1800000, bonus: 250000, stock: 380000, yearsExp: 3 },

  { company: 'Infosys', role: 'Software Engineer', level: 'SE', location: 'Pune', baseSalary: 700000, bonus: 50000, stock: 0, yearsExp: 1 },
  { company: 'Infosys', role: 'Software Engineer', level: 'SSE', location: 'Bangalore', baseSalary: 1100000, bonus: 80000, stock: 0, yearsExp: 3 },
  { company: 'TCS', role: 'Software Engineer', level: 'ASE', location: 'Chennai', baseSalary: 650000, bonus: 40000, stock: 0, yearsExp: 1 },
  { company: 'TCS', role: 'Software Engineer', level: 'SE', location: 'Hyderabad', baseSalary: 950000, bonus: 70000, stock: 0, yearsExp: 3 },
]

async function main() {
  console.log('Seeding database...')

  // Create a seed user
  const hashed = await bcrypt.hash('seed1234', 10)
  const user = await prisma.user.upsert({
    where: { email: 'seed@test.com' },
    update: {},
    create: { email: 'seed@test.com', password: hashed }
  })

  for (const entry of salaryData) {
    const normalizedName = entry.company.trim()
    const slug = normalizedName.toLowerCase().replace(/\s+/g, '-')

    const company = await prisma.company.upsert({
      where: { slug },
      update: {},
      create: { name: normalizedName, slug }
    })

    const totalComp = entry.baseSalary + entry.bonus + entry.stock

    await prisma.salary.create({
      data: {
        userId: user.id,
        companyId: company.id,
        role: entry.role,
        level: entry.level,
        location: entry.location,
        baseSalary: entry.baseSalary,
        bonus: entry.bonus,
        stock: entry.stock,
        totalComp,
        yearsExp: entry.yearsExp
      }
    })
  }

  console.log('Done! Seeded', salaryData.length, 'salary entries.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())