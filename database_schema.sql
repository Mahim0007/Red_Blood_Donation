-- ====================================================================
-- RedDrop Blood Donation & Matching Network - Relational Database Schema
-- DBMS Project Specification: MySQL / MariaDB / PostgreSQL Compatible
-- Designed for: Academic Evaluation, DBMS Lab Viva & Real-World Simulation
-- ====================================================================

CREATE DATABASE IF NOT EXISTS red_blood_donation_db;
USE red_blood_donation_db;

-- Drop existing tables in reverse dependency order for clean re-runs
DROP VIEW IF EXISTS v_active_critical_sos;
DROP VIEW IF EXISTS v_hospital_critical_inventory;
DROP TABLE IF EXISTS Donation_Logs;
DROP TABLE IF EXISTS Blood_Inventory;
DROP TABLE IF EXISTS Blood_Requests;
DROP TABLE IF EXISTS Donors;
DROP TABLE IF EXISTS Hospitals;

-- ====================================================================
-- 1. HOSPITALS & BLOOD BANKS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS Hospitals (
    hospital_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    district VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    hotline_phone VARCHAR(20) NOT NULL,
    hospital_type ENUM(
        'Govt Medical College', 
        'Govt Hospital', 
        'Specialized Hospital', 
        'Specialized Cardiac', 
        'Blood Bank', 
        'Private Super Specialty'
    ) NOT NULL,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 2. DONORS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS Donors (
    donor_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    contact_phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100),
    district VARCHAR(50) NOT NULL,
    area_address VARCHAR(150) NOT NULL,
    division VARCHAR(50) NOT NULL,
    age INT CHECK (age >= 18 AND age <= 65),
    weight_kg DECIMAL(5,2) CHECK (weight_kg >= 48.00),
    total_donations INT DEFAULT 0,
    last_donated_date DATE,
    availability_status ENUM('AVAILABLE', 'COOLDOWN', 'INACTIVE') DEFAULT 'AVAILABLE',
    is_verified BOOLEAN DEFAULT TRUE,
    tier ENUM('Bronze Lifesaver', 'Silver Lifesaver', 'Gold Lifesaver', 'Platinum Lifesaver') DEFAULT 'Bronze Lifesaver',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_blood_district (blood_group, district),
    INDEX idx_status (availability_status)
);

-- ====================================================================
-- 3. EMERGENCY BLOOD REQUESTS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS Blood_Requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_name VARCHAR(100) NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    bags_needed INT NOT NULL CHECK (bags_needed > 0),
    bags_fulfilled INT DEFAULT 0,
    urgency_level ENUM('CRITICAL', 'URGENT', 'SCHEDULED') NOT NULL,
    time_limit VARCHAR(50) NOT NULL,
    hospital_name VARCHAR(150) NOT NULL,
    district VARCHAR(50) NOT NULL,
    bed_location VARCHAR(100),
    clinical_reason TEXT,
    attendant_name VARCHAR(100) NOT NULL,
    attendant_phone VARCHAR(15) NOT NULL,
    request_status ENUM('ACTIVE', 'FULFILLED', 'CANCELLED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_req_blood_urgency (blood_group, urgency_level, request_status)
);

-- ====================================================================
-- 4. BLOOD BANK INVENTORY TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS Blood_Inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_id VARCHAR(10) NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    whole_blood_bags INT DEFAULT 0,
    prbc_red_cells_bags INT DEFAULT 0,
    platelets_units INT DEFAULT 0,
    plasma_ffp_bags INT DEFAULT 0,
    stock_status ENUM('OPTIMAL', 'LOW', 'CRITICAL') DEFAULT 'OPTIMAL',
    last_audited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES Hospitals(hospital_id) ON DELETE CASCADE,
    UNIQUE KEY uq_hospital_blood (hospital_id, blood_group)
);

-- ====================================================================
-- 5. DONATION HISTORY & AUDIT LOGS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS Donation_Logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    donor_id INT NOT NULL,
    hospital_id VARCHAR(10),
    donation_date DATE NOT NULL,
    bags_donated INT DEFAULT 1,
    blood_component ENUM('Whole Blood', 'PRBC', 'Platelets Apheresis', 'Plasma') DEFAULT 'Whole Blood',
    certificate_id VARCHAR(50) UNIQUE NOT NULL,
    remarks VARCHAR(255),
    FOREIGN KEY (donor_id) REFERENCES Donors(donor_id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES Hospitals(hospital_id) ON DELETE SET NULL
);

-- ====================================================================
-- SEED DATA INSERTION (Matches RedDrop Frontend Store)
-- ====================================================================

