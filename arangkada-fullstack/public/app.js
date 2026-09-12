/* ==========================================================================
   SPLASH SCREEN CONTROLLER (v2 — Smooth High-Tech Telemetry Sync)
   ========================================================================== */
(function initSplash() {
  const splash   = document.getElementById('splash-screen');
  const bar      = document.getElementById('splashBar');
  const statusEl = document.getElementById('splashStatusText');
  const pctEl    = document.getElementById('splashPercent');
  if (!splash) return;

  const stages = [
    { pct: 28,  msg: 'Initializing Neural Core…',           delay: 0   },
    { pct: 64,  msg: 'Connecting GPS Telemetry…',          delay: 240 },
    { pct: 88,  msg: 'Synchronizing Transit Queues…',      delay: 500 },
    { pct: 100, msg: 'Terminal Command Matrix Ready.',     delay: 780 },
  ];

  stages.forEach(({ pct, msg, delay }) => {
    setTimeout(() => {
      if (bar)      bar.style.width = pct + '%';
      if (statusEl) statusEl.textContent = msg;
      if (pctEl)    pctEl.textContent = pct + '%';
    }, delay);
  });

  // Smooth exit transition once complete
  setTimeout(() => {
    splash.classList.add('splash-exit');
    splash.addEventListener('transitionend', () => splash.remove(), { once: true });
  }, 1120);
})();

/* ==========================================================================
   APP BOOTSTRAP
   ========================================================================== */
const app = document.getElementById('app');
const toastRoot = document.getElementById('toast-root');
const modalRoot = document.getElementById('modal-root');

let authToken = sessionStorage.getItem('arangkadaToken') || '';
let currentUser = JSON.parse(sessionStorage.getItem('arangkadaUser') || 'null') || {
  name: 'Maria Santos',
  role: 'dispatcher',
  terminal: 'San Fabian Terminal',
  staffId: 'D-SP-001'
};

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'Request failed.');
    error.status = response.status;
    throw error;
  }
  return data;
}

async function loadServerState() {
  if (!authToken) return;
  try {
    const data = await api('/api/state');
    state.requests = data.requests || [];
    state.queue = data.queue || [];
    state.vehicles = data.vehicles || [];
    state.settings = data.settings || state.settings;
  } catch (err) {
    if (err.status === 401) {
      authToken = '';
      currentUser = null;
      state.loggedIn = false;
      sessionStorage.removeItem('arangkadaToken');
      sessionStorage.removeItem('arangkadaLoggedIn');
      sessionStorage.removeItem('arangkadaUser');
      state.route = 'login';
    } else {
      showToast('Backend connection notice', err.message);
    }
  }
}

const icons = {
  dashboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect></svg>`,
  terminal: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h16"></path><circle cx="2" cy="6" r="1"></circle><circle cx="2" cy="12" r="1"></circle><circle cx="2" cy="18" r="1"></circle></svg>`,
  map: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>`,
  duty: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
  reports: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  advisories: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  history: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`,
  drivers: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
  logout: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
  jeep: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="22" height="13" rx="2"></rect><path d="M5 16v3"></path><path d="M19 16v3"></path><circle cx="6.5" cy="11.5" r="1.5"></circle><circle cx="17.5" cy="11.5" r="1.5"></circle></svg>`,
  bell: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`,
  message: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
  download: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
  sparkles: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  brand: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16l-4-4 4-4"></path><path d="M17 8l4 4-4 4"></path><line x1="3" y1="12" x2="21" y2="12"></line></svg>`
};

const initialHash = location.hash.replace('#/','').replace('#','');
const initialState = {
  loggedIn: Boolean(authToken),
  route: (initialHash === 'signup' || initialHash === 'register') 
    ? 'signup' 
    : ((initialHash === 'forgot' || initialHash === 'forgot-password' || initialHash === 'reset-password') 
      ? 'forgot-password' 
      : (authToken ? (initialHash || 'dashboard') : 'login')),
  recoveryStep: 1,
  recoveryEmail: '',
  recoveryMaskedEmail: '',
  recoveryName: '',
  recoveryCodePreview: '',
  selectedDriver: 'J-014',
  routeView:'my',
  statusFilter:'all',
  requests:[
    {id:'J-014',plate:'NAB 2147',name:'Juan Dela Cruz',time:'8:40 AM'},
    {id:'J-031',plate:'NCA 3301',name:'Mario Reyes',time:'8:35 AM'},
    {id:'J-045',plate:'NBD 8821',name:'Pedro Garcia',time:'8:42 AM'}
  ],
  queue:[
    {pos:1,id:'J-008',plate:'NAB 1908',name:'Ramon Cruz',status:'Ready',clear:'CLEARED'},
    {pos:2,id:'J-014',plate:'NAB 2147',name:'Juan Dela Cruz',status:'Waiting',clear:'Clear for Departure'},
    {pos:3,id:'J-027',plate:'NDC 5821',name:'Mark Reyes',status:'Waiting',clear:'In line'},
    {pos:4,id:'J-031',plate:'NCA 3301',name:'Mario Reyes',status:'Waiting',clear:'In line'},
    {pos:5,id:'J-045',plate:'NBD 8821',name:'Pedro Garcia',status:'Waiting',clear:'In line'}
  ],
  vehicles:[
    {id:'J-008',name:'Ramon Cruz',plate:'NAB 1908',status:'On the Way',speed:'60 km/h',color:'green',top:'44%',left:'27%'},
    {id:'J-014',name:'Juan Dela Cruz',plate:'NAB 2147',status:'On the Way',speed:'45 km/h',color:'orange',top:'50%',left:'45%'},
    {id:'J-027',name:'Mark Reyes',plate:'NDC 5821',status:'Delayed',speed:'Stopped',color:'red',top:'58%',left:'63%'},
    {id:'J-019',name:'Miguel Santos',plate:'NAB 3219',status:'On the Way',speed:'55 km/h',color:'orange',top:'38%',left:'55%'}
  ],
  driverStatus:'On the Way'
};
const state = initialState;

function navigate(route){
  state.route = route;
  location.hash = '#/' + route;
  render();
  window.scrollTo(0,0);
}

window.addEventListener('hashchange',()=>{
  const r = location.hash.replace('#/','').replace('#','') || 'dashboard';
  if (!state.loggedIn) {
    if (r === 'signup' || r === 'register') {
      state.route = 'signup';
    } else if (r === 'forgot' || r === 'forgot-password' || r === 'reset-password') {
      state.route = 'forgot-password';
    } else {
      state.route = 'login';
    }
    render();
  } else {
    state.route = (r === 'signup' || r === 'login' || r === 'register' || r === 'forgot' || r === 'forgot-password' || r === 'reset-password') ? 'dashboard' : r;
    render();
  }
});

function showToast(title,message=''){
  const el=document.createElement('div');
  el.className='toast';
  el.innerHTML=`<div class="toast-icon">${icons.check}</div><div><b>${title}</b><span>${message}</span></div>`;
  toastRoot.appendChild(el);
  setTimeout(()=>el.remove(), 3400);
}

function openModal(title,body,actionLabel='Save',onAction=null){
  modalRoot.innerHTML=`<div class="modal-backdrop" id="modalBackdrop"><div class="modal"><div class="modal-head"><h3>${title}</h3><button class="modal-close" id="modalClose">✕</button></div><div class="modal-body">${body}<div class="modal-actions"><button class="ghost-btn" id="modalCancel">Cancel</button>${actionLabel?`<button class="small-btn" id="modalAction">${actionLabel}</button>`:''}</div></div></div></div>`;
  const close=()=>modalRoot.innerHTML='';
  document.getElementById('modalClose').onclick=close;
  document.getElementById('modalCancel').onclick=close;
  document.getElementById('modalBackdrop').onclick=e=>{if(e.target.id==='modalBackdrop')close()};
  if(actionLabel) document.getElementById('modalAction').onclick=()=>{ if(onAction) onAction(); close(); };
}

