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
  linkedinProfile?: string | null
}

type LeadCreateData = Prisma.leadCreateArgs['data']
type LeadUpdateData = Prisma.leadUpdateArgs['data']

type ImportError = { lead: IncomingLead | LeadCreateData | null; error: string }

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
  linkedinProfile: sanitize(lead.linkedinProfile),
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
  linkedinProfile: sanitize(lead.linkedinProfile),
})

export async function bulkCreateOrUpdateByName(prisma: PrismaClient, leads: unknown) {
  // validate payload shape
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

  // dedupe current upload
  const { deduped, duplicatesInUpload } = dedupeByKey(validLeads)

  // fetch existing rows that match (firstName,lastName)
  const existingLeads = await prisma.lead.findMany({
    where: {
      OR: deduped.map((l) => ({
        AND: [{ firstName: l.firstName.trim() }, { lastName: l.lastName.trim() }],
      })),
    },
    select: { id: true, firstName: true, lastName: true }, // id is number
  })

  // index existing and detect ambiguous keys
  const existingByKey = new Map<string, { id: number; firstName: string; lastName: string }>()
  const ambiguousKeys = new Set<string>()

  for (const existingLead of existingLeads) {
    const leadKey = keyOf(existingLead)
    if (existingByKey.has(leadKey)) ambiguousKeys.add(leadKey)
    else existingByKey.set(leadKey, existingLead)
  }

  // partition
  const toCreate: LeadCreateData[] = []
  const toUpdate: Array<{ id: number; data: LeadUpdateData; lead: IncomingLead }> = []
  const errors: ImportError[] = []

  for (const lead of deduped) {
    const leadKey = keyOf(lead)
    if (ambiguousKeys.has(leadKey)) {
      errors.push({ lead, error: 'Ambiguous match for firstName+lastName; multiple existing entries.' })
      continue
    }
    const found = existingByKey.get(leadKey)
    if (found) {
      toUpdate.push({ id: found.id, data: buildUpdateData(lead), lead })
    } else {
      toCreate.push(buildCreateData(lead))
    }
  }

  // execute ops in parallel (no $transaction)
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

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const resultValue = result.value
      if (resultValue.ok && resultValue.kind === 'create') createdCount += 1
      if (resultValue.ok && resultValue.kind === 'update') updatedCount += 1
      if (!resultValue.ok) errors.push({ lead: resultValue.lead, error: resultValue.error })
    } else {
      // extremely rare (promise rejected outside our catch)
      // we can’t know if it was create or update; log and keep going
      errors.push({ lead: null, error: 'Unknown promise rejection' })
    }
  }

  /**
 * Summary returned by the endpoint.
 *
 * - createdCount: rows created from this upload (new in DB).
 * - updatedCount: rows that matched one DB record and were updated.
 * - invalidLeads: rows dropped due to missing/invalid required fields.
 * - duplicatesInUpload: rows deduped because the CSV had duplicates (same key repeated).
 * - ambiguousNameConflicts: rows skipped because (firstName+lastName) matched >1 DB rows.
 * - duplicatesSkipped: (legacy) equals updatedCount + ambiguousNameConflicts.
 * - importedCount: (legacy) alias for createdCount.
 */
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
