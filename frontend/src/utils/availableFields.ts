import { Lead } from '../api/types/leads/getMany'

export type EnrichedLead = {
  id?: number
  createdAt: string
  updatedAt: string
  completeName: string
  email: string | null
  jobTitle: string | null
  countryCode: string | null
  companyName: string | null
  phoneNumber: string | null
  yearsInRole: string | null
  linkedinProfile: string | null
  message?: string | null
}

const DEFAULT_LABELS = [
  'Name',
  'Email',
  'Job Title',
  'Company',
  'Country',
  'Phone Number',
  'Years at Company',
  'Linkedin',
]

const DEFAULT_KEYS = [
  'completeName',
  'email',
  'jobTitle',
  'companyName',
  'countryCode',
  'phoneNumber',
  'yearsInRole',
  'linkedinProfile',
]

export const csvImportFields = {
  keys: [...DEFAULT_KEYS, 'errors'],
  labels: ['Row', 'Status', ...DEFAULT_LABELS, 'Errors'],
}

export const availableFields = {
  keys: [
    ...DEFAULT_KEYS,
    'message',
    'createdAt',
  ],
  labels: [
    ...DEFAULT_LABELS,
    'Message',
    'Created',
  ],
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const enrichLead = (lead: Lead): EnrichedLead => ({
  id: lead.id,
  completeName: `${lead.firstName} ${lead.lastName ?? ''}`,
  email: lead.email,
  jobTitle: lead.jobTitle || null,
  companyName: lead.companyName || null,
  countryCode: lead.countryCode || null,
  message: lead.message,
  phoneNumber: lead.phoneNumber || null,
  yearsInRole: lead.yearsInRole || null,
  linkedinProfile: lead.linkedinProfile || null,
  createdAt: lead.createdAt ? formatDate(lead.createdAt) : '',
  updatedAt: lead.updatedAt || '',
})
