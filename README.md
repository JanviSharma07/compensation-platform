# Compensation Intelligence Platform

A backend system for structured and comparable salary data — built for the Indian tech market.

> **Role:** Backend Engineer | **Track:** C — Compensation Intelligence System

---

## Live URL
🔗 [compensation-platform.vercel.app](https://compensation-platform.vercel.app)

---

## What This Is

This is NOT a salary listing website.

It's a compensation intelligence system that helps users **compare salaries intelligently** using levels, roles, location, and compensation structure.

Core principle: **Levels matter more than job titles.**

A "Software Engineer" at Google L4 and a "Software Engineer" at TCS are not comparable by title alone. This system stores and compares by level.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Next.js 15 (API Routes) |
| Database | PostgreSQL (Neon) |
| ORM | Prisma v6 |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Deployment | Vercel |

---

## Database Schema

3 normalized tables:

```
User
  id, email, password, createdAt

Company
  id, name, slug, industry

Salary
  id, userId, companyId, role, level, location
  baseSalary, bonus, stock, totalComp, yearsExp, createdAt
```

**Why separate Company table?**
To avoid duplication — normalization principle from DBMS. Storing company name directly in Salary would cause the same company to appear with different spellings.

**Why store totalComp as a field?**
Calculated at insertion time (base + bonus + stock) so aggregation queries are faster — no recalculation on every request.

---

## API Reference

### Auth

```
POST /api/auth/register
Body: { email, password }
→ Creates user account

POST /api/auth/login
Body: { email, password }
→ Returns JWT token (valid 7 days)
```

### Salaries

```
POST /api/salaries
Headers: Authorization: Bearer <token>
Body: { company, role, level, location, baseSalary, bonus?, stock?, yearsExp }
→ Ingests salary entry with validation and normalization

GET /api/salaries?company=&role=&level=&location=
→ Filtered salary listings
```

### Companies

```
GET /api/companies?search=
→ All companies with entry count and avg total compensation
```

### Compare

```
GET /api/compare?company1=Google India&company2=Microsoft India&role=Software Engineer
→ Side-by-side stats: avgBase, avgBonus, avgStock, avgTotal, avgYearsExp
```

---

## Key Features

### Company Normalization
"Google Inc.", "google", "GOOGLE INDIA" → all resolve to "Google India"

```typescript
function normalizeName(name: string) {
  return name.trim().toLowerCase()
    .replace(/\s+(inc|ltd|pvt|llc|corp)\.?$/i, '')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim()
}
```

Slug-based deduplication prevents duplicate company entries.

### Validation System
- Rejects missing required fields (400)
- Rejects negative or non-numeric salary (400)
- Rejects invalid JWT tokens (401)
- Defaults missing bonus/stock to 0
- All routes wrapped in try-catch with proper error responses

### JWT Authentication
- Stateless — no session storage on server
- Token contains userId and email
- Required for all write operations (salary submission)
- Read operations (GET) are public

---

## Architecture Decisions

**Why Next.js API Routes over NestJS?**
Simpler setup, faster deployment on Vercel, sufficient for this scope. NestJS adds overhead that isn't needed for a focused backend.

**Why PostgreSQL over MongoDB?**
Salary comparison requires consistent, relational schema. Flexible documents would make aggregation and comparison queries harder and less reliable.

**Why Prisma over raw SQL?**
Type-safe queries catch errors at compile time. Schema migrations are version-controlled. Cleaner code without sacrificing query power.

---

## Running Locally

```bash
# Clone the repo
git clone https://github.com/JanviSharma07/compensation-platform.git
cd compensation-platform

# Install dependencies
npm install

# Set up environment variables
# Create .env file:
DATABASE_URL="your-postgresql-url"
JWT_SECRET="your-secret-key"

# Push schema to database
npx prisma db push

# Seed with sample data
node --require ts-node/register prisma/seed.ts

# Start development server
npm run dev
```

---

## Sample API Calls

**Register:**
```bash
curl -X POST https://compensation-platform.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234"}'
```

**Compare Google vs Microsoft:**
```bash
curl "https://compensation-platform.vercel.app/api/compare?company1=Google%20India&company2=Microsoft%20India&role=Software%20Engineer"
```

---

## Edge Cases Handled

- Duplicate company names with different casing/suffixes
- Missing bonus or stock fields (defaulted to 0)
- Invalid or expired JWT tokens
- Negative salary values
- Missing required fields
- Database errors caught and returned as 500

---

*Built as part of AI Software Engineer Internship Demo Task — Track C, Backend Engineer Role*