/**
 * RedDrop - Core Data Store, Database Sync & Utilities
 * Manages LocalStorage caching, MySQL API communication, Authentication & Global Helpers.
 */

// ==========================================
// 1. STORAGE KEYS & CONSTANTS
// ==========================================
const STORAGE_KEYS = {
  DONORS: 'reddrop_donors',
  REQUESTS: 'reddrop_requests',
  INVENTORY: 'reddrop_inventory',
  HOSPITALS: 'reddrop_hospitals',
  USER_PROFILE: 'reddrop_current_user',
  AUTH_SESSION: 'reddrop_auth_session'
};

// All 64 Districts of Bangladesh in alphabetical order
const BD_DISTRICTS = [
  "Bagerhat", "Bandarban", "Barguna", "Barishal", "Bhola", "Bogura", "Brahmanbaria",
  "Chandpur", "Chapai Nawabganj", "Chattogram", "Chuadanga", "Cox's Bazar", "Cumilla",
  "Dhaka", "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj",
  "Habiganj", "Jamalpur", "Jashore", "Jhalokati", "Jhenaidah", "Joypurhat",
  "Khagrachhari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur",
  "Lalmonirhat", "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar",
  "Munshiganj", "Mymensingh", "Naogaon", "Narail", "Narayanganj", "Narsingdi",
  "Natore", "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh",
  "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur",
  "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet",
  "Tangail", "Thakurgaon"
];

// Blood compatibility and transfusion rules
const BLOOD_COMPATIBILITY = {
  "A+":  { giveTo: ["A+", "AB+"], receiveFrom: ["A+", "A-", "O+", "O-"], label: "High Demand", isUniversal: false },
  "O+":  { giveTo: ["O+", "A+", "B+", "AB+"], receiveFrom: ["O+", "O-"], label: "Most Common (38% of population)", isUniversal: false },
  "B+":  { giveTo: ["B+", "AB+"], receiveFrom: ["B+", "B-", "O+", "O-"], label: "Widely Prevalent in South Asia", isUniversal: false },
  "AB+": { giveTo: ["AB+"], receiveFrom: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], label: "Universal Red Cell Recipient", isUniversal: true },
  "A-":  { giveTo: ["A+", "A-", "AB+", "AB-"], receiveFrom: ["A-", "O-"], label: "Rare Negative Group", isUniversal: false },
  "O-":  { giveTo: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], receiveFrom: ["O-"], label: "Universal Lifesaver Donor", isUniversal: true },
  "B-":  { giveTo: ["B+", "B-", "AB+", "AB-"], receiveFrom: ["B-", "O-"], label: "Very Rare Group", isUniversal: false },
  "AB-": { giveTo: ["AB+", "AB-"], receiveFrom: ["AB-", "A-", "B-", "O-"], label: "Rarest Blood Group (<1%)", isUniversal: false }
};

// ==========================================
// 2. SEED DATA (Bangladeshi Initial Records)
// ==========================================
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
    status: "AVAILABLE",
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
    badge: "Active Volunteer",
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
    badge: "Champion",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
  }
];

