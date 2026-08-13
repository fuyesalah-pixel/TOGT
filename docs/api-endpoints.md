# TOGT API Endpoints (NestJS, `togt-api`)

Base URL (local dev): `http://localhost:3001/api`

## Auth
- `POST /auth/google` — Google OAuth callback, issues JWT + refresh token
- `POST /auth/login` — email/password login (admin/tech accounts only)
- `POST /auth/refresh` — refresh JWT
- `POST /auth/logout`

## Users
- `GET /users` — admin, filterable by role/status/year, searchable by name/id/phone
- `GET /users/:id`
- `PATCH /users/:id` — update profile
- `PATCH /users/:id/role` — admin only
- `PATCH /users/:id/terminate` — admin only

## Packages
- `GET /packages` — public, filter by type/segment
- `GET /packages/:id` — public
- `POST /packages` — worker
- `PATCH /packages/:id` — worker
- `DELETE /packages/:id` — worker

## Groups
- `GET /groups` — guide sees own, worker/admin sees all
- `POST /groups` — worker, max 50 members + 2 guides enforced
- `POST /groups/:id/members`
- `PATCH /groups/:id/status`

## Service Requests (Smart Form intake)
- `GET /service-requests` — user sees own, worker sees assigned/all
- `POST /service-requests` — Smart Form submission (any of the 6 tabs)
- `PATCH /service-requests/:id/status` — worker
- `GET /service-requests/:id/history` — progress_history

## Tickets
- `POST /tickets` — worker converts a `ticket` service_request into a full ticket record
- `PATCH /tickets/:id/issue` — set ETKT/PNR, mark issued
- `PATCH /tickets/:id/refund` — process refund
- `GET /tickets/:id`

## Umrah Gifts
- `POST /umrah/gifts` — create gift (full/half) linked to a service_request
- `GET /umrah/gifts/:id`
- `PATCH /umrah/gifts/:id/status`

## Visa Applications
- `GET /visa-applications` — user sees own, worker sees assigned
- `POST /visa-applications`
- `PATCH /visa-applications/:id/status`

## Consulting
- `POST /consulting` — schedule/request consultation ("Contact Us" tab too)
- `GET /consulting/:id`

## Chat
- `GET /chat/messages` — between two users
- `POST /chat/messages` — send message, file upload (10MB max)
- `GET /chat/conversations`

## GPS
- `POST /gps/location` — update location
- `GET /gps/group/:groupId` — guide sees all members, geofence check
- `GET /gps/parent/:userId` — secure token-based parent tracking link

## Reviews
- `GET /reviews` — public, latest 3, paginated "See More"
- `GET /reviews/all` — admin
- `POST /reviews` — customer, 24h after completion
- `GET /reviews/user/:userId`

## Notifications
- `GET /notifications` — user's notifications
- `POST /notifications/bulk` — admin (all/group/single via email/SMS/in-app)
- `PATCH /notifications/:id/read`

## Reports (Admin)
- `GET /reports/users` — counts by service/status/year
- `GET /reports/comparison` — week/month/year
- `GET /reports/export-pdf`

## System (Tech)
- `GET /system/health`
- `GET /system/logs`
- `POST /system/maintenance` — toggle maintenance mode