-- 1. Insert Hospitals
INSERT INTO Hospitals (hospital_id, name, district, address, hotline_phone, hospital_type, latitude, longitude) VALUES
('H1', 'Central Red Crescent Blood Bank', 'Dhaka', '7/5 Aurangzeb Road, Mohammadpur, Dhaka', '02-9116563', 'Blood Bank', 23.766000, 90.358000),
('H2', 'Dhaka Medical College Hospital', 'Dhaka', 'Secretariat Rd, Dhaka 1000', '02-55165088', 'Govt Hospital', 23.726000, 90.398000),
('H3', 'Bangabandhu Sheikh Mujib Medical University (BSMMU)', 'Dhaka', 'Shahbag, Dhaka 1000', '02-55165606', 'Specialized Hospital', 23.738000, 90.395000),
('H4', 'National Institute of Cardiovascular Diseases (NICVD)', 'Dhaka', 'Sher-e-Bangla Nagar, Dhaka', '02-9122560', 'Specialized Cardiac', 23.770000, 90.370000),
('H5', 'Chattogram Medical College Hospital (CMCH)', 'Chattogram', '57 K.B. Fazlul Kader Rd, Chattogram', '031-619400', 'Govt Medical College', 22.359000, 91.821000),
('H6', 'Sylhet MAG Osmani Medical College', 'Sylhet', 'Medical Road, Sylhet 3100', '0821-713667', 'Govt Medical College', 24.900000, 91.870000),
('H7', 'Evercare Hospital Dhaka', 'Dhaka', 'Plot 81, Block E, Bashundhara R/A, Dhaka', '10678', 'Private Super Specialty', 23.810000, 90.431000);

-- 2. Insert Donors
INSERT INTO Donors (donor_id, full_name, blood_group, gender, contact_phone, email, district, area_address, division, age, weight_kg, total_donations, last_donated_date, availability_status, is_verified, tier) VALUES
(101, 'Tanvir Ahmed', 'A+', 'Male', '01711223344', 'tanvir.ahmed@gmail.com', 'Dhaka', 'Dhanmondi, Dhaka', 'Dhaka', 26, 68.00, 12, '2026-06-10', 'AVAILABLE', TRUE, 'Gold Lifesaver'),
(102, 'Dr. Sadia Rahman', 'O-', 'Female', '01822334455', 'sadia.med@bsmmu.edu.bd', 'Dhaka', 'Mirpur 10, Dhaka', 'Dhaka', 29, 56.00, 8, '2026-08-01', 'COOLDOWN', TRUE, 'Silver Lifesaver'),
(103, 'Mahmudul Hasan', 'B+', 'Male', '01933445566', 'mahmud.cse@du.ac.bd', 'Dhaka', 'Uttara Sector 7, Dhaka', 'Dhaka', 23, 72.00, 5, '2026-04-15', 'AVAILABLE', TRUE, 'Bronze Lifesaver'),
(104, 'Nusrat Jahan Chowdhury', 'AB+', 'Female', '01644556677', 'nusrat.ctg@cu.ac.bd', 'Chattogram', 'Agrabad, Chattogram', 'Chattogram', 24, 54.00, 4, '2026-05-20', 'AVAILABLE', TRUE, 'Bronze Lifesaver'),
(105, 'Kazi Farhan Ishrak', 'O+', 'Male', '01755667788', 'farhan.ishrak@sust.edu', 'Sylhet', 'Zindabazar, Sylhet', 'Sylhet', 27, 75.00, 15, '2026-07-28', 'COOLDOWN', TRUE, 'Platinum Lifesaver'),
(106, 'Ayesha Siddiqua', 'A-', 'Female', '01866778899', 'ayesha.raj@ru.ac.bd', 'Rajshahi', 'Kazla, Rajshahi', 'Rajshahi', 25, 58.00, 7, '2026-03-10', 'AVAILABLE', TRUE, 'Silver Lifesaver'),
(107, 'Rifat Bin Alam', 'B-', 'Male', '01977889900', 'rifat.ku@ku.ac.bd', 'Khulna', 'Sonadanga, Khulna', 'Khulna', 31, 80.00, 11, '2026-05-02', 'AVAILABLE', TRUE, 'Gold Lifesaver'),
(108, 'Sultana Parveen', 'AB-', 'Female', '01788990011', 'sultana.bm@gmail.com', 'Barishal', 'Sadar Road, Barishal', 'Barishal', 28, 60.00, 3, '2026-02-18', 'AVAILABLE', TRUE, 'Bronze Lifesaver'),
(109, 'Shahadat Hossain', 'O+', 'Male', '01599887766', 'shahadat.cumilla@gmail.com', 'Cumilla', 'Kandirpar, Cumilla', 'Chattogram', 22, 65.00, 6, '2026-04-20', 'AVAILABLE', TRUE, 'Bronze Lifesaver');

