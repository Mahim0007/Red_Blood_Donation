-- ============================================================
-- RED BLOOD DONATION PROJECT — IMPRESSIVE SQL QUERIES
-- Database: red_blood_donation_db
-- ============================================================

USE red_blood_donation_db;


-- ============================================================
-- QUERY 1: Blood Group-wise Donor Summary (GROUP BY + CASE)
-- Purpose: দেখায় কোন রক্তের গ্রুপে কতজন donor আছে
--          এবং তাদের গড় donation সংখ্যা কত
-- ============================================================
SELECT
    blood_group                             AS 'Blood Group',
    COUNT(*)                                AS 'Total Donors',
    SUM(CASE WHEN availability_status = 'AVAILABLE' THEN 1 ELSE 0 END) AS 'Available Now',
    SUM(CASE WHEN availability_status = 'COOLDOWN'  THEN 1 ELSE 0 END) AS 'In Cooldown',
    ROUND(AVG(total_donations), 1)          AS 'Avg Donations',
    MAX(total_donations)                    AS 'Max Donations',
    SUM(total_donations) * 3               AS 'Total Lives Saved'
FROM Donors
GROUP BY blood_group
ORDER BY COUNT(*) DESC;


-- ============================================================
-- QUERY 2: Top Donors Ranked by Donations (WINDOW FUNCTION)
-- Purpose: সব donor কে তাদের donation সংখ্যা অনুযায়ী rank করে
-- ============================================================
SELECT
    RANK() OVER (ORDER BY total_donations DESC) AS 'Rank',
    donor_id                                    AS 'ID',
    full_name                                   AS 'Donor Name',
    blood_group                                 AS 'Blood Group',
    district                                    AS 'District',
    total_donations                             AS 'Total Donations',
    total_donations * 3                         AS 'Lives Saved',
    tier                                        AS 'Tier',
    availability_status                         AS 'Status'
FROM Donors
ORDER BY total_donations DESC;


-- ============================================================
-- QUERY 3: Hospital Blood Inventory Crisis Report (JOIN + CASE)
-- Purpose: কোন হাসপাতালে কোন রক্তের গ্রুপে সংকট চলছে তা দেখায়
-- ============================================================
SELECT
    h.name                                          AS 'Hospital',
    h.district                                      AS 'District',
    i.blood_group                                   AS 'Blood Group',
    i.whole_blood_bags                              AS 'Whole Blood',
    i.prbc_red_cells_bags                           AS 'PRBC',
    i.platelets_units                               AS 'Platelets',
    i.plasma_ffp_bags                               AS 'Plasma',
    (i.whole_blood_bags + i.prbc_red_cells_bags)    AS 'Total Bags',
    i.stock_status                                  AS 'Status',
    CASE i.stock_status
        WHEN 'CRITICAL' THEN '🔴 URGENT — Need Donors!'
        WHEN 'LOW'      THEN '🟡 LOW — Collect Soon'
        ELSE                 '🟢 Sufficient'
    END                                             AS 'Alert'
FROM Blood_Inventory i
JOIN Hospitals h ON i.hospital_id = h.hospital_id
WHERE i.stock_status IN ('CRITICAL', 'LOW')
ORDER BY i.stock_status = 'CRITICAL' DESC, h.name;


-- ============================================================
-- QUERY 4: Donor Eligibility with 90-Day Cooldown (DATEDIFF)
-- Purpose: দেখায় কোন donor এখন রক্ত দিতে পারবে, 
--          কতদিন পরে পারবে এবং পরবর্তী eligible তারিখ কত
-- ============================================================
SELECT
    donor_id                                        AS 'ID',
    full_name                                       AS 'Donor Name',
    blood_group                                     AS 'Blood Group',
    district                                        AS 'District',
    last_donated_date                               AS 'Last Donated',
    DATEDIFF(CURDATE(), last_donated_date)          AS 'Days Since Donation',
    GREATEST(0, 90 - DATEDIFF(CURDATE(), last_donated_date)) AS 'Days Remaining',
    DATE_ADD(last_donated_date, INTERVAL 90 DAY)   AS 'Next Eligible Date',
    CASE
        WHEN last_donated_date IS NULL THEN '✅ Never Donated — Eligible'
        WHEN DATEDIFF(CURDATE(), last_donated_date) >= 90 THEN '✅ Eligible Now'
        ELSE '❌ In 90-Day Cooldown'
    END                                             AS 'Eligibility'
FROM Donors
ORDER BY DATEDIFF(CURDATE(), last_donated_date) DESC;


-- ============================================================
-- QUERY 5: Active Blood Requests with Fulfillment Progress
--          (JOIN + Subquery + Percentage)
-- Purpose: কোন রক্তের request কতটুকু পূরণ হয়েছে তা দেখায়
-- ============================================================
SELECT
    br.request_id                                   AS 'Request ID',
    br.patient_name                                 AS 'Patient',
    br.blood_group                                  AS 'Blood Group',
    br.urgency_level                                AS 'Urgency',
    br.bags_needed                                  AS 'Needed',
    br.bags_fulfilled                               AS 'Fulfilled',
    br.bags_needed - br.bags_fulfilled              AS 'Still Needed',
    CONCAT(ROUND(br.bags_fulfilled / br.bags_needed * 100), '%') AS 'Progress',
    h.name                                          AS 'Hospital',
    h.district                                      AS 'District',
    br.attendant_phone                              AS 'Contact',
    br.request_status                               AS 'Status',
    (SELECT COUNT(*) FROM Donor_Pledges dp 
     WHERE dp.request_id = br.request_id)           AS 'Total Pledges'
