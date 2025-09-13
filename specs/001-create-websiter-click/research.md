# Research for websiter.click Ordering Platform

This document addresses the unknowns identified in the `plan.md` file.

## Performance Goals

- **Decision**: Target a Lighthouse performance score of 90+ for the landing page and client dashboard.
- **Rationale**: This provides a good user experience and is a measurable goal.
- **Alternatives considered**: None, as this is a standard industry benchmark.

## Constraints

- **Decision**: Assume a standard freelance project timeline of 4-6 weeks for the MVP.
- **Rationale**: This is a reasonable timeframe for a single developer to build the MVP.
- **Alternatives considered**: None, as no other constraints were provided.

## Scale/Scope

- **Decision**: The initial build will target up to 100 clients and 1,000 invoices in the first year.
- **Rationale**: This is a reasonable starting point for a freelance developer's client base.
- **Alternatives considered**: None, as this is an initial estimate.

## Frontend Logging Strategy

- **Decision**: Use a simple logging service (like LogSnag or Axiom) to capture important frontend events and errors.
- **Rationale**: This provides visibility into frontend issues without the complexity of a full-blown observability platform.
- **Alternatives considered**: Sentry, LogRocket (more complex to set up).
