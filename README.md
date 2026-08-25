# Pickleball Booking & Marketing Platform

A full-stack web-based platform for a pickleball facility that combines a marketing website, court reservations, Open Play activities, online payments, and an administrative management system.

---

## 📌 Project Overview

The **Pickleball Booking & Marketing Platform** allows customers to:

- Browse the pickleball facility website
- View available courts and pricing
- Reserve specific courts and time slots
- Join Open Play activities
- Pay online through PayMongo
- View booking and payment history
- Manage their profile
- Cancel eligible bookings

Administrators can:

- Manage courts
- Manage court pricing
- Manage court availability
- Manage bookings
- Create and manage Open Play activities
- Manage Open Play participants
- Monitor payments
- Manage users
- View reports and dashboard statistics

The core business rule is:

> **A booking is only confirmed after successful payment has been verified by the backend.**

---

# 🏗️ System Architecture

```text
                    PICKLEBALL PLATFORM
                            │
             ┌──────────────┴──────────────┐
             │                             │
        MARKETING                      BOOKING
          WEBSITE                        SYSTEM
             │                             │
      ┌──────┼──────┐             ┌────────┴────────┐
      │      │      │             │                 │
     Home  Courts Pricing     Court Booking      Open Play
                                    │                 │
                                    └────────┬────────┘
                                             │
                                             ▼
                                       EXPRESS.JS
                                             │
                         ┌───────────────────┼───────────────────┐
                         │                   │                   │
                      Booking             Payment              Auth
                      Service             Service             Service
                         │                   │
                         │                   ▼
                         │                PAYMONGO
                         │                   │
                         │        ┌──────────┼──────────┐
                         │        │          │          │
                         │      GCash       Maya       Card
                         │
                         ▼
                    SUPABASE
                    PostgreSQL
```

---

# 🛠️ Technology Stack

| Layer            | Technology             |
| ---------------- | ---------------------- |
| Frontend         | Next.js                |
| Language         | TypeScript             |
| Styling          | Tailwind CSS           |
| UI Components    | shadcn/ui              |
| Backend          | Node.js + Express.js   |
| Database         | Supabase PostgreSQL    |
| Authentication   | Supabase Auth          |
| Validation       | Zod                    |
| Payment Gateway  | PayMongo               |
| API              | REST API               |
| Frontend Hosting | Vercel                 |
| Backend Hosting  | Render / Railway / VPS |
| Database Hosting | Supabase               |

---

# 📂 Project Structure

```text
pickleball-platform/
│
├── client/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   ├── services/
│   └── types/
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   ├── supabase.ts
│   │   │   └── paymongo.ts
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── court.controller.ts
│   │   │   ├── courtBooking.controller.ts
│   │   │   ├── openPlay.controller.ts
│   │   │   ├── openPlayBooking.controller.ts
│   │   │   └── payment.controller.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── admin.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── rateLimit.middleware.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── court.routes.ts
│   │   │   ├── courtBooking.routes.ts
│   │   │   ├── openPlay.routes.ts
│   │   │   ├── openPlayBooking.routes.ts
│   │   │   └── payment.routes.ts
│   │   │
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── court.service.ts
│   │   │   ├── courtBooking.service.ts
│   │   │   ├── openPlay.service.ts
│   │   │   ├── openPlayBooking.service.ts
│   │   │   └── payment.service.ts
│   │   │
│   │   ├── validators/
│   │   │   ├── auth.validator.ts
│   │   │   ├── court.validator.ts
│   │   │   ├── courtBooking.validator.ts
│   │   │   ├── openPlay.validator.ts
│   │   │   └── payment.validator.ts
│   │   │
│   │   ├── types/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
└── README.md
```

---

# 👥 User Roles

## Customer

Customers can:

- Register and login
- Browse the website
- View courts
- View availability
- Book courts
- Join Open Play
- Make payments
- View bookings
- View payment history
- Cancel eligible bookings
- Manage their profile

## Admin

Administrators can:

- Manage users
- Create and edit courts
- Set court prices
- Disable courts
- Manage court schedules
- View bookings
- Create Open Play activities
- Set activity capacity
- Set Open Play prices
- Manage participants
- View payments
- Process eligible cancellations/refunds
- View reports
- View dashboard statistics

---

# 🌐 Marketing Website

The public website contains:

```text
/
├── Home
├── About
├── Courts
├── Open Play
├── Pricing
├── Events
├── Contact
├── Login
└── Register
```

## Homepage Sections

- Hero section
- Facility introduction
- Available courts
- Why choose us
- Open Play activities
- Pricing
- Gallery
- Testimonials
- Location
- Call-to-action
- Footer

### Primary CTA

```text
Book a Court
```

### Secondary CTA

```text
Join Open Play
```

