/**
 * RedDrop - Core Data Store & Utilities
 * Manages LocalStorage persistence for Donors, Requests, Inventory, Hospitals, and Logs.
 */

const STORAGE_KEYS = {
  DONORS: 'reddrop_donors',
  REQUESTS: 'reddrop_requests',
  INVENTORY: 'reddrop_inventory',
  HOSPITALS: 'reddrop_hospitals',
  USER_PROFILE: 'reddrop_current_user',
  SQL_LOGS: 'reddrop_sql_history',
  AUTH_SESSION: 'reddrop_auth_session'
};

// Initial realistic Bangladeshi Seed Data
const INITIAL_DONORS = [
  {
    id: 101,
    name: "Tanvir Ahmed",
    bloodGroup: "A+",
    phone: "01711223344",
    email: "tanvir.ahmed@gmail.com",
    district: "Dhaka",
    area: "Dhanmondi, Dhaka",
    division: "Dhaka",
    gender: "Male",
    age: 26,
    weight: 68,
    totalDonations: 12,
    lastDonatedDate: "2026-06-10",
    status: "AVAILABLE", // AVAILABLE or COOLDOWN
    verified: true,
    tier: "Gold Lifesaver",
    badge: "Champion",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: 102,
    name: "Dr. Sadia Rahman",
    bloodGroup: "O-",
    phone: "01822334455",
    email: "sadia.med@bsmmu.edu.bd",
    district: "Dhaka",
    area: "Mirpur 10, Dhaka",
    division: "Dhaka",
    gender: "Female",
    age: 29,
    weight: 56,
    totalDonations: 8,
    lastDonatedDate: "2026-08-01",
    status: "COOLDOWN",
    verified: true,
    tier: "Silver Lifesaver",
    badge: "Rare Hero",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: 103,
    name: "Mahmudul Hasan",
    bloodGroup: "B+",
    phone: "01933445566",
    email: "mahmud.cse@du.ac.bd",
    district: "Dhaka",
    area: "Uttara Sector 7, Dhaka",
    division: "Dhaka",
    gender: "Male",
    age: 23,
    weight: 72,
    totalDonations: 5,
    lastDonatedDate: "2026-04-15",
    status: "AVAILABLE",
    verified: true,
    tier: "Bronze Lifesaver",
    badge: "Youth Icon",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: 104,
    name: "Nusrat Jahan Chowdhury",
    bloodGroup: "AB+",
    phone: "01644556677",
    email: "nusrat.ctg@cu.ac.bd",
    district: "Chattogram",
    area: "Agrabad, Chattogram",
    division: "Chattogram",
    gender: "Female",
    age: 24,
    weight: 54,
    totalDonations: 4,
    lastDonatedDate: "2026-05-20",
    status: "AVAILABLE",
    verified: true,
    tier: "Bronze Lifesaver",
    badge: "Universal Recipient Supporter",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: 105,
    name: "Kazi Farhan Ishrak",
    bloodGroup: "O+",
    phone: "01755667788",
    email: "farhan.ishrak@sust.edu",
    district: "Sylhet",
    area: "Zindabazar, Sylhet",
    division: "Sylhet",
    gender: "Male",
    age: 27,
    weight: 75,
    totalDonations: 15,
    lastDonatedDate: "2026-07-28",
    status: "COOLDOWN",
    verified: true,
    tier: "Platinum Lifesaver",
    badge: "Legend",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: 106,
    name: "Ayesha Siddiqua",
    bloodGroup: "A-",
    phone: "01866778899",
    email: "ayesha.raj@ru.ac.bd",
    district: "Rajshahi",
    area: "Kazla, Rajshahi",
    division: "Rajshahi",
    gender: "Female",
    age: 25,
    weight: 58,
    totalDonations: 7,
    lastDonatedDate: "2026-03-10",
    status: "AVAILABLE",
    verified: true,
    tier: "Silver Lifesaver",
    badge: "Rare Hero",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: 107,
    name: "Rifat Bin Alam",
    bloodGroup: "B-",
    phone: "01977889900",
    email: "rifat.ku@ku.ac.bd",
    district: "Khulna",
    area: "Sonadanga, Khulna",
    division: "Khulna",
    gender: "Male",
    age: 31,
    weight: 80,
    totalDonations: 11,
    lastDonatedDate: "2026-05-02",
    status: "AVAILABLE",
    verified: true,
    tier: "Gold Lifesaver",
    badge: "Dedicated",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: 108,
    name: "Sultana Parveen",
    bloodGroup: "AB-",
    phone: "01788990011",
    email: "sultana.bm@gmail.com",
    district: "Barishal",
    area: "Sadar Road, Barishal",
    division: "Barishal",
    gender: "Female",
    age: 28,
    weight: 60,
    totalDonations: 3,
    lastDonatedDate: "2026-02-18",
    status: "AVAILABLE",
    verified: true,
    tier: "Bronze Lifesaver",
    badge: "Super Rare Donor",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: 109,
    name: "Shahadat Hossain",
    bloodGroup: "O+",
    phone: "01599887766",
    email: "shahadat.cumilla@gmail.com",
    district: "Cumilla",
    area: "Kandirpar, Cumilla",
    division: "Chattogram",
    gender: "Male",
    age: 22,
    weight: 65,
    totalDonations: 6,
    lastDonatedDate: "2026-04-20",
    status: "AVAILABLE",
    verified: true,
    tier: "Bronze Lifesaver",
    badge: "Emergency Responder",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80"
  }
];