// Live Clock Update
setInterval(()=>{
  const clockEl = document.getElementById('liveClockText');
  if (clockEl) {
    const now = new Date();
    clockEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}, 1000);

/* ==========================================================================
   AUTH PAGES (v3 — Sleek Dark Glass Redesign)
   ========================================================================== */
function loginPage() {
  return `<div class="login-shell">
    <section class="login-hero">
      <div class="hero-grid-overlay"></div>
      
      <div class="hero-top-row">
        <div class="brand">
          <div class="brand-mark">${icons.brand}</div>
          <div class="brand-text">
            <span>ARANGKADA</span>
            <span class="brand-tagline">AI Transportation Management System</span>
          </div>
        </div>
        <div class="hero-live-pill">
          <span class="pulse-dot"></span>
          <span>LIVE TELEMETRY</span>
        </div>
      </div>

      <div class="hero-main">
        <div class="hero-badge">
          <span class="hero-badge-sparkle">✦</span>
          <span>INTELLIGENT DISPATCH & QUEUE MATRIX</span>
        </div>
        <h1>AI-Powered Transportation <span>Decision Support</span></h1>
        <p>Connecting terminal dispatchers, drivers, and transit operators across Pangasinan with real-time GPS telemetry, predictive departure sequencing, and automated corridor balancing.</p>

        <!-- Live Corridor Telemetry Showcase -->
        <div class="hero-transit-widget">
          <div class="transit-widget-header">
            <div class="transit-widget-title">
              <span class="pulse-dot"></span>
              <span>Corridor Telemetry</span>
            </div>
            <span class="transit-route-pill">Corridor 1 • Active</span>
          </div>

          <div class="transit-route-stepper">
            <div class="route-step completed">
              <div class="route-step-circle">✓</div>
              <div class="route-step-info">
                <span class="step-name">San Fabian</span>
                <span class="step-meta">Hub Terminal</span>
              </div>
            </div>
            <div class="route-connector active">
              <div class="connector-pulse"></div>
            </div>
            <div class="route-step in-transit">
              <div class="route-step-circle">
                <span class="step-live-dot"></span>
              </div>
              <div class="route-step-info">
                <span class="step-name">Mangaldan</span>
                <span class="step-meta">Active Corridor</span>
              </div>
            </div>
            <div class="route-connector"></div>
            <div class="route-step">
              <div class="route-step-circle">3</div>
              <div class="route-step-info">
                <span class="step-name">Dagupan Central</span>
                <span class="step-meta">ETA 12 min</span>
              </div>
            </div>
          </div>

          <div class="transit-stat-grid">
            <div class="transit-stat">
              <span class="stat-value">99.4%</span>
              <span class="stat-label">On-Time Index</span>
            </div>
            <div class="transit-stat">
              <span class="stat-value">14 Units</span>
              <span class="stat-label">Active on Route</span>
            </div>
            <div class="transit-stat">
              <span class="stat-value">&lt; 15s</span>
              <span class="stat-label">AI Queue Latency</span>
            </div>
          </div>
        </div>

        <!-- Staff Roles Info -->
        <div class="staff-card">
          <div class="eyebrow">AUTHORIZED ROLES</div>
          <div class="staff-role-grid">
            <div class="staff-role">
              <div class="role-icon">${icons.terminal}</div>
              <div>
                <div class="role-header-row">
                  <b>Terminal Dispatcher</b>
                  <span class="role-tag dispatch">DISPATCH</span>
                </div>
                <small>Live monitoring • Queue sequencing • Route advisories</small>
              </div>
            </div>
            <div class="staff-role">
              <div class="role-icon">${icons.settings}</div>
              <div>
                <div class="role-header-row">
                  <b>System Administrator</b>
                  <span class="role-tag admin">ADMIN</span>
                </div>
                <small>Fleet configuration • Staff accounts • Security rules</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="hero-footer">
        <div>Arangkada • Pangasinan Transit System</div>
        <div class="hero-footer-status"><span class="pulse-dot"></span> Operations Grid Active</div>
      </div>
    </section>

    <section class="login-panel">
      <form class="login-box" id="loginForm">
        <div class="login-box-header">
          <div class="login-meta-badge">
            <span class="badge-sparkle">✦</span>
            <span>DISPATCH CONSOLE ACCESS</span>
          </div>
          <h2>Terminal Sign In</h2>
          <div class="sub">Enter your staff credentials to access departure queues and live route monitors.</div>
        </div>

        <div class="field">
          <label for="email">
            <span>Email Address or Staff ID</span>
            <span class="field-hint">Official</span>
          </label>
          <div class="input-wrap">
            <span class="input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </span>
            <input id="email" value="maria.santos@arangkada.ph" placeholder="e.g. maria.santos@arangkada.ph or D-SP-001" required autocomplete="username">
          </div>
        </div>

        <div class="field">
          <label for="password">
            <span>Password</span>
          </label>
          <div class="input-wrap">
            <span class="input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </span>
            <input id="password" value="password123" type="password" placeholder="Enter your password" required autocomplete="current-password">
            <button type="button" class="eye-btn" id="togglePass" title="Toggle password visibility" aria-label="Toggle password visibility">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </div>

        <div class="row-between">
          <label class="checkbox">
            <input type="checkbox" checked id="rememberSession">
            <span>Keep me signed in</span>
          </label>
          <button type="button" class="link-btn" id="forgotBtn">Forgot password?</button>
        </div>

        <button class="primary-btn full" type="submit">
          <span>Sign In to Dashboard</span>
          <svg class="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>

        <div class="auth-demo-callout">
          <div class="demo-callout-left">
            <div class="demo-bolt-badge">⚡</div>
            <div>
              <div class="auth-demo-badge">Demo Dispatcher Account</div>
              <div class="auth-demo-text">maria.santos@arangkada.ph / password123</div>
            </div>
          </div>
          <button type="button" class="demo-fill-btn" id="demoAutoFillBtn" title="Auto-fill demo credentials">Auto-fill</button>
        </div>

        <div class="auth-switch">
          <span>Need authorized staff credentials?</span>
          <button type="button" class="link-btn" id="gotoSignup">Register here</button>
        </div>

        <div class="login-foot">
          <div class="trust-badge-row">
            <span class="trust-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              TLS 256-Bit Secure
            </span>
            <span class="trust-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              Verified Terminal Portal
            </span>
          </div>
        </div>
      </form>
    </section>
  </div>`;
}

function signupPage() {
  return `<div class="login-shell">
    <section class="login-hero">
      <div class="hero-grid-overlay"></div>
      <div class="brand">
        <div class="brand-mark">${icons.brand}</div>
        <div class="brand-text">
          <span>ARANGKADA</span>
          <span class="brand-tagline">AI Transportation Management System</span>
        </div>
      </div>

      <div class="hero-main">
        <div class="hero-badge">
          <span class="hero-badge-dot"></span>
          <span>✦ STAFF ONBOARDING</span>
        </div>
        <h1>Create Staff <span>Account</span></h1>
        <p>Register your operational profile for terminal management, route clearances, and vehicle queue sequencing.</p>

        <div class="staff-card">
          <div class="eyebrow">ONBOARDING VERIFICATION</div>
          <div class="staff-role">
            <div class="role-icon">🛡️</div>
            <div>
              <b>Verified Staff Clearance</b>
              <small>Immediate terminal console activation upon role approval</small>
            </div>
          </div>
          <div class="staff-role">
            <div class="role-icon">${icons.settings}</div>
            <div>
              <b>Role-Based Permissions</b>
              <small>Dispatcher, Route Inspector, or Fleet Administrator</small>
            </div>
          </div>
        </div>
      </div>

      <div class="hero-footer">
        <div>Arangkada • Pangasinan Transit System</div>
        <div class="hero-footer-status"><span class="pulse-dot"></span> Registration Portal Active</div>
      </div>
    </section>

    <section class="login-panel">
      <form class="login-box login-box-wide" id="signupForm">
        <div class="login-box-header">
          <div class="login-meta-badge">✦ STAFF ENROLLMENT</div>
          <h2>Create Account</h2>
          <div class="sub">Fill in your details to request terminal dispatch access.</div>
        </div>

        <div class="field-grid-2">
          <div class="field">
            <label for="signupName">Full Name</label>
            <div class="input-wrap">
              <input class="input-no-icon" id="signupName" placeholder="e.g. Maria Santos" required autocomplete="name">
            </div>
          </div>
          <div class="field">
            <label for="signupStaffId">
              <span>Staff ID</span>
              <span class="field-hint">Optional</span>
            </label>
            <div class="input-wrap">
              <input class="input-no-icon" id="signupStaffId" placeholder="e.g. D-SP-005" autocomplete="off">
            </div>
          </div>
        </div>

        <div class="field">
          <label for="signupEmail">Official Email Address</label>
          <div class="input-wrap">
            <span class="input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </span>
            <input id="signupEmail" type="email" placeholder="e.g. maria.santos@arangkada.ph" required autocomplete="email">
          </div>
        </div>

        <div class="field-grid-2">
          <div class="field">
            <label for="signupRole">Staff Role</label>
            <div class="input-wrap">
              <select class="input-no-icon" id="signupRole" required>
                <option value="dispatcher">Terminal Dispatcher</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>
          </div>
          <div class="field">
            <label for="signupTerminal">Assigned Hub</label>
            <div class="input-wrap">
              <select class="input-no-icon" id="signupTerminal" required>
                <option value="San Fabian Terminal">San Fabian Terminal</option>
                <option value="Dagupan Central Terminal">Dagupan Central Terminal</option>
                <option value="Manaoag Terminal">Manaoag Terminal</option>
                <option value="Mangaldan Junction">Mangaldan Junction</option>
                <option value="System Administration">System Administration</option>
              </select>
            </div>
          </div>
        </div>

        <div class="field-grid-2">
          <div class="field">
            <label for="signupPassword">Password</label>
            <div class="input-wrap">
              <input class="input-no-icon" id="signupPassword" type="password" placeholder="Min. 6 chars" minlength="6" required autocomplete="new-password">
              <button type="button" class="eye-btn" id="toggleSignupPass" title="Toggle password">👁</button>
            </div>
          </div>
          <div class="field">
            <label for="signupConfirmPassword">Confirm</label>
            <div class="input-wrap">
              <input class="input-no-icon" id="signupConfirmPassword" type="password" placeholder="Re-enter password" minlength="6" required autocomplete="new-password">
              <button type="button" class="eye-btn" id="toggleSignupConfirmPass" title="Toggle confirm password">👁</button>
            </div>
          </div>
        </div>

        <div class="row-between" style="margin-bottom:20px">
          <label class="checkbox">
            <input type="checkbox" id="signupAgree" checked required>
            <span>I agree to operational dispatch guidelines & policy</span>
          </label>
        </div>

        <button class="primary-btn full" type="submit">
          <span>CREATE STAFF ACCOUNT</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>

        <div class="auth-switch">
          <span>Already have an authorized staff account?</span>
          <button type="button" class="link-btn" id="gotoLogin">Sign in here</button>
        </div>
      </form>
    </section>
  </div>`;
}

let resendTimerInterval = null;

function renderProgressSteps(currentStep) {
  return `
    <div class="auth-progress-steps">
      <div class="auth-progress-step ${currentStep === 1 ? 'active' : (currentStep > 1 ? 'done' : '')}">
        ${currentStep > 1 ? '✓ ' : ''}1. Identity
      </div>
      <span class="auth-progress-arrow">→</span>
      <div class="auth-progress-step ${currentStep === 2 ? 'active' : (currentStep > 2 ? 'done' : '')}">
        ${currentStep > 2 ? '✓ ' : ''}2. Verify OTP
      </div>
      <span class="auth-progress-arrow">→</span>
      <div class="auth-progress-step ${currentStep === 3 ? 'active' : ''}">
        3. New Password
      </div>
    </div>
  `;
}

function forgotPasswordPage() {
  const step = state.recoveryStep || 1;
  const email = state.recoveryEmail || '';
  const maskedEmail = state.recoveryMaskedEmail || email || 'your registered email';
  const previewCode = state.recoveryCodePreview || '';
  const errorMsg = state.recoveryError || '';

  let formContent = '';

  if (step === 1) {
    formContent = `
      <form class="login-box" id="forgotRequestForm">
        ${renderProgressSteps(1)}
        <div class="login-box-header">
          <h2>Reset Password</h2>
          <div class="sub">Enter your registered staff email address or Staff ID to begin identity verification.</div>
        </div>

        ${errorMsg ? `
          <div class="auth-alert-error" id="step1Error">
            <span>⚠️</span>
            <span>${errorMsg}</span>
          </div>
        ` : ''}

        <div class="field">
          <label for="recoveryIdentity">Email Address / Staff ID</label>
          <div class="input-wrap">
            <span class="input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </span>
            <input id="recoveryIdentity" placeholder="e.g. maria.santos@arangkada.ph or D-SP-001" value="${email}" required autocomplete="username">
          </div>
          <div class="field-hint" style="margin-top:6px">Registered dispatcher email or unique Staff ID</div>
        </div>

        <button class="primary-btn full" type="submit" id="step1NextBtn">
          <span>SEND VERIFICATION CODE</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>

        <div class="auth-switch">
          <span>Remembered your password?</span>
          <button type="button" class="link-btn" id="gotoLoginFromForgot">Back to Sign In</button>
        </div>
      </form>
    `;
  } else if (step === 2) {
    formContent = `
      <form class="login-box" id="otpVerifyForm">
        ${renderProgressSteps(2)}
        <div class="login-box-header">
          <h2>Verify Identity</h2>
          <div class="sub">We transmitted a 6-digit security code to <b>${maskedEmail}</b></div>
        </div>

        ${previewCode ? `
          <div class="auth-code-preview">
            <div>
              <div class="auth-code-label">6-Digit Verification Code</div>
              <b class="auth-code-val">${previewCode}</b>
            </div>
            <button type="button" class="auth-autofill-btn" id="autofillOtpBtn">Auto-fill</button>
          </div>
        ` : ''}

        ${errorMsg ? `
          <div class="auth-alert-error" id="otpError">
            <span>⚠️</span>
            <span>${errorMsg}</span>
          </div>
        ` : ''}

        <div class="field">
          <label style="justify-content:center;margin-bottom:12px">Enter 6-Digit Code</label>
          <div class="otp-grid" id="otpGrid">
            <input type="text" maxlength="1" pattern="[0-9]" inputmode="numeric" class="otp-box" data-idx="0" autocomplete="off" autofocus>
            <input type="text" maxlength="1" pattern="[0-9]" inputmode="numeric" class="otp-box" data-idx="1" autocomplete="off">
            <input type="text" maxlength="1" pattern="[0-9]" inputmode="numeric" class="otp-box" data-idx="2" autocomplete="off">
            <input type="text" maxlength="1" pattern="[0-9]" inputmode="numeric" class="otp-box" data-idx="3" autocomplete="off">
            <input type="text" maxlength="1" pattern="[0-9]" inputmode="numeric" class="otp-box" data-idx="4" autocomplete="off">
            <input type="text" maxlength="1" pattern="[0-9]" inputmode="numeric" class="otp-box" data-idx="5" autocomplete="off">
          </div>
          <div class="field-hint" style="text-align:center;color:#64748b">Valid for 10 minutes. Single-use authentication token.</div>
        </div>

        <button class="primary-btn full" type="submit" id="verifyOtpBtn">
          <span>VERIFY & PROCEED</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>

        <div class="row-between" style="margin-top:16px;margin-bottom:0">
          <span id="resendTimerLabel" style="font-size:12.5px;color:#64748b">
            ${state.resendCountdown > 0 ? `Resend code in <b>${state.resendCountdown}s</b>` : "Didn't receive code?"}
          </span>
          <button type="button" class="link-btn ${state.resendCountdown > 0 ? 'disabled' : ''}" id="resendCodeLink">Resend Code</button>
        </div>

        <div class="auth-switch">
          <button type="button" class="link-btn" id="tryAnotherAccountBtn">Try another Staff ID or Email</button>
        </div>
      </form>
    `;
  } else if (step === 3) {
    formContent = `
      <form class="login-box" id="newPasswordForm">
        ${renderProgressSteps(3)}
        <div class="login-box-header">
          <h2>Create New Password</h2>
          <div class="sub">Set a strong password for your authorized ARANGKADA staff account.</div>
        </div>

        ${errorMsg ? `
          <div class="auth-alert-error" id="newPwError">
            <span>⚠️</span>
            <span>${errorMsg}</span>
          </div>
        ` : ''}

        <div class="field">
          <label for="newPasswordInput">New Password</label>
          <div class="input-wrap">
            <input class="input-no-icon" id="newPasswordInput" type="password" placeholder="Enter new password" required autocomplete="new-password">
            <button type="button" class="eye-btn" id="toggleNewPass" title="Toggle password">👁</button>
          </div>
        </div>

        <div class="field">
          <label for="confirmNewPasswordInput">Confirm New Password</label>
          <div class="input-wrap">
            <input class="input-no-icon" id="confirmNewPasswordInput" type="password" placeholder="Re-enter new password" required autocomplete="new-password">
            <button type="button" class="eye-btn" id="toggleConfirmNewPass" title="Toggle password">👁</button>
          </div>
        </div>

        <div class="pw-checklist" id="pwChecklist">
          <div class="pw-rule" id="ruleLen"><span class="pw-rule-dot">●</span> <span>Minimum 8 characters</span></div>
          <div class="pw-rule" id="ruleUpper"><span class="pw-rule-dot">●</span> <span>At least 1 uppercase letter (A-Z)</span></div>
          <div class="pw-rule" id="ruleLower"><span class="pw-rule-dot">●</span> <span>At least 1 lowercase letter (a-z)</span></div>
          <div class="pw-rule" id="ruleNum"><span class="pw-rule-dot">●</span> <span>At least 1 number (0-9)</span></div>
          <div class="pw-rule" id="ruleMatch"><span class="pw-rule-dot">●</span> <span>Passwords match</span></div>
        </div>

        <button class="primary-btn full" type="submit" id="submitResetPasswordBtn">
          <span>SET NEW PASSWORD</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>

        <div class="auth-switch">
          <span>Return to</span>
          <button type="button" class="link-btn" id="gotoLoginFromForgot2">Sign In</button>
        </div>
      </form>
    `;
  } else if (step === 4) {
    formContent = `
      <div class="login-box" style="text-align:center">
        <div class="auth-success-glyph">✓</div>
        <h2>Password Changed</h2>
        <div class="sub" style="margin-bottom:28px">Your dispatcher credentials have been updated securely. You can now sign in with your new password.</div>
        <button class="primary-btn full" type="button" id="finishAndLoginBtn">
          <span>BACK TO SIGN IN</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    `;
  }

  return `<div class="login-shell">
    <section class="login-hero">
      <div class="hero-grid-overlay"></div>
      <div class="brand">
        <div class="brand-mark">${icons.brand}</div>
        <div class="brand-text">
          <span>ARANGKADA</span>
          <span class="brand-tagline">AI Transportation Management System</span>
        </div>
      </div>

      <div class="hero-main">
        <div class="hero-badge">
          <span class="hero-badge-dot"></span>
          <span>✦ CREDENTIAL RECOVERY</span>
        </div>
        <h1>Secure Staff <span>Password Recovery</span></h1>
        <p>Follow the quick 3-step verification process to securely reset and regain access to your operational dispatch tools.</p>

        <div class="staff-card">
          <div class="eyebrow">RECOVERY GUIDELINES</div>
          <div class="staff-role">
            <div class="role-icon">🔑</div>
            <div>
              <b>Single-Use OTP Verification</b>
              <small>6-digit code with 10-minute expiry for staff security</small>
            </div>
          </div>
          <div class="staff-role">
            <div class="role-icon">${icons.settings}</div>
            <div>
              <b>Strong Password Policy</b>
              <small>8+ characters with uppercase, lowercase, and numbers</small>
            </div>
          </div>
        </div>
      </div>

      <div class="hero-footer">
        <div>Arangkada • Pangasinan Transit System</div>
        <div class="hero-footer-status"><span class="pulse-dot"></span> Recovery Portal Active</div>
      </div>
    </section>

    <section class="login-panel">
      ${formContent}
    </section>
  </div>`;
}

/* ==========================================================================
   APP SHELL
   ========================================================================== */
const navItems=[
  ['dashboard','Dashboard','dashboard',null],
  ['terminal','Terminal Queue','terminal',null],
  ['live-map','Live Map','map',null],
  ['duty-requests','Duty Requests','duty','3'],
  ['reports','Reports & Incidents','reports',null],
  ['advisories','Advisories','advisories','2'],
  ['trip-history','Trip History','history',null],
  ['drivers','Drivers Directory','drivers',null],
  ['settings','Settings','settings',null]
];

function shell(pageTitle,subtitle,body){
  const activeUser = currentUser || { name: 'Maria Santos', role: 'dispatcher', terminal: 'San Fabian Terminal' };
  const initials = (activeUser.name || 'MS').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase() || 'MS';
  const roleName = (activeUser.role || 'dispatcher').toUpperCase();
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return `<div class="app-shell">
    <aside class="sidebar" id="sidebar">
      <div class="brand">
        <div class="brand-mark">${icons.brand}</div>
        ARANGKADA
      </div>
      <div class="role-label">
        <span>${roleName}</span> TERMINAL HUB
      </div>
      <nav class="nav">
        ${navItems.map(([r,l,i,count])=>`
          <button class="nav-btn ${state.route===r?'active':''}" data-nav="${r}">
            <span class="nav-icon">${icons[i]}</span>
            <span>${l}</span>
            ${count ? `<span class="badge-pill">${count}</span>` : ''}
          </button>
        `).join('')}
      </nav>
      <div class="sidebar-bottom">
        <div class="user-card">
          <div class="avatar">${initials}<i class="online-dot"></i></div>
          <div class="user-meta">
            <b>${activeUser.name || 'Maria Santos'}</b>
            <small>${activeUser.terminal || 'San Fabian Terminal'}</small>
          </div>
        </div>
        <button class="logout-btn" id="logoutBtn">${icons.logout} Sign out</button>
      </div>
    </aside>
    <main class="main">
      <header class="topbar">
        <div style="display:flex;align-items:center;gap:14px">
          <button class="mobile-toggle" id="mobileToggle">☰</button>
          <div class="page-title">
            <h1>${pageTitle}</h1>
            <p>${subtitle}</p>
          </div>
        </div>
        <div class="top-actions">
          <div class="hub-status-pill">
            <span class="dot" style="background:#10b981"></span>
            ${activeUser.terminal || 'San Fabian Terminal'}
          </div>
          <div class="top-clock">
            <b>${dateStr}</b>
            <span id="liveClockText">${timeStr}</span>
          </div>
          <div class="topbar-avatar" title="${activeUser.name}">${initials}</div>
        </div>
      </header>
      <div class="content">${body}</div>
    </main>
  </div>`;
}

function stat(value,label,sub,icon,color='purple',trend=''){
  return `<div class="stat-card">
    <div class="stat-top">
      <div class="stat-icon ${color}">${icon}</div>
      ${trend ? `<span class="stat-trend up">▲ ${trend}</span>` : ''}
    </div>
    <div class="stat-value">${value}</div>
    <h4>${label}</h4>
    <p>${sub}</p>
  </div>`;
}

function badge(text,color='gray'){
  return `<span class="badge ${color}"><i class="dot"></i>${text}</span>`;
}

/* ==========================================================================
   PAGE VIEWS
   ========================================================================== */
function dashboard(){
  const readyCount = state.queue.filter(q=>q.status==='Ready').length;
  const waitingCount = state.queue.filter(q=>q.status==='Waiting').length;
  const enRouteCount = state.vehicles.filter(v=>v.status==='On the Way').length;
  const delayedCount = state.vehicles.filter(v=>v.status==='Delayed').length;

  return shell(
    'Operations Dashboard',
    'Real-time passenger queue, vehicle telemetry, and AI dispatch support',
    `<div class="grid stats-grid">
      ${stat('15','Today\'s Total Trips','3 scheduled next',icons.duty,'purple','8%')}
      ${stat(`${enRouteCount}`,'Active on Route','San Fabian → Dagupan',icons.map,'blue','Live')}
      ${stat(`${readyCount}`,'Ready for Departure','Cleared & boarded',icons.terminal,'green')}
      ${stat(`${waitingCount}`,'In Departure Queue','Queued at bay',icons.history,'orange')}
      ${stat(delayedCount ? `${delayedCount}` : '0','Reported Delays',delayedCount?'Near Mangaldan':'Clear corridors',icons.reports,delayedCount?'red':'green')}
    </div>

    <div class="grid dashboard-grid">
      <!-- 1. Departure Queue -->
      <section class="card">
        <div class="card-head">
          <h3>${icons.terminal} Departure Queue</h3>
          <button class="text-btn" data-nav="terminal">Manage Queue →</button>
        </div>
        <div class="card-body" style="padding-top:10px">
          <div class="list">
            ${state.queue.slice(0,5).map(q=>`
              <div class="list-row" style="cursor:pointer" data-select-queue="${q.id}">
                <div class="queue-num">#${q.pos}</div>
                <div class="list-main">
                  <b>${q.name}</b>
                  <small>${q.id} • ${q.plate}</small>
                </div>
                <div>
                  ${badge(q.status, q.status==='Ready'?'green':'orange')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- 2. Live Map Mini Radar -->
      <section class="card">
        <div class="card-head">
          <h3>${icons.map} Live Fleet Corridor</h3>
          <button class="text-btn" data-nav="live-map">Full Map →</button>
        </div>
        <div class="card-body" style="padding:12px">
          ${mapMarkup(false)}
        </div>
      </section>

      <!-- 3. AI Dispatcher Guidance -->
      <section class="card">
        <div class="card-head">
          <h3>${icons.sparkles} AI Decision Support</h3>
          <span class="badge purple">LIVE AI 2.4</span>
        </div>
        <div class="card-body">
          <div class="guidance" style="margin-top:0">
            <h4>Optimal Spacing Recommendation</h4>
            <p>Shared corridor traffic is moderately rising near <b>Mangaldan Junction</b>.</p>
            <ul>
              <li>Recommended headway: <b>6–8 minutes</b></li>
              <li>J-008 has cleared the departure gate</li>
              <li>Next in line: <b>J-014 (Juan Dela Cruz)</b></li>
            </ul>
            <p style="font-weight:700;color:#581c87;margin-top:8px">Suggested: Clear J-014 for departure in 4 mins.</p>
          </div>
        </div>
      </section>
    </div>

    <!-- Quick Operations & Recent Incidents -->
    <div class="grid bottom-grid">
      <section class="card">
        <div class="card-head">
          <h3>${icons.duty} Quick Dispatcher Actions</h3>
        </div>
        <div class="card-body">
          <div class="quick-actions">
            <button class="action-tile" id="quickBroadcastBtn">
              <div class="action-tile-icon">${icons.bell}</div>
              <div>
                <b>Broadcast Operational Alert</b>
                <small>Send emergency alert to all drivers</small>
              </div>
            </button>
            <button class="action-tile" id="quickMsgDriversBtn">
              <div class="action-tile-icon">${icons.message}</div>
              <div>
                <b>Message Active Fleet</b>
                <small>Dispatch route notice or advisory</small>
              </div>
            </button>
            <button class="action-tile" id="createAdvFromDash">
              <div class="action-tile-icon">${icons.advisories}</div>
              <div>
                <b>Create Route Advisory</b>
                <small>Publish weather or traffic update</small>
              </div>
            </button>
            <button class="action-tile" id="downloadReportDash">
              <div class="action-tile-icon">${icons.download}</div>
              <div>
                <b>Export Daily Summary CSV</b>
                <small>Download dispatcher logs</small>
              </div>
            </button>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-head">
          <h3>${icons.reports} Active Advisories</h3>
          <button class="text-btn" data-nav="advisories">All Advisories →</button>
        </div>
        <div class="card-body" style="padding-top:8px">
          <div class="list">
            <div class="list-row">
              <div class="incident-ico">⚠</div>
              <div class="list-main">
                <b>Heavy Traffic Near Mangaldan</b>
                <small>San Fabian → Dagupan Route</small>
              </div>
              <span class="badge orange">Active</span>
            </div>
            <div class="list-row">
              <div class="incident-ico" style="background:var(--blue-soft);color:var(--blue);border-color:var(--blue-border)">ℹ</div>
              <div class="list-main">
                <b>Bonuan Road Maintenance</b>
                <small>Alternate lane open</small>
              </div>
              <span class="badge blue">Notice</span>
            </div>
          </div>
        </div>
      </section>
    </div>`
  );
}

function mapMarkup(isLarge=false){
  return `<div class="map-card ${isLarge?'large':''}">
    <div class="map-gridlines"></div>
    <div class="map-road r1"></div>
    <div class="map-road r2"></div>
    <div class="map-road r3"></div>
    <div class="map-road r4"></div>
    <svg class="route-svg" viewBox="0 0 800 450" preserveAspectRatio="none">
      <path d="M 90 280 Q 240 180 380 230 T 680 160" fill="none" stroke="rgba(124, 58, 237, 0.45)" stroke-width="4" stroke-dasharray="6,6" />
      <path d="M 120 340 Q 280 260 480 290 T 720 220" fill="none" stroke="rgba(6, 182, 212, 0.35)" stroke-width="3" />
    </svg>
    <div class="map-label" style="top:22%;left:10%">San Fabian Terminal</div>
    <div class="map-label" style="top:52%;left:44%">Mangaldan Junction</div>
    <div class="map-label" style="top:32%;left:76%">Dagupan Hub</div>
    ${state.vehicles.map(v=>`
      <div class="vehicle-marker" style="top:${v.top};left:${v.left}" data-vehicle="${v.id}" title="${v.name} • ${v.plate}">
        <span class="vehicle-dot ${v.color}"></span>
        <b>${v.id}</b>
        <small style="font-size:9.5px;color:#94a3b8">${v.speed}</small>
      </div>
    `).join('')}
    <div class="map-legend">
      <span><i class="dot" style="color:#22c55e"></i> Normal</span>
      <span><i class="dot" style="color:#f59e0b"></i> Moderate</span>
      <span><i class="dot" style="color:#ef4444"></i> Delayed</span>
    </div>
  </div>`;
}

function terminalPage(){
  return shell(
    'Terminal Departure Queue',
    'Driver duty requests and terminal departure sequencing',
    `<div class="grid two-col">
      <div>
        <section class="card">
          <div class="card-head">
            <h3>${icons.duty} Pending Duty Requests</h3>
            <span class="badge purple">${state.requests.length} PENDING</span>
          </div>
          <div class="card-body">
            ${state.requests.length === 0 ? '<div class="empty">No pending driver duty requests at this time.</div>' : ''}
            ${state.requests.map(r=>`
              <div class="request-card">
                <div class="jeep-icon">${icons.jeep}</div>
                <div class="request-info">
                  <b>${r.id} • ${r.plate}</b>
                  <strong>${r.name}</strong>
                  <small>Requested at ${r.time} • San Fabian Terminal</small>
                </div>
                <div class="request-actions">
                  <button class="success-btn approve" data-id="${r.id}">Approve</button>
                  <button class="danger-btn reject" data-id="${r.id}">Decline</button>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <section class="card" style="margin-top:18px">
          <div class="card-head">
            <h3>${icons.terminal} Terminal Departure Queue</h3>
            <div style="display:flex;gap:8px">
              <button class="ghost-btn" id="manageQueue">Reorder Queue</button>
              <button class="small-btn" id="refreshQueue">↻ Refresh</button>
            </div>
          </div>
          <div class="card-body">
            ${state.queue.map(q=>`
              <div class="queue-card ${state.selectedDriver===q.id?'selected':''}" data-select-queue="${q.id}">
                <div class="queue-num">#${q.pos}</div>
                <div class="avatar" style="width:38px;height:38px;font-size:12px">${q.name.split(' ').slice(0,2).map(n=>n[0]).join('')}</div>
                <div style="min-width:0;flex:1">
                  <b style="font-size:13.5px">${q.name}</b>
                  <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">${q.id} • ${q.plate}</div>
                </div>
                <div>
                  ${badge(q.status, q.status==='Ready'?'green':'orange')}
                </div>
                <div class="queue-actions">
                  <button class="success-btn clear-departure" data-id="${q.id}">${q.status==='Ready'?'Departed':'Clear for Departure'}</button>
                  <button class="ghost-btn" data-driver-details="${q.id}">Details</button>
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      </div>

      <aside>
        ${selectedDriverCard()}
      </aside>
    </div>`
  );
}

function selectedDriverCard(){
  const q=state.queue.find(x=>x.id===state.selectedDriver)||state.queue[1]||state.queue[0]||{name:'Juan Dela Cruz',id:'J-014',plate:'NAB 2147',status:'Waiting',pos:2};
  return `<section class="card">
    <div class="card-head">
      <h3>${icons.drivers} Selected Driver</h3>
      <button class="text-btn" data-driver-details="${q.id}">Full Profile →</button>
    </div>
    <div class="card-body">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
        <div class="avatar" style="width:48px;height:48px;font-size:16px">${q.name.split(' ').slice(0,2).map(n=>n[0]).join('')}</div>
        <div>
          <b style="font-size:15px;display:block">${q.name}</b>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${q.id} • Plate: <b>${q.plate}</b></div>
        </div>
      </div>
      
      <div class="grid" style="grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px">
        <div class="detail">
          <span>Assigned Route</span>
          <b>San Fabian → Dagupan</b>
        </div>
        <div class="detail">
          <span>Terminal GPS</span>
          <b style="color:var(--green)">Verified at Terminal</b>
        </div>
        <div class="detail">
          <span>Departure Queue</span>
          <b>Rank #${q.pos}</b>
        </div>
        <div class="detail">
          <span>Duty Status</span>
          <b>${q.status==='Ready'?'READY':'QUEUED'}</b>
        </div>
      </div>

      <div class="guidance" style="margin-top:0">
        <h4>${icons.sparkles} Dispatch Guidance</h4>
        <ul>
          <li>J-008 already departed & en route</li>
          <li>${q.id} is ${q.pos===2?'next in line':'in the queue sequence'}</li>
          <li>Current traffic near Mangaldan: Moderate</li>
        </ul>
        <p style="font-weight:700;color:#581c87">Recommended spacing: 5–8 minutes.</p>
      </div>
    </div>
  </section>`;
}

function liveMapPage(){
  const visible=state.statusFilter==='all'?state.vehicles:state.vehicles.filter(v=>v.status===state.statusFilter);
  const body=`<div class="filterbar">
    <div class="filters">
      <b style="font-size:12px;color:var(--text-muted)">Route View:</b>
      <div class="segment">
        <button class="${state.routeView==='my'?'active':''}" data-route-view="my">My Route</button>
        <button class="${state.routeView==='nearby'?'active':''}" data-route-view="nearby">Nearby</button>
        <button class="${state.routeView==='ai'?'active':''}" data-route-view="ai">AI Priority</button>
      </div>
      <b style="font-size:12px;color:var(--text-muted);margin-left:12px">Status Filter:</b>
      <div class="segment">
        <button class="${state.statusFilter==='all'?'active':''}" data-status="all">All (${state.vehicles.length})</button>
        <button class="${state.statusFilter==='On the Way'?'active':''}" data-status="On the Way">On the Way</button>
        <button class="${state.statusFilter==='Delayed'?'active':''}" data-status="Delayed">Delayed</button>
      </div>
    </div>
    <button class="small-btn" id="createAdvisory">+ Create Advisory</button>
  </div>
  
  <div class="grid live-layout">
    <div>
      ${mapMarkup(true)}
      <div class="grid two-col" style="margin-top:18px">
        <section class="card">
          <div class="card-head">
            <h3>${icons.reports} Recent Driver Incident Reports</h3>
            <button class="text-btn" data-nav="reports">All Reports →</button>
          </div>
          <div class="card-body">
            <div class="list">
              ${[['Heavy Traffic','Mangaldan • J-014','Medium'],['Vehicle Breakdown','Near Urdaneta • J-027','High'],['Flooding Watch','Binmaley • J-019','High']].map(x=>`
                <div class="list-row">
                  <div class="incident-ico">⚠</div>
                  <div class="list-main">
                    <b>${x[0]}</b>
                    <small>${x[1]}</small>
                  </div>
                  <span class="badge ${x[2]==='High'?'red':'orange'}">${x[2]}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <h3>${icons.sparkles} Decision Support</h3>
          </div>
          <div class="card-body">
            <div class="guidance" style="margin-top:0">
              <h4>Traffic Congestion Advisory</h4>
              <p>Corridor sensor data shows vehicle density rising at <b>Mangaldan Junction</b>.</p>
              <p style="margin-top:6px"><b>Action:</b> Space subsequent departures by ~6 minutes to prevent bottlenecking.</p>
            </div>
          </div>
        </section>
      </div>
    </div>

    <aside>
      <section class="card">
        <div class="card-head">
          <h3>${icons.jeep} Active Vehicles</h3>
          <span class="badge purple">${visible.length} ACTIVE</span>
        </div>
        <div class="vehicle-list-card">
          ${visible.map(v=>`
            <div class="vehicle-row ${state.selectedDriver===v.id?'selected':''}" data-select-vehicle="${v.id}">
              <div class="vehicle-avatar">${v.id.replace('J-','J')}</div>
              <div style="min-width:0;flex:1">
                <b>${v.id}</b>
                <small>${v.name}</small>
              </div>
              <div class="vehicle-speed">
                ${v.speed}<br>
                ${badge(v.status, v.status==='Delayed'?'red':'green')}
              </div>
            </div>
          `).join('')}
          <button class="small-btn full" id="viewJeepDetails" style="margin-top:12px">View Jeepney Details</button>
        </div>
      </section>
    </aside>
  </div>`;
  return shell('Live Fleet Operations Map','Real-time GPS telemetry and corridor awareness',body);
}

function driverDetailsPage(){
  const v=state.vehicles.find(x=>x.id===state.selectedDriver)||state.vehicles[1]||state.vehicles[0];
  const isDelayed=state.driverStatus==='Delayed';
  const isOut=state.driverStatus==='Out of Service';
  const statusColor=isOut?'red':isDelayed?'orange':'green';
  const body=`<div style="display:flex;justify-content:flex-end;margin-bottom:14px">
    <button class="ghost-btn" data-nav="live-map">← Back to Fleet Map</button>
  </div>
  
  <section class="card">
    <div class="driver-head-card">
      <div class="avatar">JD<i class="online-dot"></i></div>
      <div class="driver-head-text">
        <h2>Juan Dela Cruz</h2>
        <p>Driver ID: <b>D-014</b> &nbsp; • &nbsp; Jeepney: <b>${v.id}</b> (${v.plate})</p>
        <div class="badges">
          ${badge(state.driverStatus.toUpperCase(),statusColor)}
          ${badge('GPS ACTIVE • 5G CONNECTED','purple')}
          ${badge('San Fabian → Dagupan Route','blue')}
        </div>
      </div>
      <div style="margin-left:auto;text-align:right">
        <div style="font-size:11px;color:var(--text-muted)">Assigned Terminal</div>
        <b style="font-size:13px">San Fabian Terminal</b>
        <div style="font-size:11px;color:var(--green);margin-top:4px">Telemetry Live: 4s ago</div>
      </div>
    </div>
  </section>

  <div class="grid details-grid">
    <section class="card">
      <div class="card-head">
        <h3>${icons.drivers} Driver Profile</h3>
      </div>
      <div class="card-body">
        <div class="detail-list">
          ${[['Full Name','Juan Dela Cruz'],['Driver ID','D-014'],['Assigned Terminal','San Fabian Terminal'],['Route','San Fabian → Dagupan'],['License Class','Professional (RC 1,2,3)'],['Status','Active Duty']].map(x=>`
            <div class="detail">
              <span>${x[0]}</span>
              <b>${x[1]}</b>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <h3>${icons.jeep} Vehicle Telemetry</h3>
      </div>
      <div class="card-body">
        <div class="detail-list">
          ${[['Internal ID',v.id],['Plate Number',v.plate],['Current Speed',v.speed],['Operational Status',state.driverStatus],['Fleet Operator','Arangkada Transport Coop'],['Vehicle Capacity','22 Passengers']].map(x=>`
            <div class="detail">
              <span>${x[0]}</span>
              <b>${x[1]}</b>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  </div>

  <section class="card" style="margin-top:18px">
    <div class="card-head">
      <h3>${icons.duty} Current Trip Stepper & ETA</h3>
      ${badge('GPS Telemetry Stream Active','green')}
    </div>
    <div class="card-body">
      <div class="grid" style="grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px">
        ${[['Departure Time','8:42 AM'],['Current Corridor','Mangaldan Junction'],['Elapsed Time','28 min'],['Estimated Arrival','9:28 AM']].map(x=>`
          <div class="detail">
            <span>${x[0]}</span>
            <b style="font-size:14px">${x[1]}</b>
          </div>
        `).join('')}
      </div>
      <div class="trip-progress">
        <div class="progress-track">
          <div class="progress-fill"></div>
        </div>
        <div class="progress-labels">
          <span>San Fabian (Departed 8:42 AM)</span>
          <span style="color:var(--purple);font-weight:800">Mangaldan (Current)</span>
          <span>Dagupan Hub (ETA 9:28 AM)</span>
        </div>
      </div>
    </div>
  </section>

  <section class="card" style="margin-top:18px">
    <div class="card-head">
      <h3>Dispatcher Command Suite</h3>
    </div>
    <div class="card-body">
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="small-btn" id="messageDriver">${icons.message} Message Driver</button>
        <button class="ghost-btn" data-nav="live-map">${icons.map} View on Fleet Map</button>
        <button class="warning-btn" id="markDelayed">Mark Delayed</button>
        <button class="danger-btn" id="markOut">Mark Out of Service</button>
        <button class="ghost-btn" data-nav="reports">${icons.reports} Review Reports</button>
        <button class="ghost-btn" data-nav="terminal">${icons.terminal} Back to Queue</button>
      </div>
    </div>
  </section>`;
  return shell('Driver & Jeepney Details','Detailed telemetry, status, and dispatcher actions',body);
}

function tablePage(type){
  const data={
    'duty-requests':{
      title:'Duty Requests',
      sub:'Review and approve driver departure duty requests',
      heads:['Jeepney','Driver','Terminal','Requested','Status','Action'],
      rows:state.requests.map(r=>[`${r.id} • ${r.plate}`,r.name,'San Fabian Terminal',r.time,badge('Pending','orange'),`<button class="small-btn" data-nav="terminal">Review</button>`])
    },
    'reports':{
      title:'Reports & Incidents',
      sub:'Road conditions, weather updates, and vehicle incident logs',
      heads:['Type','Location','Vehicle','Time','Priority','Status'],
      rows:[
        ['Heavy Traffic','Mangaldan Junction','J-014','8:51 AM',badge('Medium','orange'),badge('Open','blue')],
        ['Vehicle Breakdown','Near Urdaneta','J-027','7:55 AM',badge('High','red'),badge('Reviewing','orange')],
        ['Flooding Alert','Binmaley','J-019','6:40 AM',badge('High','red'),badge('Active','purple')],
        ['Road Work','Bonuan Road','J-014','Yesterday',badge('Low','gray'),badge('Resolved','green')]
      ]
    },
    'advisories':{
      title:'Operational Advisories',
      sub:'Create and broadcast travel bulletins to drivers and terminal staff',
      heads:['Advisory Bulletin','Coverage','Created','Status','Audience','Action'],
      rows:[
        ['Heavy traffic near Mangaldan','San Fabian → Dagupan','8:32 AM',badge('Active','green'),'All Drivers',`<button class="ghost-btn">Edit</button>`],
        ['Rainfall and ponding advisory','Binmaley corridor','8:14 AM',badge('Active','green'),'All Staff',`<button class="ghost-btn">Edit</button>`],
        ['Bonuan Road maintenance notice','Bonuan area','Yesterday',badge('Expired','gray'),'All Drivers',`<button class="ghost-btn">View</button>`]
      ]
    },
    'trip-history':{
      title:'Trip History Logs',
      sub:'Archived vehicle runs and on-time performance records',
      heads:['Vehicle','Driver','Route','Departure','Arrival','Duration','Status'],
      rows:[
        ['J-019','Miguel Santos','San Fabian → Dagupan','8:22 AM','9:07 AM','45 min',badge('Completed','green')],
        ['J-002','Rico Bautista','San Fabian → Dagupan','8:12 AM','8:59 AM','47 min',badge('Completed','green')],
        ['J-027','Mark Reyes','San Fabian → Dagupan','7:58 AM','8:50 AM','52 min',badge('Completed','green')]
      ]
    },
    'drivers':{
      title:'Drivers & Fleet Directory',
      sub:'Authorized drivers and assigned jeepney vehicles',
      heads:['Driver','Driver ID','Jeepney','Plate','Status','Action'],
      rows:[
        ['Juan Dela Cruz','D-014','J-014','NAB 2147',badge('On the Way','green'),`<button class="small-btn" data-driver-details="J-014">View Profile</button>`],
        ['Mario Reyes','D-031','J-031','NCA 3301',badge('At Terminal','orange'),`<button class="ghost-btn" data-driver-details="J-031">View Profile</button>`],
        ['Pedro Garcia','D-045','J-045','NBD 8821',badge('At Terminal','orange'),`<button class="ghost-btn" data-driver-details="J-045">View Profile</button>`]
      ]
    }
  };

  const d=data[type];
  const extra=type==='advisories'?`<div style="display:flex;justify-content:flex-end;margin-bottom:14px"><button class="small-btn" id="createAdvisory">+ Create Advisory</button></div>`:'';
  
  return shell(
    d.title,
    d.sub,
    `${extra}
    <section class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>${d.heads.map(h=>`<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${d.rows.map(r=>`<tr>${r.map((c,i)=>`<td>${i===0?`<b>${c}</b>`:c}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>`
  );
}

function settingsPage(){
  const activeUser = currentUser || { name: 'Maria Santos', email: 'maria.santos@arangkada.ph', terminal: 'San Fabian Terminal' };
  return shell(
    'Settings & Preferences',
    'Dispatcher profile, operational notifications, and terminal configuration',
    `<div class="grid two-col">
      <section class="card">
        <div class="card-head">
          <h3>${icons.drivers} Staff Profile</h3>
        </div>
        <div class="card-body">
          <div class="field">
            <label>Display Name</label>
            <input id="settingsName" value="${activeUser.name || 'Maria Santos'}">
          </div>
          <div class="field">
            <label>Assigned Terminal</label>
            <input value="${activeUser.terminal || 'San Fabian Terminal'}" disabled style="background:var(--card-sub)">
          </div>
          <div class="field">
            <label>Email Address</label>
            <input id="settingsEmail" value="${activeUser.email || 'maria.santos@arangkada.ph'}">
          </div>
          <button class="small-btn" id="saveSettings">Save Changes</button>
        </div>
      </section>

      <section class="card">
        <div class="card-head">
          <h3>${icons.bell} Operational Alerts</h3>
        </div>
        <div class="card-body">
          <label class="checkbox" style="margin-bottom:16px;display:flex">
            <input type="checkbox" checked>
            <span>Real-time road incident alerts</span>
          </label>
          <label class="checkbox" style="margin-bottom:16px;display:flex">
            <input type="checkbox" checked>
            <span>Driver duty request alerts</span>
          </label>
          <label class="checkbox" style="margin-bottom:16px;display:flex">
            <input type="checkbox" checked>
            <span>Departure queue clearance changes</span>
          </label>
          <label class="checkbox" style="display:flex">
            <input type="checkbox">
            <span>Audio tone notifications on new departure</span>
          </label>
        </div>
      </section>
    </div>`
  );
}

/* ==========================================================================
   EVENT HANDLERS & WIRE-UP
   ========================================================================== */
function attachEvents(){
  document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>navigate(b.dataset.nav));
  
  const toggle=document.getElementById('mobileToggle'); 
  if(toggle) toggle.onclick=()=>document.getElementById('sidebar').classList.toggle('open');
  
  const logout=document.getElementById('logoutBtn'); 
  if(logout) logout.onclick=()=>openModal(
    'Sign out of ARANGKADA?',
    '<p style="font-size:13px;color:var(--text-muted);line-height:1.6">You will return to the authorized staff sign-in screen.</p>',
    'Sign out',
    ()=>{
      state.loggedIn=false;
      authToken='';
      currentUser=null;
      sessionStorage.removeItem('arangkadaToken');
      sessionStorage.removeItem('arangkadaLoggedIn');
      sessionStorage.removeItem('arangkadaUser');
      navigate('login');
    }
  );

  const gotoSignup=document.getElementById('gotoSignup'); if(gotoSignup) gotoSignup.onclick=()=>navigate('signup');
  const gotoLogin=document.getElementById('gotoLogin'); if(gotoLogin) gotoLogin.onclick=()=>navigate('login');
  const gotoLogin1=document.getElementById('gotoLoginFromForgot'); 
  if(gotoLogin1) gotoLogin1.onclick=()=>{ 
    state.recoveryStep=1; 
    state.recoveryError=''; 
    if(resendTimerInterval) clearInterval(resendTimerInterval); 
    navigate('login'); 
  };
  const gotoLogin2=document.getElementById('gotoLoginFromForgot2'); 
  if(gotoLogin2) gotoLogin2.onclick=()=>{ 
    state.recoveryStep=1; 
    state.recoveryError=''; 
    if(resendTimerInterval) clearInterval(resendTimerInterval); 
    navigate('login'); 
  };
  const finishBtn=document.getElementById('finishAndLoginBtn'); 
  if(finishBtn) finishBtn.onclick=()=>{ 
    state.recoveryStep=1; 
    state.recoveryError=''; 
    navigate('login'); 
  };

  const tryAnother=document.getElementById('tryAnotherAccountBtn');
  if(tryAnother) tryAnother.onclick=()=>{ 
    state.recoveryStep=1; 
    state.recoveryError=''; 
    if(resendTimerInterval) clearInterval(resendTimerInterval); 
    render(); 
  };

  // STEP 1 Form Handler
  const forgotReqForm=document.getElementById('forgotRequestForm');
  if(forgotReqForm){
    forgotReqForm.onsubmit=async e=>{
      e.preventDefault();
      state.recoveryError='';
      const identity=document.getElementById('recoveryIdentity')?.value.trim();
      if(!identity){
        state.recoveryError='Please enter your staff email address or Staff ID.';
        render();
        return;
      }
      try{
        const data=await api('/api/auth/forgot-password',{
          method:'POST',
          body:JSON.stringify({email:identity})
        });
        state.recoveryEmail=data.email;
        state.recoveryMaskedEmail=data.maskedEmail;
        state.recoveryName=data.name;
        state.recoveryCodePreview=data.resetCode;
        state.recoveryStep=2;
        state.recoveryError='';
        state.resendCountdown=45;
        
        if(resendTimerInterval) clearInterval(resendTimerInterval);
        resendTimerInterval=setInterval(()=>{
          if(state.resendCountdown>0){
            state.resendCountdown--;
            const label=document.getElementById('resendTimerLabel');
            const link=document.getElementById('resendCodeLink');
            if(label){
              label.innerHTML=state.resendCountdown>0
                ? `Resend code in <b id="countdownSecs">${state.resendCountdown}s</b>`
                : "Didn't receive code?";
            }
            if(link){
              if(state.resendCountdown>0) link.classList.add('disabled');
              else link.classList.remove('disabled');
            }
          } else {
            clearInterval(resendTimerInterval);
          }
        }, 1000);

        render();
        showToast('Code Sent', data.message);
      }catch(err){
        state.recoveryError=err.message || "We couldn't find an ARANGKADA account with that email or Staff ID.";
        render();
      }
    };
  }

  // STEP 2 OTP Grid & Verify Handler
  const otpGrid=document.getElementById('otpGrid');
  if(otpGrid){
    const boxes=otpGrid.querySelectorAll('.otp-box');
    boxes.forEach((box,idx)=>{
      box.oninput=e=>{
        const val=e.target.value.replace(/\D/g,'');
        e.target.value=val?val[0]:'';
        if(val){
          box.classList.add('filled');
          if(idx<5 && boxes[idx+1]) boxes[idx+1].focus();
        } else {
          box.classList.remove('filled');
        }
      };
      box.onkeydown=e=>{
        if(e.key==='Backspace' && !box.value && idx>0 && boxes[idx-1]){
          boxes[idx-1].focus();
        }
      };
      box.onpaste=e=>{
        e.preventDefault();
        const pasteData=(e.clipboardData || window.clipboardData).getData('text');
        const digits=pasteData.replace(/\D/g,'').slice(0,6);
        digits.split('').forEach((d,i)=>{
          if(boxes[i]){
            boxes[i].value=d;
            boxes[i].classList.add('filled');
          }
        });
        if(digits.length>0){
          const targetIdx=Math.min(digits.length, 5);
          boxes[targetIdx].focus();
        }
      };
    });
  }

  const autofillBtn=document.getElementById('autofillOtpBtn');
  if(autofillBtn){
    autofillBtn.onclick=()=>{
      const code=state.recoveryCodePreview || '';
      const boxes=document.querySelectorAll('#otpGrid .otp-box');
      code.split('').forEach((d,i)=>{
        if(boxes[i]){
          boxes[i].value=d;
          boxes[i].classList.add('filled');
        }
      });
      if(boxes[5]) boxes[5].focus();
    };
  }

  const resendLink=document.getElementById('resendCodeLink');
  if(resendLink){
    resendLink.onclick=async()=>{
      if(state.resendCountdown>0) return;
      try{
        const data=await api('/api/auth/forgot-password',{
          method:'POST',
          body:JSON.stringify({email:state.recoveryEmail})
        });
        state.recoveryCodePreview=data.resetCode;
        state.recoveryError='';
        state.resendCountdown=45;
        render();
        showToast('New Code Sent', data.message);
      }catch(err){
        showToast('Resend Failed', err.message);
      }
    };
  }

  const otpVerifyForm=document.getElementById('otpVerifyForm');
  if(otpVerifyForm){
    otpVerifyForm.onsubmit=async e=>{
      e.preventDefault();
      state.recoveryError='';
      const boxes=document.querySelectorAll('#otpGrid .otp-box');
      const code=Array.from(boxes).map(b=>b.value.trim()).join('');
      if(code.length!==6 || !/^\d{6}$/.test(code)){
        state.recoveryError='Please enter all 6 digits of the verification code.';
        render();
        return;
      }
      try{
        await api('/api/auth/verify-recovery-code',{
          method:'POST',
          body:JSON.stringify({email:state.recoveryEmail,code})
        });
        state.verifiedCode=code;
        state.recoveryStep=3;
        state.recoveryError='';
        if(resendTimerInterval) clearInterval(resendTimerInterval);
        render();
        showToast('Identity Verified','Please create your new password.');
      }catch(err){
        state.recoveryError=err.message || 'Invalid verification code. Please check and try again.';
        render();
      }
    };
  }

  // STEP 3 New Password Form Handler
  const newPasswordForm=document.getElementById('newPasswordForm');
  if(newPasswordForm){
    const tNew=document.getElementById('toggleNewPass');
    if(tNew) tNew.onclick=()=>{const p=document.getElementById('newPasswordInput');p.type=p.type==='password'?'text':'password'};
    const tConf=document.getElementById('toggleConfirmNewPass');
    if(tConf) tConf.onclick=()=>{const p=document.getElementById('confirmNewPasswordInput');p.type=p.type==='password'?'text':'password'};

    const newPwInput=document.getElementById('newPasswordInput');
    const confPwInput=document.getElementById('confirmNewPasswordInput');
    
    function updatePwRules(){
      const p=newPwInput?newPwInput.value:'';
      const c=confPwInput?confPwInput.value:'';

      const validLen=p.length>=8;
      const validUpper=/[A-Z]/.test(p);
      const validLower=/[a-z]/.test(p);
      const validNum=/[0-9]/.test(p);
      const validMatch=validLen && p===c;

      function setRule(id,valid){
        const el=document.getElementById(id);
        if(!el) return;
        const dot=el.querySelector('.pw-rule-dot');
        if(valid){
          el.classList.add('valid');
          if(dot) dot.innerText='✓';
        } else {
          el.classList.remove('valid');
          if(dot) dot.innerText='●';
        }
      }

      setRule('ruleLen',validLen);
      setRule('ruleUpper',validUpper);
      setRule('ruleLower',validLower);
      setRule('ruleNum',validNum);
      setRule('ruleMatch',validMatch);
    }

    if(newPwInput) newPwInput.oninput=updatePwRules;
    if(confPwInput) confPwInput.oninput=updatePwRules;

    newPasswordForm.onsubmit=async e=>{
      e.preventDefault();
      state.recoveryError='';
      const newPassword=document.getElementById('newPasswordInput')?.value || '';
      const confirmPassword=document.getElementById('confirmNewPasswordInput')?.value || '';

      if(newPassword!==confirmPassword){
        state.recoveryError='Passwords do not match. Please ensure both fields match.';
        render();
        return;
      }
      if(newPassword.length<8){
        state.recoveryError='Password must be at least 8 characters long.';
        render();
        return;
      }
      if(!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)){
        state.recoveryError='Password must include at least 1 uppercase letter, 1 lowercase letter, and 1 number.';
        render();
        return;
      }

      try{
        await api('/api/auth/reset-password',{
          method:'POST',
          body:JSON.stringify({
            email:state.recoveryEmail,
            code:state.verifiedCode || state.recoveryCodePreview,
            newPassword
          })
        });
        state.recoveryStep=4;
        state.recoveryError='';
        state.recoveryCodePreview='';
        state.verifiedCode='';
        render();
        showToast('Password Changed','Your password has been updated successfully.');
      }catch(err){
        state.recoveryError=err.message || 'Could not reset password. Please check requirements and try again.';
        render();
      }
    };
  }

  const loginForm=document.getElementById('loginForm'); 
  if(loginForm){
    const tp = document.getElementById('togglePass');
    if(tp) tp.onclick=()=>{
      const p=document.getElementById('password');
      const isPass = p.type === 'password';
      p.type = isPass ? 'text' : 'password';
      tp.innerHTML = isPass ? 
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>' :
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    };
    const fb = document.getElementById('forgotBtn');
    if(fb) fb.onclick=()=>{ 
      state.recoveryStep=1; 
      state.recoveryError=''; 
      if(resendTimerInterval) clearInterval(resendTimerInterval);
      navigate('forgot-password'); 
    };

    const demoBtn = document.getElementById('demoAutoFillBtn');
    if(demoBtn) demoBtn.onclick=()=>{
      const em = document.getElementById('email');
      const pw = document.getElementById('password');
      if(em) em.value = 'maria.santos@arangkada.ph';
      if(pw) pw.value = 'password123';
      showToast('Credentials Populated', 'Demo dispatcher details filled.');
    };
    
    loginForm.onsubmit=async e=>{
      e.preventDefault();
      const email=document.getElementById('email').value.trim();
      const pass=document.getElementById('password').value;
      try{
        const data=await api('/api/auth/login',{method:'POST',body:JSON.stringify({email,password:pass})});
        authToken=data.token;
        currentUser=data.user;
        sessionStorage.setItem('arangkadaToken',authToken);
        sessionStorage.setItem('arangkadaLoggedIn','1');
        sessionStorage.setItem('arangkadaUser',JSON.stringify(data.user));
        state.loggedIn=true;
        await loadServerState();
        navigate('dashboard');
        showToast('Welcome back',`Signed in as ${data.user.name}.`);
      }catch(err){
        showToast('Invalid Sign In',err.message);
      }
    };
  }

  const signupForm=document.getElementById('signupForm'); 
  if(signupForm){
    const tPass=document.getElementById('toggleSignupPass');
    if(tPass) tPass.onclick=()=>{const p=document.getElementById('signupPassword');p.type=p.type==='password'?'text':'password'};
    const tConfirm=document.getElementById('toggleSignupConfirmPass');
    if(tConfirm) tConfirm.onclick=()=>{const p=document.getElementById('signupConfirmPassword');p.type=p.type==='password'?'text':'password'};

    signupForm.onsubmit=async e=>{
      e.preventDefault();
      const name=document.getElementById('signupName').value.trim();
      const staffId=document.getElementById('signupStaffId').value.trim();
      const email=document.getElementById('signupEmail').value.trim();
      const role=document.getElementById('signupRole').value;
      const terminal=document.getElementById('signupTerminal').value;
      const password=document.getElementById('signupPassword').value;
      const confirmPassword=document.getElementById('signupConfirmPassword').value;

      if(password!==confirmPassword){
        showToast('Passwords do not match','Please ensure both password fields match.');
        return;
      }
      if(password.length<6){
        showToast('Password too short','Password must be at least 6 characters long.');
        return;
      }

      try{
        const data=await api('/api/auth/register',{
          method:'POST',
          body:JSON.stringify({name,email,password,role,terminal,staffId})
        });
        authToken=data.token;
        currentUser=data.user;
        sessionStorage.setItem('arangkadaToken',authToken);
        sessionStorage.setItem('arangkadaLoggedIn','1');
        sessionStorage.setItem('arangkadaUser',JSON.stringify(data.user));
        state.loggedIn=true;
        await loadServerState();
        navigate('dashboard');
        showToast('Account Created!',`Welcome to ARANGKADA, ${data.user.name}.`);
      }catch(err){
        showToast('Registration failed',err.message);
      }
    };
  }

  // Action buttons
  document.querySelectorAll('.approve').forEach(b=>b.onclick=async e=>{
    e.stopPropagation();
    const id=b.dataset.id;
    try{
      const data=await api(`/api/requests/${encodeURIComponent(id)}/approve`,{method:'POST'});
      state.requests=data.requests;
      state.queue=data.queue;
      render();
      showToast('Duty Approved',`${id} added to the active departure queue.`);
    }catch(err){
      showToast('Error',err.message);
    }
  });

  document.querySelectorAll('.reject').forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    const id=b.dataset.id;
    openModal(
      'Decline Duty Request',
      `<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">Decline the departure duty request for vehicle <b>${id}</b>?</p><div class="field"><label>Reason</label><textarea id="rejectReason" rows="3" placeholder="e.g. Mechanical review required"></textarea></div>`,
      'Decline Request',
      async()=>{
        try{
          const reason=document.getElementById('rejectReason')?.value||'';
          const data=await api(`/api/requests/${encodeURIComponent(id)}/reject`,{method:'POST',body:JSON.stringify({reason})});
          state.requests=data.requests;
          render();
          showToast('Request Declined',`${id} removed from pending list.`);
        }catch(err){
          showToast('Error',err.message);
        }
      }
    );
  });

  document.querySelectorAll('[data-select-queue]').forEach(x=>x.onclick=()=>{
    state.selectedDriver=x.dataset.selectQueue;
    render();
  });

  document.querySelectorAll('.clear-departure').forEach(b=>b.onclick=async e=>{
    e.stopPropagation();
    const id=b.dataset.id;
    try{
      const data=await api(`/api/queue/${encodeURIComponent(id)}/clear`,{method:'POST'});
      state.queue=data.queue;
      render();
      showToast('Cleared for Departure',`${id} has been authorized to depart the terminal.`);
    }catch(err){
      showToast('Could not clear',err.message);
    }
  });

  const mq=document.getElementById('manageQueue');
  if(mq) mq.onclick=()=>showToast('Queue Sequencing','Queue priority order is managed in real time based on arrival.');

  const rq=document.getElementById('refreshQueue');
  if(rq) rq.onclick=async()=>{
    rq.classList.add('refresh-spin');
    await loadServerState();
    render();
    showToast('Queue Refreshed','Latest live queue loaded from backend.');
  };

  document.querySelectorAll('[data-route-view]').forEach(b=>b.onclick=()=>{state.routeView=b.dataset.routeView;render()});
  document.querySelectorAll('[data-status]').forEach(b=>b.onclick=()=>{state.statusFilter=b.dataset.status;render()});
  document.querySelectorAll('[data-vehicle]').forEach(b=>b.onclick=()=>{state.selectedDriver=b.dataset.vehicle;render();showToast('Vehicle Focused',`${state.selectedDriver} selected on map.`)});
  document.querySelectorAll('[data-select-vehicle]').forEach(b=>b.onclick=()=>{state.selectedDriver=b.dataset.selectVehicle;render()});

  const vjd=document.getElementById('viewJeepDetails');
  if(vjd) vjd.onclick=()=>navigate('driver-details');

  document.querySelectorAll('[data-driver-details]').forEach(b=>b.onclick=()=>{state.selectedDriver=b.dataset.driverDetails;navigate('driver-details')});

  const createAdv=document.getElementById('createAdvisory') || document.getElementById('createAdvFromDash');
  if(createAdv) createAdv.onclick=()=>openModal(
    'Create Transportation Advisory',
    `<div class="field"><label>Advisory Title</label><input id="advTitle" placeholder="e.g. Heavy traffic near Mangaldan"></div><div class="field"><label>Details & Message</label><textarea id="advMsg" rows="4" placeholder="Enter full advisory instructions..."></textarea></div><div class="field"><label>Target Audience</label><select id="advAudience"><option>All Active Drivers</option><option>San Fabian Route Only</option><option>All Terminal Staff</option></select></div>`,
    'Publish Advisory',
    async()=>{
      try{
        const title=document.getElementById('advTitle')?.value.trim();
        const message=document.getElementById('advMsg')?.value.trim();
        const audience=document.getElementById('advAudience')?.value;
        await api('/api/advisories',{method:'POST',body:JSON.stringify({title,message,audience})});
        showToast('Advisory Published','Sent to the fleet corridor network.');
      }catch(err){
        showToast('Could not publish',err.message);
      }
    }
  );

  const msgD=document.getElementById('messageDriver');
  if(msgD) msgD.onclick=()=>openModal(
    'Message Driver',
    `<div class="field"><label>Recipient</label><input id="messageTo" value="Juan Dela Cruz • J-014" disabled style="background:var(--card-sub)"></div><div class="field"><label>Message Content</label><textarea id="messageBody" rows="4" placeholder="Type dispatch instructions..."></textarea></div>`,
    'Send Message',
    async()=>{
      try{
        await api('/api/messages',{method:'POST',body:JSON.stringify({to:document.getElementById('messageTo')?.value||state.selectedDriver,message:document.getElementById('messageBody')?.value||'',type:'direct'})});
        showToast('Message Sent','Transmitted directly to driver terminal.');
      }catch(err){
        showToast('Could not send',err.message);
      }
    }
  );

  const msgDs=document.getElementById('quickMsgDriversBtn');
  if(msgDs) msgDs.onclick=()=>openModal(
    'Broadcast Message to Fleet',
    `<div class="field"><label>Audience</label><select id="broadcastTo"><option>All Active Route Drivers</option><option>At-Terminal Drivers Only</option></select></div><div class="field"><label>Message</label><textarea id="broadcastBody" rows="4" placeholder="Enter operational message..."></textarea></div>`,
    'Transmit Broadcast',
    async()=>{
      try{
        await api('/api/messages',{method:'POST',body:JSON.stringify({to:document.getElementById('broadcastTo')?.value||'All Active Route Drivers',message:document.getElementById('broadcastBody')?.value||'',type:'broadcast'})});
        showToast('Broadcast Sent','Dispatched to all active fleet devices.');
      }catch(err){
        showToast('Could not send',err.message);
      }
    }
  );

  const broadcast=document.getElementById('quickBroadcastBtn');
  if(broadcast) broadcast.onclick=()=>openModal(
    '🚨 Broadcast Emergency Alert',
    `<div class="field"><label>Urgent Alert Details</label><textarea id="alertBody" rows="4" placeholder="Enter emergency corridor warning..."></textarea></div>`,
    'Broadcast Urgent Alert',
    async()=>{
      try{
        await api('/api/messages',{method:'POST',body:JSON.stringify({to:'All Active Staff & Drivers',message:document.getElementById('alertBody')?.value||'',type:'alert'})});
        showToast('Urgent Alert Broadcasted','High-priority alert published.');
      }catch(err){
        showToast('Could not broadcast',err.message);
      }
    }
  );

  const dl=document.getElementById('downloadReportDash');
  if(dl) dl.onclick=()=>{
    const csv='Metric,Value\nTotal Trips Today,15\nCompleted Trips,12\nActive on Route,3\nReported Delays,1\nOn-Time Reliability,98.4%\nReport Generated,San Fabian Terminal';
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download='arangkada-daily-dispatch-summary.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Report Downloaded','Daily summary CSV generated.');
  };

  const md=document.getElementById('markDelayed');
  if(md) md.onclick=async()=>{
    try{
      const data=await api(`/api/vehicles/${encodeURIComponent(state.selectedDriver)}/status`,{method:'PATCH',body:JSON.stringify({status:'Delayed'})});
      state.vehicles=data.vehicles;
      state.driverStatus='Delayed';
      render();
      showToast('Status Updated',`${state.selectedDriver} marked as Delayed.`);
    }catch(err){
      showToast('Error',err.message);
    }
  };

  const mo=document.getElementById('markOut');
  if(mo) mo.onclick=()=>openModal(
    'Mark Out of Service?',
    '<p style="font-size:13px;color:var(--text-muted);line-height:1.6">This jeepney will be taken off the active departure queue until maintenance clearance.</p>',
    'Confirm Out of Service',
    async()=>{
      try{
        const data=await api(`/api/vehicles/${encodeURIComponent(state.selectedDriver)}/status`,{method:'PATCH',body:JSON.stringify({status:'Out of Service'})});
        state.vehicles=data.vehicles;
        state.driverStatus='Out of Service';
        render();
        showToast('Vehicle Offline',`${state.selectedDriver} set to Out of Service.`);
      }catch(err){
        showToast('Error',err.message);
      }
    }
  );

  const ss=document.getElementById('saveSettings');
  if(ss) ss.onclick=async()=>{
    try{
      const displayName=document.getElementById('settingsName')?.value||'Maria Santos';
      const email=document.getElementById('settingsEmail')?.value||'maria.santos@arangkada.ph';
      await api('/api/settings',{method:'PATCH',body:JSON.stringify({displayName,email})});
      showToast('Preferences Saved','Settings successfully updated.');
    }catch(err){
      showToast('Error',err.message);
    }
  };
}

/* ==========================================================================
   RENDER & BOOTSTRAP
   ========================================================================== */
function render(){
  if(!state.loggedIn || state.route==='login' || state.route==='signup' || state.route==='register' || state.route==='forgot' || state.route==='forgot-password' || state.route==='reset-password'){
    if(state.route==='signup' || state.route==='register'){
      app.innerHTML=signupPage();
    }else if(state.route==='forgot' || state.route==='forgot-password' || state.route==='reset-password'){
      app.innerHTML=forgotPasswordPage();
    }else{
      app.innerHTML=loginPage();
    }
    attachEvents();
    return;
  }
  
  let html='';
  switch(state.route){
    case 'dashboard': html=dashboard(); break;
    case 'terminal': html=terminalPage(); break;
    case 'live-map': html=liveMapPage(); break;
    case 'driver-details': html=driverDetailsPage(); break;
    case 'duty-requests': case 'reports': case 'advisories': case 'trip-history': case 'drivers':
      html=tablePage(state.route); break;
    case 'settings': html=settingsPage(); break;
    default: html=dashboard();
  }
  app.innerHTML=html;
  attachEvents();
}

async function bootstrap(){
  if(authToken) await loadServerState();
  render();
}

bootstrap();
