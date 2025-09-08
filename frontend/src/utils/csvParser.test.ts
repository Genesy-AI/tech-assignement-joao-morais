import { describe, it, expect } from 'vitest'
import {
  parseCsv,
  isValidEmail,
  isValidCountryCodeFormat,
  isValidLinkedinProfile,
  isSimpleValidPhone,
} from './csvParser'

describe('isValidEmail', () => {
  it('should return true for valid email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
    expect(isValidEmail('first.last+tag@example.org')).toBe(true)
    expect(isValidEmail('123@456.com')).toBe(true)
  })

  it('should return false for invalid email addresses', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('invalid')).toBe(false)
    expect(isValidEmail('test@')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('test.example.com')).toBe(false)
    expect(isValidEmail('test@.com')).toBe(false)
    expect(isValidEmail('test@example')).toBe(false)
  })
})

describe('isValidCountryCodeFormat', () => {
  it('should return true for valid ISO country codes', () => {
    expect(isValidCountryCodeFormat('US')).toBe(true) // United States
    expect(isValidCountryCodeFormat('BR')).toBe(true) // Brazil
    expect(isValidCountryCodeFormat('DE')).toBe(true) // Germany
    expect(isValidCountryCodeFormat('JP')).toBe(true) // Japan
    expect(isValidCountryCodeFormat('IN')).toBe(true) // India
  })

  it('should be case-insensitive and normalize to uppercase', () => {
    expect(isValidCountryCodeFormat('us')).toBe(true)
    expect(isValidCountryCodeFormat('br')).toBe(true)
    expect(isValidCountryCodeFormat('dE')).toBe(true)
  })

  it('should return false for invalid codes', () => {
    expect(isValidCountryCodeFormat('')).toBe(false) // empty string
    expect(isValidCountryCodeFormat('U')).toBe(false) // single letter
    expect(isValidCountryCodeFormat('USA')).toBe(false) // three letters
    expect(isValidCountryCodeFormat('ZZ')).toBe(false) // not an assigned region
    expect(isValidCountryCodeFormat('123')).toBe(false) // numbers
    expect(isValidCountryCodeFormat('@@')).toBe(false) // special chars
  })
})

describe('isValidLinkedinProfile', () => {
  expect(isValidLinkedinProfile('https://linkedin.com/in/john-doe')).toBe(true)
  expect(isValidLinkedinProfile('https://linkedin.com/in/john-doe')).toBe(true)
  expect(isValidLinkedinProfile('http://linkedin.com/in/jane_doe')).toBe(true)
  expect(isValidLinkedinProfile('https://linkedin.com/in/john-doe/')).toBe(true)

  expect(isValidLinkedinProfile('https://linkdin.com/in/john-doe')).toBe(false)
  expect(isValidLinkedinProfile('https://linkedin.com')).toBe(false)
  expect(isValidLinkedinProfile('https://github.com/john')).toBe(false)
  expect(isValidLinkedinProfile('john-doe')).toBe(false)
})