const INITIAL_REQUESTS = [
  {
    id: 501,
    patientName: "Sumaiya Akhter (7 yrs)",
    bloodGroup: "O-",
    bagsNeeded: 2,
    bagsFulfilled: 1,
    urgency: "CRITICAL", // CRITICAL, URGENT, SCHEDULED
    timeLimit: "Within 2 Hours",
    deadlineDate: "2026-08-26 22:00",
    hospital: "Dhaka Medical College Hospital (DMCH)",
    district: "Dhaka",
    division: "Dhaka",
    bedLocation: "Cabin 304, Pediatric ICU",
    reason: "Thalassemia & Acute Anemia Crisis",
    attendantName: "Kamrul Islam (Father)",
    attendantPhone: "01711998877",
    status: "ACTIVE",
    postedAgo: "25 mins ago",
    donorsCommitted: ["Sadia Rahman (Reserved)"]
  },
  {
    id: 502,
    patientName: "Mohammad Rafiqul Islam",
    bloodGroup: "A+",
    bagsNeeded: 3,
    bagsFulfilled: 2,
    urgency: "CRITICAL",
    timeLimit: "Within 4 Hours",
    deadlineDate: "2026-08-27 00:30",
    hospital: "National Institute of Cardiovascular Diseases (NICVD)",
    district: "Dhaka",
    division: "Dhaka",
    bedLocation: "Cardiac CCU - Bed 12",
    reason: "Emergency Open Heart Bypass Surgery",
    attendantName: "Ashraful Islam (Brother)",
    attendantPhone: "01819556677",
    status: "ACTIVE",
    postedAgo: "1 hour ago",
    donorsCommitted: ["Tanvir Ahmed", "Shakil Khan"]
  },
  {
    id: 503,
    patientName: "Nafisa Begum",
    bloodGroup: "B+",
    bagsNeeded: 1,
    bagsFulfilled: 0,
    urgency: "URGENT",
    timeLimit: "Tomorrow Morning",
    deadlineDate: "2026-08-27 10:00",
    hospital: "Chattogram Medical College Hospital (CMCH)",
    district: "Chattogram",
    division: "Chattogram",
    bedLocation: "Gynecology Ward 2, Bed 15",
    reason: "Post-Partum Hemorrhage / C-Section",
    attendantName: "Jashim Uddin (Husband)",
    attendantPhone: "01678123456",
    status: "ACTIVE",
    postedAgo: "3 hours ago",
    donorsCommitted: []
  },
  {
    id: 504,
    patientName: "Abdul Mannan (62 yrs)",
    bloodGroup: "AB-",
    bagsNeeded: 2,
    bagsFulfilled: 0,
    urgency: "CRITICAL",
    timeLimit: "Urgent (Rare Group)",
    deadlineDate: "2026-08-27 06:00",
    hospital: "Sylhet MAG Osmani Medical College",
    district: "Sylhet",
    division: "Sylhet",
    bedLocation: "Emergency Trauma Unit - Bed 4",
    reason: "Road Traffic Accident Multiple Trauma",
    attendantName: "Enamul Haque (Son)",
    attendantPhone: "01723456789",
    status: "ACTIVE",
    postedAgo: "4 hours ago",
    donorsCommitted: []
  },
  {
    id: 505,
    patientName: "Tahsina Tabassum",
    bloodGroup: "O+",
    bagsNeeded: 1,
    bagsFulfilled: 1,
    urgency: "SCHEDULED",
    timeLimit: "Aug 28 (10:00 AM)",
    deadlineDate: "2026-08-28 10:00",
    hospital: "Evercare Hospital Dhaka",
    district: "Dhaka",
    division: "Dhaka",
    bedLocation: "Oncology Ward 7A",
    reason: "Chemotherapy Supportive Platelets & Blood",
    attendantName: "Dr. Kabir (Relative)",
    attendantPhone: "01987654321",
    status: "FULFILLED",
    postedAgo: "1 day ago",
    donorsCommitted: ["Shahadat Hossain"]
  }
];

