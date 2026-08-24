# Last-Mile Delivery Tracker

A complete full-stack delivery management platform built with Node.js, Express, MySQL and vanilla HTML/CSS/JavaScript.

## Features
- Customer, delivery-agent and admin authentication using JWT + bcrypt
- Order creation with pickup/drop zone detection
- Volumetric weight: `L × B × H / 5000`
- Chargeable weight = higher of actual and volumetric weight
- Admin-configurable B2B/B2C intra/inter-zone rate cards
- Admin-configurable COD surcharge
- Manual and nearest-agent auto assignment
- Immutable tracking history with timestamp and actor
- Delivery lifecycle: Created → Assigned → Picked Up → In Transit → Out for Delivery → Delivered / Failed
- Failed delivery rescheduling and reassignment
- Customer tracking dashboard
- Admin order filtering
- Email notifications through Nodemailer when SMTP is configured
- Optional SMS integration through Twilio when configured
- Demo seed data

## Requirements
- Node.js 18+
- MySQL 8+
- npm

## Setup

### 1. Database
Create a MySQL database:

```sql
CREATE DATABASE last_mile_tracker;
```

Then run:

```bash
mysql -u root -p last_mile_tracker < database/schema.sql
mysql -u root -p last_mile_tracker < database/seed.sql
```

### 2. Backend

```bash
cd backend
npm install
copy .env.example .env
```

On macOS/Linux use:

```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials.

Start:

```bash
npm run dev
```

The server runs at `http://localhost:5000`.

### 3. Frontend
Open:

`http://localhost:5000`

The Express server serves the frontend.

## Demo accounts

After running `seed.sql`:

- Admin: `admin@example.com` / `Admin@123`
- Agent: `agent@example.com` / `Agent@123`
- Customer: `customer@example.com` / `Customer@123`

## Rate calculation

1. Detect pickup and drop zones using configured area-to-zone mappings.
2. Calculate volumetric weight:
   `L × B × H / 5000`
3. Chargeable weight:
   `max(actualWeight, volumetricWeight)`
4. Select B2B/B2C rate card.
5. If pickup and drop zones are the same, use intra-zone rate; otherwise inter-zone rate.
6. Find the matching weight slab.
7. Add COD surcharge when payment type is COD.
8. Return a transparent breakdown before confirmation.

## API
Base URL: `/api`

Auth:
- POST `/auth/register`
- POST `/auth/login`

Orders:
- POST `/orders/quote`
- POST `/orders`
- GET `/orders`
- GET `/orders/:id`
- PUT `/orders/:id/status`
- PUT `/orders/:id/assign`
- POST `/orders/:id/auto-assign`
- POST `/orders/:id/reschedule`

Admin:
- GET `/admin/orders`
- GET `/admin/zones`
- POST `/admin/zones`
- POST `/admin/zones/:id/areas`
- GET `/admin/rates`
- POST `/admin/rates`
- GET `/admin/agents`

Agents:
- GET `/agents/me/orders`
- PUT `/agents/me/location`
- PUT `/agents/me/availability`

## Deployment
Deploy the backend to Render/Railway and set the same environment variables there. A frontend-only deployment is not required because Express serves the frontend.

## System design
See `docs/system-design.md`.
