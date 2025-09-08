import { Lead } from "../api/types/leads/getMany"

export type EnrichedLead = {
  id: number
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
  message: string | null
}

export const availableFields = {
  keys: [
    'completeName',
    'email',
    'jobTitle',
    'companyName',
    'countryCode',
    'message',
    'phoneNumber',
    'yearsInRole',
    'linkedinProfile',
    'createdAt',
  ],
  labels: [
    'Name',
    'Email',
    'Job Title',
    'Company',
    'Country',
    'Message',
    'Phone Number',
    'Years at Company',
    'Linkedin',
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
  jobTitle: lead.jobTitle,
  companyName: lead.companyName,
  countryCode: lead.countryCode,
  message: lead.message,
  phoneNumber: lead.phoneNumber,
  yearsInRole: lead.yearsInRole,
  linkedinProfile: lead.linkedinProfile,
  createdAt: formatDate(lead.createdAt),
  updatedAt: lead.updatedAt
})
