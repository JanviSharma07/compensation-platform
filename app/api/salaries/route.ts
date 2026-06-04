import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// Helper to get user from token
function getUserFromToken(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null
  try {
    const token = auth.split(' ')[1]
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
  } catch {
    return null
  }
}

// Normalize company name → "google inc." becomes "Google"
function normalizeName(name: string) {
  return name.trim().toLowerCase()
    .replace(/\s+(inc|ltd|pvt|llc|corp)\.?$/i, '')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim()
}

// POST → Submit a salary entry
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromToken(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { company, role, level, location, baseSalary, bonus, stock, yearsExp } = body

    // Validation
    if (!company || !role || !level || !location || !baseSalary || !yearsExp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (typeof baseSalary !== 'number' || baseSalary <= 0) {
      return NextResponse.json({ error: 'Invalid base salary' }, { status: 400 })
    }

    if (typeof yearsExp !== 'number' || yearsExp < 0) {
      return NextResponse.json({ error: 'Invalid years of experience' }, { status: 400 })
    }

    // Normalize company name
    const normalizedName = normalizeName(company)
    const slug = normalizedName.toLowerCase().replace(/\s+/g, '-')

    // Find or create company
    let companyRecord = await prisma.company.findUnique({ where: { slug } })
    if (!companyRecord) {
      companyRecord = await prisma.company.create({
        data: { name: normalizedName, slug }
      })
    }

    // Calculate total comp
    const totalComp = baseSalary + (bonus ?? 0) + (stock ?? 0)

    const salary = await prisma.salary.create({
      data: {
        userId: user.userId,
        companyId: companyRecord.id,
        role,
        level,
        location,
        baseSalary,
        bonus: bonus ?? 0,
        stock: stock ?? 0,
        totalComp,
        yearsExp
      }
    })

    return NextResponse.json({ message: 'Salary submitted', salary }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET → List + filter salaries
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const company = searchParams.get('company')
    const role = searchParams.get('role')
    const level = searchParams.get('level')
    const location = searchParams.get('location')

    const salaries = await prisma.salary.findMany({
      where: {
        ...(role && { role: { contains: role, mode: 'insensitive' } }),
        ...(level && { level: { contains: level, mode: 'insensitive' } }),
        ...(location && { location: { contains: location, mode: 'insensitive' } }),
        ...(company && {
          company: { name: { contains: company, mode: 'insensitive' } }
        })
      },
      include: { company: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ count: salaries.length, salaries })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}