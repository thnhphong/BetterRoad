# BetterRoad Project Structure

```
betterroad/
├── client/                          # React Frontend
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── assets/
│   │   │   └── logo.svg
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   ├── RegisterForm.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Layout.jsx
│   │   │   └── common/
│   │   │       ├── Button.jsx
│   │   │       ├── Input.jsx
│   │   │       └── Card.jsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Roads.jsx
│   │   │   ├── Damages.jsx
│   │   │   └── Tasks.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useApi.js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── authService.js
│   │   ├── utils/
│   │   │   ├── constants.js
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                          # Node.js Backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── supabase.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   ├── upload.js
│   │   │   └── validation.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── company.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── road.routes.js
│   │   │   ├── damage.routes.js
│   │   │   └── task.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── company.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── road.controller.js
│   │   │   ├── damage.controller.js
│   │   │   └── task.controller.js
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   ├── company.service.js
│   │   │   └── email.service.js
│   │   ├── utils/
│   │   │   ├── jwt.js
│   │   │   ├── validation.js
│   │   │   └── response.js
│   │   ├── models/
│   │   │   └── index.js
│   │   └── app.js
│   ├── uploads/                     # File uploads directory
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
├── .gitignore
├── pnpm-workspace.yaml
└── README.md
```

## Setup Instructions

### 1. Root Configuration

**pnpm-workspace.yaml:**
```yaml
packages:
  - 'client'
  - 'server'
```

**Root .gitignore:**
```
node_modules/
.env
.DS_Store
dist/
build/
uploads/*
!uploads/.gitkeep
*.log
.vscode/
.idea/
```

### 2. Installation Commands

```bash
# Install dependencies for all workspaces
pnpm install

# Install client dependencies
cd client && pnpm install

# Install server dependencies
cd server && pnpm install

# Run both concurrently (from root)
pnpm run dev
```

### 3. Package Scripts

**Root package.json:**
```json
{
  "name": "betterroad",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel -r dev",
    "dev:client": "pnpm --filter client dev",
    "dev:server": "pnpm --filter server dev",
    "build": "pnpm -r build",
    "install:all": "pnpm install && pnpm -r install"
  }
}
```

### 4. Environment Files

**client/.env:**
```
VITE_API_URL=http://localhost:5001/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**server/.env:** (as provided in your requirements)

### 5. Key Features Implemented

- ✅ Company registration with Supabase Auth
- ✅ Company login with JWT
- ✅ Protected routes
- ✅ Auth context management
- ✅ RLS policies integration
- ✅ File upload configuration
- ✅ Error handling middleware
- ✅ API service layer
- ✅ Tailwind CSS setup

### 6. Next Steps

1. Set up Supabase project and get credentials
2. Configure environment variables
3. Run migrations on Supabase
4. Install dependencies: `pnpm install`
5. Start development servers: `pnpm run dev`