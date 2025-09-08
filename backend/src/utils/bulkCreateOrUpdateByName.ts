import type { Prisma, PrismaClient } from '@prisma/client'

export type IncomingLead = {
  firstName: string
  lastName: string
  email: string
  jobTitle?: string | null
  countryCode?: string | null
  companyName?: string | null
  phoneNumber?: string | null
  yearsInRole?: string | null
}

type LeadCreateData = Prisma.leadCreateArgs['data'];
type LeadUpdateData = Prisma.leadUpdateArgs['data'];

type ImportError = { lead: IncomingLead | LeadCreateData | null; error: string };

const sanitize = (s?: string | null) => (typeof s === 'string' ? s.trim() || null : null)

const keyOf = (l: { firstName: string; lastName: string }) =>
  `${String(l.firstName || '')
    .trim()
    .toLowerCase()}_${String(l.lastName || '')
    .trim()
    .toLowerCase()}`

const isValidLead = (lead: any): lead is IncomingLead =>
  !!lead &&
  typeof lead.firstName === 'string' &&
  lead.firstName.trim() &&
  typeof lead.lastName === 'string' &&
  lead.lastName.trim() &&
  typeof lead.email === 'string' &&
  lead.email.trim()

const dedupeByKey = (leads: IncomingLead[]) => {
  const map = new Map<string, IncomingLead>()
  for (const l of leads) map.set(keyOf(l), l) // keep last occurrence
  return { deduped: Array.from(map.values()), duplicatesInUpload: leads.length - map.size }
}

const buildCreateData = (lead: IncomingLead): LeadCreateData => ({
  firstName: sanitize(lead.firstName) ?? '',
  lastName: sanitize(lead.lastName) ?? '',
  email: lead.email.trim(),
  jobTitle: sanitize(lead.jobTitle),
  countryCode: sanitize(lead.countryCode),
  companyName: sanitize(lead.companyName),
  phoneNumber: sanitize(lead.phoneNumber),
  yearsInRole: sanitize(lead.yearsInRole),
})

const buildUpdateData = (lead: IncomingLead): LeadUpdateData => ({
  firstName: sanitize(lead.firstName) ?? undefined,
  lastName: sanitize(lead.lastName) ?? undefined,
  email: lead.email.trim(),
  jobTitle: sanitize(lead.jobTitle),
  countryCode: sanitize(lead.countryCode),
  companyName: sanitize(lead.companyName),
  phoneNumber: sanitize(lead.phoneNumber),
  yearsInRole: sanitize(lead.yearsInRole),
})

export async function bulkCreateOrUpdateByName(prisma: PrismaClient, leads: unknown) {
  // 1) validate payload shape
  if (!Array.isArray(leads) || leads.length === 0) {
    return { status: 400 as const, body: { error: 'leads must be a non-empty array' } }
  }

  const validLeads = (leads as any[]).filter(isValidLead)
  if (validLeads.length === 0) {
    return {
      status: 400 as const,
      body: { error: 'No valid leads found. firstName, lastName, and email are required.' },
    }
  }

  // 2) dedupe current upload
  const { deduped, duplicatesInUpload } = dedupeByKey(validLeads)

  // 3) fetch existing rows that match (firstName,lastName)
  const existing = await prisma.lead.findMany({
    where: {
      OR: deduped.map((l) => ({
        AND: [{ firstName: l.firstName.trim() }, { lastName: l.lastName.trim() }],
      })),
    },
    select: { id: true, firstName: true, lastName: true }, // id is number
  })

  // 4) index existing and detect ambiguous keys
  const existingByKey = new Map<string, { id: number; firstName: string; lastName: string }>()
  const ambiguousKeys = new Set<string>()

  for (const e of existing) {
    const k = keyOf(e)
    if (existingByKey.has(k)) ambiguousKeys.add(k)
    else existingByKey.set(k, e)
  }

  // 5) partition
  const toCreate: LeadCreateData[] = []
  const toUpdate: Array<{ id: number; data: LeadUpdateData; lead: IncomingLead }> = []
  const errors: ImportError[] = []

  for (const lead of deduped) {
    const k = keyOf(lead)
    if (ambiguousKeys.has(k)) {
      errors.push({ lead, error: 'Ambiguous match for firstName+lastName; multiple existing entries.' })
      continue
    }
    const found = existingByKey.get(k)
    if (found) {
      toUpdate.push({ id: found.id, data: buildUpdateData(lead), lead })
    } else {
      toCreate.push(buildCreateData(lead))
    }
  }

  // 6) execute ops in parallel (no $transaction)
  type OpResult =
    | { ok: true; kind: 'create' | 'update' }
    | { ok: false; kind: 'create' | 'update'; error: string; lead: any }

  const createOps = toCreate.map((data) =>
    prisma.lead
      .create({ data })
      .then<OpResult>(() => ({ ok: true, kind: 'create' }))
      .catch((e) => ({
        ok: false,
        kind: 'create',
        error: e instanceof Error ? e.message : 'Unknown error',
        lead: data,
      }))
  )

  const updateOps = toUpdate.map(({ id, data, lead }) =>
    prisma.lead
      .update({ where: { id }, data })
      .then<OpResult>(() => ({ ok: true, kind: 'update' }))
      .catch((e) => ({
        ok: false,
        kind: 'update',
        error: e instanceof Error ? e.message : 'Unknown error',
        lead,
      }))
  )

  const results = await Promise.allSettled([...createOps, ...updateOps])

  let createdCount = 0
  let updatedCount = 0

  for (const r of results) {
    if (r.status === 'fulfilled') {
      const v = r.value
      if (v.ok && v.kind === 'create') createdCount += 1
      if (v.ok && v.kind === 'update') updatedCount += 1
      if (!v.ok) errors.push({ lead: v.lead, error: v.error })
    } else {
      // extremely rare (promise rejected outside our catch)
      // we can’t know if it was create or update; log and keep going
      errors.push({ lead: null, error: 'Unknown promise rejection' })
    }
  }

  return {
    status: 200 as const,
    body: {
      success: errors.length === 0,
      processed: deduped.length,
      createdCount,
      updatedCount,
      invalidLeads: (leads as any[]).length - validLeads.length,
      duplicatesInUpload,
      ambiguousNameConflicts: ambiguousKeys.size,
      errors,
    },
  }
}