---

# 🏟️ Court Booking

Customers can reserve a specific court for a specific hourly time slot.

### Example

```text
Court: Court 1
Date: August 25, 2026

8:00 AM   AVAILABLE
9:00 AM   AVAILABLE
10:00 AM  BOOKED
11:00 AM  AVAILABLE
12:00 PM  AVAILABLE
...
7:00 PM   AVAILABLE
```

Operating hours:

```text
8:00 AM – 8:00 PM
```

Each booking is one hour.

Example:

```text
6:00 PM – 7:00 PM
```

---

# 💰 Court Pricing

Administrators can configure the price of each court.

Example:

```text
Court Name: Court 1
Court Number: 1
Price: ₱400/hour
Status: ACTIVE
```

Possible court statuses:

```text
ACTIVE
INACTIVE
MAINTENANCE
```

A court can be disabled when it is unavailable for maintenance or other reasons.

---

# 🎾 Open Play

Open Play allows customers to join activities created by administrators.

Unlike court booking, customers are not reserving an entire court.

Instead, they reserve player slots.

### Example

```text
Activity:
Beginner Open Play

Date:
August 25, 2026

Time:
6:00 PM – 8:00 PM

Capacity:
24 players

Price:
₱250/player

Available:
18 / 24 slots
```

A customer can reserve:

```text
2 slots
```

Total:

```text
₱250 × 2 = ₱500
```

---

# 🎯 Open Play Management

Administrators can create:

```text
Activity Name
Description
Date
Start Time
End Time
Capacity
Price
Skill Level
Status
```

Example:

```text
Activity:
Beginner Open Play

Skill Level:
Beginner

Date:
August 25, 2026

Time:
6:00 PM – 8:00 PM

Capacity:
24

Price:
₱250
```

---

# 💳 Payment System

The platform uses **PayMongo** as the payment gateway.

Supported payment methods may include:

- GCash
- Maya
- Credit/Debit Cards
- QR Ph
- Other payment methods supported by PayMongo

The application does not directly integrate with GCash or Maya.

Instead:

```text
Customer
   ↓
Next.js
   ↓
Express.js
   ↓
PayMongo
   ↓
GCash / Maya / Card / QR Ph
```

---

# 🔄 Booking & Payment Flow

The booking process follows:

```text
Select Court / Open Play
          ↓
Booking Summary
          ↓
Reserve & Pay
          ↓
Create PENDING_PAYMENT
          ↓
PayMongo Checkout
          ↓
Customer Payment
          ↓
PayMongo Webhook
          ↓
Verify Payment
          ↓
Update Payment
          ↓
Confirm Booking
```

The frontend must never determine whether a payment was successful.

The backend receives and verifies the payment notification from PayMongo.

---

# ⏳ Temporary Reservation

When payment begins, the selected booking slot is temporarily reserved.

Example:

```text
Court 1
6:00 PM – 7:00 PM

Status:
PENDING_PAYMENT
```

The payment window can be configured.

Example:

```text
10 minutes
```

If the customer does not complete payment:

```text
PENDING_PAYMENT
        ↓
      EXPIRED
        ↓
Slot becomes available
```

This prevents unpaid reservations from permanently blocking court schedules.

---

# 🔔 PayMongo Webhook

Endpoint:

```text
POST /api/payments/webhook/paymongo
```

Payment confirmation should come from the webhook.

```text
PayMongo
    ↓
Webhook
    ↓
Express.js
    ↓
Verify Event
    ↓
Update Payment
    ↓
Update Booking
```

Successful payment:

```text
Payment:
PAID

Booking:
CONFIRMED
```

---

# 📊 Statuses

## Payment Status

```text
PENDING
PAID
FAILED
EXPIRED
REFUNDED
```

## Booking Status

```text
PENDING_PAYMENT
CONFIRMED
CANCELLED
COMPLETED
EXPIRED
```

---

# 🗄️ Database

The application uses **Supabase PostgreSQL**.

Main tables:

```text
users
courts
court_bookings
open_play_activities
open_play_bookings
payments
```

---

## Users

```text
id
name
email
phone
role
created_at
updated_at
```

Roles:

```text
CUSTOMER
ADMIN
```

---

## Courts

```text
id
name
description
price_per_hour
status
created_at
updated_at
```

---

## Court Bookings

```text
id
user_id
court_id
booking_date
start_time
end_time
total_amount
status
created_at
updated_at
```

---

## Open Play Activities

```text
id
title
description
date
start_time
end_time
capacity
price
skill_level
status
created_at
updated_at
```

---

## Open Play Bookings

```text
id
activity_id
user_id
number_of_slots
total_amount
status
created_at
updated_at
```

---

## Payments