const INITIAL_INVENTORY = [
  { hospitalId: "H1", hospitalName: "Central Red Crescent Blood Bank (Dhaka)", group: "A+", wholeBlood: 38, prbc: 24, platelets: 12, ffp: 18, status: "OPTIMAL" },
  { hospitalId: "H1", hospitalName: "Central Red Crescent Blood Bank (Dhaka)", group: "A-", wholeBlood: 6, prbc: 4, platelets: 2, ffp: 3, status: "LOW" },
  { hospitalId: "H1", hospitalName: "Central Red Crescent Blood Bank (Dhaka)", group: "B+", wholeBlood: 42, prbc: 30, platelets: 15, ffp: 22, status: "OPTIMAL" },
  { hospitalId: "H1", hospitalName: "Central Red Crescent Blood Bank (Dhaka)", group: "B-", wholeBlood: 5, prbc: 3, platelets: 1, ffp: 2, status: "LOW" },
  { hospitalId: "H1", hospitalName: "Central Red Crescent Blood Bank (Dhaka)", group: "O+", wholeBlood: 55, prbc: 40, platelets: 18, ffp: 25, status: "OPTIMAL" },
  { hospitalId: "H1", hospitalName: "Central Red Crescent Blood Bank (Dhaka)", group: "O-", wholeBlood: 2, prbc: 1, platelets: 1, ffp: 1, status: "CRITICAL" },
  { hospitalId: "H1", hospitalName: "Central Red Crescent Blood Bank (Dhaka)", group: "AB+", wholeBlood: 20, prbc: 14, platelets: 8, ffp: 10, status: "OPTIMAL" },
  { hospitalId: "H1", hospitalName: "Central Red Crescent Blood Bank (Dhaka)", group: "AB-", wholeBlood: 1, prbc: 1, platelets: 0, ffp: 1, status: "CRITICAL" },

  { hospitalId: "H2", hospitalName: "Dhaka Medical College Hospital (DMCH)", group: "A+", wholeBlood: 25, prbc: 18, platelets: 8, ffp: 12, status: "OPTIMAL" },
  { hospitalId: "H2", hospitalName: "Dhaka Medical College Hospital (DMCH)", group: "A-", wholeBlood: 3, prbc: 2, platelets: 1, ffp: 1, status: "LOW" },
  { hospitalId: "H2", hospitalName: "Dhaka Medical College Hospital (DMCH)", group: "B+", wholeBlood: 30, prbc: 22, platelets: 10, ffp: 14, status: "OPTIMAL" },
  { hospitalId: "H2", hospitalName: "Dhaka Medical College Hospital (DMCH)", group: "B-", wholeBlood: 4, prbc: 2, platelets: 1, ffp: 2, status: "LOW" },
  { hospitalId: "H2", hospitalName: "Dhaka Medical College Hospital (DMCH)", group: "O+", wholeBlood: 34, prbc: 28, platelets: 12, ffp: 18, status: "OPTIMAL" },
  { hospitalId: "H2", hospitalName: "Dhaka Medical College Hospital (DMCH)", group: "O-", wholeBlood: 1, prbc: 1, platelets: 0, ffp: 1, status: "CRITICAL" },
  { hospitalId: "H2", hospitalName: "Dhaka Medical College Hospital (DMCH)", group: "AB+", wholeBlood: 14, prbc: 9, platelets: 4, ffp: 6, status: "OPTIMAL" },
  { hospitalId: "H2", hospitalName: "Dhaka Medical College Hospital (DMCH)", group: "AB-", wholeBlood: 0, prbc: 0, platelets: 0, ffp: 0, status: "CRITICAL" },

  { hospitalId: "H3", hospitalName: "Chattogram Medical College Hospital (CMCH)", group: "A+", wholeBlood: 18, prbc: 12, platelets: 6, ffp: 8, status: "OPTIMAL" },
  { hospitalId: "H3", hospitalName: "Chattogram Medical College Hospital (CMCH)", group: "O+", wholeBlood: 22, prbc: 15, platelets: 8, ffp: 10, status: "OPTIMAL" },
  { hospitalId: "H3", hospitalName: "Chattogram Medical College Hospital (CMCH)", group: "O-", wholeBlood: 1, prbc: 0, platelets: 0, ffp: 1, status: "CRITICAL" },
  { hospitalId: "H3", hospitalName: "Chattogram Medical College Hospital (CMCH)", group: "B+", wholeBlood: 20, prbc: 14, platelets: 7, ffp: 9, status: "OPTIMAL" }
];

