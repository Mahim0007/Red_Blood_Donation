/**
 * RedDrop - Shared Navigation, Footer, and Global Modals
 */

document.addEventListener('DOMContentLoaded', () => {
  renderSharedModals();
  setupEmergencyTicker();
  applyRoleBasedVisibility();
  if (window.lucide) lucide.createIcons();
});

function applyRoleBasedVisibility() {
  try {
    const session = JSON.parse(localStorage.getItem('reddrop_auth_session') || 'null');
    const isAdmin = !!(session && session.isLoggedIn && session.role === 'admin');

    // Select all DBMS Studio / admin links
    const adminElements = document.querySelectorAll('[data-role="admin-only"], a[href="admin.html"], a[href*="admin.html"]');
    adminElements.forEach(el => {
      // Do not hide back buttons on admin.html page itself
      if (window.location.pathname.endsWith('admin.html')) return;

      if (!isAdmin) {
        el.style.display = 'none';
        el.classList.add('hidden');
        if (el.parentElement && el.parentElement.tagName === 'LI') {
          el.parentElement.style.display = 'none';
          el.parentElement.classList.add('hidden');
        }
      } else {
        el.style.display = '';
        el.classList.remove('hidden');
        if (el.parentElement && el.parentElement.tagName === 'LI') {
          el.parentElement.style.display = '';
          el.parentElement.classList.remove('hidden');
        }
      }
    });
  } catch (e) {
    console.error('Error applying role visibility', e);
  }
}
window.applyRoleBasedVisibility = applyRoleBasedVisibility;

function setupEmergencyTicker() {
  const tickerEl = document.getElementById('emergency-ticker-content');
  if (!tickerEl) return;
  const requests = RedDropStore.getRequests().filter(r => r.urgency === 'CRITICAL');
  if (requests.length > 0) {
    tickerEl.innerHTML = requests.map(r => 
      `<span class="inline-flex items-center gap-1.5 mr-6 text-red-100"><span class="w-2 h-2 rounded-full bg-red-400 animate-ping"></span><strong>URGENT:</strong> ${r.bloodGroup} needed at ${r.hospital} (${r.timeLimit}) • Call: <a href="tel:${r.attendantPhone}" class="underline font-bold text-white">${r.attendantPhone}</a></span>`
    ).join('');
  }
}

