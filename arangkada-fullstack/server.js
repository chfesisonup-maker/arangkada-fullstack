const express = require('express');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5500;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-arangkada-secret-before-production';
const DB_PATH = path.join(__dirname, 'data', 'db.json');

app.use(express.json({ limit: '1mb' }));

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

const defaultUsers = [
  {
    id: 'staff-001',
    name: 'Maria Santos',
    role: 'dispatcher',
    email: 'maria.santos@arangkada.ph',
    staffId: 'D-SP-001',
    terminal: 'San Fabian Terminal',
    passwordHash: bcrypt.hashSync('password123', 10)
  },
  {
    id: 'admin-001',
    name: 'ARANGKADA Admin',
    role: 'admin',
    email: 'admin@arangkada.ph',
    staffId: 'ADM-001',
    terminal: 'System Administration',
    passwordHash: bcrypt.hashSync('admin123', 10)
  }
];

function getAllUsers() {
  const db = readDb();
  if (!Array.isArray(db.users) || db.users.length === 0) {
    db.users = [...defaultUsers];
    writeDb(db);
  }
  return db.users;
}

function publicUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'ARANGKADA API' });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role = 'dispatcher', terminal = 'San Fabian Terminal', staffId } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanName = String(name).trim();
  const cleanStaffId = (staffId && String(staffId).trim()) 
    ? String(staffId).trim().toUpperCase() 
    : `D-SP-${Math.floor(100 + Math.random() * 900)}`;

  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const db = readDb();
  if (!Array.isArray(db.users) || db.users.length === 0) {
    db.users = [...defaultUsers];
  }

  const existing = db.users.find(u =>
    u.email.toLowerCase() === cleanEmail || u.staffId.toUpperCase() === cleanStaffId
  );

  if (existing) {
    return res.status(400).json({ error: 'An account with this email or Staff ID already exists.' });
  }

  const newUser = {
    id: `staff-${Date.now()}`,
    name: cleanName,
    role: role || 'dispatcher',
    email: cleanEmail,
    staffId: cleanStaffId,
    terminal: terminal || 'San Fabian Terminal',
    passwordHash: bcrypt.hashSync(String(password), 10)
  };

  db.users.push(newUser);
  writeDb(db);

  const token = jwt.sign(
    { sub: newUser.id, name: newUser.name, role: newUser.role, email: newUser.email },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.status(201).json({ token, user: publicUser(newUser) });
});

app.post('/api/auth/signup', (req, res) => {
  // Alias for /api/auth/register
  req.url = '/api/auth/register';
  app._router.handle(req, res);
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email/Staff ID and password are required.' });
  }

  const identity = String(email).trim().toLowerCase();
  const users = getAllUsers();
  const user = users.find(u =>
    u.email.toLowerCase() === identity || u.staffId.toLowerCase() === identity
  );

  if (!user || !bcrypt.compareSync(String(password), user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email/Staff ID or password.' });
  }

  const token = jwt.sign(
    { sub: user.id, name: user.name, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, user: publicUser(user) });
});

function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [username, domain] = email.split('@');
  if (username.length <= 2) {
    return `${username[0]}******@${domain}`;
  }
  return `${username[0]}******${username[username.length - 1]}@${domain}`;
}

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Email or Staff ID is required.' });
  }

  const identity = String(email).trim().toLowerCase();
  const db = readDb();
  if (!Array.isArray(db.users) || db.users.length === 0) {
    db.users = [...defaultUsers];
  }

  const userIndex = db.users.findIndex(u =>
    (u.email.toLowerCase() === identity || u.staffId.toLowerCase() === identity) &&
    (u.role === 'dispatcher' || u.role === 'admin')
  );

  if (userIndex === -1) {
    return res.status(404).json({ error: "We couldn't find an ARANGKADA account with that email or Staff ID." });
  }

  const user = db.users[userIndex];
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  user.resetToken = {
    code: resetCode,
    expiresAt,
    verified: false
  };

  writeDb(db);

  const maskedEmail = maskEmail(user.email);

  res.json({
    ok: true,
    message: `We sent a 6-digit verification code to ${maskedEmail}`,
    email: user.email,
    maskedEmail,
    staffId: user.staffId,
    name: user.name,
    resetCode // available for demo preview / auto-fill
  });
});

app.post('/api/auth/verify-recovery-code', (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
  }

  const cleanCode = String(code).trim();
  if (!/^\d{6}$/.test(cleanCode)) {
    return res.status(400).json({ error: 'Verification code must be exactly 6 digits.' });
  }

  const identity = String(email).trim().toLowerCase();
  const db = readDb();
  const user = (db.users || []).find(u =>
    u.email.toLowerCase() === identity || u.staffId.toLowerCase() === identity
  );

  if (!user || !user.resetToken || !user.resetToken.code) {
    return res.status(400).json({ error: 'No active recovery request found. Please request a new code.' });
  }

  if (Date.now() > user.resetToken.expiresAt) {
    delete user.resetToken;
    writeDb(db);
    return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
  }

  if (String(user.resetToken.code).trim() !== cleanCode) {
    return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
  }

  user.resetToken.verified = true;
  writeDb(db);

  res.json({
    ok: true,
    message: 'Verification code confirmed successfully.'
  });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, code, newPassword } = req.body || {};
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, verification code, and new password are required.' });
  }

  const pw = String(newPassword);
  const hasMinLen = pw.length >= 8;
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);

  if (!hasMinLen || !hasUpper || !hasLower || !hasNumber) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, and 1 number.'
    });
  }

  const identity = String(email).trim().toLowerCase();
  const db = readDb();
  const userIndex = (db.users || []).findIndex(u =>
    u.email.toLowerCase() === identity || u.staffId.toLowerCase() === identity
  );

  if (userIndex === -1) {
    return res.status(404).json({ error: 'Staff account not found.' });
  }

  const user = db.users[userIndex];
  if (!user.resetToken || !user.resetToken.code) {
    return res.status(400).json({ error: 'No active password reset request found. Please request a new code.' });
  }

  if (Date.now() > user.resetToken.expiresAt) {
    delete user.resetToken;
    writeDb(db);
    return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
  }

  if (String(user.resetToken.code).trim() !== String(code).trim()) {
    return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
  }

  user.passwordHash = bcrypt.hashSync(pw, 10);
  delete user.resetToken;
  writeDb(db);

  res.json({
    ok: true,
    message: 'Your password has been updated. You can now sign in using your new password.',
    user: publicUser(user)
  });
});