const INITIAL_HOSPITALS = [
  { id: "H1", name: "Central Red Crescent Blood Bank", district: "Dhaka", address: "7/5 Aurangzeb Road, Mohammadpur, Dhaka", hotline: "02-9116563", type: "Blood Bank", lat: 23.766, lng: 90.358 },
  { id: "H2", name: "Dhaka Medical College Hospital", district: "Dhaka", address: "Secretariat Rd, Dhaka 1000", hotline: "02-55165088", type: "Govt Hospital", lat: 23.726, lng: 90.398 },
  { id: "H3", name: "Bangabandhu Sheikh Mujib Medical University (BSMMU)", district: "Dhaka", address: "Shahbag, Dhaka 1000", hotline: "02-55165606", type: "Specialized Hospital", lat: 23.738, lng: 90.395 },
  { id: "H4", name: "National Institute of Cardiovascular Diseases (NICVD)", district: "Dhaka", address: "Sher-e-Bangla Nagar, Dhaka", hotline: "02-9122560", type: "Specialized Cardiac", lat: 23.770, lng: 90.370 },
  { id: "H5", name: "Chattogram Medical College Hospital", district: "Chattogram", address: "57 K.B. Fazlul Kader Rd, Chattogram", hotline: "031-619400", type: "Govt Medical College", lat: 22.359, lng: 91.821 },
  { id: "H6", name: "Sylhet MAG Osmani Medical College", district: "Sylhet", address: "Medical Road, Sylhet 3100", hotline: "0821-713667", type: "Govt Medical College", lat: 24.900, lng: 91.870 },
  { id: "H7", name: "Evercare Hospital Dhaka", district: "Dhaka", address: "Plot 81, Block E, Bashundhara R/A, Dhaka", hotline: "10678", type: "Private Super Specialty", lat: 23.810, lng: 90.431 }
];

const INITIAL_USER_PROFILE = {
  id: 101,
  name: "Tanvir Ahmed",
  bloodGroup: "A+",
  phone: "01711223344",
  email: "tanvir.ahmed@gmail.com",
  district: "Dhaka",
  area: "Dhanmondi, Dhaka",
  donorId: "RD-BD-2026-8942",
  tier: "Gold Lifesaver",
  totalDonations: 12,
  livesSaved: 36,
  lastDonatedDate: "2026-06-10",
  nextEligibleDate: "2026-09-08",
  status: "AVAILABLE",
  vitals: {
    hemoglobin: "14.8 g/dL",
    bloodPressure: "120/80 mmHg",
    pulseRate: "72 bpm",
    weight: "68 kg"
  },
  history: [
    { date: "2026-06-10", hospital: "NICVD, Dhaka", recipient: "Cardiac Surgery Patient", bags: 1, certificateId: "CERT-2026-1092" },
    { date: "2026-02-14", hospital: "DMCH, Dhaka", recipient: "Emergency Thalassemia Child", bags: 1, certificateId: "CERT-2026-0871" },
    { date: "2025-10-20", hospital: "BSMMU, Dhaka", recipient: "Dengue Platelets Donor", bags: 1, certificateId: "CERT-2025-0543" },
    { date: "2025-06-15", hospital: "Central Red Crescent", recipient: "Blood Bank Replacement", bags: 1, certificateId: "CERT-2025-0211" }
  ]
};

