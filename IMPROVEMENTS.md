# IMPROVEMENTS

This document summarizes areas of improvement identified during the test project.  
The goal is to prioritize actionable changes, highlight potential risks, and suggest opportunities for better UX and developer experience.

---

## Top Priorities (Impact vs. Effort)

| Improvement | Impact | Effort | Notes |
|-------------|--------|--------|-------|
| Add confirmation before deleting a lead | High | Low | Prevents accidental data loss |
| Add confirmation before clearing data in CSV modal | High | Low | Improves safety and avoids user frustration |
| Add search input on leads list | High | Low/Medium | Improves navigation and user productivity |
| Add sort functionality on leads list fields | High | Medium | Easier to organize and analyze leads |
| Allow editing an existing message instead of only replacing | High | Medium | Important for workflows with multiple leads |
| Add unit and e2e tests | High | Medium/High | Increases confidence, prevents regressions |
| Fix TypeScript configuration & missing types/interfaces | Medium | Medium | Reduces runtime errors and improves DX |
| Refactor backend APIs into separated functions | Medium/High | Medium | Improves maintainability and testability |
| Add “Actions” column per lead (generate msg / guess gender) | Medium | Low | Lower priority QoL; per-row actions |

---

## Quick Wins

- **Confirmation dialogs**
  - Add confirmation on **lead delete** action.
  - Add confirmation on **clearData** in CSV modal.
- **Types**
  - Add missing `Lead` types/interfaces in multiple places for type safety.
- **Leads List**
  - Add a **search input** to quickly filter leads.
- **Per-row actions (optional, lower priority)**
  - Lightweight **Actions** column (e.g., “Generate message”, “Guess gender”) for one-off operations.

---

## Larger Refactors

- **CSV Import UX**
  - Allow users to update wrong fields in the CSV modal **without re-uploading**.
- **Message Editing**
  - Enable editing an existing message instead of forcing users to regenerate and overwrite.
- **Component Structure**
  - Break down large components into smaller, reusable ones for readability and maintainability.
- **Leads List**
  - Add **sorting** capabilities on lead fields for better organization.
- **Backend APIs**
  - **Refactor into smaller, separated functions** with clear responsibilities to improve cohesion, enable targeted tests, and simplify changes.

---

## Potential Bugs & Risky Areas

- Accidental lead deletion due to lack of confirmation.
- CSV data loss if users clear data unintentionally.
- TypeScript misconfiguration and missing types could lead to subtle runtime errors.

---

## UX Opportunities

- Safer, clearer user flows with confirmations (delete, clear data).
- More flexible CSV import workflow (edit fields without re-upload).
- Message editing for better user control, especially with multiple selected leads.
- Enhanced discoverability in the leads list with **search** and **sort**.
- **Actions** column for quick, per-row operations (lower priority).

---

## Developer Experience (DX) Improvements

- **Testing**  
  - Add interface tests: both unit and end-to-end.
- **Type Safety**  
  - Fix TypeScript configuration.  
  - Define and enforce proper `Lead` interfaces across the codebase.  
- **Maintainability**  
  - Break components into smaller ones to reduce complexity and improve reusability.
  - **Refactor backend APIs** into separated functions to improve testability, error handling, and observability.

---