-- 3. Insert Blood Requests
INSERT INTO Blood_Requests (request_id, patient_name, blood_group, bags_needed, bags_fulfilled, urgency_level, time_limit, hospital_name, district, bed_location, clinical_reason, attendant_name, attendant_phone, request_status) VALUES
(501, 'Sumaiya Akhter (7 yrs)', 'O-', 2, 1, 'CRITICAL', 'Within 2 Hours', 'Dhaka Medical College Hospital (DMCH)', 'Dhaka', 'Cabin 304, Pediatric ICU', 'Thalassemia & Acute Anemia Crisis', 'Kamrul Islam (Father)', '01711998877', 'ACTIVE'),
(502, 'Mohammad Rafiqul Islam', 'A+', 3, 2, 'CRITICAL', 'Within 4 Hours', 'National Institute of Cardiovascular Diseases (NICVD)', 'Dhaka', 'Cardiac CCU - Bed 12', 'Emergency Open Heart Bypass Surgery', 'Ashraful Islam (Brother)', '01819556677', 'ACTIVE'),
(503, 'Nafisa Begum', 'B+', 1, 0, 'URGENT', 'Tomorrow Morning', 'Chattogram Medical College Hospital (CMCH)', 'Chattogram', 'Gynecology Ward 2, Bed 15', 'Post-Partum Hemorrhage / C-Section', 'Jashim Uddin (Husband)', '01678123456', 'ACTIVE'),
(504, 'Abdul Mannan (62 yrs)', 'AB-', 2, 0, 'CRITICAL', 'Urgent (Rare Group)', 'Sylhet MAG Osmani Medical College', 'Sylhet', 'Emergency Trauma Unit - Bed 4', 'Road Traffic Accident Multiple Trauma', 'Enamul Haque (Son)', '01723456789', 'ACTIVE'),
(505, 'Tahsina Tabassum', 'O+', 1, 1, 'SCHEDULED', 'Aug 28 (10:00 AM)', 'Evercare Hospital Dhaka', 'Dhaka', 'Oncology Ward 7A', 'Chemotherapy Supportive Platelets & Blood', 'Dr. Kabir (Relative)', '01987654321', 'FULFILLED');

-- 4. Insert Blood Inventory (Composite tracking per hospital and blood group)
INSERT INTO Blood_Inventory (hospital_id, blood_group, whole_blood_bags, prbc_red_cells_bags, platelets_units, plasma_ffp_bags, stock_status) VALUES
('H1', 'A+', 38, 24, 12, 18, 'OPTIMAL'),
('H1', 'A-', 6, 4, 2, 3, 'LOW'),
('H1', 'B+', 42, 30, 15, 22, 'OPTIMAL'),
('H1', 'B-', 5, 3, 1, 2, 'LOW'),
('H1', 'O+', 55, 40, 18, 25, 'OPTIMAL'),
('H1', 'O-', 2, 1, 1, 1, 'CRITICAL'),
('H1', 'AB+', 20, 14, 8, 10, 'OPTIMAL'),
('H1', 'AB-', 1, 1, 0, 1, 'CRITICAL'),

('H2', 'A+', 25, 18, 8, 12, 'OPTIMAL'),
('H2', 'A-', 3, 2, 1, 1, 'LOW'),
('H2', 'B+', 30, 22, 10, 14, 'OPTIMAL'),
('H2', 'B-', 4, 2, 1, 2, 'LOW'),
('H2', 'O+', 34, 28, 12, 18, 'OPTIMAL'),
('H2', 'O-', 1, 1, 0, 1, 'CRITICAL'),
('H2', 'AB+', 14, 9, 4, 6, 'OPTIMAL'),
('H2', 'AB-', 0, 0, 0, 0, 'CRITICAL'),

('H5', 'A+', 18, 12, 6, 8, 'OPTIMAL'),
('H5', 'O+', 22, 15, 8, 10, 'OPTIMAL'),
('H5', 'O-', 1, 0, 0, 1, 'CRITICAL'),
('H5', 'B+', 20, 14, 7, 9, 'OPTIMAL');