// Blood Compatibility Matrix
const BLOOD_COMPATIBILITY = {
  "A+": { giveTo: ["A+", "AB+"], receiveFrom: ["A+", "A-", "O+", "O-"], label: "Common & High Demand", isUniversal: false },
  "O+": { giveTo: ["O+", "A+", "B+", "AB+"], receiveFrom: ["O+", "O-"], label: "Most Common Blood Group (38% of population)", isUniversal: false },
  "B+": { giveTo: ["B+", "AB+"], receiveFrom: ["B+", "B-", "O+", "O-"], label: "Widely Prevalent in South Asia", isUniversal: false },
  "AB+": { giveTo: ["AB+"], receiveFrom: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], label: "Universal Red Cell Recipient", isUniversal: true },
  "A-": { giveTo: ["A+", "A-", "AB+", "AB-"], receiveFrom: ["A-", "O-"], label: "Rare Negative Group", isUniversal: false },
  "O-": { giveTo: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], receiveFrom: ["O-"], label: "Universal Red Cell Donor (Lifesaver in Emergencies!)", isUniversal: true },
  "B-": { giveTo: ["B+", "B-", "AB+", "AB-"], receiveFrom: ["B-", "O-"], label: "Very Rare Group", isUniversal: false },
  "AB-": { giveTo: ["AB+", "AB-"], receiveFrom: ["AB-", "A-", "B-", "O-"], label: "Rarest Blood Group (<1%)", isUniversal: false }
};

