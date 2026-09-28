-- Donation_Logs table এ donor_name column যোগ করো
-- phpMyAdmin > red_blood_donation_db > SQL tab এ এটা run করো

ALTER TABLE Donation_Logs 
ADD COLUMN donor_name VARCHAR(100) NULL AFTER donor_id;

-- পুরনো records এর জন্য donor_id থেকে নাম fill করো
UPDATE Donation_Logs dl
JOIN Donors d ON dl.donor_id = d.donor_id
SET dl.donor_name = d.full_name
WHERE dl.donor_name IS NULL;