FROM Blood_Requests br
LEFT JOIN Hospitals h ON br.hospital_id = h.hospital_id
ORDER BY br.urgency_level = 'CRITICAL' DESC,
         br.urgency_level = 'URGENT' DESC;


-- ============================================================
-- QUERY 6: Complete Donation History (Multi-table JOIN)
-- Purpose: কোন donor কোন হাসপাতালে কবে রক্ত দিয়েছে
--          তার সম্পূর্ণ ইতিহাস
-- ============================================================
SELECT
    dl.log_id                                       AS 'Log ID',
    dl.certificate_id                               AS 'Certificate',
    d.full_name                                     AS 'Donor Name',
    d.blood_group                                   AS 'Blood Group',
    d.district                                      AS 'Donor District',
    h.name                                          AS 'Hospital',
    h.district                                      AS 'Hospital District',
    dl.donation_date                                AS 'Donation Date',
    dl.blood_component                              AS 'Component',
    dl.bags_donated                                 AS 'Bags',
    dl.remarks                                      AS 'Remarks'
FROM Donation_Logs dl
JOIN Donors d    ON dl.donor_id    = d.donor_id
JOIN Hospitals h ON dl.hospital_id = h.hospital_id
ORDER BY dl.donation_date DESC;


-- ============================================================
-- QUERY 7: District-wise Blood Availability Report
--          (GROUP BY + HAVING + Correlated Subquery)
-- Purpose: জেলা অনুযায়ী কতজন donor available আছে এবং
--          কতটি active blood request আছে
-- ============================================================
SELECT
    d.district                                      AS 'District',
    COUNT(DISTINCT d.donor_id)                      AS 'Total Donors',
    SUM(CASE WHEN d.availability_status = 'AVAILABLE' THEN 1 ELSE 0 END) AS 'Available Donors',
    (SELECT COUNT(*) FROM Blood_Requests br 
     WHERE br.district = d.district 
       AND br.request_status = 'ACTIVE')            AS 'Active Requests',
    ROUND(AVG(d.total_donations), 1)                AS 'Avg Donations',
    SUM(d.total_donations) * 3                      AS 'Lives Saved'
FROM Donors d
GROUP BY d.district
HAVING COUNT(DISTINCT d.donor_id) > 0
ORDER BY `Available Donors` DESC;


-- ============================================================
-- QUERY 8: Overall Project Dashboard Statistics
--          (Multiple Aggregations — Best for presentation!)
-- Purpose: পুরো system এর একটি summary — Sir কে 
--          এটা দেখালে সবচেয়ে ভালো impression হবে
-- ============================================================
SELECT '📊 SYSTEM OVERVIEW' AS 'Category', '' AS 'Metric', '' AS 'Value'
UNION ALL
SELECT '👥 Donors', 'Total Registered',     CAST(COUNT(*) AS CHAR)               FROM Donors
UNION ALL
SELECT '👥 Donors', 'Available Now',        CAST(SUM(availability_status='AVAILABLE') AS CHAR) FROM Donors
UNION ALL
SELECT '👥 Donors', 'In 90-Day Cooldown',   CAST(SUM(availability_status='COOLDOWN') AS CHAR)  FROM Donors
UNION ALL
SELECT '🏥 Hospitals', 'Connected',         CAST(COUNT(*) AS CHAR)               FROM Hospitals
UNION ALL
SELECT '🩸 Donations', 'Total Recorded',    CAST(COUNT(*) AS CHAR)               FROM Donation_Logs
UNION ALL
SELECT '🩸 Donations', 'Lives Saved (x3)',  CAST(SUM(total_donations)*3 AS CHAR) FROM Donors
UNION ALL
SELECT '🚨 Requests', 'Active SOS',         CAST(COUNT(*) AS CHAR)               FROM Blood_Requests WHERE request_status='ACTIVE'
UNION ALL
SELECT '🚨 Requests', 'Critical Urgency',   CAST(COUNT(*) AS CHAR)               FROM Blood_Requests WHERE urgency_level='CRITICAL'
UNION ALL
SELECT '📦 Inventory', 'Critical Shortages',CAST(COUNT(*) AS CHAR)               FROM Blood_Inventory WHERE stock_status='CRITICAL'
UNION ALL
SELECT '📦 Inventory', 'Low Stock',         CAST(COUNT(*) AS CHAR)               FROM Blood_Inventory WHERE stock_status='LOW'
UNION ALL
SELECT '🤝 Pledges', 'Total Donor Pledges', CAST(COUNT(*) AS CHAR)               FROM Donor_Pledges
UNION ALL
SELECT '👤 Users', 'Registered Accounts',   CAST(COUNT(*) AS CHAR)               FROM Users;
