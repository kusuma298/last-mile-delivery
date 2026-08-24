USE last_mile_tracker;

INSERT IGNORE INTO users(name,email,password_hash,phone,role) VALUES
('Admin User','admin@example.com','$2a$10$V9s3mV8w8g8Qm3k0d4uH2e3xv8M7a3cR5mJ0p5q8wY0V5L5oF5gG2','9000000001','admin'),
('Demo Agent','agent@example.com','$2a$10$8K1p/a0dL1z0rQxG4Q8wUO7V8m6k0vX3bM2j4q5d8pL0s6e8n9y0G','9000000002','agent'),
('Demo Customer','customer@example.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','9000000003','customer');

INSERT IGNORE INTO agents(user_id,available,current_lat,current_lng)
SELECT id,1,16.5062,80.6480 FROM users WHERE email='agent@example.com';

INSERT IGNORE INTO zones(name) VALUES ('Vijayawada'),('Guntur'),('Hyderabad');

INSERT IGNORE INTO zone_areas(zone_id,area_name)
SELECT id,'Vijayawada' FROM zones WHERE name='Vijayawada';
INSERT IGNORE INTO zone_areas(zone_id,area_name)
SELECT id,'Benz Circle' FROM zones WHERE name='Vijayawada';
INSERT IGNORE INTO zone_areas(zone_id,area_name)
SELECT id,'Guntur' FROM zones WHERE name='Guntur';
INSERT IGNORE INTO zone_areas(zone_id,area_name)
SELECT id,'Hyderabad' FROM zones WHERE name='Hyderabad';

INSERT INTO rate_cards(order_type,route_type,min_weight,max_weight,base_charge)
SELECT 'B2C','INTRA',0,1,50 WHERE NOT EXISTS (SELECT 1 FROM rate_cards WHERE order_type='B2C' AND route_type='INTRA' AND min_weight=0);
INSERT INTO rate_cards(order_type,route_type,min_weight,max_weight,base_charge)
SELECT 'B2C','INTRA',1.01,5,80 WHERE NOT EXISTS (SELECT 1 FROM rate_cards WHERE order_type='B2C' AND route_type='INTRA' AND min_weight=1.01);
INSERT INTO rate_cards(order_type,route_type,min_weight,max_weight,base_charge)
SELECT 'B2C','INTER',0,1,90 WHERE NOT EXISTS (SELECT 1 FROM rate_cards WHERE order_type='B2C' AND route_type='INTER' AND min_weight=0);
INSERT INTO rate_cards(order_type,route_type,min_weight,max_weight,base_charge)
SELECT 'B2C','INTER',1.01,5,140 WHERE NOT EXISTS (SELECT 1 FROM rate_cards WHERE order_type='B2C' AND route_type='INTER' AND min_weight=1.01);
INSERT INTO rate_cards(order_type,route_type,min_weight,max_weight,base_charge)
SELECT 'B2B','INTRA',0,1,40 WHERE NOT EXISTS (SELECT 1 FROM rate_cards WHERE order_type='B2B' AND route_type='INTRA' AND min_weight=0);
INSERT INTO rate_cards(order_type,route_type,min_weight,max_weight,base_charge)
SELECT 'B2B','INTRA',1.01,5,70 WHERE NOT EXISTS (SELECT 1 FROM rate_cards WHERE order_type='B2B' AND route_type='INTRA' AND min_weight=1.01);
INSERT INTO rate_cards(order_type,route_type,min_weight,max_weight,base_charge)
SELECT 'B2B','INTER',0,1,75 WHERE NOT EXISTS (SELECT 1 FROM rate_cards WHERE order_type='B2B' AND route_type='INTER' AND min_weight=0);
INSERT INTO rate_cards(order_type,route_type,min_weight,max_weight,base_charge)
SELECT 'B2B','INTER',1.01,5,120 WHERE NOT EXISTS (SELECT 1 FROM rate_cards WHERE order_type='B2B' AND route_type='INTER' AND min_weight=1.01);

INSERT INTO cod_rates(order_type,surcharge) VALUES ('B2B',30),('B2C',40)
ON DUPLICATE KEY UPDATE surcharge=VALUES(surcharge);
