# TOGT Tour & Travel — Requirements & Business Analysis

## 1. Company Overview

TOGT Tour & Travel is a full-service travel agency based in Addis Ababa, Ethiopia.
As an **IATA member**, TOGT has direct access to airline ticketing systems (GDS: Amadeus/Sabre/Travelport)
and can issue, reissue, and refund flight tickets through official channels (BSP).

Business spans:
- **Outbound travel** — Ethiopians traveling abroad (especially Umrah pilgrims)
- **Inbound travel** — foreigners visiting Ethiopia

## 2. The Six Core Business Lines

### 2.1 ✈️ Ticket Office (IATA Member Services)
- Sell international & domestic flight tickets via IATA BSP
- Process refunds per IATA regulations (refundable vs non-refundable, cancellation penalties, taxes usually refundable, 7–30 business day processing, no-show penalties, partial refunds)
- Reissue tickets (date/route changes)
- Group flight bookings

**Business flow:** Customer inquiry → Worker checks GDS options → Customer chooses flight → Worker collects passenger/passport/contact/date/class details → Price quoted (base fare + taxes + TOGT service fee) → Payment (cash/bank/Telebirr) → Ticket issued (ETKT + PNR) → Travel → (optional) Refund flow.

**Revenue model:** Airline commission (0–9%), service fee (500–2,000 ETB/ticket), refund processing fee (500–1,000 ETB), occasional fare markup.

### 2.2 🕋 Umrah Package (Core Business)
Package types:
1. **Economy** — shared rooms, standard hotel, group transport, Imam included, basic meals
2. **VIP** — premium hotel near Haram, private/semi-private rooms, private transport, premium meals, dedicated Imam
3. **Honeymoon** — all VIP features + marital-life training sessions with Imam/counselor + couple privacy arrangements
4. **Custom** — customer chooses hotel tier, transport, group size, optional Imam

**Umrah Gift feature:**
- **Full Gift** — sender pays 100%, recipient only provides documents
- **Half Gift** — sender pays 50%, recipient pays remaining 50% before travel
- Gift certificate/notification sent to recipient