-- 5. Insert Donation Logs (Audited Donation History)
INSERT INTO Donation_Logs (log_id, donor_id, hospital_id, donation_date, bags_donated, blood_component, certificate_id, remarks) VALUES
(1, 101, 'H4', '2026-06-10', 1, 'Whole Blood', 'CERT-2026-1092', 'NICVD Cardiac Surgery emergency replacement'),
(2, 101, 'H2', '2026-02-14', 1, 'Whole Blood', 'CERT-2026-0871', 'DMCH Emergency pediatric thalassemia child support'),
(3, 101, 'H3', '2025-10-20', 1, 'Platelets Apheresis', 'CERT-2025-0543', 'BSMMU Dengue season apheresis donor'),
(4, 101, 'H1', '2025-06-15', 1, 'Whole Blood', 'CERT-2025-0211', 'Red Crescent voluntary blood camp'),
(5, 102, 'H3', '2026-08-01', 1, 'Whole Blood', 'CERT-2026-1144', 'Rare O- emergency support at BSMMU ICU'),
(6, 105, 'H6', '2026-07-28', 1, 'Whole Blood', 'CERT-2026-1120', 'Sylhet MAG Osmani road accident emergency');

-- ====================================================================
-- DATABASE VIEWS (Essential for DBMS Viva Demonstration)
-- ====================================================================

-- View 1: Active Critical SOS Requests
CREATE OR REPLACE VIEW v_active_critical_sos AS
SELECT 
    request_id,
    patient_name,
    blood_group,
    (bags_needed - bags_fulfilled) AS bags_pending,
    urgency_level,
    time_limit,
    hospital_name,
    district,
    attendant_name,
    attendant_phone
FROM Blood_Requests
WHERE request_status = 'ACTIVE' AND urgency_level = 'CRITICAL';

-- View 2: Hospital Inventory with Critical or Low Stock
CREATE OR REPLACE VIEW v_hospital_critical_inventory AS
SELECT 
    h.name AS hospital_name,
    h.district,
    h.hotline_phone,
    i.blood_group,
    i.whole_blood_bags,
    i.prbc_red_cells_bags,
    i.platelets_units,
    i.stock_status
FROM Hospitals h
JOIN Blood_Inventory i ON h.hospital_id = i.hospital_id
WHERE i.stock_status IN ('CRITICAL', 'LOW');

-- ====================================================================
-- DBMS LAB SQL PRACTICE & VIVA DEMO QUERIES
-- ====================================================================

-- Query 1: Find all eligible 'O-' universal donors in Dhaka
-- SELECT donor_id, full_name, contact_phone, area_address, total_donations
-- FROM Donors
-- WHERE blood_group = 'O-' AND district = 'Dhaka' AND availability_status = 'AVAILABLE';

-- Query 2: Aggregated count of donors and total donations per blood group
-- SELECT blood_group, COUNT(*) AS donor_count, SUM(total_donations) AS total_units_given
-- FROM Donors
-- GROUP BY blood_group
-- ORDER BY donor_count DESC;

-- Query 3: Multi-table JOIN - Hospitals suffering from Critical Blood Shortage
-- SELECT h.name AS hospital_name, h.district, i.blood_group, i.whole_blood_bags, i.stock_status
-- FROM Hospitals h
-- JOIN Blood_Inventory i ON h.hospital_id = i.hospital_id
-- WHERE i.stock_status = 'CRITICAL'
-- ORDER BY h.district;

-- Query 4: Unfulfilled active emergency requests sorted by urgency
-- SELECT request_id, patient_name, blood_group, (bags_needed - bags_fulfilled) AS remaining_bags, hospital_name, attendant_phone
-- FROM Blood_Requests
-- WHERE request_status = 'ACTIVE' AND bags_fulfilled < bags_needed
-- ORDER BY FIELD(urgency_level, 'CRITICAL', 'URGENT', 'SCHEDULED');

-- Query 5: Subquery - Find top lifesaver donors who donated above the average donation count
-- SELECT full_name, blood_group, contact_phone, district, total_donations, tier
-- FROM Donors
-- WHERE total_donations > (SELECT AVG(total_donations) FROM Donors)
-- ORDER BY total_donations DESC;

-- Query 6: JOIN Donors with Donation Logs to produce a donor's lifetime certificate log
-- SELECT d.full_name, d.blood_group, l.certificate_id, l.donation_date, l.blood_component, h.name AS hospital_name
-- FROM Donors d
-- JOIN Donation_Logs l ON d.donor_id = l.donor_id
-- LEFT JOIN Hospitals h ON l.hospital_id = h.hospital_id
-- WHERE d.donor_id = 101
-- ORDER BY l.donation_date DESC;
