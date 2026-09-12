ARANGKADA FULL-STACK WEBSITE

Requirements:
- Node.js 18 or newer

How to run:
1. Open PowerShell in this folder.
2. Run: npm install
3. Run: npm run dev
4. Open Google Chrome and go to: http://localhost:5500

Demo dispatcher login:
Email: maria.santos@arangkada.ph
Password: password123

Demo admin login:
Email: admin@arangkada.ph
Password: admin123

Backend features included:
- Express API server
- JWT login and staff registration authentication
- Password hashing with bcryptjs
- Persistent demo data stored in data/db.json
- Approve/reject duty requests
- Clear vehicles for departure
- Update vehicle status
- Create advisories
- Send driver/broadcast messages
- Save dispatcher settings

Main API routes:
GET  /api/health
POST /api/auth/login
POST /api/auth/register
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/state
POST /api/requests/:id/approve
POST /api/requests/:id/reject
POST /api/queue/:id/clear
PATCH /api/vehicles/:id/status
POST /api/advisories
POST /api/messages
PATCH /api/settings

Note:
This is a local development backend. data/db.json is used as a simple persistent database for now. For production, replace it with MySQL/PostgreSQL/Supabase and set a secure JWT_SECRET environment variable.