describe('isSimpleValidPhone', () => {
  it('rejects empty-ish values', () => {
    expect(isSimpleValidPhone('')).toBe(false)
    expect(isSimpleValidPhone('   ')).toBe(false)
    expect(isSimpleValidPhone(null as unknown as string)).toBe(false)
    expect(isSimpleValidPhone(undefined as unknown as string)).toBe(false)
  })

  it('accepts plain national numbers (7–15 digits)', () => {
    expect(isSimpleValidPhone('7311239702')).toBe(true)
    expect(isSimpleValidPhone('1601140330')).toBe(true)
    expect(isSimpleValidPhone('8239784724')).toBe(true)
    expect(isSimpleValidPhone('1234567')).toBe(true)
    expect(isSimpleValidPhone('123456789012345')).toBe(true)
  })

  it('rejects too short or too long', () => {
    expect(isSimpleValidPhone('123456')).toBe(false)
    expect(isSimpleValidPhone('1234567890123456')).toBe(false)
  })

  it('accepts numbers with separators (spaces, dashes, dots, parentheses)', () => {
    expect(isSimpleValidPhone('(731) 123-9702')).toBe(true)
    expect(isSimpleValidPhone('063.430.8860')).toBe(true)
    expect(isSimpleValidPhone('272.441.0955')).toBe(true)
    expect(isSimpleValidPhone('414-902-6626')).toBe(true)
  })

  it('accepts numbers with extensions at the end', () => {
    // extension patterns: x123, ext. 9, #456
    expect(isSimpleValidPhone('+1-280-754-0462x2154')).toBe(true)
    expect(isSimpleValidPhone('(816)237-0737x0663')).toBe(true)
    expect(isSimpleValidPhone('990-054-7491x78196')).toBe(true)
    expect(isSimpleValidPhone('+1 (415) 555-2671 ext. 123')).toBe(true)
    expect(isSimpleValidPhone('235-396-3701 #802')).toBe(true)
  })

  it('accepts international dialing prefixes and plus sign', () => {
    // 00/011 → treated as + (internally by the function)
    expect(isSimpleValidPhone('001-464-312-8555')).toBe(true)
    expect(isSimpleValidPhone('011 415 555 2671')).toBe(true)
    expect(isSimpleValidPhone('+1-444-818-4212')).toBe(true)
    expect(isSimpleValidPhone('+1-076-096-4074x6140')).toBe(true)
  })
  
  it('rejects obvious junk', () => {
    expect(isSimpleValidPhone('hello world')).toBe(false)
    expect(isSimpleValidPhone('(+1) ABC-DEFG')).toBe(false)
    expect(isSimpleValidPhone('+++++++')).toBe(false)
  })

  it('rejects multiple plus signs in body once normalized', () => {
    // After cleaning we allow only one leading '+'
    expect(isSimpleValidPhone('++1-415-555-2671')).toBe(false)
    expect(isSimpleValidPhone('+1+4155552671')).toBe(false)
  })

  it('preserves acceptance of leading zeros for national formats', () => {
    expect(isSimpleValidPhone('059-372-5255')).toBe(true)
    expect(isSimpleValidPhone('063.430.8860x4762')).toBe(true)
  })
})