app.get('/api/state', auth, (req, res) => {
  const db = readDb();
  res.json({
    requests: db.requests,
    queue: db.queue,
    vehicles: db.vehicles,
    settings: db.settings,
    advisories: db.advisories,
    messages: db.messages
  });
});

app.post('/api/requests/:id/approve', auth, (req, res) => {
  const db = readDb();
  const index = db.requests.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Duty request not found.' });

  const [request] = db.requests.splice(index, 1);
  if (!db.queue.some(q => q.id === request.id)) {
    db.queue.push({
      pos: db.queue.length + 1,
      id: request.id,
      plate: request.plate,
      name: request.name,
      status: 'Waiting',
      clear: 'In line'
    });
  }
  db.queue = db.queue.map((q, i) => ({ ...q, pos: i + 1 }));
  writeDb(db);
  res.json({ ok: true, request, requests: db.requests, queue: db.queue });
});

app.post('/api/requests/:id/reject', auth, (req, res) => {
  const db = readDb();
  const index = db.requests.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Duty request not found.' });
  const [request] = db.requests.splice(index, 1);
  writeDb(db);
  res.json({ ok: true, request, reason: req.body?.reason || '', requests: db.requests });
});

app.post('/api/queue/:id/clear', auth, (req, res) => {
  const db = readDb();
  const q = db.queue.find(item => item.id === req.params.id);
  if (!q) return res.status(404).json({ error: 'Queue entry not found.' });
  q.status = 'Ready';
  q.clear = 'CLEARED';
  writeDb(db);
  res.json({ ok: true, queue: db.queue, item: q });
});

app.patch('/api/vehicles/:id/status', auth, (req, res) => {
  const db = readDb();
  const vehicle = db.vehicles.find(v => v.id === req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });

  const allowed = ['On the Way', 'Delayed', 'Out of Service', 'At Terminal'];
  const status = req.body?.status;
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid vehicle status.' });
  }

  vehicle.status = status;
  if (status === 'Delayed') {
    vehicle.color = 'red';
    vehicle.speed = 'Stopped';
  } else if (status === 'Out of Service') {
    vehicle.color = 'red';
    vehicle.speed = 'Offline';
  } else if (status === 'On the Way') {
    vehicle.color = 'green';
    if (vehicle.speed === 'Stopped' || vehicle.speed === 'Offline') vehicle.speed = '45 km/h';
  } else if (status === 'At Terminal') {
    vehicle.color = 'orange';
    vehicle.speed = '0 km/h';
  }

  writeDb(db);
  res.json({ ok: true, vehicle, vehicles: db.vehicles });
});

app.post('/api/advisories', auth, (req, res) => {
  const { title, message, audience } = req.body || {};
  if (!title || !message) return res.status(400).json({ error: 'Title and message are required.' });

  const db = readDb();
  const advisory = {
    id: `ADV-${Date.now()}`,
    title: String(title).trim(),
    message: String(message).trim(),
    audience: audience || 'All drivers',
    createdBy: req.user.name,
    createdAt: new Date().toISOString()
  };
  db.advisories.unshift(advisory);
  writeDb(db);
  res.status(201).json({ ok: true, advisory });
});

app.post('/api/messages', auth, (req, res) => {
  const { to, message, type = 'direct' } = req.body || {};
  if (!to || !message) return res.status(400).json({ error: 'Recipient and message are required.' });

  const db = readDb();
  const item = {
    id: `MSG-${Date.now()}`,
    to,
    message: String(message).trim(),
    type,
    sentBy: req.user.name,
    sentAt: new Date().toISOString()
  };
  db.messages.unshift(item);
  writeDb(db);
  res.status(201).json({ ok: true, message: item });
});

app.patch('/api/settings', auth, (req, res) => {
  const db = readDb();
  const input = req.body || {};
  db.settings = {
    ...db.settings,
    ...input,
    notifications: {
      ...db.settings.notifications,
      ...(input.notifications || {})
    }
  };
  writeDb(db);
  res.json({ ok: true, settings: db.settings });
});

app.post('/api/reset-demo', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
  return res.status(501).json({ error: 'Demo reset endpoint is intentionally disabled.' });
});

app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API route not found.' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log('\n======================================================');
  console.log('  ✦ ARANGKADA — AI Transportation Decision Support');
  console.log('======================================================');
  console.log(`  ➜ Local:   http://localhost:${PORT}`);
  console.log('  ➜ Role:    Terminal Dispatcher & Admin Platform');
  console.log('  ➜ Demo:    maria.santos@arangkada.ph / password123');
  console.log('======================================================\n');
});