```text
id
user_id
booking_type
booking_id
amount
currency
provider
payment_method
provider_reference
checkout_url
status
paid_at
created_at
updated_at
```

---

# 🔌 REST API

Base URL:

```text
http://localhost:5000/api
```

Production example:

```text
https://api.yourdomain.com/api
```

---

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

---

## Courts

```http
GET    /api/courts
GET    /api/courts/:id
POST   /api/courts
PUT    /api/courts/:id
DELETE /api/courts/:id
```

---

## Court Bookings

```http
GET  /api/court-bookings
GET  /api/court-bookings/:id
POST /api/court-bookings
PUT  /api/court-bookings/:id/cancel
```

---

## Open Play

```http
GET    /api/open-play
GET    /api/open-play/:id
POST   /api/open-play
PUT    /api/open-play/:id
DELETE /api/open-play/:id
```

---

## Open Play Bookings

```http
POST /api/open-play/:id/book
GET  /api/open-play/bookings
PUT  /api/open-play/bookings/:id/cancel
```

---

## Payments

```http
POST /api/payments/create-checkout
POST /api/payments/webhook/paymongo
GET  /api/payments/:id
```

---

# 🔐 Authentication & Authorization

Authentication is handled by Supabase Auth.

The backend should verify the user's Supabase access token before accessing protected endpoints.

Example:

```text
Customer
   ↓
Supabase Login
   ↓
Access Token
   ↓
Next.js
   ↓
Express.js
   ↓
Auth Middleware
   ↓
Verify Token
   ↓
Allow Request
```

Admin-only endpoints should additionally use:

```text
auth.middleware
       ↓
admin.middleware
       ↓
controller
```

---

# 🛡️ Security Requirements

The application must implement:

- Supabase Authentication
- Role-based authorization
- Server-side validation
- Zod validation
- Supabase Row Level Security
- HTTPS in production
- Rate limiting
- Secure environment variables
- PayMongo webhook verification
- Duplicate booking protection
- Double-payment protection
- Booking expiration
- Server-side price calculation

### Important

Payment secret keys must never be exposed to the frontend.

Never place these values inside the Next.js client:

```text
SUPABASE_SERVICE_ROLE_KEY
PAYMONGO_SECRET_KEY
PAYMONGO_WEBHOOK_SECRET
```

---

# ⚙️ Server Configuration

The backend is located inside:

```text
/server
```

Install dependencies:

```bash
cd server
npm install
```

Start the development server:

```bash
npm run dev
```

Build the server:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

---

# 🔑 Environment Variables

Create:

```text
server/.env
```

Example:

```env
PORT=5000
NODE_ENV=development

FRONTEND_URL=http://localhost:3000

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

PAYMONGO_SECRET_KEY=
PAYMONGO_PUBLIC_KEY=
PAYMONGO_WEBHOOK_SECRET=
```

Never commit `.env` to Git.

---

# 📁 Server Architecture

The backend follows a layered architecture:

```text
Request
   ↓
Route
   ↓
Middleware
   ↓
Controller
   ↓
Service
   ↓
Supabase / PayMongo
```

### Routes

Responsible for defining API endpoints.

### Middleware

Responsible for:

- Authentication
- Authorization
- Rate limiting
- Error handling

### Controllers

Responsible for receiving HTTP requests and returning responses.

### Services

Responsible for business logic.

Examples:

```text
courtBooking.service.ts
payment.service.ts
openPlay.service.ts
```

### Validators

Responsible for validating request data using Zod.

### Config

Responsible for external services and environment variables.

---

# 🖥️ Admin Dashboard

The admin dashboard should contain:

```text
Dashboard
Users
Courts
Court Bookings
Open Play
Open Play Bookings
Payments
Reports
Settings
```

Dashboard statistics:

```text
Today's Revenue
Today's Bookings
Court Bookings
Open Play Bookings
Upcoming Activities
Available Courts
Pending Payments
```

---

# 👤 Customer Dashboard

Customer dashboard:

```text
My Dashboard
├── Upcoming Bookings
├── Booking History
├── Payments
└── Profile
```

Example booking:

```text
Court 2
August 25, 2026
6:00 PM – 7:00 PM

₱400
PAID

[View Details]
[Cancel]
```

---

# 🚫 Double Booking Protection

The system must prevent two customers from reserving the same court and time.

The backend should:

1. Validate the request.
2. Check the court status.
3. Check the requested date/time.
4. Check existing bookings.
5. Create a temporary reservation.
6. Start the payment process.
7. Confirm only after payment.
8. Expire unpaid reservations.

The database should also enforce appropriate constraints to prevent race conditions.

Never rely only on frontend availability checks.

---

# 💵 Server-Side Price Calculation

The frontend should not be trusted to determine the final price.

