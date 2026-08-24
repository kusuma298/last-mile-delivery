# Last-Mile Delivery Tracker — System Design

## 1. Rate Calculation Engine

The rate calculation engine calculates the delivery charge dynamically using administrator-configured rate cards. When a customer enters pickup and drop addresses, the system first identifies their respective zones. The package's volumetric weight is calculated using:

Volumetric Weight = (Length × Width × Height) / 5000

The chargeable weight is the higher of actual weight and volumetric weight. The system then determines whether the shipment is intra-zone or inter-zone and selects the appropriate B2B or B2C rate card based on the order type and weight slab. If the payment type is COD, the configured COD surcharge is added. The final charge and its breakdown are returned to the customer before order confirmation.

## 2. Zone Detection

Zones and their corresponding areas are stored in the database. Each zone can contain multiple configured area names. When an address is entered, the system matches the address against the configured area names and determines the pickup and drop zones. This approach keeps zone configuration dynamic and allows administrators to modify coverage without changing application code.

For a production system, this approach can be extended using a geocoding API such as Google Maps or OpenStreetMap to convert addresses into coordinates and perform more accurate zone detection.

## 3. Auto-Assignment Logic

Delivery agents have an availability status and current location stored in the database. When auto-assignment is triggered, the system retrieves available agents and compares their current location with the pickup location. The nearest available agent is selected and assigned to the order. The assignment is recorded in the order assignment table with the assignment type marked as AUTO.

Manual assignment is also supported, allowing administrators to select a specific agent.

## 4. Failed Delivery Handling

When a delivery attempt fails, the agent changes the order status to FAILED. The status change is recorded in the immutable tracking history with the timestamp and actor. The customer is notified about the failed attempt and can request a new delivery date.

A reschedule record stores the new date and reason. The previous agent is removed from the order and the order is returned to CREATED status. The administrator can then manually assign another agent or trigger automatic assignment for the new delivery attempt.

## 5. Tracking and Audit History

The current order status is stored in the orders table for fast access. Every status change is also inserted as a new record in the order_tracking table. Existing tracking records are never modified by the application. Each record contains the order, status, timestamp, actor and optional note, providing customers with a complete tracking timeline and administrators with an audit trail.
