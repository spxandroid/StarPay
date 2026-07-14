/* Insurance checkout UI concept — behavior for payment.html.
   Designed by @spxandroid (www.spxandroid.com).
   Each payment method (UPI, Cards, Net Banking, Card EMI, Cardless EMI,
   Loan Offers, Wallets) is a self-contained block of functions below,
   in the same order as the panels in the HTML. All amounts derive from
   EMI_AMOUNT (~line 200) rather than being re-hardcoded per panel. */

/* ── THEME ── */
function toggleTheme() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', dark ? 'light' : 'dark');
  document.getElementById('icon-moon').style.display = dark ? '' : 'none';
  document.getElementById('icon-sun').style.display  = dark ? 'none' : '';
}

/* ── METHOD SWITCH ── */
function switchMethod(id, el) {
  document.querySelectorAll('.m-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('panel-' + id);
  panel.classList.add('active');
  /* re-trigger child animations */
  panel.querySelectorAll('.upi-info-col > *, .otm-compact, .card-form-col > *').forEach(c => {
    c.style.animation = 'none';
    void c.offsetWidth;
    c.style.animation = '';
  });
}

/* ── 15-MIN SESSION TIMER ── */
let secs = 15 * 60;
const box = document.getElementById('timer-box');
const tm  = document.getElementById('t-m');
const ts  = document.getElementById('t-s');
function tick() {
  if (secs <= 0) { tm.textContent = '00'; ts.textContent = '00'; return; }
  tm.textContent = String(Math.floor(secs / 60)).padStart(2,'0');
  ts.textContent = String(secs % 60).padStart(2,'0');
  if (secs <= 300) box.classList.add('warn'); else box.classList.remove('warn');
  secs--;
}
tick(); setInterval(tick, 1000);

/* ── QR 10-MIN TIMER ── */
let qrSecs = 10 * 60;
const qrEl  = document.getElementById('qr-time');
const qrRow = document.getElementById('qr-expiry-row');
function qrTick() {
  if (qrSecs <= 0) { if (qrEl) qrEl.textContent = 'Expired'; return; }
  if (qrEl) qrEl.textContent = String(Math.floor(qrSecs/60)).padStart(2,'0') + ':' + String(qrSecs%60).padStart(2,'0');
  if (qrRow) {
    if (qrSecs <= 120) qrRow.classList.add('expiring');
    else qrRow.classList.remove('expiring');
  }
  qrSecs--;
}
qrTick(); setInterval(qrTick, 1000);

/* ── ASBA OTM ── */
function toggleOTM(chk) {
  const btn = document.getElementById('otm-btn');
  const box = document.getElementById('otm-box');
  if (chk.checked) {
    btn.classList.add('enabled'); btn.disabled = false;
    box.classList.add('active');
  } else {
    btn.classList.remove('enabled'); btn.disabled = true;
    box.classList.remove('active');
    resetQR();
  }
}

function swapQR(fn) {
  const qrBox = document.getElementById('qr-main-box');
  qrBox.classList.add('qr-exit');
  setTimeout(() => {
    fn();
    qrBox.classList.remove('qr-exit');
    qrBox.classList.add('qr-enter');
    qrBox.addEventListener('animationend', () => qrBox.classList.remove('qr-enter'), {once:true});
  }, 220);
}

function generateOTM() {
  swapQR(() => {
    document.getElementById('qr-main-box').classList.add('otm-mode');
    document.getElementById('qr-type-badge').className = 'qr-badge-sm otm';
    document.getElementById('qr-type-badge').innerHTML = '<svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> ASBA OTM QR';
    document.getElementById('qr-instructions').innerHTML = 'Scan this <strong>ASBA OTM QR</strong> with your UPI app to authorise a One Time Mandate of <strong>₹18,499</strong>.';
    document.getElementById('otm-active-pill').classList.add('show');
  });
}

function resetQR() {
  swapQR(() => {
    document.getElementById('qr-main-box').classList.remove('otm-mode');
    document.getElementById('qr-type-badge').className = 'qr-badge-sm';
    document.getElementById('qr-type-badge').innerHTML = '<svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg> UPI Collect QR';
    document.getElementById('qr-instructions').innerHTML = 'Open Google Pay, PhonePe, Paytm or BHIM — tap <strong>Scan QR</strong> and point your camera at this code.';
    document.getElementById('otm-active-pill').classList.remove('show');
  });
}

/* ── NET BANKING SELECTION ── */
function selectBank(tile) {
  document.querySelectorAll('.nb-tile').forEach(t => t.classList.remove('sel'));
  tile.classList.add('sel');
  const sel = document.getElementById('nb-select');
  if (sel) sel.value = '';
}
function selectBankDropdown(sel) {
  if (sel.value) {
    document.querySelectorAll('.nb-tile').forEach(t => t.classList.remove('sel'));
  }
}

/* ── CARD LIVE UPDATE ── */
const networkLogos = {
  visa: `<svg width="60" height="22" viewBox="0 0 60 22" xmlns="http://www.w3.org/2000/svg"><text x="0" y="20" font-family="Arial Black,Arial,sans-serif" font-size="22" font-weight="900" font-style="italic" fill="white" letter-spacing="-1">VISA</text></svg>`,
  mastercard: `<svg width="50" height="31" viewBox="0 0 50 31" fill="none"><circle cx="19" cy="15.5" r="12" fill="#EB001B" opacity=".9"/><circle cx="31" cy="15.5" r="12" fill="#F79E1B" opacity=".9"/><path d="M25 5.9a12 12 0 0 1 0 19.2A12 12 0 0 1 25 5.9z" fill="#FF5F00" opacity=".9"/></svg>`,
  rupay: `<svg width="66" height="26" viewBox="0 0 66 26" xmlns="http://www.w3.org/2000/svg"><rect width="66" height="26" rx="4" fill="rgba(255,255,255,0.18)"/><text x="6" y="19" font-family="Arial,sans-serif" font-size="14" font-weight="900" fill="white">Ru</text><text x="28" y="19" font-family="Arial,sans-serif" font-size="14" font-weight="900" fill="#FF6B00">Pay</text></svg>`,
  amex: `<svg width="62" height="26" viewBox="0 0 62 26" xmlns="http://www.w3.org/2000/svg"><rect width="62" height="26" rx="4" fill="rgba(255,255,255,0.2)"/><text x="6" y="18" font-family="Arial,sans-serif" font-size="11" font-weight="900" fill="white" letter-spacing="1.5">AMEX</text></svg>`,
  diners: `<svg width="70" height="26" viewBox="0 0 70 26" xmlns="http://www.w3.org/2000/svg"><text x="0" y="18" font-family="Arial,sans-serif" font-size="10" font-weight="700" fill="rgba(255,255,255,0.8)">DINERS CLUB</text></svg>`,
  unknown: `<svg width="50" height="31" viewBox="0 0 50 31" fill="none"><circle cx="19" cy="15.5" r="12" fill="#EB001B" opacity=".55"/><circle cx="31" cy="15.5" r="12" fill="#F79E1B" opacity=".55"/><path d="M25 5.9a12 12 0 0 1 0 19.2A12 12 0 0 1 25 5.9z" fill="#FF5F00" opacity=".55"/></svg>`
};
const networkClasses = ['net-visa','net-mastercard','net-rupay','net-amex','net-diners'];

function detectNetwork(raw) {
  if (/^4/.test(raw)) return 'visa';
  if (/^5[1-5]/.test(raw) || /^2[2-7]\d{2}/.test(raw)) return 'mastercard';
  if (/^(60|65|81|82|508|353|356)/.test(raw)) return 'rupay';
  if (/^3[47]/.test(raw)) return 'amex';
  if (/^3(0[0-5]|6|8)/.test(raw)) return 'diners';
  return 'unknown';
}

let _lastNet = 'unknown';

function updateCard(numInput) {
  /* ─ Number ─ */
  const numEl = document.getElementById('inp-num');
  let raw = numEl.value.replace(/\D/g, '');
  const net = detectNetwork(raw);

  /* Format input with spaces every 4 digits */
  const amex = net === 'amex';
  const maxLen = amex ? 15 : 16;
  raw = raw.substring(0, maxLen);
  if (amex) {
    numEl.value = raw.replace(/^(\d{4})(\d{0,6})(\d{0,5})/, (_,a,b,c)=>[a,b,c].filter(Boolean).join(' '));
  } else {
    numEl.value = raw.replace(/(.{4})/g,'$1 ').trim();
  }

  /* Build display (entered digits visible, remaining dots) */
  let display = '';
  if (amex) {
    const groups = [4,6,5];
    let pos = 0;
    groups.forEach((len, gi) => {
      if (gi > 0) display += '  ';
      for (let i = 0; i < len; i++) { display += raw[pos] || '•'; pos++; }
    });
  } else {
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) display += '  ';
      display += raw[i] || '•';
    }
  }
  document.getElementById('disp-number').textContent = display;

  /* ─ Network logo & card color (animated on change) ─ */
  const card    = document.getElementById('card-visual');
  const logoEl  = document.getElementById('card-network-logo');
  networkClasses.forEach(c => card.classList.remove(c));
  if (net !== 'unknown') card.classList.add('net-' + net);

  if (net !== _lastNet) {
    _lastNet = net;
    logoEl.classList.add('net-changing');
    setTimeout(() => {
      logoEl.innerHTML = networkLogos[net];
      logoEl.classList.remove('net-changing');
    }, 180);
  }

  /* ─ Name ─ */
  const nameVal = document.getElementById('inp-name').value.toUpperCase() || 'YOUR NAME';
  document.getElementById('disp-name').textContent = nameVal.substring(0,22);

  /* ─ Expiry ─ */
  const expVal = document.getElementById('inp-exp').value || 'MM / YY';
  document.getElementById('disp-expiry').textContent = expVal;
}

