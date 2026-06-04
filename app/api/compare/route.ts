import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const company1 = searchParams.get('company1')
    const company2 = searchParams.get('company2')
    const role = searchParams.get('role')
    const level = searchParams.get('level')

    if (!company1 || !company2) {
      return NextResponse.json({ error: 'Two companies required' }, { status: 400 })
    }

    // Get salaries for both companies
    const getSalaries = (company: string) => prisma.salary.findMany({
      where: {
        company: { name: { contains: company, mode: 'insensitive' } },
        ...(role && { role: { contains: role, mode: 'insensitive' } }),
        ...(level && { level: { contains: level, mode: 'insensitive' } }),
      },
      include: { company: true }
    })

    const [salaries1, salaries2] = await Promise.all([
      getSalaries(company1),
      getSalaries(company2)
    ])

    // Calculate averages
    const calcStats = (salaries: typeof salaries1) => {
      if (salaries.length === 0) return null
      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
      return {
        count: salaries.length,
        avgBase: Math.round(avg(salaries.map(s => s.baseSalary))),
        avgBonus: Math.round(avg(salaries.map(s => s.bonus))),
        avgStock: Math.round(avg(salaries.map(s => s.stock))),
        avgTotal: Math.round(avg(salaries.map(s => s.totalComp))),
        avgYearsExp: Math.round(avg(salaries.map(s => s.yearsExp)))
      }
    }

    return NextResponse.json({
      filters: { role, level },
      [company1]: { stats: calcStats(salaries1), salaries: salaries1 },
      [company2]: { stats: calcStats(salaries2), salaries: salaries2 }
    })

  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}