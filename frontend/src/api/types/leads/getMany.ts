export type LeadsGetManyInput = undefined

export type Lead = {
  id: number
  createdAt: string
  updatedAt: string
  firstName: string
  lastName: string | null
  email: string | null
  jobTitle: string | null
  countryCode: string | null
  companyName: string | null
  phoneNumber: string | null
  yearsInRole: string | null
  linkedinProfile: string | null
  message: string | null
}

export type LeadsGetManyOutput = Lead[]
