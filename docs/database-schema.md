# TOGT Database Schema

PostgreSQL 16, managed via Prisma ORM (`togt-api/prisma/schema.prisma`). All primary keys are UUID.

## Core Tables

### users
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| email | text UNIQUE | |
| google_id | text UNIQUE, nullable | null for seeded admin/tech accounts |
| password_hash | text, nullable | bcrypt, only for admin/tech seeded accounts |
| full_name | text | |
| phone | text | |
| passport_number | text, nullable | |
| passport_expiry | date, nullable | |
| role | enum(customer, worker, guide, admin, tech) | |
| status | enum(active, terminated) | default active |
| language_preference | enum(en, ar, am, om) | default en |
| created_at, updated_at | timestamptz | |

### packages
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| title | text | |
| description | text | |
| type | enum(umrah_economy, umrah_vip, umrah_honeymoon, umrah_custom, domestic_prebuilt, domestic_custom, tourist_prebuilt, tourist_custom) | |
| segment | text, nullable | school / honeymoon / friends / corporate (domestic); route name (foreigner) |
| pricing | JSONB | { amount, currency, discount } |
| duration_days | int | |
| max_members | int | default 50 |
| includes | text[] | |
| excludes | text[] | |
| created_by | UUID FK -> users.id | |
| is_active | boolean | default true |
| created_at | timestamptz | |

### groups
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | text | |
| package_id | UUID FK -> packages.id | |
| start_date, end_date | date | |
| status | enum(upcoming, in_progress, completed, cancelled) | |
| created_by | UUID FK -> users.id | |
| created_at | timestamptz | |

### group_members
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| group_id | UUID FK -> groups.id | |
| user_id | UUID FK -> users.id | |
| role | enum(member, guide) | max 50 members + 2 guides enforced at app layer |
| joined_at | timestamptz | |

### service_requests
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK -> users.id, nullable | nullable to support guest Smart Form submissions |
| service_type | enum(ticket, umrah, domestic, tourist, visa, consulting) | |
| package_id | UUID FK -> packages.id, nullable | |
| status | enum(pending, accepted, in_progress, completed, cancelled) | |
| form_data | JSONB | raw Smart Form field values, service-specific |
| assigned_worker | UUID FK -> users.id, nullable | |
| created_at, completed_at | timestamptz | |

### progress_history
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| service_request_id | UUID FK -> service_requests.id | |
| status_from, status_to | text | |
| changed_by | UUID FK -> users.id | |
| notes | text | |
| created_at | timestamptz | |

### tour_plan_steps
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| group_id | UUID FK -> groups.id | |
| step_order | int | |
| title, description | text | |
| location_lat, location_lng | double precision | |
| estimated_time | timestamptz, nullable | |
| is_completed | boolean | default false |
| completed_at | timestamptz, nullable | |

### location_tracking
TimescaleDB hypertable (time-series optimized) on `recorded_at`.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK -> users.id | |
| group_id | UUID FK -> groups.id, nullable | |
| latitude, longitude | double precision | |
| accuracy | double precision, nullable | |
| recorded_at | timestamptz | hypertable partition key |

### chat_messages
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| sender_id | UUID FK -> users.id | |
| receiver_id | UUID FK -> users.id | |
| service_request_id | UUID FK -> service_requests.id, nullable | |
| message | text | |
| file_url | text, nullable | max 10MB, Cloudflare R2 |
| is_read | boolean | default false |
| created_at | timestamptz | |

### reviews
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| service_request_id | UUID FK -> service_requests.id | |
| user_id | UUID FK -> users.id | |
| rating | smallint | 1–5 |
| review_text | text | |
| image_urls | text[] | max 10MB each |
| is_visible | boolean | auto-publish after 24h |
| created_at | timestamptz | |

### notifications
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK -> users.id | |
| title, message | text | |
| type | enum(status_update, new_package, chat_message, system, alert) | |
| channel | enum(in_app, email, sms) | |
| is_read | boolean | default false |
| sent_at | timestamptz | |

