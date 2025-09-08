export interface LeadsBulkImportInput {
  leads: {
    firstName: string
    lastName: string
    email: string
    jobTitle?: string
    countryCode?: string
    companyName?: string
    phoneNumber?: string
    yearsInRole?: string
  }[]
}

export interface LeadsBulkImportOutput {
  success: boolean
  importedCount: number
  duplicatesSkipped: number
  processed: number
  createdCount: number
  updatedCount: number
  invalidLeads: number
  duplicatesInUpload: number
  ambiguousNameConflicts: number
  errors: Array<{
    lead: any
    error: string
  }>
}
