import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')

    const companies = await prisma.company.findMany({
      where: {
        ...(search && { name: { contains: search, mode: 'insensitive' } })
      },
      include: {
        _count: { select: { salaries: true } },
        salaries: {
          select: {
            totalComp: true,
            baseSalary: true,
            role: true,
            level: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Calculate avg total comp per company
    const result = companies.map(c => {
      const avg = c.salaries.length > 0
        ? Math.round(c.salaries.reduce((a, b) => a + b.totalComp, 0) / c.salaries.length)
        : 0
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        industry: c.industry,
        totalEntries: c._count.salaries,
        avgTotalComp: avg
      }
    })

    return NextResponse.json({ count: result.length, companies: result })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}