### system_logs
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| log_level | enum(info, warning, error, critical) | |
| service, message | text | |
| metadata | JSONB | |
| created_at | timestamptz | |

## Service-Line Specific Tables

These tables capture rich, queryable detail beyond `service_requests.form_data` (JSONB), created once a
worker converts/processes a request. `service_requests` remains the universal intake record for the
Smart Form; these tables are the operational records workers manage afterward.

### tickets
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| service_request_id | UUID FK -> service_requests.id | |
| passenger_full_name | text | as per passport |
| passport_number | text | |
| passport_expiry | date | |
| date_of_birth | date | |
| nationality | text | |
| origin, destination | text | |
| departure_date | date | |
| return_date | date, nullable | |
| cabin_class | enum(economy, business, first) | |
| passenger_count | int | default 1 |
| special_requirements | text, nullable | |
| base_fare, taxes, service_fee, total_amount | numeric(12,2) | |
| payment_method | enum(cash, bank_transfer, telebirr) | |
| amount_paid, balance_due | numeric(12,2) | |
| receipt_number | text, nullable | |
| etkt_number | text, nullable | |
| pnr_locator | text, nullable | |
| gds_used | enum(amadeus, sabre, travelport), nullable | |
| issue_date | date, nullable | |
| refund_status | enum(none, requested, processed, rejected) | default none |
| refund_amount | numeric(12,2), nullable | |
| refund_date | date, nullable | |
| cancellation_penalty | numeric(12,2), nullable | |
| created_by | UUID FK -> users.id | worker |
| created_at, updated_at | timestamptz | |

### umrah_gifts
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| service_request_id | UUID FK -> service_requests.id | |
| sender_user_id | UUID FK -> users.id | |
| recipient_user_id | UUID FK -> users.id, nullable | linked once recipient registers |
| recipient_full_name | text | |
| recipient_phone, recipient_email | text | |
| gift_type | enum(full, half) | |
| amount_covered_by_sender | numeric(12,2) | |
| remaining_amount | numeric(12,2) | 0 if full gift |
| status | enum(pending_recipient_action, awaiting_remaining_payment, confirmed, cancelled) | |
| created_at | timestamptz | |

### visa_applications
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| service_request_id | UUID FK -> service_requests.id | |
| applicant_user_id | UUID FK -> users.id | |
| visa_type | enum(visit, medical, family) | |
| destination_country | text | |
| purpose_details | text | |
| sponsor_relationship | text, nullable | family visa |
| hospital_name | text, nullable | medical visa |
| documents_checklist | JSONB | { docName: boolean(received) } |
| embassy_submission_date | date, nullable | |
| tracking_number | text, nullable | |
| status | enum(consultation, document_collection, submitted, under_review, additional_docs_requested, approved, rejected, collected) | |
| assigned_worker | UUID FK -> users.id | |
| created_at, updated_at | timestamptz | |

### consulting_requests
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| service_request_id | UUID FK -> service_requests.id, nullable | |
| user_id | UUID FK -> users.id, nullable | nullable for guest "Contact Us" inquiries |
| area | enum(umrah, ticket, tour, visa, general) | |
| preferred_contact_method | enum(phone, email, in_person) | |
| scheduled_time | timestamptz, nullable | |
| is_paid | boolean | default false |
| converted_to_booking | boolean | default false |
| notes | text | |
| created_at | timestamptz | |

## Entity Relationship Summary

```
users ──1:N── packages (created_by)
users ──1:N── groups (created_by)
groups ──1:N── group_members ──N:1── users
groups ──1:N── tour_plan_steps
groups ──1:N── location_tracking
packages ──1:N── service_requests
users ──1:N── service_requests (user_id, assigned_worker)
service_requests ──1:N── progress_history
service_requests ──1:1── tickets | umrah_gifts | visa_applications | consulting_requests
service_requests ──1:N── reviews
users ──N:N── chat_messages (sender/receiver)
users ──1:N── notifications
```

