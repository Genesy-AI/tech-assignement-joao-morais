import { useEffect, useRef, useState } from 'react'

const availableFields = [
  { field: 'firstName', label: 'First Name' },
  { field: 'lastName', label: 'Last Name' },
  { field: 'email', label: 'Email' },
  { field: 'jobTitle', label: 'Job Title' },
  { field: 'companyName', label: 'Company Name' },
  { field: 'countryCode', label: 'Country Code' },
  { field: 'phoneNumber', label: 'Phone Number' },
  { field: 'yearsInRole', label: 'Years In Role' },
  { field: 'linkedinProfile', label: 'Linkedin' },
]

type MessageTemplateModalFieldsDropdownProps = {
  insertField: (field: string) => void
}

export const MessageTemplateModalFieldsDropdown = ({
  insertField,
}: MessageTemplateModalFieldsDropdownProps) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // close on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      <span className="rounded-md shadow-sm">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex justify-center w-full px-2 py-1 text-sm font-medium leading-5 text-gray-700 transition duration-150 ease-in-out bg-white border border-gray-300 rounded-md hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-gray-50 active:text-gray-800"
          aria-haspopup="true"
          aria-expanded={open}
        >
          <span>Options</span>
          <svg className="w-5 h-5 ml-2 -mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </span>
      <div
        className={`${
          open ? '' : 'hidden'
        } absolute right-0 w-56 mt-2 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg outline-none z-[9999] max-h-60 overflow-y-auto`}
        role="menu"
        aria-label="Insert field"
      >
        <div className="py-1">
          {availableFields.map(({ field, label }) => (
            <button
              key={field}
              type="button"
              className="text-gray-700 flex justify-between w-full px-4 py-2 text-sm leading-5 text-left hover:bg-gray-50"
              // using onMouseDown avoids losing focus/closing before the click fires
              onMouseDown={(e) => {
                e.preventDefault()
                insertField(field)
                setOpen(false)
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
