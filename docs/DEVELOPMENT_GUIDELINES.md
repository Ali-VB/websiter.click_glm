# DEVELOPMENT_GUIDELINES.md – Web Development Guidelines for Qoder IDE

This file defines best practices, workflows, and safety reminders for development within this project. All contributors — including solo development work — **must follow** these rules to ensure quality, stability, and maintainability.

---

## 🔒 General Principles
- **Stability first**: Do not break existing features while adding new ones.
- **Minimal impact**: Fix bugs in a targeted way, without introducing unrelated changes.
- **Reversibility**: Always write changes in a way that can be easily rolled back.
- **Consistency**: Follow the established coding style, patterns, and conventions.

---

## 🛠 Bug Fixing Rules
1. **Investigate carefully** before changing code. Understand the cause, not just the symptom.
2. **Avoid collateral damage**: Ensure that bug fixes do not break existing features.
3. **Write regression tests** whenever possible to prevent the same bug from reappearing.
4. **Document changes** in commit messages and/or inline comments.
5. **Do not optimize prematurely** – fix the bug first, optimize later if needed.

---

## 🌐 Web Development Best Practices
- **Accessibility (a11y):** Ensure semantic HTML and ARIA attributes where needed.
- **Performance:** Optimize assets, use lazy loading, minimize bundle size.
- **Security:** Validate inputs, escape outputs, and avoid exposing sensitive data.
- **Responsive design:** Support mobile, tablet, and desktop views.
- **Code organization:** Use clear folder structures and meaningful naming conventions.
- **Version control:** Commit small, focused changes with descriptive messages.

---

## 📋 Code Review Checklist (Self-Check)
Before finalizing a change, ask:
- Does this change fix only what it is supposed to?
- Did I run all tests (unit, integration, UI if applicable)?
- Could this unintentionally break another part of the system?
- Is the code clean, readable, and documented?

---

## 🔄 Step-by-Step Workflow (Solo Developer)

As a solo developer, you can streamline the branching strategy. Here’s the recommended approach:

### 1. Branching
- **Default:** Work directly on `main` for **small, safe edits** (typos, text changes, CSS tweaks).
- **Use a branch** for:
  - New features that may take time to complete.
  - Risky bug fixes or refactors that could break existing code.
  - Experiments or alternative implementations.
- Branch naming (when used):
  - `feature/<short-description>`
  - `bugfix/<short-description>`

### 2. Development
- Keep changes focused and incremental.
- Run tests and manually verify functionality before committing.
- Add or update tests alongside your changes.

### 3. Commit Messages
- Use descriptive messages:
  - `feat: add user login form`
  - `fix: resolve null pointer in dashboard`
  - `chore: update dependencies`

### 4. Testing
- Run all tests (unit, integration, UI if applicable).
- Manually check critical flows.
- Verify responsive design and cross-browser behavior if relevant.

### 5. Merge (if using branches)
- Merge only after you’ve verified stability.
- Delete branches after merge to keep the repo clean.

### 6. Post-Merge
- Verify that the application runs as expected.
- Monitor logs and error reports if deployed.

---

## 🚫 Common Mistakes to Avoid
- ❌ **Hardcoding values** (e.g., API URLs, credentials) → use config files or environment variables.
- ❌ **Skipping tests** after changes → always run tests, even for small edits.
- ❌ **Deleting migrations or database files** instead of creating proper migrations.
- ❌ **Mixing unrelated changes** in one commit → keep commits focused.
- ❌ **Ignoring accessibility** → always check basic a11y compliance.
- ❌ **Committing sensitive data** (passwords, keys, tokens).
- ❌ **Overwriting working code** when fixing bugs instead of understanding the root cause.
- ❌ **Forgetting backups/branches** before risky refactors.

---

## 🚀 Deployment Checklist
Before pushing changes live, always verify:

1. **Code & Tests**
   - All tests (unit, integration, UI) are passing.
   - No linting or build errors remain.

2. **Environment & Config**
   - Environment variables are set correctly.
   - No sensitive data (tokens, API keys) is hardcoded.
   - Config matches the target environment (staging/production).

3. **Database & Migrations**
   - All new migrations are applied and tested.
   - No manual changes were made that bypass migrations.

4. **Performance & Security**
   - Assets are optimized and minified.
   - No obvious security vulnerabilities (e.g., open endpoints, missing validations).
   - HTTPS and CORS policies are correctly configured.

5. **User Experience**
   - Application is responsive across devices.
   - Key features work smoothly without regression.
   - Accessibility is checked (basic keyboard navigation and ARIA roles).

6. **Monitoring & Rollback**
   - Error logging is enabled (server and client).
   - Backups exist for database and critical files.
   - Rollback strategy is ready in case of failure.

---

## ⚠️ Important Reminders
- Be **careful with every change**.
- When fixing bugs, **do not ruin another implementation or working feature**.
- Communicate unclear requirements to yourself clearly (write notes/todos) before implementing.
- Prioritize **maintainability over cleverness**.
- Always keep a **backup or branch** before major changes.

---

✅ Following these rules, solo-friendly workflow, and deployment checklist will keep the project stable, maintainable, and scalable.
