-- ====================================================================
-- RedDrop Blood Donation & Matching Network - Relational Database Schema
-- DBMS Project Specification: MySQL / PostgreSQL Compatible
-- ====================================================================

CREATE DATABASE IF NOT EXISTS red_blood_donation_db;
USE red_blood_donation_db;

-- 1. HOSPITALS & BLOOD BANKS TABLE
CREATE TABLE IF NOT EXISTS Hospitals (
    hospital_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    district VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    hotline_phone VARCHAR(20) NOT NULL,
    hospital_type ENUM('Govt Medical College', 'Specialized Hospital', 'Blood Bank', 'Private Super Specialty') NOT NULL,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. DONORS TABLE
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

-- 3. EMERGENCY BLOOD REQUESTS TABLE
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

-- 4. BLOOD BANK INVENTORY TABLE
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

-- 5. DONATION HISTORY & AUDIT LOGS TABLE
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
-- DBMS LAB SQL PRACTICE QUERIES
-- ====================================================================

-- Query 1: Find all eligible 'O-' universal donors in Dhaka
-- SELECT donor_id, full_name, contact_phone, area_address, total_donations
-- FROM Donors
-- WHERE blood_group = 'O-' AND district = 'Dhaka' AND availability_status = 'AVAILABLE';

-- Query 2: Aggregated count of donors per blood group
-- SELECT blood_group, COUNT(*) AS donor_count, SUM(total_donations) AS total_units_given
-- FROM Donors
-- GROUP BY blood_group
-- ORDER BY donor_count DESC;

-- Query 3: Join Hospitals and Blood Inventory with Critical Shortage
-- SELECT h.name AS hospital_name, h.district, i.blood_group, i.whole_blood_bags, i.stock_status
-- FROM Hospitals h
-- JOIN Blood_Inventory i ON h.hospital_id = i.hospital_id
-- WHERE i.stock_status = 'CRITICAL'
-- ORDER BY h.district;

-- Query 4: Find active emergency requests where bags are still needed
-- SELECT request_id, patient_name, blood_group, (bags_needed - bags_fulfilled) AS remaining_bags, hospital_name, attendant_phone
-- FROM Blood_Requests
-- WHERE request_status = 'ACTIVE' AND bags_fulfilled < bags_needed;