const INITIAL_REQUESTS = [
  {
    id: 501,
    patientName: "Sumaiya Akhter (7 yrs)",
    bloodGroup: "O-",
    bagsNeeded: 2,
    bagsFulfilled: 1,
    urgency: "CRITICAL",
    timeLimit: "Within 2 Hours",
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
  { hospitalId: "H2", hospitalName: "Dhaka Medical College Hospital (DMCH)", group: "O+", wholeBlood: 34, prbc: 28, platelets: 12, ffp: 18, status: "OPTIMAL" },
  { hospitalId: "H2", hospitalName: "Dhaka Medical College Hospital (DMCH)", group: "O-", wholeBlood: 1, prbc: 1, platelets: 0, ffp: 1, status: "CRITICAL" },
  { hospitalId: "H3", hospitalName: "Chattogram Medical College Hospital (CMCH)", group: "B+", wholeBlood: 20, prbc: 14, platelets: 7, ffp: 9, status: "OPTIMAL" }
];

const INITIAL_HOSPITALS = [
  { id: "H1", name: "Central Red Crescent Blood Bank", district: "Dhaka", address: "7/5 Aurangzeb Road, Mohammadpur, Dhaka", hotline: "02-9116563", type: "Blood Bank", lat: 23.766, lng: 90.358 },
  { id: "H2", name: "Dhaka Medical College Hospital", district: "Dhaka", address: "Secretariat Rd, Dhaka 1000", hotline: "02-55165088", type: "Govt Hospital", lat: 23.726, lng: 90.398 },
  { id: "H3", name: "Bangabandhu Sheikh Mujib Medical University (BSMMU)", district: "Dhaka", address: "Shahbag, Dhaka 1000", hotline: "02-55165606", type: "Specialized Hospital", lat: 23.738, lng: 90.395 },
  { id: "H4", name: "National Institute of Cardiovascular Diseases (NICVD)", district: "Dhaka", address: "Sher-e-Bangla Nagar, Dhaka", hotline: "02-9122560", type: "Specialized Cardiac", lat: 23.770, lng: 90.370 },
  { id: "H5", name: "Chattogram Medical College Hospital", district: "Chattogram", address: "57 K.B. Fazlul Kader Rd, Chattogram", hotline: "031-619400", type: "Govt Medical College", lat: 22.359, lng: 91.821 }
];

const INITIAL_USER_PROFILE = {
  id: 101,
  name: "Voluntary Donor",
  bloodGroup: "O+",
  phone: "01700000000",
  email: "donor@reddrop.org",
  district: "Dhaka",
  area: "Dhaka Sadar",
  donorId: "RD-BD-2026-0101",
  tier: "Bronze Lifesaver",
  totalDonations: 0,
  livesSaved: 0,
  lastDonatedDate: null,
  nextEligibleDate: "Immediately Eligible",
  status: "AVAILABLE",
  history: []
};

// ==========================================
// 3. CORE DATA STORE (RedDropStore)
// ==========================================
const RedDropStore = {
  isBackendConnected: false,
  _syncPromise: null,

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

    this.syncWithBackend();
  },

  async syncWithBackend() {
    if (this._syncPromise) return this._syncPromise;

    this._syncPromise = (async () => {
      try {
        const testRes = await fetch('api/donors.php', { method: 'GET', cache: 'no-store' });
        if (testRes.ok) {
          const json = await testRes.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(json.data));
            this.isBackendConnected = true;

            // Fetch live requests
            try {
              const reqRes = await fetch('api/requests.php', { cache: 'no-store' });
              if (reqRes.ok) {
                const reqJson = await reqRes.json();
                if (reqJson.success && Array.isArray(reqJson.data)) {
                  localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(reqJson.data));
                }
              }
            } catch (e) {}

            // Fetch live inventory
            try {
              const invRes = await fetch('api/inventory.php', { cache: 'no-store' });
              if (invRes.ok) {
                const invJson = await invRes.json();
                if (invJson.success && Array.isArray(invJson.data)) {
                  localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(invJson.data));
                }
              }
            } catch (e) {}

            // Fetch live hospitals
            try {
              const hospRes = await fetch('api/hospitals.php', { cache: 'no-store' });
              if (hospRes.ok) {
                const hospJson = await hospRes.json();
                if (hospJson.success && Array.isArray(hospJson.data)) {
                  localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(hospJson.data));
                }
              }
            } catch (e) {}

            this.updateBadges(true);
            window.dispatchEvent(new CustomEvent('reddrop_data_synced', { detail: { source: 'MySQL' } }));
            return true;
          }
        }
      } catch (err) {
        this.isBackendConnected = false;
        this.updateBadges(false);
      }
      return false;
    })();

    return this._syncPromise;
  },

  updateBadges(connected) {
    document.querySelectorAll('.dbms-status-badge').forEach(el => {
      if (connected) {
        el.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> MySQL Connected (XAMPP)';
        el.classList.add('badge-connected-mysql');
      } else {
        el.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-400"></span> Local Storage Mode';
      }
    });
  },

  getDonors() {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DONORS) || '[]');
  },

  addDonor(donor) {
    const donors = this.getDonors();
    donor.id = donor.id || Date.now();
    donor.totalDonations = donor.totalDonations || 0;
    donor.verified = true;
    donor.tier = donor.totalDonations >= 10 ? 'Gold Lifesaver' : donor.totalDonations >= 5 ? 'Silver Lifesaver' : 'Bronze Lifesaver';
    donor.badge = donor.totalDonations >= 10 ? 'Champion' : 'Active Volunteer';
    donor.avatar = donor.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(donor.name)}`;
    donors.unshift(donor);
    localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(donors));

    // Persist into MySQL
    if (window.fetch) {
      fetch('api/donors.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donor)
      }).then(r => r.json()).then(res => {
        if (res.success && res.donor_id) {
          donor.id = res.donor_id;
          localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(donors));
        }
      }).catch(() => {});
    }

    return donor;
  },

  getRequests() {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REQUESTS) || '[]');
  },

  addRequest(req) {
    const requests = this.getRequests();
    req.id = req.id || Date.now();
    req.bagsFulfilled = 0;
    req.status = 'ACTIVE';
    req.postedAgo = 'Just now';
    req.donorsCommitted = [];
    requests.unshift(req);
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));

    // Persist into MySQL
    if (window.fetch) {
      fetch('api/requests.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      }).then(r => r.json()).then(res => {
        if (res.success && res.request_id) {
          req.id = res.request_id;
          localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
        }
      }).catch(() => {});
    }

    return req;
  },

  pledgeDonation(requestId, donorInfo = null) {
    const requests = this.getRequests();
    const target = requests.find(r => r.id == requestId);
    if (!target) return { success: false, message: 'Request not found' };

    if (target.bagsFulfilled >= target.bagsNeeded) {
      return { success: false, message: 'Request is already fully fulfilled' };
    }

    target.bagsFulfilled += 1;
    target.donorsCommitted = target.donorsCommitted || [];

    const user = this.getUserProfile() || {};
    const donorName = typeof donorInfo === 'string' ? donorInfo : (donorInfo?.name || user.name || "Voluntary Donor");
    const donorId = typeof donorInfo === 'object' && donorInfo?.id ? donorInfo.id : user.id;
    const donorPhone = typeof donorInfo === 'object' && donorInfo?.phone ? donorInfo.phone : user.phone;
    const donorEmail = typeof donorInfo === 'object' && donorInfo?.email ? donorInfo.email : user.email;

    target.donorsCommitted.push(donorName);
    if (target.bagsFulfilled >= target.bagsNeeded) {
      target.status = 'FULFILLED';
    }
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));

    // Generate donation certificate
    const certId = `CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];

    user.history = user.history || [];
    user.history.unshift({
      date: today,
      hospital: target.hospital || 'Hospital Transfusion Center',
      recipient: target.patientName || 'Emergency Patient',
      bags: 1,
      certificateId: certId
    });
    user.totalDonations = (user.totalDonations || 0) + 1;
    user.livesSaved = (user.livesSaved || 0) + 3;
    user.lastDonatedDate = today;
    user.status = 'COOLDOWN';
    this.updateUserProfile(user);

    // Sync auth session
    if (typeof RedDropAuth !== 'undefined') {
      const session = RedDropAuth.getSession();
      if (session && session.user) {
        session.user = { ...session.user, ...user };
        localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
      }
    }

    // Persist to MySQL
    if (window.fetch) {
      fetch('api/requests.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pledge',
          request_id: requestId,
          donor_id: donorId,
          donorName,
          donorPhone,
          donorEmail,
          certificateId: certId,
          hospital: target.hospital,
          patientName: target.patientName
        })
      }).then(r => r.json()).then(res => {
        if (res.success && res.total_donations != null) {
          const u = RedDropStore.getUserProfile() || {};
          u.totalDonations = res.total_donations;
          u.livesSaved = res.lives_saved || (res.total_donations * 3);
          if (res.donorId) u.donorId = res.donorId;
          if (res.donor_id) u.id = res.donor_id;
          u.lastDonatedDate = res.lastDonatedDate || today;
          u.status = res.status || 'COOLDOWN';
          u.nextEligibleDate = res.nextEligibleDate;
          RedDropStore.updateUserProfile(u);

          if (typeof RedDropAuth !== 'undefined') {
            const s = RedDropAuth.getSession();
            if (s && s.user) {
              s.user = { ...s.user, ...u };
              localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(s));
            }
          }
        }
      }).catch(() => {});
    }

    return { success: true, request: target, certificateId: certId, totalDonations: user.totalDonations };
  },

  async recordDirectDonation(hospitalName = 'Dhaka Medical College Hospital (DMCH)', remarks = 'Voluntary Blood Transfusion') {
    const user = this.getUserProfile() || {};
    const certId = `CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];

    // Local optimistic update
    user.history = user.history || [];
    user.history.unshift({
      date: today,
      hospital: hospitalName,
      recipient: 'Emergency Patient',
      bags: 1,
      certificateId: certId
    });
    user.totalDonations = (user.totalDonations || 0) + 1;
    user.livesSaved = (user.livesSaved || 0) + 3;
    user.lastDonatedDate = today;
    user.status = 'COOLDOWN';
    this.updateUserProfile(user);

    if (typeof RedDropAuth !== 'undefined') {
      const session = RedDropAuth.getSession();
      if (session && session.user) {
        session.user = { ...session.user, ...user };
        localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
      }
    }

    // Persist directly to MySQL
    if (window.fetch) {
      try {
        const r = await fetch('api/donors.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'donate',
            donor_id: user.id,
            donorName: user.name,
            donorPhone: user.phone,
            donorEmail: user.email,
            hospital: hospitalName,
            remarks: remarks,
            certificateId: certId
          })
        });
        const res = await r.json();
        if (res.success) {
          user.totalDonations = res.total_donations;
          user.livesSaved = res.lives_saved;
          if (res.donorId) user.donorId = res.donorId;
          if (res.donor_id) user.id = res.donor_id;
          user.lastDonatedDate = res.lastDonatedDate || today;
          user.status = res.status || 'COOLDOWN';
          user.nextEligibleDate = res.nextEligibleDate;
          this.updateUserProfile(user);

          if (typeof RedDropAuth !== 'undefined') {
            const s = RedDropAuth.getSession();
            if (s && s.user) {
              s.user = { ...s.user, ...user };
              localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(s));
            }
          }
          return {
            success: true,
            certificateId: certId,
            totalDonations: res.total_donations,
            livesSaved: res.lives_saved,
            hospital: res.hospital,
            date: res.date,
            lastDonatedDate: res.lastDonatedDate,
            nextEligibleDate: res.nextEligibleDate
          };
        }
      } catch (e) {}
    }

    return { success: true, certificateId: certId, totalDonations: user.totalDonations, livesSaved: user.livesSaved, hospital: hospitalName, date: today };
  },

  async syncUserWithDatabase() {
    const user = this.getUserProfile();
    if (!user || (!user.email && !user.phone && !user.name && !user.id)) return user;
    if (window.fetch) {
      try {
        const identifier = user.email || user.phone || user.name || user.id;
        const res = await fetch(`api/login.php?action=sync&identifier=${encodeURIComponent(identifier)}&id=${encodeURIComponent(user.id || '')}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.profile) {
            const updated = { ...user, ...data.profile };
            this.updateUserProfile(updated);
            if (typeof RedDropAuth !== 'undefined') {
              const session = RedDropAuth.getSession();
              if (session && session.user) {
                session.user = { ...session.user, ...updated };
                localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
              }
            }
            return updated;
          }
        }
      } catch (e) {}
    }
    return user;
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

      if (window.fetch) {
        fetch('api/inventory.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hospitalId, group, component, delta })
        }).catch(() => {});
      }

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

