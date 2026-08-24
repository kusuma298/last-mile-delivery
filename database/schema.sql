CREATE DATABASE IF NOT EXISTS last_mile_tracker;
USE last_mile_tracker;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  role ENUM('customer','agent','admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS zone_areas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  zone_id INT NOT NULL,
  area_name VARCHAR(150) NOT NULL,
  UNIQUE(zone_id,area_name),
  FOREIGN KEY(zone_id) REFERENCES zones(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rate_cards (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_type ENUM('B2B','B2C') NOT NULL,
  route_type ENUM('INTRA','INTER') NOT NULL,
  min_weight DECIMAL(10,2) NOT NULL,
  max_weight DECIMAL(10,2) NOT NULL,
  base_charge DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cod_rates (
  order_type ENUM('B2B','B2C') PRIMARY KEY,
  surcharge DECIMAL(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS agents (
  user_id INT PRIMARY KEY,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  current_lat DECIMAL(10,7),
  current_lng DECIMAL(10,7),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  agent_id INT,
  pickup_address VARCHAR(500) NOT NULL,
  drop_address VARCHAR(500) NOT NULL,
  pickup_zone_id INT NOT NULL,
  drop_zone_id INT NOT NULL,
  pickup_lat DECIMAL(10,7),
  pickup_lng DECIMAL(10,7),
  drop_lat DECIMAL(10,7),
  drop_lng DECIMAL(10,7),
  length_cm DECIMAL(10,2) NOT NULL,
  width_cm DECIMAL(10,2) NOT NULL,
  height_cm DECIMAL(10,2) NOT NULL,
  actual_weight DECIMAL(10,2) NOT NULL,
  volumetric_weight DECIMAL(10,2) NOT NULL,
  chargeable_weight DECIMAL(10,2) NOT NULL,
  order_type ENUM('B2B','B2C') NOT NULL,
  payment_type ENUM('PREPAID','COD') NOT NULL,
  base_charge DECIMAL(10,2) NOT NULL,
  cod_surcharge DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_charge DECIMAL(10,2) NOT NULL,
  status ENUM('CREATED','ASSIGNED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED','CANCELLED') NOT NULL DEFAULT 'CREATED',
  scheduled_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(customer_id) REFERENCES users(id),
  FOREIGN KEY(agent_id) REFERENCES users(id),
  FOREIGN KEY(pickup_zone_id) REFERENCES zones(id),
  FOREIGN KEY(drop_zone_id) REFERENCES zones(id)
);

CREATE TABLE IF NOT EXISTS order_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  agent_id INT NOT NULL,
  assigned_by INT,
  assignment_type ENUM('MANUAL','AUTO') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY(agent_id) REFERENCES users(id),
  FOREIGN KEY(assigned_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_tracking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  actor_id INT,
  note VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY(actor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reschedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  new_date DATE NOT NULL,
  reason VARCHAR(500),
  requested_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY(requested_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  order_id INT,
  channel ENUM('EMAIL','SMS','IN_APP') NOT NULL,
  message VARCHAR(1000) NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE SET NULL
);
