# Jordan Aviation — Sick Leave Management System (SLMS)

## Overview
A bilingual (Arabic/English) web application for managing employee sick leaves at Jordan Aviation. Supports multi-role workflows for employees, company doctors, and HR managers.

## Tech Stack
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 5 (port 5000)
- **Styling**: Tailwind CSS + Ant Design v6 (antd)
- **State Management**: Zustand with persistence
- **Routing**: React Router DOM v7
- **Internationalization**: i18next (English + Arabic, defaults to Arabic)
- **Charts**: Recharts
- **Backend Integration**: Supabase (prepared, currently uses mock data)

## Project Structure
```
src/
  App.tsx                        # Root routing (full role-based routes)
  main.tsx                       # Entry point (BrowserRouter + i18n + App)
  index.css                      # Global styles, CSS vars, animations, status badges
  i18n/
    en.json                      # English translations
    ar.json                      # Arabic translations
    config.ts                    # i18next init, RTL/LTR on language change
  services/
    mockData.ts                  # Mock users, leaves, doctors, facilities
  store/
    authStore.ts                 # Auth (login/logout/register) with Zustand persist
    leaveStore.ts                # Leave management store
    notificationStore.ts         # Notifications store
  types/
    index.ts                     # All TypeScript interfaces & types
  pages/
    auth/
      LoginPage.tsx              # Beautiful split-layout login (gradient + features)
      RegisterPage.tsx           # Registration form (JA email validation)
    PlaceholderPage.tsx          # "Coming Soon" placeholder for unbuilt pages
  components/
    layout/
      AppLayout.tsx              # Main shell: Sider + Header + Content (Outlet)
      ProtectedRoute.tsx         # Auth guard + role guard
```

## User Roles & Demo Credentials
All accounts use password: `Test1234`
- **Employee**: `employee@jordanaviation.jo` → `/employee/dashboard`
- **Company Doctor**: `doctor@jordanaviation.jo` → `/doctor/dashboard`
- **HR Manager**: `admin@jordanaviation.jo` → `/admin/dashboard`

## Leave Statuses
`SUBMITTED` → `PROCESSING` → `UNDER_REVIEW` → `DOCS_REQUESTED` / `EXAMINATION_REQUESTED` → `APPROVED` / `PARTIALLY_APPROVED` / `REJECTED`

## Routes
- `/login` — Login page (public)
- `/register` — Registration page (public)
- `/employee/*` — Employee routes (EMPLOYEE role only)
- `/doctor/*` — Doctor routes (COMPANY_DOCTOR role only)
- `/admin/*` — Admin routes (HR_MANAGER, HR_OFFICER roles)
- `/rules`, `/notifications`, `/profile` — All authenticated users

## Design Tokens
- Navy: `#001529`
- Gold: `#D4AF37`
- Default language: Arabic (RTL), toggleable to English (LTR)

## Development
- Run: `npm run dev` (starts on port 5000)
- Build: `npm run build`
- Lint: `npm run lint`
- Type check: `npm run typecheck`

## Deployment
- Target: Static site
- Build command: `npm run build`
- Output directory: `dist`