// ==========================================
// 4. AUTHENTICATION MANAGER (RedDropAuth)
// ==========================================
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

// ==========================================
// 5. GLOBAL UI HELPERS & POPULATION
// ==========================================
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

// Populates all 64 districts in dropdown selects cleanly
function populateAllDistrictSelects() {
  const districtSelects = [
    'hero-district',
    'filter-district',
    'donor-district',
    'add-donor-district',
    'req-district',
    'reg-district'
  ];

  districtSelects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    if (el.options.length >= 64) return; // Already populated

    const currentVal = el.value;
    const hasAllOption = el.querySelector('option[value="ALL"]');

    let html = '';
    if (hasAllOption) {
      html += `<option value="ALL">All Districts (64)</option>`;
    } else {
      html += `<option value="" disabled ${!currentVal ? 'selected' : ''}>Select District (64)</option>`;
    }

    BD_DISTRICTS.forEach(dist => {
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

// Window globals
window.RedDropStore = RedDropStore;
window.RedDropAuth = RedDropAuth;
window.STORAGE_KEYS = STORAGE_KEYS;
window.BD_DISTRICTS = BD_DISTRICTS;
window.BLOOD_COMPATIBILITY = BLOOD_COMPATIBILITY;
window.populateAllDistrictSelects = populateAllDistrictSelects;