/* Auto-format expiry MM/YY */
document.getElementById('inp-exp').addEventListener('input', function() {
  let v = this.value.replace(/\D/g,'').substring(0,4);
  if (v.length >= 3) v = v.substring(0,2) + ' / ' + v.substring(2);
  this.value = v;
});

/* ── CARD EMI: BANK LIST + PLANS ── */
const EMI_AMOUNT  = 18499;
const EMI_TENURES = [3, 6, 9, 12, 18, 24];
const emiBanks = [
  { id:'amex',     name:'AMEX',  full:'American Express',      bg:'linear-gradient(135deg,#006FCF,#00A8E8)', rate:15,   types:['credit'] },
  { id:'ausfb',    name:'AU',    full:'AU Small Finance Bank', bg:'linear-gradient(135deg,#E8720C,#F4A322)', rate:16,   types:['credit'] },
  { id:'axis',     name:'AXIS',  full:'Axis Bank',             bg:'linear-gradient(135deg,#5C1010,#8B1A1A)', rate:15,   types:['credit','debit'] },
  { id:'bobcard',  name:'BOB',   full:'BOBCARD',                bg:'linear-gradient(135deg,#B34700,#E06010)', rate:14,   types:['credit'] },
  { id:'canara',   name:'CNRB',  full:'Canara Bank',            bg:'linear-gradient(135deg,#7B1113,#A31F22)', rate:13,   types:['credit'] },
  { id:'dbs',      name:'DBS',   full:'DBS Bank',               bg:'linear-gradient(135deg,#E4002B,#FF3355)', rate:16,   types:['credit'] },
  { id:'federal',  name:'FED',   full:'Federal Bank',           bg:'linear-gradient(135deg,#003B71,#0A5CA8)', rate:15,   types:['credit'] },
  { id:'hdfc',     name:'HDFC',  full:'HDFC Bank',              bg:'linear-gradient(135deg,#00387A,#005CB8)', rate:14,   types:['credit','debit'] },
  { id:'icici',    name:'ICICI', full:'ICICI Bank',             bg:'linear-gradient(135deg,#9B0000,#CC0000)', rate:15,   types:['credit','debit'] },
  { id:'idfc',     name:'IDFC',  full:'IDFC First Bank',        bg:'linear-gradient(135deg,#006070,#009BB0)', rate:16,   types:['credit','debit'] },
  { id:'indusind', name:'IIB',   full:'IndusInd Bank',          bg:'linear-gradient(135deg,#8B1538,#B8305A)', rate:15,   types:['credit'] },
  { id:'kotak',    name:'KTK',   full:'Kotak Mahindra Bank',    bg:'linear-gradient(135deg,#4A235A,#76448A)', rate:14,   types:['credit','debit'] },
  { id:'rbl',      name:'RBL',   full:'RBL Bank',               bg:'linear-gradient(135deg,#8A1538,#C41E3A)', rate:18,   types:['credit'] },
  { id:'sbi',      name:'SBI',   full:'SBI Card',               bg:'linear-gradient(135deg,#003166,#0052A5)', rate:15,   types:['credit','debit'] },
  { id:'scb',      name:'SC',    full:'Standard Chartered',     bg:'linear-gradient(135deg,#005A2B,#009845)', rate:13,   types:['credit'] },
  { id:'yes',      name:'YES',   full:'Yes Bank',               bg:'linear-gradient(135deg,#002D62,#0047AB)', rate:16,   types:['credit'] },
];
let emiActiveTab = 'credit';

function fmtINR0(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}
function calcEmi(principal, annualRatePct, months) {
  const r = annualRatePct / 1200;
  const factor = Math.pow(1 + r, months);
  return principal * r * factor / (factor - 1);
}

function renderEmiBanks(filter) {
  const list = document.getElementById('emi-bank-list');
  const q = (filter || '').trim().toLowerCase();
  const banks = emiBanks.filter(b => b.types.includes(emiActiveTab) &&
    (!q || b.name.toLowerCase().includes(q) || b.full.toLowerCase().includes(q)));
  if (!banks.length) {
    list.innerHTML = `<div class="emi-empty">No banks found. Try a different search.</div>`;
    return;
  }
  list.innerHTML = banks.map((b, i) => `
    <div class="emi-bank-row" style="animation-delay:${Math.min(i * 0.03, 0.3)}s" onclick="openEmiBank('${b.id}')">
      <div class="emi-bank-icon" style="background:${b.bg}">${b.name}</div>
      <div>
        <div class="emi-bank-name">${b.full}</div>
        <div class="emi-bank-rate">EMI from ${b.rate.toFixed(2)}% p.a.</div>
      </div>
      <svg class="emi-bank-chevron" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
      </svg>
    </div>
  `).join('');
}

function switchEmiTab(tab) {
  emiActiveTab = tab;
  document.getElementById('emi-tab-credit').classList.toggle('active', tab === 'credit');
  document.getElementById('emi-tab-debit').classList.toggle('active', tab === 'debit');
  const search = document.querySelector('.emi-search-input');
  if (search) search.value = '';
  renderEmiBanks('');
}

function filterEmiBanks(v) { renderEmiBanks(v); }

function openEmiBank(id) {
  const bank = emiBanks.find(b => b.id === id);
  if (!bank) return;

  document.getElementById('emi-bank-header').innerHTML = `
    <div class="emi-bank-icon" style="background:${bank.bg}">${bank.name}</div>
    <div>
      <div class="emi-bank-header-name">${bank.full}</div>
      <div class="emi-bank-header-sub">${emiActiveTab === 'credit' ? 'Credit' : 'Debit'} Card EMI</div>
    </div>
  `;

  const planList = document.getElementById('emi-plan-list');
  planList.innerHTML = EMI_TENURES.map(m => {
    const emi = calcEmi(EMI_AMOUNT, bank.rate, m);
    const totalInterest = emi * m - EMI_AMOUNT;
    return `
      <label class="emi-plan-row" onclick="selectEmiPlan(this, ${emi}, ${m}, ${totalInterest})">
        <input type="radio" name="emi-plan" class="emi-plan-radio">
        <span class="emi-plan-dot"></span>
        <span class="emi-plan-info">
          <span class="emi-plan-main">${fmtINR0(emi)} <span class="emi-plan-x">×</span> ${m} M <span class="emi-plan-rate">@${bank.rate.toFixed(2)}% p.a</span></span>
          <span class="emi-plan-sub">Total ${fmtINR0(totalInterest)} interest charged</span>
        </span>
      </label>
    `;
  }).join('');

  document.getElementById('emi-summary').style.display = 'none';
  const cta = document.getElementById('emi-plan-cta');
  cta.disabled = true;
  cta.innerHTML = 'Select a plan to continue';

  document.getElementById('emi-step-list').style.display = 'none';
  const stepPlans = document.getElementById('emi-step-plans');
  stepPlans.style.display = '';
  stepPlans.style.animation = 'none';
  void stepPlans.offsetWidth;
  stepPlans.style.animation = '';

  /* measure after the panel is visible, else scrollHeight reads 0 */
  const acc = document.getElementById('emi-accordion-standard');
  acc.classList.add('open');
  const body = document.getElementById('emi-plan-list');
  body.style.maxHeight = body.scrollHeight + 'px';
}

