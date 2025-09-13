# Data Model for websiter.click

This document defines the database schema based on the key entities from the feature specification.

## Tables

### `clients`
Represents a user who can place an order.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | Primary Key, Default: `uuid_generate_v4()` |
| `name` | `text` | Not Null |
| `email` | `text` | Not Null, Unique |
| `phone` | `text` | Nullable |
| `created_at` | `timestamp with time zone` | Not Null, Default: `now()` |

### `projects`
Represents a website order.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | Primary Key, Default: `uuid_generate_v4()` |
| `client_id` | `uuid` | Foreign Key to `clients.id` |
| `status` | `text` | Not Null, e.g., `submitted_for_review`, `active` |
| `website_type` | `text` | Not Null |
| `design_preferences` | `jsonb` | Nullable |
| `add_ons` | `jsonb` | Nullable |
| `domain_info` | `jsonb` | Nullable |
| `maintenance_plan` | `text` | Nullable |
| `created_at` | `timestamp with time zone` | Not Null, Default: `now()` |

### `invoices`
Represents the financial record of an order.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | Primary Key, Default: `uuid_generate_v4()` |
| `project_id` | `uuid` | Foreign Key to `projects.id` |
| `status` | `text` | Not Null, e.g., `draft`, `approved`, `paid` |
| `line_items` | `jsonb` | Not Null |
| `total_amount` | `integer` | Not Null (in cents) |
| `currency` | `text` | Not Null, Default: `cad` |
| `created_at` | `timestamp with time zone` | Not Null, Default: `now()` |

### `notifications`
Represents a message for a user.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | Primary Key, Default: `uuid_generate_v4()` |
| `client_id` | `uuid` | Foreign Key to `clients.id` |
| `message` | `text` | Not Null |
| `is_read` | `boolean` | Not Null, Default: `false` |
| `created_at` | `timestamp with time zone` | Not Null, Default: `now()` |