function renderSharedModals() {
  if (document.getElementById('global-modals-root')) return;

  const modalRoot = document.createElement('div');
  modalRoot.id = 'global-modals-root';
  modalRoot.innerHTML = `
    <!-- Quick Blood Request Modal -->
    <div id="request-modal" class="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-sm hidden flex items-center justify-center p-4">
      <div class="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto transform transition-all">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <i data-lucide="plus-circle" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="font-extrabold text-slate-900 text-base">Post Emergency Blood Request</h3>
              <p class="text-[11px] text-slate-500 font-medium">Broadcast your requirement across thousands of donors</p>
            </div>
          </div>
          <button onclick="closeRequestModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <form id="quick-request-form" onsubmit="handleQuickRequestSubmit(event)" class="mt-4 space-y-3.5 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Patient Name *</label>
            <input type="text" id="req-patient-name" required placeholder="e.g. Master Arif (Child)" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Blood Group *</label>
              <select id="req-blood-group" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold bg-white text-red-600">
                <option value="A+">A+ (A Positive)</option>
                <option value="A-">A- (A Negative)</option>
                <option value="B+">B+ (B Positive)</option>
                <option value="B-">B- (B Negative)</option>
                <option value="O+">O+ (O Positive)</option>
                <option value="O-">O- (O Negative - Rare)</option>
                <option value="AB+">AB+ (AB Positive)</option>
                <option value="AB-">AB- (AB Negative - Rare)</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Bags Required *</label>
              <input type="number" id="req-bags" min="1" max="10" value="1" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">District *</label>
              <select id="req-district" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium bg-white">
                <option value="Dhaka" selected>Dhaka</option>
                <option value="Bagerhat">Bagerhat</option>
                <option value="Bandarban">Bandarban</option>
                <option value="Barguna">Barguna</option>
                <option value="Barishal">Barishal</option>
                <option value="Bhola">Bhola</option>
                <option value="Bogura">Bogura</option>
                <option value="Brahmanbaria">Brahmanbaria</option>
                <option value="Chandpur">Chandpur</option>
                <option value="Chapai Nawabganj">Chapai Nawabganj</option>
                <option value="Chattogram">Chattogram</option>
                <option value="Chuadanga">Chuadanga</option>
                <option value="Cox's Bazar">Cox's Bazar</option>
                <option value="Cumilla">Cumilla</option>
                <option value="Dinajpur">Dinajpur</option>
                <option value="Faridpur">Faridpur</option>
                <option value="Feni">Feni</option>
                <option value="Gaibandha">Gaibandha</option>
                <option value="Gazipur">Gazipur</option>
                <option value="Gopalganj">Gopalganj</option>
                <option value="Habiganj">Habiganj</option>
                <option value="Jamalpur">Jamalpur</option>
                <option value="Jashore">Jashore</option>
                <option value="Jhalokati">Jhalokati</option>
                <option value="Jhenaidah">Jhenaidah</option>
                <option value="Joypurhat">Joypurhat</option>
                <option value="Khagrachhari">Khagrachhari</option>
                <option value="Khulna">Khulna</option>
                <option value="Kishoreganj">Kishoreganj</option>
                <option value="Kurigram">Kurigram</option>
                <option value="Kushtia">Kushtia</option>
                <option value="Lakshmipur">Lakshmipur</option>
                <option value="Lalmonirhat">Lalmonirhat</option>
                <option value="Madaripur">Madaripur</option>
                <option value="Magura">Magura</option>
                <option value="Manikganj">Manikganj</option>
                <option value="Meherpur">Meherpur</option>
                <option value="Moulvibazar">Moulvibazar</option>
                <option value="Munshiganj">Munshiganj</option>
                <option value="Mymensingh">Mymensingh</option>
                <option value="Naogaon">Naogaon</option>
                <option value="Narail">Narail</option>
                <option value="Narayanganj">Narayanganj</option>
                <option value="Narsingdi">Narsingdi</option>
                <option value="Natore">Natore</option>
                <option value="Netrokona">Netrokona</option>
                <option value="Nilphamari">Nilphamari</option>
                <option value="Noakhali">Noakhali</option>
                <option value="Pabna">Pabna</option>
                <option value="Panchagarh">Panchagarh</option>
                <option value="Patuakhali">Patuakhali</option>
                <option value="Pirojpur">Pirojpur</option>
                <option value="Rajbari">Rajbari</option>
                <option value="Rajshahi">Rajshahi</option>
                <option value="Rangamati">Rangamati</option>
                <option value="Rangpur">Rangpur</option>
                <option value="Satkhira">Satkhira</option>
                <option value="Shariatpur">Shariatpur</option>
                <option value="Sherpur">Sherpur</option>
                <option value="Sirajganj">Sirajganj</option>
                <option value="Sunamganj">Sunamganj</option>
                <option value="Sylhet">Sylhet</option>
                <option value="Tangail">Tangail</option>
                <option value="Thakurgaon">Thakurgaon</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Urgency Level *</label>
              <select id="req-urgency" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-rose-600 bg-white">
                <option value="CRITICAL">Critical (Within 2-4 Hours)</option>
                <option value="URGENT">Urgent (Within 12-24 Hours)</option>
                <option value="SCHEDULED">Scheduled (Next 2-3 Days)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Hospital / Clinic Name & Location *</label>
            <input type="text" id="req-hospital" required placeholder="e.g. Dhaka Medical College Hospital, Bed #204" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium">
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Reason / Clinical Condition</label>
            <input type="text" id="req-reason" placeholder="e.g. Thalassemia / Emergency Delivery / Dengue / Surgery" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Attendant Name *</label>
              <input type="text" id="req-attendant-name" required placeholder="e.g. Dr. Kabir / Relative" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Attendant Phone *</label>
              <input type="tel" id="req-attendant-phone" required placeholder="017XXXXXXXX" pattern="01[3-9][0-9]{8}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold">
            </div>
          </div>

          <div class="pt-2 flex items-center justify-end gap-2">
            <button type="button" onclick="closeRequestModal()" class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition">Cancel</button>
            <button type="submit" class="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black shadow-lg shadow-red-200 transition flex items-center gap-2">
              <i data-lucide="send" class="w-4 h-4"></i> Broadcast Request
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Eligibility Quiz Modal -->
    <div id="eligibility-modal" class="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-sm hidden flex items-center justify-center p-4">
      <div class="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-slate-100">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <i data-lucide="shield-check" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="font-extrabold text-slate-900 text-base">Blood Donation Eligibility Checker</h3>
              <p class="text-[11px] text-slate-500 font-medium">Quick 60-second medical compliance check</p>
            </div>
          </div>
          <button onclick="closeEligibilityModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div id="quiz-container" class="mt-5 space-y-4 text-xs">
          <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <p class="font-bold text-slate-800 mb-2">1. Are you between 18 and 60 years old?</p>
            <div class="flex gap-3">
              <label class="flex items-center gap-1.5 cursor-pointer font-semibold"><input type="radio" name="q_age" value="yes" checked> Yes</label>
              <label class="flex items-center gap-1.5 cursor-pointer font-semibold"><input type="radio" name="q_age" value="no"> No</label>
            </div>
          </div>

          <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <p class="font-bold text-slate-800 mb-2">2. Is your body weight at least 48 kg (for females) or 50 kg (for males)?</p>
            <div class="flex gap-3">
              <label class="flex items-center gap-1.5 cursor-pointer font-semibold"><input type="radio" name="q_weight" value="yes" checked> Yes</label>
              <label class="flex items-center gap-1.5 cursor-pointer font-semibold"><input type="radio" name="q_weight" value="no"> No</label>
            </div>
          </div>

          <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <p class="font-bold text-slate-800 mb-2">3. Have you completed at least 90 days (3 months) since your last donation?</p>
            <div class="flex gap-3">
              <label class="flex items-center gap-1.5 cursor-pointer font-semibold"><input type="radio" name="q_days" value="yes" checked> Yes / First Time</label>
              <label class="flex items-center gap-1.5 cursor-pointer font-semibold"><input type="radio" name="q_days" value="no"> No (< 90 Days)</label>
            </div>
          </div>

          <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <p class="font-bold text-slate-800 mb-2">4. Are you free from recent fever, infection, or major surgeries?</p>
            <div class="flex gap-3">
              <label class="flex items-center gap-1.5 cursor-pointer font-semibold"><input type="radio" name="q_health" value="yes" checked> Yes, Perfectly Healthy</label>
              <label class="flex items-center gap-1.5 cursor-pointer font-semibold"><input type="radio" name="q_health" value="no"> No</label>
            </div>
          </div>

          <div id="quiz-result" class="hidden p-4 rounded-2xl font-medium text-xs"></div>

          <div class="pt-2 flex items-center justify-between">
            <button type="button" onclick="evaluateEligibility()" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-200 transition">
              Verify My Eligibility
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalRoot);
}

window.openRequestModal = function() {
  document.getElementById('request-modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
};

window.closeRequestModal = function() {
  document.getElementById('request-modal').classList.add('hidden');
};

window.openEligibilityModal = function() {
  document.getElementById('eligibility-modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
};

window.closeEligibilityModal = function() {
  document.getElementById('eligibility-modal').classList.add('hidden');
};

window.evaluateEligibility = function() {
  const age = document.querySelector('input[name="q_age"]:checked')?.value === 'yes';
  const weight = document.querySelector('input[name="q_weight"]:checked')?.value === 'yes';
  const days = document.querySelector('input[name="q_days"]:checked')?.value === 'yes';
  const health = document.querySelector('input[name="q_health"]:checked')?.value === 'yes';

  const resultBox = document.getElementById('quiz-result');
  resultBox.classList.remove('hidden');

  if (age && weight && days && health) {
    resultBox.className = 'p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs space-y-2';
    resultBox.innerHTML = `
      <div class="flex items-center gap-2 text-emerald-700 font-black text-sm">
        <i data-lucide="check-circle-2" class="w-5 h-5"></i> Congratulations! You Are Eligible to Donate!
      </div>
      <p class="text-slate-600 font-normal">Your health indicators qualify you as an active blood donor. Join thousands of lifesavers today.</p>
      <div class="pt-2">
        <a href="auth.html" class="inline-block bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow">Register as a Donor Now &rarr;</a>
      </div>
    `;
  } else {
    resultBox.className = 'p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-medium text-xs space-y-1.5';
    resultBox.innerHTML = `
      <div class="flex items-center gap-2 text-amber-700 font-black text-sm">
        <i data-lucide="alert-triangle" class="w-5 h-5"></i> Temporary Cooldown / Medical Advisory
      </div>
      <p class="text-slate-600">Based on guidelines, you need to wait until you complete the cooldown period or recover your full health before donating blood safely.</p>
    `;
  }
  if (window.lucide) lucide.createIcons();
};

window.handleQuickRequestSubmit = function(e) {
  e.preventDefault();
  const patientName = document.getElementById('req-patient-name').value;
  const bloodGroup = document.getElementById('req-blood-group').value;
  const bags = parseInt(document.getElementById('req-bags').value) || 1;
  const district = document.getElementById('req-district').value;
  const urgency = document.getElementById('req-urgency').value;
  const hospital = document.getElementById('req-hospital').value;
  const reason = document.getElementById('req-reason').value || "Emergency Medical Requirement";
  const attendantName = document.getElementById('req-attendant-name').value;
  const attendantPhone = document.getElementById('req-attendant-phone').value;

  const newReq = {
    patientName,
    bloodGroup,
    bagsNeeded: bags,
    urgency,
    timeLimit: urgency === 'CRITICAL' ? 'Within 2 Hours' : urgency === 'URGENT' ? 'Within 24 Hours' : 'Scheduled',
    deadlineDate: 'Urgent',
    hospital,
    district,
    division: district === 'Chattogram' ? 'Chattogram' : district === 'Sylhet' ? 'Sylhet' : 'Dhaka',
    bedLocation: 'Direct Contact with Attendant',
    reason,
    attendantName,
    attendantPhone
  };

  RedDropStore.addRequest(newReq);
  closeRequestModal();
  showToast(`Emergency request for ${bloodGroup} posted successfully! Broadcasted to donors.`, 'success');

  // If on requests.html, re-render
  if (typeof renderRequestsGrid === 'function') {
    renderRequestsGrid();
  }
};
