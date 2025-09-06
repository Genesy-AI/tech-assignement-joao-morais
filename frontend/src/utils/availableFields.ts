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

export const enrichLead = (lead: any) => ({
  id: lead.id,
  completeName: `${lead.firstName} ${lead.lastName ?? ''}`,
  email: lead.email,
  jobTitle: lead.jobTitle,
  companyName: lead.companyName,
  countryCode: lead.countryCode,
  message: lead.name,
  phoneNumber: lead.phoneNumber,
  yearsInRole: lead.yearsInRole,
  linkedinProfile: lead.linkedinProfile,
  createdAt: formatDate(lead.createdAt),
})