**Process flow:** Inquiry → Document collection (passport 6mo+ validity, photos, meningitis vaccination cert, bank statement, mahram proof for women under 45) → Visa processing (Saudi Ministry of Hajj, 5–10 working days) → Flight + hotel booking → Pre-departure briefing (Ihram/Tawaf/Sa'i training) → Departure (Bole Airport) → In Saudi Arabia (airport pickup, guided rituals, GPS tracking) → Return → Follow-up (thank-you PDF, review request after 24h).

**Revenue model:** Package markup 15–30%, visa processing fees, ETB→SAR/USD exchange margin, group discounts.

### 2.3 🏔️ Domestic Tours
Target segments: **School trips**, **Honeymoon trips**, **Friends vacations**, **Corporate trips**.

Destinations:
- Northern Circuit: Lalibela, Gondar, Axum, Bahir Dar, Simien Mountains
- Southern Circuit: Hawassa, Arba Minch, Dorze Village, Omo Valley, Bale Mountains
- Eastern Circuit: Harar, Dire Dawa, Awash National Park, Danakil Depression

**Package structure:** 2 pre-built packages (worker-created, fixed dates) + 1 custom option per segment.

**Revenue model:** Package markup 20–35%, corporate contracts, seasonal pricing, school trip commissions.

### 2.4 🌍 Foreigner Tours (Inbound Tourism)
"Airport to Airport" service:
- **On arrival:** pickup, welcome sign, hotel transfer/check-in, orientation, optional SIM
- **During stay:** daily guided tours (multi-lingual: English, Arabic, French, Spanish, German, Italian, Chinese, Turkish), hotel, domestic flights, ground transport, restaurant reservations, cultural experiences, 24/7 emergency support
- **On departure:** checkout assistance, airport transfer, VAT refund assistance, feedback collection

**Package structure:** 2 pre-built routes + 1 custom option. Popular routes: Historical Northern Circuit (7–10 days), Cultural South (5–7 days), Nature & Wildlife (4–6 days), Addis City Tour (2–3 days), Combined (14+ days).

**Revenue model:** Package markup 25–40%, USD/EUR pricing, hotel/guide commissions, premium service fees.

### 2.5 🛂 Visa Processing
Visa types: **Visit** (tourism/family/business — UAE, Turkey, China, India), **Hospital/Medical** (requires doctor referral, hospital appointment, medical history, financial proof), **Family** (sponsorship docs, relationship proof).

**Process flow:** Consultation → Document collection (passport, photos, bank statement, employment letter, insurance, itinerary/hotel proof) → Application preparation → Submission to embassy → Status tracking → Collection → Post-issuance follow-up.

**Revenue model:** Service fee 500–3,000 ETB/application, translation fees, express processing fees, consultation fees.

### 2.6 💼 Consulting
Areas: Umrah, Ticket, Tour, Visa consulting. Free initial consultation (15–30 min), optional paid in-depth consultation, can convert to booking.

## 3. Organizational Structure & System Roles

| Real-world role | System role | Responsibilities |
|---|---|---|
| Manager/Owner | `admin` | Oversees everything, approves decisions, reviews reports |
| Ticket/Umrah/Tour/Visa workers (4–8 people) | `worker` | Customer service, package creation, booking, visa processing, group coordination |
| Imams / Tour guides | `guide` | Group leadership, member tracking, tour plan execution |
| System administrator (1 person) | `tech` | Maintenance, troubleshooting, updates, monitoring |
| End customers | `customer` | Book services, track progress, chat, review |

Each user has **exactly one role** (no multi-role accounts). Authentication via Google OAuth 2.0, except seeded `admin@togt.com` / `tech@togt.com` accounts.

## 4. Business Intelligence Requirements (Admin Reports)

- **Service performance:** revenue/volume by service line, seasonal trends (Ramadan, summer)
- **Customer insights:** total/new/repeat customers, lifetime value, satisfaction (reviews)
- **Worker performance:** requests handled, average completion time, chat response time
- **Financial reports:** revenue by service/month/year, package profitability, refund analysis
- **Group performance:** average group size, guide performance, completion rate, incidents

## 5. Functional Requirements Summary (by Dashboard)

See `api-endpoints.md` and `database-schema.md` for the technical mapping of these features.

- **Public Website:** Hero, About, Umrah/Domestic/Foreigner/Ticket/Visa sections, Smart Form (6 tabs), FAQ, Testimonials (3 + "See More"), Footer, floating WhatsApp + AI Assistant.
- **Customer Dashboard:** Track Processes, History, Chat, Parent Control (GPS link), Reviews, Tour Plan Tracking, Notifications, Settings.
- **Worker Dashboard:** Users, Create (user/group/package), Progress (status + notes + history log), Chat, Notifications, Settings.
- **Guide Dashboard:** Group cards → My Members / Tracking Plan / Track Map (1km geofence alert), Chat, Notifications, Settings.
- **Admin Dashboard:** Users (filter/search/terminate/role management), Reports (export PDF), Notifications (bulk send), Settings.
- **Tech Dashboard:** System health, error logs (GlitchTip), maintenance mode toggle, AI error analyzer (read-only), Settings.

## 6. Non-Functional Requirements

- Multi-language public site (en/ar full, am/om placeholder), dashboards English-only
- File uploads capped at 10MB (chat, reviews, documents) via Cloudflare R2
- Offline mode for Worker Dashboard (IndexedDB + Service Worker background sync)
- Daily automated backup (2:00 AM EAT, pg_dump → gzip → Telegram, 30-day retention)
- Security: JWT + refresh tokens, RBAC, rate limiting, input validation, bcrypt for seeded accounts, CORS, secure headers
