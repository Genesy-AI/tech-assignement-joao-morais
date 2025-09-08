import Papa from 'papaparse'

export interface CsvLead {
  firstName: string
  lastName: string
  email: string
  jobTitle?: string
  countryCode?: string
  companyName?: string
  phoneNumber?: string
  yearsInRole?: string
  linkedinProfile?: string
  isValid: boolean
  errors: string[]
  rowIndex: number
}

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
// Validates a country code against the browser's built-in Intl CLDR data.
// Returns true only if the code is recognized as an ISO 3166 region.
// Note: For guaranteed consistency across environments (e.g. Node.js),
// consider using a library like i18n-iso-countries.
export function isValidCountryCodeFormat(code: string) {
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
    const name = regionNames.of(code.toUpperCase())
    return name !== undefined
  } catch {
    return false
  }
}

export function isValidLinkedinProfile(url: string) {
  const linkedInRegex =
    /^(https?:\/\/)?(www\.)?linkedin\.com\/(in\/[a-zA-Z0-9_-]+|company\/[a-zA-Z0-9_-]+)\/?$/
  return linkedInRegex.test(url)
}

export function isSimpleValidPhone(raw?: string | null): boolean {
  if (!raw) return false
  let s = raw.trim()

  // drop extension at end
  s = s.replace(/(?:\s*(?:ext\.?|x|#)\s*\d{1,6})\s*$/i, "")

  // convert international prefixes to +
  s = s.replace(/^\s*011\s*/, "+").replace(/^\s*00\s*/, "+")

  // remove common separators
  s = s.replace(/[()\-\.\s]/g, "")

  // keep only digits; allow one leading +
  if (s.startsWith("+")) s = "+" + s.slice(1).replace(/\D/g, "")
  else s = s.replace(/\D/g, "")

  const body = s.startsWith("+") ? s.slice(1) : s
  return body.length >= 7 && body.length <= 15 && /^\+?\d+$/.test(s)
}

export const parseCsv = (content: string): CsvLead[] => {
  if (!content?.trim()) {
    throw new Error('CSV content cannot be empty')
  }

  const parseResult = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => value.trim(),
    transformHeader: (header) => header.trim().toLowerCase(),
    quoteChar: '"',
  })

  if (parseResult.errors.length > 0) {
    const criticalErrors = parseResult.errors.filter(
      (error) => error.type === 'Delimiter' || error.type === 'Quotes' || error.type === 'FieldMismatch'
    )
    if (criticalErrors.length > 0) {
      throw new Error(`CSV parsing failed: ${criticalErrors[0].message}`)
    }
  }

  if (!parseResult.data || parseResult.data.length === 0) {
    throw new Error('CSV file appears to be empty or contains no valid data')
  }

  const data: CsvLead[] = []

  parseResult.data.forEach((row, index) => {
    if (Object.values(row).every((value) => !value)) return

    const lead: Partial<CsvLead> = { rowIndex: index + 2 }
    Object.entries(row).forEach(([header, value]) => {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z]/g, '')
      const trimmedValue = value?.trim() || ''

      switch (normalizedHeader) {
        case 'firstname':
          lead.firstName = trimmedValue
          break
        case 'lastname':
          lead.lastName = trimmedValue
          break
        case 'email':
          lead.email = trimmedValue
          break
        case 'jobtitle':
          lead.jobTitle = trimmedValue || undefined
          break
        case 'countrycode':
          lead.countryCode = trimmedValue || undefined
          break
        case 'companyname':
          lead.companyName = trimmedValue || undefined
          break
        case 'phonenumber':
          lead.phoneNumber = trimmedValue || undefined
          break
        case 'yearsinrole':
          lead.yearsInRole = trimmedValue || undefined
          break
        case 'linkedinprofile':
          lead.linkedinProfile = trimmedValue || undefined
          break
      }
    })

    const errors: string[] = []
    if (!lead.firstName?.trim()) {
      errors.push('First name is required')
    }
    if (!lead.lastName?.trim()) {
      errors.push('Last name is required')
    }
    if (!lead.email?.trim()) {
      errors.push('Email is required')
    } else if (!isValidEmail(lead.email)) {
      errors.push('Invalid email format')
    } else if (lead.countryCode && !isValidCountryCodeFormat(lead.countryCode)) {
      errors.push('Invalid country code format')
    } else if (lead.linkedinProfile && !isValidLinkedinProfile(lead.linkedinProfile)) {
      errors.push('Invalid linkedin url')
    } else if (lead.phoneNumber && !isSimpleValidPhone(lead.phoneNumber)) {
      errors.push('Invalid phone number format')
    }
    data.push({
      ...lead,
      firstName: lead.firstName || '',
      lastName: lead.lastName || '',
      email: lead.email || '',
      isValid: errors.length === 0,
      errors,
    } as CsvLead)
  })

  return data
}