function backToEmiBanks() {
  document.getElementById('emi-step-plans').style.display = 'none';
  const stepList = document.getElementById('emi-step-list');
  stepList.style.display = '';
  stepList.style.animation = 'none';
  void stepList.offsetWidth;
  stepList.style.animation = '';
}

function toggleEmiAccordion(btn) {
  const acc = btn.parentElement;
  acc.classList.toggle('open');
  const body = btn.nextElementSibling;
  body.style.maxHeight = acc.classList.contains('open') ? body.scrollHeight + 'px' : '0px';
}

function selectEmiPlan(row, emi, months, interest) {
  document.querySelectorAll('.emi-plan-row').forEach(r => r.classList.remove('sel'));
  row.classList.add('sel');
  row.querySelector('.emi-plan-radio').checked = true;

  document.getElementById('emi-summary').style.display = 'grid';
  document.getElementById('emi-p-interest').textContent = fmtINR0(interest);
  document.getElementById('emi-p-monthly').textContent  = fmtINR0(emi);

  const cta = document.getElementById('emi-plan-cta');
  cta.disabled = false;
  cta.innerHTML = `<svg fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor" style="width:17px;height:17px"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Set up EMI — ${fmtINR0(emi)}/month × ${months}`;
}

renderEmiBanks('');

function handleCardEmiPay(btn) {
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="loan-spinner"></span> Processing…';
  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = original;
    populateSuccessScreen();
    showResultScreen('success');
  }, 1300);
}

let cardlessProviderSelected = null;
function selectCardlessProvider(el) {
  cardlessProviderSelected = el.dataset.provider;
  document.querySelectorAll('#cardless-providers-grid .provider-card').forEach(c => c.classList.toggle('sel', c === el));
  const cta = document.getElementById('cardless-emi-cta');
  cta.disabled = false;
  cta.innerHTML = `<svg fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg> Continue with ${cardlessProviderSelected}`;
}

function handleCardlessEmiPay(btn) {
  if (!cardlessProviderSelected) return;
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="loan-spinner"></span> Redirecting…';
  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = original;
    populateSuccessScreen();
    showResultScreen('success');
  }, 1300);
}

/* ── LOAN OFFERS WIZARD ── */
const loanData = { addressType: '', education: '', employment: '', income: '' };
const loanSteps = ['personal', 'financial', 'preview', 'offers'];
let loanMaxReached = 0;

const loanFieldLabels = {
  addressType: { rented: 'Rented', owned: 'Owned', company: 'Company Provided', parents: "Parents'" },
  education:   { undergraduate: 'Undergraduate', diploma: 'Diploma', graduate: 'Graduate', professional: 'Professional Degree', postgraduate: 'Post Graduate' },
  employment:  { salaried: 'Salaried', 'self-employed': 'Self Employed' },
};

(function loanInitDob() {
  const dobEl = document.getElementById('loan-dob');
  if (dobEl) dobEl.max = new Date().toISOString().split('T')[0];
})();

function loanGoTo(step) {
  document.querySelectorAll('.loan-screen').forEach(s => s.classList.remove('active'));
  document.getElementById('loan-screen-' + step).classList.add('active');

  const wrap = document.getElementById('loan-progress-wrap');
  if (step === 'consent') {
    wrap.style.display = 'none';
  } else {
    wrap.style.display = '';
    loanStepperSync(step);
  }

  if (step === 'preview') loanRenderPreview();
  if (step === 'offers') loanRenderOffers();

  const panel = document.getElementById('panel-bnpl');
  if (panel) panel.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function loanStepperSync(step) {
  const idx = loanSteps.indexOf(step);
  if (idx > loanMaxReached) loanMaxReached = idx;
  document.querySelectorAll('.loan-step-node').forEach((node, i) => {
    node.classList.remove('done', 'current', 'clickable');
    if (i < idx) node.classList.add('done');
    if (i === idx) node.classList.add('current');
    if (i <= loanMaxReached && i !== idx) node.classList.add('clickable');
  });
  document.querySelectorAll('.loan-step-line').forEach((line, i) => {
    line.classList.toggle('done', i < idx);
  });
}

function loanStepperJump(step) {
  const idx = loanSteps.indexOf(step);
  if (idx <= loanMaxReached) loanGoTo(step);
}

function loanToggleConsent(chk) {
  document.getElementById('loan-consent-next').disabled = !chk.checked;
}

function loanSelectChip(field, value, btn) {
  btn.parentElement.querySelectorAll('.loan-chip').forEach(c => c.classList.remove('sel'));
  btn.classList.add('sel');
  loanData[field] = value;
  if (field === 'employment') loanValidateFinancial();
  else loanValidatePersonal();
}

function loanDigitsOnly(el, maxLen) {
  el.value = el.value.replace(/\D/g, '').substring(0, maxLen);
}

function loanFormatPan(el) {
  el.value = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);
  loanValidatePersonal();
}

function loanFormatIncome(el) {
  const raw = el.value.replace(/\D/g, '').substring(0, 8);
  loanData.income = raw;
  el.value = raw ? Number(raw).toLocaleString('en-IN') : '';
  loanValidateFinancial();
}

function loanAge(dobStr) {
  const dob = new Date(dobStr);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

/* live "application strength" meter — small dopamine hit, and it doubles
   as a single source of truth for how close the applicant is to done */
const LOAN_REQUIRED_FIELDS = 11;
function loanComputeStrength() {
  let filled = 0;
  const val = id => (document.getElementById(id) || {}).value?.trim() || '';
  if (val('loan-fname')) filled++;
  if (val('loan-lname')) filled++;
  if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(val('loan-pan'))) filled++;
  if (/^[0-9]{6}$/.test(val('loan-pincode'))) filled++;
  if (loanData.addressType) filled++;
  if (loanData.education) filled++;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('loan-email'))) filled++;
  const dob = val('loan-dob');
  if (dob && loanAge(dob) >= 18) filled++;
  if (loanData.income && Number(loanData.income) >= 5000) filled++;
  if (loanData.employment) filled++;
  if (val('loan-father')) filled++;

  const pct = Math.round((filled / LOAN_REQUIRED_FIELDS) * 100);
  const fill = document.getElementById('loan-strength-fill');
  const label = document.getElementById('loan-strength-pct');
  if (fill) fill.style.width = pct + '%';
  if (label) label.textContent = pct + '%';
  return pct;
}

function loanValidatePersonal() {
  const fn  = document.getElementById('loan-fname').value.trim();
  const ln  = document.getElementById('loan-lname').value.trim();
  const pan = document.getElementById('loan-pan').value.trim();
  const pin = document.getElementById('loan-pincode').value.trim();
  const email = document.getElementById('loan-email').value.trim();
  const dob = document.getElementById('loan-dob').value;

  const panOk = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan);
  const pinOk = /^[0-9]{6}$/.test(pin);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const dobOk = !!dob && loanAge(dob) >= 18;

  document.getElementById('loan-pan-hint').textContent = pan && !panOk ? 'Enter a valid PAN, e.g. ABCDE1234F' : '';
  document.getElementById('loan-dob-hint').textContent = dob && !dobOk ? 'Applicant must be at least 18 years old' : '';

  const ok = !!(fn && ln && panOk && pinOk && loanData.addressType && loanData.education && emailOk && dobOk);
  document.getElementById('loan-personal-next').disabled = !ok;
  loanComputeStrength();
  return ok;
}

function loanValidateFinancial() {
  const incomeOk = loanData.income && Number(loanData.income) >= 5000;
  const father = document.getElementById('loan-father').value.trim();
  const ok = !!(incomeOk && loanData.employment && father);
  document.getElementById('loan-financial-next').disabled = !ok;
  loanComputeStrength();
  return ok;
}

function loanFmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function loanPreviewRow(label, value) {
  return `<div class="loan-preview-item"><div class="loan-pi-label">${label}</div><div class="loan-pi-value">${value || '—'}</div></div>`;
}

function loanRenderPreview() {
  const fname = document.getElementById('loan-fname').value.trim();
  const mname = document.getElementById('loan-mname').value.trim();
  const lname = document.getElementById('loan-lname').value.trim();
  const fullName = [fname, mname, lname].filter(Boolean).join(' ');
  const pan = document.getElementById('loan-pan').value.trim();
  const pincode = document.getElementById('loan-pincode').value.trim();
  const email = document.getElementById('loan-email').value.trim();
  const dob = document.getElementById('loan-dob').value;
  const father = document.getElementById('loan-father').value.trim();
  const income = loanData.income ? '₹' + Number(loanData.income).toLocaleString('en-IN') : '';

  document.getElementById('loan-preview-personal').innerHTML =
    loanPreviewRow('Applicant Name', fullName) +
    loanPreviewRow('PAN Number', pan) +
    loanPreviewRow('Pincode', pincode) +
    loanPreviewRow('Address Type', loanFieldLabels.addressType[loanData.addressType]) +
    loanPreviewRow('Education', loanFieldLabels.education[loanData.education]) +
    loanPreviewRow('Email ID', email) +
    loanPreviewRow('Date of Birth', loanFmtDate(dob));

  document.getElementById('loan-preview-financial').innerHTML =
    loanPreviewRow('Net Monthly Income', income) +
    loanPreviewRow('Employment Type', loanFieldLabels.employment[loanData.employment]);

  document.getElementById('loan-preview-family').innerHTML =
    loanPreviewRow("Father's Name", father);
}