For example, the frontend might send:

```json
{
  "courtId": "court-id",
  "date": "2026-08-25",
  "startTime": "18:00"
}
```

The backend retrieves the actual court price:

```text
Court 1
₱400/hour
```

Then calculates:

```text
Total = ₱400
```

For Open Play:

```text
Price = ₱250
Slots = 2

Total = ₱500
```

This prevents users from modifying prices through browser requests.

---

# 🧪 Development

Recommended development order:

```text
1. Server Setup
       ↓
2. Supabase Database
       ↓
3. Supabase Authentication
       ↓
4. User Roles
       ↓
5. Courts
       ↓
6. Court Availability
       ↓
7. Court Booking
       ↓
8. Open Play
       ↓
9. Open Play Booking
       ↓
10. PayMongo Checkout
       ↓
11. PayMongo Webhook
       ↓
12. Booking Expiration
       ↓
13. Admin Dashboard
       ↓
14. Customer Dashboard
       ↓
15. Frontend Integration
       ↓
16. Testing
       ↓
17. Deployment
```

---

# 🧪 Testing Checklist

Before production deployment, test:

### Authentication

- [ ] Register customer
- [ ] Login
- [ ] Logout
- [ ] Invalid credentials
- [ ] Protected routes
- [ ] Admin authorization

### Court Booking

- [ ] View courts
- [ ] View availability
- [ ] Create booking
- [ ] Prevent duplicate booking
- [ ] Prevent booking inactive court
- [ ] Prevent booking maintenance court
- [ ] Cancel booking
- [ ] Expire unpaid booking

### Open Play

- [ ] Create activity
- [ ] View activities
- [ ] Join activity
- [ ] Prevent exceeding capacity
- [ ] Cancel participation

### Payments

- [ ] Create PayMongo checkout
- [ ] Successful payment
- [ ] Failed payment
- [ ] Expired payment
- [ ] Webhook verification
- [ ] Booking confirmation
- [ ] Prevent duplicate payment

### Admin

- [ ] Manage users
- [ ] Manage courts
- [ ] Manage activities
- [ ] View bookings
- [ ] View payments
- [ ] View reports

---

# 🚀 Deployment

## Frontend

Recommended:

```text
Vercel
```

Environment variables should contain only frontend-safe values.

---

## Backend

Recommended options:

```text
Render
Railway
VPS
```

Production server example:

```text
https://api.yourdomain.com
```

---

## Database

Use:

```text
Supabase PostgreSQL
```

Enable Row Level Security where appropriate.

---

# 🌍 Production Architecture

```text
                         INTERNET
                             │
                ┌────────────┴────────────┐
                │                         │
              Vercel                  PayMongo
                │                         │
             Next.js                  Payments
                │                         │
                ▼                         │
          Express API ◄──────────────────┘
                │
       ┌────────┴─────────┐
       │                  │
   Supabase Auth      PostgreSQL
       │                  │
       └────────┬─────────┘
                │
             Storage
```

---

# 📌 Core Business Rule

The most important business rule is:

```text
A booking is only CONFIRMED after successful payment
has been verified by the backend.
```

Correct flow:

```text
Customer selects slot
        ↓
Create temporary reservation
        ↓
PENDING_PAYMENT
        ↓
PayMongo Checkout
        ↓
Customer pays
        ↓
PayMongo Webhook
        ↓
Backend verifies payment
        ↓
Payment = PAID
        ↓
Booking = CONFIRMED
```

Incorrect flow:

```text
Customer selects slot
        ↓
Booking = CONFIRMED
        ↓
Payment
```

The second approach should not be used because it can create unpaid bookings and unreliable availability.

---

# 📈 Future Improvements

Possible future features include:

- Email booking confirmations
- SMS notifications
- QR-code booking confirmation
- Automated receipts
- Promo codes
- Membership plans
- Loyalty points
- Tournament management
- Coach/instructor booking
- Equipment rental
- Multiple facility branches
- Waitlist for full Open Play
- Automated refunds
- Revenue analytics
- Customer reviews
- Push notifications
- Calendar integration
- Google Maps integration

---

# 📜 Project Status

```text
Version: 1.0
Status: Initial Development
```

Current focus:

```text
Server Configuration
        ↓
Supabase Database
        ↓
Authentication
        ↓
Booking System
        ↓
PayMongo Integration
```

---

# 👨‍💻 Development Principle

The system should prioritize:

```text
Security
   +
Reliable Booking
   +
Verified Payments
   +
Clean Architecture
   +
Scalability
   +
Good User Experience
```

The frontend should handle presentation and user interaction.

The backend should handle business rules, authorization, booking validation, pricing, payment processing, and payment confirmation.

The database should enforce data integrity and prevent conflicting bookings.
