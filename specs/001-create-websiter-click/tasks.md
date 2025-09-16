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

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T016 Implement `POST /api/auth/signup` API route.
- [x] T017 Implement `POST /api/auth/login` API route.
- [x] T018 Implement `POST /api/onboarding` API route.
- [x] T019 Implement `GET /api/invoices` API route.
- [x] T020 Implement `GET /api/admin/invoices` API route.
- [ ] T021 Implement `PUT /api/admin/invoices/:id` API route.
- [ ] T022 Implement `POST /api/stripe/checkout-session` API route.
- [ ] T023 Implement `POST /api/stripe/webhook` API route.
- [ ] T024 [P] Create the landing page UI (`src/app/page.tsx`).
- [ ] T025 [P] Create the sign-up page UI (`src/app/signup/page.tsx`).
- [ ] T026 [P] Create the login page UI (`src/app/login/page.tsx`).
- [ ] T027 Create the multi-step onboarding wizard UI (`src/app/onboarding/page.tsx`).
- [ ] T028 Create the client dashboard UI (`src/app/dashboard/page.tsx`).
- [ ] T029 Create the admin portal UI for invoice management (`src/app/admin/invoices/page.tsx`).

## Phase 3.4: Integration
- [ ] T030 Connect auth API routes to Supabase Auth.
- [ ] T031 Connect onboarding and invoice API routes to Supabase database.
- [ ] T032 Integrate Stripe checkout session creation.
- [ ] T033 Implement email verification flow using Supabase.
- [ ] T034 Implement email notifications for invoice approval and payment confirmation.

## Phase 3.5: Polish
- [ ] T035 [P] Write unit tests for critical utility functions.
- [ ] T036 [P] Ensure all pages are responsive and mobile-friendly.
- [ ] T037 [P] Add accessibility features (e.g., ARIA attributes).
- [ ] T038 [P] Write README.md with detailed setup and usage instructions.

## Dependencies
- Setup (T001-T005) must be completed before all other tasks.
- Tests (T006-T015) must be completed before core implementation (T016-T029).
- Core implementation tasks for API routes (T016-T023) should be completed before the UI tasks that depend on them (T024-T029).
- Integration tasks (T030-T034) depend on core implementation tasks.

## Parallel Example
```
# The following setup tasks can be run in parallel:
Task: "Install and configure shadcn/ui."
Task: "Install and configure Supabase client (`@supabase/supabase-js`)."
Task: "Install and configure Stripe client (`stripe`)."
Task: "Set up Jest and React Testing Library for testing."

# The following test tasks can be run in parallel:
Task: "Contract test for POST /api/auth/signup."
Task: "Contract test for POST /api/auth/login."
Task: "Contract test for POST /api/onboarding."
...
```
