# Tasks: websiter.click Ordering Platform

**Input**: Design documents from `/specs/001-create-websiter-click/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/

## Phase 3.1: Setup
- [x] T001 [P] Install and configure shadcn/ui.
- [x] T002 [P] Install and configure Supabase client (`@supabase/supabase-js`).
- [x] T003 [P] Install and configure Stripe client (`stripe`).
- [x] T004 [P] Set up Jest and React Testing Library for testing.
- [x] T005 Create Supabase tables for `clients`, `projects`, `invoices`, and `notifications` based on `data-model.md`.

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
- [x] T006 [P] Contract test for `POST /api/auth/signup`.
- [x] T007 [P] Contract test for `POST /api/auth/login`.
- [x] T008 [P] Contract test for `POST /api/onboarding`.
- [x] T009 [P] Contract test for `GET /api/invoices`.
- [x] T010 [P] Contract test for `GET /api/admin/invoices`.
- [x] T011 [P] Contract test for `PUT /api/admin/invoices/:id`.
- [x] T012 [P] Contract test for `POST /api/stripe/checkout-session`.
- [x] T013 [P] Contract test for `POST /api/stripe/webhook`.
- [x] T014 [P] Integration test for the client onboarding flow.
- [x] T015 [P] Integration test for the admin invoice approval flow.

## Phase 3.3: Core API Implementation
- [x] T016 Implement `POST /api/auth/signup` API route.
- [x] T017 Implement `POST /api/auth/login` API route.
- [x] T018 Implement `POST /api/onboarding` API route.
- [x] T019 Implement `GET /api/invoices` API route.
- [x] T020 Implement `GET /api/admin/invoices` API route.
- [x] T021 Implement `PUT /api/admin/invoices/:id` API route.
- [x] T022 Implement `POST /api/stripe/checkout-session` API route.
- [x] T023 Implement `POST /api/stripe/webhook` API route.

## Phase 3.4: UI - Onboarding Wizard
- [x] T024: Build UI for Step 1: Base Package Selection.
- [x] T025: Build UI for Step 2: Add-on Selection.
- [x] T026: Build UI for Step 3: Website Inspiration & Design.
- [x] T027: Build UI for Step 4: Domain & Hosting Selection.
- [x] T028: Build UI for Step 5: Maintenance Plan Selection.
- [x] T029: Build UI for Step 6: Account Creation & Order Summary.
- [x] T030: Implement visual progress tracker for the wizard.
- [x] T031: Implement real-time cost calculator for the wizard.

## Phase 3.5: UI - Client Dashboard
- [x] T032: Build main dashboard layout and overview component.
- [x] T033: Build project status tracking view with timeline.
- [x] T034: Build asset upload interface.
- [x] T035: Build billing and invoice history page (with PDF download).
- [x] T036: Build support ticket system (create, track, view history).
- [x] T037: Build account management page (password, notification preferences).

## Phase 3.6: UI - Admin Dashboard
- [x] T038: Build main admin layout and navigation.
- [x] T039: Build Project Management view (list with filters, detail view).
- [x] T040: Build Client Management view (list, details, internal notes).
- [x] T041: Build Support Ticket Management interface (view, assign, resolve).
- [x] T042: Build Contact Submission inbox view.
- [x] T043: Build Broadcast Notification tool.
- [x] T044: Build System Administration view (stats, config, debug tools).

## Phase 3.7: Integration
- [ ] T045: Connect Auth pages (Signup/Login) to Supabase Auth & implement email verification.
- [ ] T046: Connect Onboarding Wizard state to the backend API.
- [ ] T047: Connect Asset Upload interface to Supabase Storage.
- [ ] T048: Connect the full Support Ticket system to the database.
- [ ] T049: Connect the public Contact Form to the `contact_submissions` table.
- [ ] T050: Update Invoice & Payment APIs to handle tax calculations.
- [ ] T051: Implement Role-Based Access Control for all admin routes.

## Phase 3.8: Polish
- [ ] T052: Write unit tests for critical utility functions.
- [ ] T053: Ensure all pages are responsive and mobile-friendly.
- [ ] T054: Add accessibility features (e.g., ARIA attributes).
- [ ] T055: Write README.md with detailed setup and usage instructions.