/* ── LENDER MARKETPLACE ──
   No lender is hardcoded first. Rank is always computed live from the
   lender's own published numbers against the applicant's own loan
   amount, and the shopper picks the measure that matters to them.
   "Success Rate" is the modelled approval likelihood for this profile
   and tenure/policy combination — it's the default sort because it's
   the number that actually predicts whether a shopper gets funded. */
const loanLenders = [
  { id: 'finsall', name: 'Finsall', mark: 'FS', bg: 'linear-gradient(135deg,#1B6FD1,#3FA0F5)',
    emi: 644.0, aprMin: 19.51, aprMax: 26.00, tenureMin: 3, tenureMax: 30, successRate: 88,
    fee: { type: 'flat', value: 799 }, feeLabel: '₹799 +GST' },
  { id: 'fibe', name: 'Fibe', mark: 'Fi', bg: 'linear-gradient(135deg,#FF6A00,#FF9A3D)',
    powered: 'EarlySalary Services Private Limited (ESPL)',
    emi: 887.32, aprMin: 19.24, aprMax: 27.01, tenureMin: 3, tenureMax: 30, successRate: 95,
    fee: { type: 'pct', value: 1.25 }, feeLabel: '1.25% +GST',
    footnote: 'Processing fee is calculated on the loan amount' },
  { id: 'bimapay', name: 'Bimapay', mark: 'bp', bg: 'linear-gradient(135deg,#1565C0,#42A5F5)',
    emi: 639.44, aprMin: 18, aprMax: 27.3, tenureMin: 2, tenureMax: 30, successRate: 91,
    fee: { type: 'flat', value: 500 }, feeLabel: '₹500 +GST' },
  { id: 'axio', name: 'Axio', mark: 'Ax', bg: 'linear-gradient(135deg,#2E7D32,#66BB6A)',
    emi: 2475.36, aprMin: 25.0, aprMax: 32.74, tenureMin: 3, tenureMax: 12, successRate: 79,
    fee: { type: 'pct', value: 2.5 }, feeLabel: '2.0% - 3.0% +GST' },
];

let loanSelectedLender = null;
let loanSortKey = 'success';

function loanFeeRupees(l) {
  return l.fee.type === 'flat' ? l.fee.value : Math.round(EMI_AMOUNT * l.fee.value / 100);
}

function loanSuccessTier(pct) {
  return pct >= 90 ? 'tier-high' : pct >= 75 ? 'tier-mid' : 'tier-low';
}

function loanComputeBadges(list) {
  const emis = list.map(l => l.emi), aprs = list.map(l => l.aprMin), fees = list.map(loanFeeRupees);
  const minEmi = Math.min(...emis), minApr = Math.min(...aprs), minFee = Math.min(...fees);
  const maxSuccess = Math.max(...list.map(l => l.successRate));

  list.forEach(l => {
    l._badges = [];
    if (l.successRate === maxSuccess) l._badges.push({ label: 'Top Success Rate', cls: 'badge-best' });
    if (l.emi === minEmi) l._badges.push({ label: 'Lowest EMI', cls: 'badge-emi' });
    if (l.aprMin === minApr) l._badges.push({ label: 'Lowest Rate', cls: 'badge-rate' });
    if (loanFeeRupees(l) === minFee) l._badges.push({ label: 'Lowest Fees', cls: 'badge-fee' });
  });
}

const loanSortFns = {
  success: (a, b) => b.successRate - a.successRate,
  emi:     (a, b) => a.emi - b.emi,
  rate:    (a, b) => a.aprMin - b.aprMin,
  fees:    (a, b) => loanFeeRupees(a) - loanFeeRupees(b),
};