// Data Store Manager
const RedDropStore = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.DONORS)) {
      localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(INITIAL_DONORS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REQUESTS)) {
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(INITIAL_REQUESTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVENTORY)) {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(INITIAL_INVENTORY));
    }
    if (!localStorage.getItem(STORAGE_KEYS.HOSPITALS)) {
      localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(INITIAL_HOSPITALS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USER_PROFILE)) {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(INITIAL_USER_PROFILE));
    }
  },

  getDonors() {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DONORS) || '[]');
  },

  addDonor(donor) {
    const donors = this.getDonors();
    donor.id = Date.now();
    donor.totalDonations = donor.totalDonations || 0;
    donor.verified = true;
    donor.tier = donor.totalDonations >= 10 ? 'Gold Lifesaver' : donor.totalDonations >= 5 ? 'Silver Lifesaver' : 'Bronze Lifesaver';
    donor.badge = 'Active Volunteer';
    donor.avatar = donor.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${donor.name}`;
    donors.unshift(donor);
    localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(donors));
    return donor;
  },

  getRequests() {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REQUESTS) || '[]');
  },

  addRequest(req) {
    const requests = this.getRequests();
    req.id = Date.now();
    req.bagsFulfilled = 0;
    req.status = 'ACTIVE';
    req.postedAgo = 'Just now';
    req.donorsCommitted = [];
    requests.unshift(req);
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
    return req;
  },

  pledgeDonation(requestId, donorName = "Tanvir Ahmed") {
    const requests = this.getRequests();
    const target = requests.find(r => r.id == requestId);
    if (target) {
      if (target.bagsFulfilled < target.bagsNeeded) {
        target.bagsFulfilled += 1;
        target.donorsCommitted = target.donorsCommitted || [];
        target.donorsCommitted.push(donorName);
        if (target.bagsFulfilled >= target.bagsNeeded) {
          target.status = 'FULFILLED';
        }
        localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
        return { success: true, request: target };
      }
    }
    return { success: false, message: 'Request already fully fulfilled or not found' };
  },

  getInventory() {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY) || '[]');
  },

  updateInventoryBag(hospitalId, group, component = 'wholeBlood', delta = -1) {
    const inv = this.getInventory();
    const item = inv.find(i => i.hospitalId === hospitalId && i.group === group);
    if (item && item[component] + delta >= 0) {
      item[component] += delta;
      const total = item.wholeBlood + item.prbc;
      item.status = total <= 2 ? 'CRITICAL' : total <= 8 ? 'LOW' : 'OPTIMAL';
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inv));
      return { success: true, item };
    }
    return { success: false, message: 'Insufficient stock or item not found' };
  },

  getHospitals() {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HOSPITALS) || '[]');
  },

  getUserProfile() {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || '{}');
  },

  updateUserProfile(updates) {
    const profile = { ...this.getUserProfile(), ...updates };
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    return profile;
  },

  resetAllData() {
    localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(INITIAL_DONORS));
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(INITIAL_REQUESTS));
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(INITIAL_INVENTORY));
    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(INITIAL_HOSPITALS));
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(INITIAL_USER_PROFILE));
    return true;
  }
};

// Central Authentication & Route Protection Manager
const RedDropAuth = {
  getSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  isLoggedIn() {
    const session = this.getSession();
    return !!(session && session.isLoggedIn);
  },

  login(user, role = 'donor') {
    const session = {
      isLoggedIn: true,
      role: role,
      user: user,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
    }
    return session;
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    window.location.replace('login.html');
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.replace('login.html');
    }
  }
};
window.RedDropAuth = RedDropAuth;
window.STORAGE_KEYS = STORAGE_KEYS;

// Global Toast UI Alert Helper
window.showToast = function(message, type = 'success') {
  let toastContainer = document.getElementById('reddrop-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'reddrop-toast-container';
    toastContainer.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : type === 'warning' ? 'bg-amber-500' : 'bg-red-600';
  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info';
  
  toast.className = `${bg} text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold pointer-events-auto transform transition-all duration-300 translate-y-4 opacity-0`;
  toast.innerHTML = `
    <i data-lucide="${icon}" class="w-5 h-5 flex-shrink-0"></i>
    <span class="flex-1">${message}</span>
    <button class="opacity-70 hover:opacity-100" onclick="this.parentElement.remove()"><i data-lucide="x" class="w-4 h-4"></i></button>
  `;

  toastContainer.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// Bangladeshi Districts categorized by Division (All 64 Districts)
const BD_DISTRICTS = [
  "Dhaka", "Gazipur", "Narayanganj", "Narsingdi", "Tangail", "Faridpur", "Manikganj", "Munshiganj", "Gopalganj", "Madaripur", "Rajbari", "Shariatpur", "Kishoreganj",
  "Chattogram", "Cox's Bazar", "Cumilla", "Feni", "Brahmanbaria", "Noakhali", "Chandpur", "Lakshmipur", "Rangamati", "Khagrachhari", "Bandarban",
  "Sylhet", "Moulvibazar", "Habiganj", "Sunamganj",
  "Rajshahi", "Bogura", "Pabna", "Sirajganj", "Naogaon", "Natore", "Chapai Nawabganj", "Joypurhat",
  "Khulna", "Jashore", "Kushtia", "Jhenaidah", "Satkhira", "Bagerhat", "Chuadanga", "Magura", "Meherpur", "Narail",
  "Barishal", "Patuakhali", "Bhola", "Pirojpur", "Jhalokati", "Barguna",
  "Rangpur", "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Thakurgaon",
  "Mymensingh", "Jamalpur", "Netrokona", "Sherpur"
];

// Automatically populate all 64 districts across all filter and registration dropdowns
function populateAllDistrictSelects() {
  if (typeof BD_DISTRICTS === 'undefined') return;

  const districtSelects = [
    'hero-district',
    'filter-district',
    'donor-district',
    'add-donor-district',
    'req-district',
    'reg-district'
  ];

  const sortedDistricts = [...BD_DISTRICTS].sort((a, b) => a.localeCompare(b));

  districtSelects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    if (el.options.length >= 64) return; // already fully populated with 64 districts

    const currentVal = el.value;
    const hasAllOption = el.querySelector('option[value="ALL"]');

    let html = '';
    if (hasAllOption) {
      html += `<option value="ALL">All Districts (64)</option>`;
    } else {
      html += `<option value="" disabled ${!currentVal ? 'selected' : ''}>Select District (64)</option>`;
    }

    sortedDistricts.forEach(dist => {
      html += `<option value="${dist}">${dist}</option>`;
    });

    el.innerHTML = html;
    if (currentVal && currentVal !== 'ALL') {
      el.value = currentVal;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  populateAllDistrictSelects();
});

window.BD_DISTRICTS = BD_DISTRICTS;
window.populateAllDistrictSelects = populateAllDistrictSelects;