describe('parseCsv', () => {
  it('should throw error for empty content', () => {
    expect(() => parseCsv('')).toThrow('CSV content cannot be empty')
    expect(() => parseCsv('   ')).toThrow('CSV content cannot be empty')
  })

  it('should throw error for CSV with only headers', () => {
    const csv = 'firstName,lastName,email'
    expect(() => parseCsv(csv)).toThrow('CSV file appears to be empty or contains no valid data')
  })

  it('should throw error for malformed CSV content', () => {
    const malformedCsv = `firstName,lastName,email
"John,Doe,john@example.com,extra"field`
    expect(() => parseCsv(malformedCsv)).toThrow('CSV parsing failed')
  })

  it('should throw error for CSV with mismatched field count', () => {
    const mismatchedCsv = `firstName,lastName,email
John,Doe,john@example.com,ExtraField,AnotherExtra
Jane,Smith`
    expect(() => parseCsv(mismatchedCsv)).toThrow('CSV parsing failed')
  })

  it('should throw error for CSV with critical delimiter issues', () => {
    const noDelimiterCsv = `firstName lastName email
John Doe john@example.com`
    expect(() => parseCsv(noDelimiterCsv)).toThrow()
  })

  it('should parse valid CSV with all required fields', () => {
    const csv = `firstName,lastName,email,jobTitle,countryCode,companyName
John,Doe,john.doe@example.com,Developer,US,Tech Corp`

    const result = parseCsv(csv)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      jobTitle: 'Developer',
      countryCode: 'US',
      companyName: 'Tech Corp',
      isValid: true,
      errors: [],
      rowIndex: 2,
    })
  })

  it('should handle missing required fields and mark as invalid', () => {
    const csv = `firstName,lastName,email
,Smith,john@example.com
John,,john@example.com
John,Smith,`

    const result = parseCsv(csv)

    expect(result).toHaveLength(3)

    expect(result[0].isValid).toBe(false)
    expect(result[0].errors).toContain('First name is required')

    expect(result[1].isValid).toBe(false)
    expect(result[1].errors).toContain('Last name is required')

    expect(result[2].isValid).toBe(false)
    expect(result[2].errors).toContain('Email is required')
  })

  it('should validate email format', () => {
    const csv = `firstName,lastName,email
John,Doe,invalid-email
Jane,Smith,jane@example.com`

    const result = parseCsv(csv)

    expect(result).toHaveLength(2)
    expect(result[0].isValid).toBe(false)
    expect(result[0].errors).toContain('Invalid email format')
    expect(result[1].isValid).toBe(true)
  })

  it('should handle CSV with quoted values', () => {
    const csv = `firstName,lastName,email,jobTitle
"John","Doe","john.doe@example.com","Software Engineer"`

    const result = parseCsv(csv)

    expect(result).toHaveLength(1)
    expect(result[0].firstName).toBe('John')
    expect(result[0].lastName).toBe('Doe')
    expect(result[0].email).toBe('john.doe@example.com')
    expect(result[0].jobTitle).toBe('Software Engineer')
  })

  it('should skip empty rows', () => {
    const csv = `firstName,lastName,email
John,Doe,john@example.com
,,
Jane,Smith,jane@example.com`

    const result = parseCsv(csv)

    expect(result).toHaveLength(2)
    expect(result[0].firstName).toBe('John')
    expect(result[1].firstName).toBe('Jane')
  })

  it('should handle case-insensitive headers', () => {
    const csv = `FIRSTNAME,LASTNAME,EMAIL,JOBTITLE,COUNTRYCODE,COMPANYNAME
John,Doe,john@example.com,Developer,US,Tech Corp`

    const result = parseCsv(csv)

    expect(result).toHaveLength(1)
    expect(result[0].firstName).toBe('John')
    expect(result[0].lastName).toBe('Doe')
    expect(result[0].email).toBe('john@example.com')
    expect(result[0].jobTitle).toBe('Developer')
  })

  it('should handle missing optional fields', () => {
    const csv = `firstName,lastName,email,jobTitle,countryCode
John,Doe,john@example.com,,`

    const result = parseCsv(csv)

    expect(result).toHaveLength(1)
    expect(result[0].jobTitle).toBeUndefined()
    expect(result[0].countryCode).toBeUndefined()
    expect(result[0].isValid).toBe(true)
  })

  it('should preserve row index correctly', () => {
    const csv = `firstName,lastName,email
John,Doe,john@example.com
Jane,Smith,jane@example.com
Bob,Johnson,bob@example.com`

    const result = parseCsv(csv)

    expect(result).toHaveLength(3)
    expect(result[0].rowIndex).toBe(2)
    expect(result[1].rowIndex).toBe(3)
    expect(result[2].rowIndex).toBe(4)
  })

  it('should handle multiple validation errors per lead', () => {
    const csv = `firstName,lastName,email
 , ,invalid-email`

    const result = parseCsv(csv)

    expect(result).toHaveLength(1)
    expect(result[0].isValid).toBe(false)
    expect(result[0].errors).toHaveLength(3)
    expect(result[0].errors).toContain('First name is required')
    expect(result[0].errors).toContain('Last name is required')
    expect(result[0].errors).toContain('Invalid email format')
  })

  it('should handle extra columns not in header mapping', () => {
    const csv = `firstName,lastName,email,unknownColumn
John,Doe,john@example.com,someValue`

    const result = parseCsv(csv)

    expect(result).toHaveLength(1)
    expect(result[0].firstName).toBe('John')
    expect(result[0].lastName).toBe('Doe')
    expect(result[0].email).toBe('john@example.com')
    expect(result[0].isValid).toBe(true)
  })

  it('should handle mixed valid and invalid leads', () => {
    const csv = `firstName,lastName,email
John,Doe,john@example.com
,Smith,invalid-email
Jane,Johnson,jane@example.com`

    const result = parseCsv(csv)

    expect(result).toHaveLength(3)
    expect(result[0].isValid).toBe(true)
    expect(result[1].isValid).toBe(false)
    expect(result[1].errors).toContain('First name is required')
    expect(result[1].errors).toContain('Invalid email format')
    expect(result[2].isValid).toBe(true)
  })

  it('should handle whitespace in fields', () => {
    const csv = `firstName,lastName,email
 John , Doe , john@example.com `

    const result = parseCsv(csv)

    expect(result).toHaveLength(1)
    expect(result[0].firstName).toBe('John')
    expect(result[0].lastName).toBe('Doe')
    expect(result[0].email).toBe('john@example.com')
    expect(result[0].isValid).toBe(true)
  })
})