function loanSetSort(key, btn) {
  loanSortKey = key;
  document.querySelectorAll('.loan-sort-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loanPaintOffers(false);
}

function loanSkeletonHTML(n) {
  return Array.from({ length: n }).map((_, i) => `
    <div class="lender-skel" style="animation-delay:${(i * 0.06).toFixed(2)}s">
      <div class="skel-circle"></div>
      <div class="skel-lines"><div class="skel-line w60"></div><div class="skel-line w40"></div></div>
      <div class="skel-block"></div>
    </div>
  `).join('');
}

/* one lender's detail panel open at a time — keeps the list scannable
   instead of letting four expansions push everything off-screen again */
let loanOpenLenderId = null;

function loanCardHTML(l, idx) {
  const selCls = loanSelectedLender === l.id ? ' sel' : '';
  const rankCls = idx === 0 ? ' rank-first' : '';
  const isOpen = loanOpenLenderId === l.id;
  const midApr = (l.aprMin + l.aprMax) / 2;
  const defaultTenure = l.tenureMax >= 12 && l.tenureMin <= 12 ? 12 : l.tenureMin;
  const estEmi = calcEmi(EMI_AMOUNT, midApr, defaultTenure);
  const badges = (l._badges || []).map(b => `<span class="lender-badge ${b.cls}">${b.label}</span>`).join('');
  return `
    <div class="lender-card${selCls}${rankCls}" data-id="${l.id}">
      <div class="lender-accent" style="background:${l.bg}"></div>
      <div class="lender-body">
        <div class="lender-summary" onclick="loanSelectLender('${l.id}')">
          <div class="lender-mark" style="background:${l.bg}">${l.mark}</div>
          <div class="lender-name-wrap">
            <div class="lender-name">${l.name}</div>
            ${l.powered ? `<div class="lender-powered">Powered by ${l.powered}</div>` : ''}
            ${badges ? `<div class="lender-badges">${badges}</div>` : ''}
          </div>
          <div class="lender-row-success">
            <span class="lender-success-chip ${loanSuccessTier(l.successRate)}">${l.successRate}%</span>
            <span class="lender-row-success-label">Success</span>
          </div>
          <div class="lender-row-stat">
            <div class="lrs-label">EMI from</div>
            <div class="lrs-value">₹${Math.round(l.emi).toLocaleString('en-IN')}/mo</div>
          </div>
          <button type="button" class="lender-compare-btn${loanCompareSet.has(l.id) ? ' active' : ''}" data-id="${l.id}" onclick="loanToggleCompare('${l.id}', event)" aria-pressed="${loanCompareSet.has(l.id)}" title="Add to compare">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h18M16.5 3L21 7.5m0 0L16.5 12M21 7.5H3"/></svg>
          </button>
          <div class="lender-check">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
          </div>
          <button type="button" class="lender-row-toggle${isOpen ? ' open' : ''}" onclick="loanToggleLenderDetail('${l.id}', event)" aria-label="Toggle details">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="2.4" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
          </button>
        </div>
        <div class="lender-detail-body" id="lender-detail-${l.id}" style="max-height:${isOpen ? '999px' : '0px'}">
          <div class="lender-detail-inner">
            <div class="lender-detail-stats">
              <div><div class="lm-label">APR</div><div class="lm-value">${l.aprMin}% - ${l.aprMax}%</div></div>
              <div><div class="lm-label">Tenure</div><div class="lm-value">${l.tenureMin}-${l.tenureMax} mo</div></div>
              <div><div class="lm-label">Fees</div><div class="lm-value">${l.feeLabel}</div></div>
            </div>
            <div class="lender-slider-row" onclick="event.stopPropagation()">
              <div class="lender-slider-label">
                <span>Try ${defaultTenure} months</span>
                <span class="lender-slider-emi" id="slider-emi-${l.id}">≈ ${fmtINR0(estEmi)}/mo</span>
              </div>
              <input type="range" class="lender-slider" min="${l.tenureMin}" max="${l.tenureMax}" value="${defaultTenure}" oninput="loanUpdateSliderEmi('${l.id}', this)">
            </div>
            ${l.footnote ? `<div class="lender-footnote">${l.footnote}</div>` : ''}
            <div class="lender-links">
              <a href="#" onclick="event.stopPropagation();event.preventDefault()">Penal charges</a>
              <a href="#" onclick="event.stopPropagation();event.preventDefault()">View KFS</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function loanToggleLenderDetail(id, evt) {
  if (evt) evt.stopPropagation();
  loanOpenLenderId = loanOpenLenderId === id ? null : id;
  document.querySelectorAll('.lender-card').forEach(card => {
    const rid = card.dataset.id;
    const body = document.getElementById('lender-detail-' + rid);
    const toggle = card.querySelector('.lender-row-toggle');
    const open = rid === loanOpenLenderId;
    if (body) body.style.maxHeight = open ? body.scrollHeight + 'px' : '0px';
    if (toggle) toggle.classList.toggle('open', open);
  });
}

function loanUpdateSliderEmi(id, input) {
  const l = loanLenders.find(x => x.id === id);
  const months = Number(input.value);
  const midApr = (l.aprMin + l.aprMax) / 2;
  const emi = calcEmi(EMI_AMOUNT, midApr, months);
  const emiEl = document.getElementById('slider-emi-' + id);
  if (emiEl) emiEl.textContent = '≈ ' + fmtINR0(emi) + '/mo';
  const label = input.closest('.lender-slider-row').querySelector('.lender-slider-label span:first-child');
  if (label) label.textContent = `Try ${months} month${months > 1 ? 's' : ''}`;
  const body = input.closest('.lender-detail-body');
  if (body && body.style.maxHeight !== '0px') body.style.maxHeight = body.scrollHeight + 'px';
}

function loanSelectLender(id) {
  loanSelectedLender = id;
  document.querySelectorAll('.lender-card').forEach(c => c.classList.toggle('sel', c.dataset.id === id));
  document.getElementById('loan-offer-cta').disabled = false;
}

/* ── COMPARE TRAY ── */
const loanCompareSet = new Set();
const LOAN_COMPARE_MAX = 3;

function loanToggleCompare(id, evt) {
  if (evt) evt.stopPropagation();
  if (loanCompareSet.has(id)) {
    loanCompareSet.delete(id);
  } else {
    if (loanCompareSet.size >= LOAN_COMPARE_MAX) { loanFlashCompareLimit(); return; }
    loanCompareSet.add(id);
  }
  document.querySelectorAll('.lender-compare-btn').forEach(btn => {
    btn.classList.toggle('active', loanCompareSet.has(btn.dataset.id));
    btn.setAttribute('aria-pressed', loanCompareSet.has(btn.dataset.id));
  });
  loanRenderCompareBar();
}

function loanFlashCompareLimit() {
  const bar = document.getElementById('loan-compare-bar');
  if (!bar) return;
  bar.style.display = 'flex';
  bar.classList.remove('limit-shake');
  void bar.offsetWidth;
  bar.classList.add('limit-shake');
}

function loanRenderCompareBar() {
  const bar = document.getElementById('loan-compare-bar');
  const chips = document.getElementById('loan-compare-chips');
  const cta = document.getElementById('loan-compare-cta');
  const count = document.getElementById('loan-compare-count');
  if (loanCompareSet.size === 0) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  const items = [...loanCompareSet].map(id => loanLenders.find(l => l.id === id)).filter(Boolean);
  chips.innerHTML = items.map(l => `
    <span class="loan-compare-chip">
      <span class="ccm" style="background:${l.bg}">${l.mark}</span>
      ${l.name}
      <button type="button" onclick="loanToggleCompare('${l.id}', event)" aria-label="Remove ${l.name} from compare">
        <svg fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </span>
  `).join('');
  cta.disabled = items.length < 2;
  count.textContent = `(${items.length}/${LOAN_COMPARE_MAX})`;
}

function loanClearCompare() {
  loanCompareSet.clear();
  document.querySelectorAll('.lender-compare-btn').forEach(btn => btn.classList.remove('active'));
  loanRenderCompareBar();
}

function loanOpenCompare() {
  const items = [...loanCompareSet].map(id => loanLenders.find(l => l.id === id)).filter(Boolean);
  if (items.length < 2) return;
  const table = document.getElementById('compare-table');
  table.style.setProperty('--cols', items.length);
  table.innerHTML = loanCompareTableHTML(items);
  document.getElementById('lender-list').style.display = 'none';
  document.querySelector('.loan-sort-row').style.display = 'none';
  document.getElementById('loan-compare-bar').style.display = 'none';
  document.getElementById('loan-compare-view').style.display = 'block';
}

function loanCloseCompare() {
  document.getElementById('loan-compare-view').style.display = 'none';
  document.getElementById('lender-list').style.display = '';
  document.querySelector('.loan-sort-row').style.display = '';
  loanRenderCompareBar();
}

function loanCompareTableHTML(items) {
  const row = (label, cellFn) => `
    <div class="compare-row">
      <div class="compare-label-cell">${label}</div>
      ${items.map(cellFn).join('')}
    </div>
  `;
  return `
    <div class="compare-row">
      <div class="compare-label-cell"></div>
      ${items.map(l => `
        <div class="compare-cell compare-head-cell">
          <button type="button" class="compare-remove" onclick="loanToggleCompare('${l.id}', event); loanOpenCompare();" aria-label="Remove ${l.name}">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <div class="compare-head-mark" style="background:${l.bg}">${l.mark}</div>
          <div class="compare-head-name">${l.name}</div>
        </div>
      `).join('')}
    </div>
    ${row('Success Rate', l => `<div class="compare-cell"><span class="lender-success-chip ${loanSuccessTier(l.successRate)}">${l.successRate}%</span></div>`)}
    ${row('EMI From', l => `<div class="compare-cell">₹${Math.round(l.emi).toLocaleString('en-IN')}/mo</div>`)}
    ${row('APR', l => `<div class="compare-cell">${l.aprMin}% - ${l.aprMax}%</div>`)}
    ${row('Tenure', l => `<div class="compare-cell">${l.tenureMin}-${l.tenureMax} mo</div>`)}
    ${row('Fees', l => `<div class="compare-cell">${l.feeLabel}</div>`)}
    ${row('Highlights', l => `<div class="compare-cell compare-badges-cell">${(l._badges || []).map(b => `<span class="lender-badge ${b.cls}">${b.label}</span>`).join('') || '—'}</div>`)}
    <div class="compare-row compare-select-row">
      <div class="compare-label-cell"></div>
      ${items.map(l => `<div class="compare-cell"><button type="button" class="compare-select-btn" onclick="loanSelectFromCompare('${l.id}')">Select</button></div>`).join('')}
    </div>
  `;
}

function loanSelectFromCompare(id) {
  loanCloseCompare();
  loanSelectLender(id);
  const row = document.querySelector(`.lender-card[data-id="${id}"]`);
  if (row) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function loanPaintOffers(firstReveal) {
  const list = document.getElementById('lender-list');
  const sorted = [...loanLenders].sort(loanSortFns[loanSortKey]);

  if (firstReveal) {
    list.innerHTML = sorted.map((l, i) => loanCardHTML(l, i)).join('');
    return;
  }

  /* FLIP: capture current positions, re-render in new order, then
     animate each card from its old spot to its new one */
  const before = new Map([...list.querySelectorAll('.lender-card')].map(c => [c.dataset.id, c.getBoundingClientRect()]));
  list.innerHTML = sorted.map((l, i) => loanCardHTML(l, i)).join('');
  list.querySelectorAll('.lender-card').forEach(c => {
    const first = before.get(c.dataset.id);
    if (!first) return;
    const last = c.getBoundingClientRect();
    const dx = first.left - last.left, dy = first.top - last.top;
    if (dx || dy) {
      c.style.transition = 'none';
      c.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(() => {
        c.style.transition = 'transform .45s cubic-bezier(.2,.8,.2,1)';
        c.style.transform = '';
      });
    }
  });
}

function loanRenderOffers() {
  const list = document.getElementById('lender-list');
  if (list.dataset.loaded) return;
  list.innerHTML = loanSkeletonHTML(4);
  setTimeout(() => {
    list.dataset.loaded = '1';
    loanComputeBadges(loanLenders);
    loanPaintOffers(true);
  }, 650);
}

/* ── POST-SELECTION FLOW: one live calculator, then one confirmation ──
   All numbers fall out of the same calcEmi() used everywhere else in
   the app. Tenure, downpayment, breakdown and schedule all live on a
   single screen and update on every input — nothing is a separate
   page to click through, and nothing is a hardcoded screenshot prop. */
function loanShowOffersView(view) {
  document.querySelectorAll('.loan-offers-view').forEach(v => v.classList.remove('active'));
  document.getElementById('loan-offers-view-' + view).classList.add('active');
  const panel = document.getElementById('panel-bnpl');
  if (panel) panel.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

/* real lenders publish a small fixed set of downpayment/installment
   plans per tenure — not a continuous range — so the picker is a
   preset list, not a slider */
const LOAN_TIER_PCTS = [15, 22, 30];
const loanPlanState = { lenderId: null, tenure: null, tenureOptions: [], tierIndex: 0, downpaymentPct: 15, computed: null };
const loanAccordionOpen = { breakdown: false, schedule: false };

function loanStartPlan() {
  if (!loanSelectedLender) return;
  const l = loanLenders.find(x => x.id === loanSelectedLender);
  loanPlanState.lenderId = l.id;
  const candidates = [3, 6, 9, 12, 18, 24].filter(m => m >= l.tenureMin && m <= l.tenureMax);
  loanPlanState.tenureOptions = candidates.length ? candidates.slice(0, 4) : [l.tenureMin];
  loanPlanState.tenure = loanPlanState.tenureOptions[Math.min(1, loanPlanState.tenureOptions.length - 1)];
  loanPlanState.tierIndex = 0;
  loanRenderCalculator();
  loanShowOffersView('calculator');
}

function loanRenderCalculator() {
  const l = loanLenders.find(x => x.id === loanPlanState.lenderId);
  document.getElementById('loan-calc-lender').innerHTML = `
    <div class="lender-mark" style="background:${l.bg}">${l.mark}</div>
    <div><div class="loan-plan-lender-name">${l.name}</div><div class="loan-plan-lender-sub">Choose your EMI plan</div></div>
  `;
  document.getElementById('loan-calc-tenure-tabs').innerHTML = loanPlanState.tenureOptions.map(m => `
    <button type="button" class="loan-sort-btn${m === loanPlanState.tenure ? ' active' : ''}" onclick="loanSetCalcTenure(${m},this)">${m} Months</button>
  `).join('');
  loanRenderTiers();
}

function loanSetCalcTenure(months, btn) {
  loanPlanState.tenure = months;
  loanPlanState.tierIndex = 0;
  btn.parentElement.querySelectorAll('.loan-sort-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loanRenderTiers();
}

function loanRenderTiers() {
  const l = loanLenders.find(x => x.id === loanPlanState.lenderId);
  const midApr = (l.aprMin + l.aprMax) / 2;
  const months = loanPlanState.tenure;
  const tiers = LOAN_TIER_PCTS.map(pct => {
    const downpayment = Math.round(EMI_AMOUNT * pct / 100);
    const emi = calcEmi(EMI_AMOUNT - downpayment, midApr, months);
    return { pct, downpayment, emi };
  });
  document.getElementById('loan-calc-tiers').innerHTML = tiers.map((t, i) => `
    <label class="emi-plan-row${i === loanPlanState.tierIndex ? ' sel' : ''}" onclick="loanSelectTier(${i})">
      <input type="radio" name="loan-tier" class="emi-plan-radio" ${i === loanPlanState.tierIndex ? 'checked' : ''}>
      <span class="emi-plan-dot"></span>
      <span class="emi-plan-info">
        <span class="emi-plan-main">${fmtINR0(t.emi)}/mo <span class="emi-plan-x">×</span> ${months} months</span>
        <span class="emi-plan-sub">Downpayment ${fmtINR0(t.downpayment)} now</span>
      </span>
    </label>
  `).join('');
  loanCalcApply(loanPlanState.tierIndex);
}

function loanSelectTier(idx) {
  loanPlanState.tierIndex = idx;
  document.querySelectorAll('#loan-calc-tiers .emi-plan-row').forEach((row, i) => {
    row.classList.toggle('sel', i === idx);
    row.querySelector('.emi-plan-radio').checked = i === idx;
  });
  loanCalcApply(idx);
}

function loanCalcApply(tierIndex) {
  loanPlanState.downpaymentPct = LOAN_TIER_PCTS[tierIndex];
  const l = loanLenders.find(x => x.id === loanPlanState.lenderId);
  const midApr = (l.aprMin + l.aprMax) / 2;
  const downpayment = Math.round(EMI_AMOUNT * loanPlanState.downpaymentPct / 100);
  const loanAmt = EMI_AMOUNT - downpayment;
  const months = loanPlanState.tenure;
  const emi = calcEmi(loanAmt, midApr, months);
  const totalRepay = emi * months;
  const interest = totalRepay - loanAmt;
  const fee = loanFeeRupees(l);
  const effectiveRepay = totalRepay + fee;
  loanPlanState.computed = { downpayment, loanAmt, months, emi, interest, fee, effectiveRepay, midApr };

  document.getElementById('loan-split-down').style.width = loanPlanState.downpaymentPct + '%';
  document.getElementById('loan-split-fin').style.width = (100 - loanPlanState.downpaymentPct) + '%';
  document.getElementById('loan-calc-dp').textContent = fmtINR0(downpayment);
  document.getElementById('loan-calc-loanamt').textContent = fmtINR0(loanAmt);
  document.getElementById('loan-calc-emi').textContent = fmtINR0(emi) + '/mo';

  document.getElementById('loan-calc-breakdown').innerHTML = [
    ['Product Value', fmtINR0(EMI_AMOUNT), false],
    ['Downpayment', '-' + fmtINR0(downpayment), false],
    ['Loan Amount', fmtINR0(loanAmt), true],
    ['Processing Fee', fmtINR0(fee), false],
    ['Interest', fmtINR0(interest), false],
    ['Effective Repayment Amount', fmtINR0(effectiveRepay), true],
  ].map(([label, val, strong]) => `<div class="loan-breakdown-row${strong ? ' strong' : ''}"><span>${label}</span><span>${val}</span></div>`).join('');

  const today = new Date();
  const rows = [];
  for (let i = 1; i <= months; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, Math.min(today.getDate(), 28));
    rows.push(`<div class="loan-schedule-row"><span>${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</span><span>${fmtINR0(emi)}</span></div>`);
  }
  document.getElementById('loan-calc-schedule-rows').innerHTML = rows.join('');

  ['breakdown', 'schedule'].forEach(key => {
    if (loanAccordionOpen[key]) {
      const body = document.getElementById('loan-' + key + '-body');
      body.style.maxHeight = body.scrollHeight + 'px';
    }
  });
}

function loanToggleAccordion(key) {
  const acc = document.getElementById('loan-' + key + '-accordion');
  const body = document.getElementById('loan-' + key + '-body');
  loanAccordionOpen[key] = !loanAccordionOpen[key];
  acc.classList.toggle('open', loanAccordionOpen[key]);
  body.style.maxHeight = loanAccordionOpen[key] ? body.scrollHeight + 'px' : '0px';
}

function loanConfirmPlan() {
  const l = loanLenders.find(x => x.id === loanPlanState.lenderId);
  const { emi, months } = loanPlanState.computed;
  document.getElementById('loan-confirm-recap').textContent = `${fmtINR0(emi)}/mo × ${months} months with ${l.name}`;
  document.getElementById('loan-confirm-lender-name').textContent = l.name;
  const cta = document.getElementById('loan-confirm-cta');
  cta.disabled = false;
  cta.innerHTML = `Continue to <span>${l.name}</span>`;
  loanShowOffersView('confirmed');
}

function loanContinueToLender(btn) {
  btn.disabled = true;
  btn.innerHTML = '<span class="loan-spinner"></span> Redirecting…';
  setTimeout(() => {
    populateSuccessScreen();
    showResultScreen('success');
  }, 1300);
}

/* ── WALLETS ──
   Linked wallets pay instantly off a stored balance; everything else
   is a redirect and carries a real, itemised convenience fee — not a
   flat balance grid with no way to see what you're actually paying. */
const walletsLinked = [
  { id: 'paytm',     name: 'Paytm Wallet',     mark: 'Pt', bg: 'linear-gradient(135deg,#0060CC,#00ADEF)', balance: 1250 },
  { id: 'phonepe',   name: 'PhonePe Wallet',   mark: 'PP', bg: 'linear-gradient(135deg,#5A2FC2,#8B5CF6)', balance: 500 },
  { id: 'gpay',      name: 'Google Pay',       mark: 'G',  bg: 'linear-gradient(135deg,#1A73E8,#4285F4)', balance: 750 },
  { id: 'amazonpay', name: 'Amazon Pay Balance', mark: 'Az', bg: 'linear-gradient(135deg,#CC7700,#FF9900)', balance: 250 },
];
const walletsOther = [
  { id: 'airtel',     name: 'Airtel Payments Bank Wallet', mark: 'Air', bg: 'linear-gradient(135deg,#E4002B,#FF3355)', feeBase: 450, feeGstPct: 18 },
  { id: 'mobikwik',   name: 'Mobikwik Wallet',             mark: 'MBK', bg: 'linear-gradient(135deg,#1565C0,#42A5F5)', feeBase: 450, feeGstPct: 18 },
  { id: 'freecharge', name: 'Freecharge',                  mark: 'FC',  bg: 'linear-gradient(135deg,#D32F2F,#EF5350)', feeBase: 450, feeGstPct: 18 },
  { id: 'jiomoney',   name: 'JioMoney',                    mark: 'Jio', bg: 'linear-gradient(135deg,#1565C0,#1976D2)', feeBase: 380, feeGstPct: 18 },
];
let walletSelected = null;

function walletFee(w) {
  return Math.round(w.feeBase * (1 + w.feeGstPct / 100));
}

function walletRenderAll() {
  document.getElementById('wallet-linked-list').innerHTML = walletsLinked.map(w => {
    const sufficient = w.balance >= EMI_AMOUNT;
    return `
      <div class="wallet-card ${sufficient ? '' : 'wallet-disabled'}" data-id="${w.id}">
        <label class="emi-plan-row" ${sufficient ? `onclick="walletSelect('${w.id}')"` : ''}>
          <input type="radio" name="wallet-select" class="emi-plan-radio" ${sufficient ? '' : 'disabled'}>
          <span class="emi-plan-dot"></span>
          <span class="emi-bank-icon" style="background:${w.bg}">${w.mark}</span>
          <span class="emi-plan-info">
            <span class="emi-plan-main">${w.name}</span>
            <span class="emi-plan-sub">${sufficient ? `Balance ${fmtINR0(w.balance)}` : `Balance ${fmtINR0(w.balance)} — add ${fmtINR0(EMI_AMOUNT - w.balance)} more to pay with this wallet`}</span>
          </span>
          <span class="wallet-tag ${sufficient ? 'tag-ok' : 'tag-warn'}">${sufficient ? 'Sufficient' : 'Low balance'}</span>
        </label>
      </div>
    `;
  }).join('');

  document.getElementById('wallet-other-list').innerHTML = walletsOther.map(w => {
    const fee = walletFee(w);
    return `
      <div class="wallet-card" data-id="${w.id}">
        <label class="emi-plan-row" onclick="walletSelect('${w.id}')">
          <input type="radio" name="wallet-select" class="emi-plan-radio">
          <span class="emi-plan-dot"></span>
          <span class="emi-bank-icon" style="background:${w.bg}">${w.mark}</span>
          <span class="emi-plan-info">
            <span class="emi-plan-main">${w.name}</span>
            <span class="emi-plan-sub">Non-refundable fee up to ${fmtINR0(fee)} (incl. tax) will be charged</span>
          </span>
          <button type="button" class="lender-row-toggle" onclick="walletToggleFee('${w.id}', event)" aria-label="Fee breakup">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="2.4" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
          </button>
        </label>
        <div class="emi-accordion-body" id="wallet-fee-${w.id}">
          <div class="loan-accordion-inner">
            <div class="loan-breakdown-row"><span>Base convenience fee</span><span>${fmtINR0(w.feeBase)}</span></div>
            <div class="loan-breakdown-row"><span>GST (${w.feeGstPct}%)</span><span>${fmtINR0(fee - w.feeBase)}</span></div>
            <div class="loan-breakdown-row strong"><span>Total (non-refundable)</span><span>${fmtINR0(fee)}</span></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function walletSelect(id) {
  walletSelected = id;
  document.querySelectorAll('#panel-wallets .wallet-card').forEach(c => {
    const isSel = c.dataset.id === id;
    c.classList.toggle('sel', isSel);
    const radio = c.querySelector('input[name="wallet-select"]');
    if (radio) radio.checked = isSel;
  });
  const w = [...walletsLinked, ...walletsOther].find(x => x.id === id);
  const cta = document.getElementById('wallet-cta');
  cta.disabled = false;
  cta.innerHTML = `<svg fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor" style="width:17px;height:17px"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg> Pay ${fmtINR0(EMI_AMOUNT)} via ${w.name}`;
}

function walletToggleFee(id, evt) {
  evt.stopPropagation();
  const body = document.getElementById('wallet-fee-' + id);
  const btn = evt.currentTarget;
  const isOpen = body.style.maxHeight && body.style.maxHeight !== '0px';
  body.style.maxHeight = isOpen ? '0px' : body.scrollHeight + 'px';
  btn.classList.toggle('open', !isOpen);
}

/* linked wallets pay straight off their balance; redirect-based wallets
   always get a final "here's the exact total, including fees" review
   before anything is charged */
function walletProceed() {
  if (!walletSelected) return;
  const w = [...walletsLinked, ...walletsOther].find(x => x.id === walletSelected);
  if (w.feeBase) {
    walletOpenFeeReview(w);
  } else {
    const cta = document.getElementById('wallet-cta');
    const original = cta.innerHTML;
    cta.disabled = true;
    cta.innerHTML = '<span class="loan-spinner"></span> Processing…';
    setTimeout(() => {
      cta.disabled = false;
      cta.innerHTML = original;
      populateSuccessScreen();
      showResultScreen('success');
    }, 1300);
  }
}

function walletOpenFeeReview(w) {
  const tax = Math.round(w.feeBase * w.feeGstPct / 100);
  const total = EMI_AMOUNT + w.feeBase + tax;
  document.getElementById('wallet-review-rows').innerHTML = `
    <div class="confirm-modal-row"><span>Premium</span><span>${fmtINR0(EMI_AMOUNT)}</span></div>
    <div class="confirm-modal-row"><span>Convenience Fee</span><span>${fmtINR0(w.feeBase)}</span></div>
    <div class="confirm-modal-row"><span>Tax on Convenience Fee</span><span>${fmtINR0(tax)}</span></div>
    <div class="confirm-modal-row total"><span>Total Amount</span><span>${fmtINR0(total)}</span></div>
  `;
  const cta = document.getElementById('wallet-review-cta');
  cta.disabled = false;
  cta.innerHTML = 'Confirm';
  document.getElementById('wallet-review-overlay').classList.add('open');
}

function walletCloseFeeReview() {
  document.getElementById('wallet-review-overlay').classList.remove('open');
}

function walletConfirmFeeReview(btn) {
  btn.disabled = true;
  btn.innerHTML = '<span class="loan-spinner"></span> Redirecting…';
  setTimeout(() => {
    walletCloseFeeReview();
    populateSuccessScreen();
    showResultScreen('success');
  }, 1300);
}

walletRenderAll();

/* ── PAYMENT RESULT SCREENS ──
   Success reads as "your cover is active" (policy number, sum insured,
   coverage dates) rather than a bare receipt; failure reassures first
   ("nothing was charged, your quote is safe") before offering a retry.
   Sandbox convention for testing, same idea as Stripe's decline test
   cards: enter CVV 000 on the Cards panel to preview the failure state,
   any other CVV succeeds. */
function showResultScreen(type) {
  document.getElementById('screen-success').classList.remove('open');
  document.getElementById('screen-failure').classList.remove('open');
  document.getElementById('screen-' + type).classList.add('open');
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.body.style.overflow = 'hidden';
}

function hideResultScreens() {
  document.getElementById('screen-success').classList.remove('open');
  document.getElementById('screen-failure').classList.remove('open');
  document.body.style.overflow = '';
}

function fmtResultDate(d) {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function populateSuccessScreen() {
  const orderId = (document.getElementById('order-id-value') || {}).textContent || 'STR-INS-2024-88471';
  const digits = orderId.replace(/\D/g, '').slice(-6) || '000000';
  const today = new Date();
  /* "APP" — an application reference, deliberately not styled like a
     policy number, since no policy exists until underwriting clears it */
  document.getElementById('res-policy-no').textContent = `STR/APP/2026/${digits}`;
  document.getElementById('res-amount').textContent = fmtINR0(EMI_AMOUNT);
  document.getElementById('res-period').textContent = fmtResultDate(today);

  const mobileEl = document.getElementById('order-mobile-value');
  document.getElementById('res-phone').textContent = mobileEl ? mobileEl.textContent : '+91 98765 43210';

  const emailInput = document.getElementById('loan-email');
  const email = (emailInput && emailInput.value.trim()) || 'rohit.sharma@gmail.com';
  document.getElementById('res-email').textContent = email;

  const nextDay = new Date(today);
  nextDay.setDate(nextDay.getDate() + 1);
  const noteEl = document.getElementById('res-followup-note');
  if (noteEl) {
    noteEl.textContent = `Your money has reached us safely. Your convenience fee receipt will land in ${email} on ${fmtResultDate(nextDay)}.`;
  }
}

function populateFailureScreen(reason) {
  const orderId = (document.getElementById('order-id-value') || {}).textContent || 'STR-INS-2024-88471';
  document.getElementById('res-fail-ref').textContent = orderId;
  document.getElementById('res-fail-amount').textContent = fmtINR0(EMI_AMOUNT);
  if (reason) document.getElementById('res-fail-reason').textContent = reason;
}

function downloadPaymentReceipt() {
  const ref = document.getElementById('res-policy-no').textContent;
  const amount = document.getElementById('res-amount').textContent;
  const date = document.getElementById('res-period').textContent;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${ref}</title>
    <style>
      @page { margin: 22mm 18mm; }
      body { font-family: Arial, Helvetica, sans-serif; color: #0E1526; margin: 0; padding: 36px; }
      .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 26px; }
      .brand-mark { width: 32px; height: 32px; border-radius: 8px; background: #173172; display: flex; align-items: center; justify-content: center; }
      .brand-mark svg { width: 18px; height: 18px; }
      .brand-name { font-size: 14px; font-weight: 800; color: #173172; letter-spacing: .6px; }
      .badge { display: inline-block; background: #D1FAE5; color: #065F46; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-bottom: 18px; }
      h1 { color: #173172; font-size: 19px; margin: 0 0 6px; }
      .sub { color: #8592A8; font-size: 12px; margin: 0 0 22px; }
      table { width: 100%; border-collapse: collapse; max-width: 500px; }
      td { padding: 11px 0; border-bottom: 1px solid #E4E8F1; font-size: 13px; }
      td.label { color: #8592A8; }
      td.value { font-weight: 700; text-align: right; }
      .note { margin-top: 26px; color: #8592A8; font-size: 11.5px; max-width: 500px; line-height: 1.6; border-top: 1px solid #E4E8F1; padding-top: 16px; }
    </style></head><body>
    <div class="brand">
      <div class="brand-mark"><svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M18.6 6.62c-1.44 0-2.8.56-3.77 1.53L12 10.66l-1.52 1.34.01-.01L7.8 14.39c-.64.64-1.49.99-2.4.99-1.87 0-3.39-1.51-3.39-3.38S3.53 8.62 5.4 8.62c.91 0 1.76.35 2.44 1.03l1.13 1 1.51-1.34-1.26-1.11C8.2 7.18 6.84 6.62 5.4 6.62 2.42 6.62 0 9.04 0 12s2.42 5.38 5.4 5.38c1.44 0 2.8-.56 3.77-1.53l2.83-2.51.01.01L13.52 12h-.01l2.69-2.39c.64-.64 1.49-.99 2.4-.99 1.87 0 3.39 1.51 3.39 3.38s-1.52 3.38-3.39 3.38c-.9 0-1.76-.35-2.44-1.03l-1.14-1.01-1.51 1.34 1.27 1.12c1.03 1.01 2.39 1.57 3.83 1.57 2.98 0 5.4-2.41 5.4-5.38s-2.42-5.37-5.4-5.37z"/></svg></div>
    </div>
    <div class="badge">Payment Received</div>
    <h1>Payment Receipt</h1>
    <p class="sub">This receipt confirms payment only — it is not a policy certificate.</p>
    <table>
      <tr><td class="label">Application Reference</td><td class="value">${ref}</td></tr>
      <tr><td class="label">Plan Applied For</td><td class="value">Family Floater Plan</td></tr>
      <tr><td class="label">Sum Insured (Proposed)</td><td class="value">₹10,00,000</td></tr>
      <tr><td class="label">Amount Paid</td><td class="value">${amount}</td></tr>
      <tr><td class="label">Payment Date</td><td class="value">${date}</td></tr>
    </table>
    <p class="note">Your application is now under receipting and underwriting review. It does not confirm policy issuance or coverage. A policy certificate will be issued separately once underwriting is complete. This is a system-generated document for demo purposes.</p>
    </body></html>`;

  /* print via a hidden iframe rather than window.open — works without
     needing pop-up permission, and the browser's own print dialog is
     what lets the user choose "Save as PDF" */
  let frame = document.getElementById('receipt-print-frame');
  if (!frame) {
    frame = document.createElement('iframe');
    frame.id = 'receipt-print-frame';
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
    document.body.appendChild(frame);
  }
  const doc = frame.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
  }, 300);
}

function downloadFailureReceipt() {
  const ref = document.getElementById('res-fail-ref').textContent;
  const amount = document.getElementById('res-fail-amount').textContent;
  const reason = document.getElementById('res-fail-reason').textContent;
  const date = fmtResultDate(new Date());
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${ref}</title>
    <style>
      @page { margin: 22mm 18mm; }
      body { font-family: Arial, Helvetica, sans-serif; color: #0E1526; margin: 0; padding: 36px; }
      .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 26px; }
      .brand-mark { width: 32px; height: 32px; border-radius: 8px; background: #173172; display: flex; align-items: center; justify-content: center; }
      .brand-mark svg { width: 18px; height: 18px; }
      .brand-name { font-size: 14px; font-weight: 800; color: #173172; letter-spacing: .6px; }
      .badge { display: inline-block; background: #FEF3C7; color: #92400E; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-bottom: 18px; }
      h1 { color: #173172; font-size: 19px; margin: 0 0 6px; }
      .sub { color: #8592A8; font-size: 12px; margin: 0 0 22px; }
      table { width: 100%; border-collapse: collapse; max-width: 500px; }
      td { padding: 11px 0; border-bottom: 1px solid #E4E8F1; font-size: 13px; }
      td.label { color: #8592A8; }
      td.value { font-weight: 700; text-align: right; }
      .note { margin-top: 26px; color: #8592A8; font-size: 11.5px; max-width: 500px; line-height: 1.6; border-top: 1px solid #E4E8F1; padding-top: 16px; }
    </style></head><body>
    <div class="brand">
      <div class="brand-mark"><svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M18.6 6.62c-1.44 0-2.8.56-3.77 1.53L12 10.66l-1.52 1.34.01-.01L7.8 14.39c-.64.64-1.49.99-2.4.99-1.87 0-3.39-1.51-3.39-3.38S3.53 8.62 5.4 8.62c.91 0 1.76.35 2.44 1.03l1.13 1 1.51-1.34-1.26-1.11C8.2 7.18 6.84 6.62 5.4 6.62 2.42 6.62 0 9.04 0 12s2.42 5.38 5.4 5.38c1.44 0 2.8-.56 3.77-1.53l2.83-2.51.01.01L13.52 12h-.01l2.69-2.39c.64-.64 1.49-.99 2.4-.99 1.87 0 3.39 1.51 3.39 3.38s-1.52 3.38-3.39 3.38c-.9 0-1.76-.35-2.44-1.03l-1.14-1.01-1.51 1.34 1.27 1.12c1.03 1.01 2.39 1.57 3.83 1.57 2.98 0 5.4-2.41 5.4-5.38s-2.42-5.37-5.4-5.37z"/></svg></div>
    </div>
    <div class="badge">Payment Attempt Failed</div>
    <h1>Payment Attempt Receipt</h1>
    <p class="sub">Attach this with your email to support@example.com if the debited amount isn't auto-refunded within 7 working days.</p>
    <table>
      <tr><td class="label">Reference ID</td><td class="value">${ref}</td></tr>
      <tr><td class="label">Attempted Amount</td><td class="value">${amount}</td></tr>
      <tr><td class="label">Reason</td><td class="value">${reason}</td></tr>
      <tr><td class="label">Attempt Date</td><td class="value">${date}</td></tr>
    </table>
    <p class="note">This receipt confirms a failed payment attempt only. No policy or coverage is associated with this transaction. This is a system-generated document for demo purposes.</p>
    </body></html>`;

  let frame = document.getElementById('receipt-print-frame');
  if (!frame) {
    frame = document.createElement('iframe');
    frame.id = 'receipt-print-frame';
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
    document.body.appendChild(frame);
  }
  const doc = frame.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
  }, 300);
}

function handleCardsPay(btn) {
  const cvvInput = document.querySelector('#panel-cards input[type="password"]');
  const cvv = cvvInput ? cvvInput.value : '';
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="loan-spinner"></span> Processing…';
  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = original;
    if (cvv === '000') {
      populateFailureScreen('Card declined by issuing bank');
      showResultScreen('failure');
    } else {
      populateSuccessScreen();
      showResultScreen('success');
    }
  }, 1300);
}
