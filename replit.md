# Sick Leave Management System (SLMS)

## Overview
A web application for managing employee sick leaves in an aviation company (Jordan Aviation). Supports multi-role workflows for employees, company doctors, and HR managers.

## Tech Stack
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 5 (port 5000)
- **Styling**: Tailwind CSS + Ant Design (antd)
- **State Management**: Zustand with persistence
- **Routing**: React Router DOM v7
- **Internationalization**: i18next (English + Arabic)
- **Charts**: Recharts
- **Backend Integration**: Supabase (prepared, currently uses mock data)

## Project Structure
```
src/
  App.tsx          # Root component (placeholder - needs wiring up)
  main.tsx         # App entry point
  index.css        # Global styles with Tailwind directives
  i18n/            # Translation files (en.json, ar.json) + config
  services/        # Data layer (mockData.ts with business entities)
  store/           # Zustand stores (authStore, leaveStore, notificationStore)
  types/           # TypeScript interfaces (index.ts)
```

## User Roles
- `EMPLOYEE` - Submit and track sick leaves
- `COMPANY_DOCTOR` - Review medical certificates
- `HR_MANAGER` - Approve/reject leaves, manage medical database
- `HR_OFFICER` - Support HR operations

## Leave Statuses
`SUBMITTED` → `UNDER_REVIEW` → `APPROVED` / `PARTIALLY_APPROVED` / `REJECTED`

## Development
- Run: `npm run dev` (starts on port 5000)
- Build: `npm run build`
- Lint: `npm run lint`
- Type check: `npm run typecheck`

## Deployment
- Target: Static site
- Build command: `npm run build`
- Output directory: `dist`

## Notes
- App.tsx is currently a placeholder - the stores, types, services, and i18n infrastructure are all built but need to be connected to the UI
- Mock data is in `src/services/mockData.ts`
- Vite configured to allow all hosts for Replit proxy compatibility
