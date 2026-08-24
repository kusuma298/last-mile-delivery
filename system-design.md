# System Design

## 1. Rate calculation engine
The order quote endpoint receives pickup/drop addresses, package dimensions, actual weight, order type and payment type. The system first detects the pickup and drop zones by matching configured area names to the address. Zone mappings are stored in `zone_areas`, so administrators can change coverage without changing source code.

Volumetric weight is calculated as `L × B × H / 5000`. The chargeable weight is the maximum of actual and volumetric weight. The engine then determines whether the shipment is intra-zone or inter-zone and selects a rate card using B2B/B2C order type and the matching weight slab. If payment is COD, the configured COD surcharge is added. The API returns base charge, COD surcharge and total so the frontend can show the price before confirmation.

## 2. Zone detection
A simple configurable area-to-zone model is used. Each zone has multiple area keywords. For production, this can be replaced with a geocoding provider such as Google Maps or OpenStreetMap while retaining the same zone database model.

## 3. Auto-assignment
Agents have an availability flag and current latitude/longitude. Auto-assignment filters to available agents and ranks them by distance score from the pickup location. The selected agent is stored in `order_assignments` and the order is changed to ASSIGNED. For a production system, the distance score can be replaced with Haversine distance or routing API travel distance.

## 4. Immutable tracking
The current status is stored on `orders` for fast reads, but every transition also inserts a new row into `order_tracking`. Existing tracking rows are never updated or deleted by the application. Each record contains status, timestamp, actor and optional note. This gives customers a complete timeline and gives administrators an audit trail.

## 5. Failed delivery
An agent can mark an order FAILED. The notification service informs the customer. The customer can submit a new delivery date. A reschedule record is created, the order is reset to CREATED and the previous agent is removed. Admin can then auto-assign or manually assign another available agent.

## 6. Security
Passwords are hashed with bcrypt. JWTs identify the authenticated user and role. Middleware enforces customer, agent and admin permissions. SQL queries use parameterized placeholders.

## 7. Scalability
The backend is separated into routes, controllers, services and database access. Notification delivery can be moved to a queue in a production deployment. Rate cards, zones and agents are data-driven and can be changed by admins without redeploying.
