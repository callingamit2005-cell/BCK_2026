# Developer Setup Guide - BachatKaro

Complete step-by-step guide to set up BachatKaro for local development.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Running Locally](#running-locally)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)
8. [Next Steps](#next-steps)

---

## Prerequisites

### Required Software

| Software | Version | Purpose | Download |
|----------|---------|---------|----------|
| **Node.js** | 18+ | JavaScript runtime | https://nodejs.org |
| **Git** | 2.40+ | Version control | https://git-scm.com |
| **Bun** (optional) | Latest | Fast package manager | https://bun.sh |

### Recommended Tools

- **VS Code**: https://code.visualstudio.com
- **VS Code Extensions**:
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - TypeScript Vue Plugin
  - Prettier - Code formatter
  - ESLint

### Accounts Required

1. **GitHub** (for repository access)
2. **Supabase** (for backend/database)
3. **Vercel** (optional, for deployment)

---

## Initial Setup

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/BachatKaro.git

# Navigate to project directory
cd BachatKaro

# Verify you're in the correct directory
pwd  # or: cd on Windows to see current path
```

**Expected output**: You should see the `src/`, `supabase/`, `public/` folders.

### Step 2: Install Node.js

#### Option A: Using NVM (Node Version Manager) - **Recommended**

```bash
# Install NVM (one-time setup)
# macOS/Linux:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Windows: Use nvm-windows from https://github.com/coreybutler/nvm-windows

# Install Node.js 18
nvm install 18
nvm use 18

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

#### Option B: Direct Installation

Download and install from https://nodejs.org (LTS version recommended)

```bash
# Verify installation
node --version  # Should show v18+
npm --version   # Should show 9+
```

### Step 3: Install Dependencies

#### Option A: Using Bun (Faster) - **Recommended**

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies using Bun
bun install

# Verify installation
bun --version
```

#### Option B: Using npm

```bash
# Install dependencies
npm install

# Verify installation
npm --version
```

**Expected time**: 2-5 minutes depending on internet speed.

---

## Environment Configuration

### Step 1: Create Environment File

```bash
# Copy example environment file
cp .env.local.example .env.local

# Or create it manually
touch .env.local
```

### Step 2: Get Supabase Credentials

1. Go to https://app.supabase.com
2. Create a new project or use existing one
3. Go to **Settings → API** (or **Project Settings → API**)
4. Copy the following:
   - **Project URL**: `VITE_SUPABASE_URL`
   - **Anon Key**: `VITE_SUPABASE_ANON_KEY`

### Step 3: Configure Environment Variables

Edit `.env.local` and add:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Analytics (can be disabled)
VITE_ENABLE_ANALYTICS=false

# Optional: API endpoints
VITE_API_URL=http://localhost:54321
```

**Security Note**: Never commit `.env.local` to Git. It's in `.gitignore`.

### Step 4: Verify Environment

```bash
# On macOS/Linux:
cat .env.local

# On Windows:
type .env.local
```

You should see your Supabase credentials.

---

## Database Setup

### Step 1: Connect to Supabase

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Log in to Supabase
supabase login
# Follow the prompts and paste your access token
```

### Step 2: Link Local Project to Supabase

```bash
# If you don't have a local Supabase setup already
supabase link --project-ref your-project-id

# Your project ID is in your Supabase dashboard URL:
# https://app.supabase.com/project/YOUR-PROJECT-ID
```

### Step 3: Run Database Migrations

```bash
# Push all migrations to your Supabase database
supabase db push

# Verify migrations were applied
# Go to Supabase Studio → SQL Editor → Check recent migrations
```

### Step 4: Verify Database Connection

```bash
# Test the connection by starting the app
# You'll know it works when you can log in
```

---

## Running Locally

### Start Development Server

#### Using Bun

```bash
# Start development server
bun run dev

# Expected output:
# ✓ ready in 123ms
#
#   ➜  Local:   http://localhost:5173/
#   ➜  press h to show help
```

#### Using npm

```bash
# Start development server
npm run dev
```

### Access the Application

1. Open browser
2. Go to `http://localhost:5173/`
3. You should see the BachatKaro login page

### Hot Module Replacement (HMR)

- Changes to files automatically reload in browser
- Your edits appear instantly without page refresh
- Component state is preserved in some cases

### Stop Development Server

Press `Ctrl+C` in the terminal.

---

## Verification

### Step 1: Test Authentication

1. Click "Sign Up"
2. Enter test email: `test@example.com`
3. Enter password: `TestPassword123!`
4. Click Sign Up
5. You should see a verification email message

### Step 2: Create Test Account

If you can't verify email locally:

1. Go to Supabase Studio (supabase.com → your project)
2. Navigate to **Authentication → Users**
3. Create user manually with email/password
4. Confirm email (mark as verified)

### Step 3: Log In to App

1. Return to app at `http://localhost:5173/`
2. Click "Log In"
3. Use your test credentials
4. You should be redirected to Dashboard

### Step 4: Test a Feature

1. Click "Add Expense" button
2. Enter test data (name, amount)
3. Click "Save"
4. You should see your expense on Dashboard

### Step 5: Check Browser Console

Open browser DevTools (`F12` or `Cmd+Option+I`):

1. Go to **Console** tab
2. There should be NO red errors
3. You may see yellow warnings (these are OK)

---

## Troubleshooting

### Issue: "Cannot find module '@/...'"

**Solution**:
- Vite uses path aliases defined in `tsconfig.json`
- Make sure `vite.config.ts` has the correct alias configuration
- Restart dev server with `Ctrl+C` and `bun run dev` again

### Issue: Database Connection Error

**Solution**:
```bash
# Verify your .env.local has correct credentials
grep VITE_SUPABASE .env.local

# Check Supabase is running (if using local setup)
supabase status

# Restart Supabase connection
supabase link --project-ref your-project-id
```

### Issue: "Port 5173 already in use"

**Solution**:
```bash
# Option 1: Kill process using port 5173
# macOS/Linux:
lsof -i :5173
kill -9 <PID>

# Option 2: Use different port
bun run dev -- --port 3000
# Then access at http://localhost:3000
```

### Issue: npm/bun commands not found

**Solution**:
```bash
# Verify Node.js installation
node --version
npm --version
bun --version

# If not found, install from https://nodejs.org
# Or restart your terminal after installation
```

### Issue: TypeScript errors in editor

**Solution**:
```bash
# Rebuild TypeScript
bun run build
# or
npm run build

# If still not working, restart VS Code editor
```

### Issue: Hot reload not working

**Solution**:
```bash
# Kill dev server
Ctrl+C

# Clear cache
rm -rf node_modules/.vite  # macOS/Linux
rmdir /s node_modules\.vite  # Windows

# Restart
bun run dev
```

### Issue: Cannot connect to Supabase

**Solution**:
1. Check `.env.local` has correct credentials
2. Go to https://app.supabase.com and validate keys still exist
3. Check Supabase project is not paused
4. Verify internet connection
5. Check firewall isn't blocking Supabase

---

## Development Workflow

### Daily Workflow

1. Start day:
   ```bash
   git pull origin develop
   bun install  # in case dependencies changed
   bun run dev
   ```

2. Create feature branch:
   ```bash
   git checkout -b feature/my-feature
   ```

3. Make changes and test locally

4. Run linting and tests:
   ```bash
   bun run lint
   bun run test
   ```

5. Commit and push:
   ```bash
   git add .
   git commit -m "feat: added my feature"
   git push origin feature/my-feature
   ```

6. Create Pull Request on GitHub

### Testing Locally

```bash
# Run all tests once
bun run test

# Run tests in watch mode
bun run test:watch

# Run specific test file
bun run test -- filename.test.ts
```

### Linting Code

```bash
# Check for linting issues
bun run lint

# Fix auto-fixable issues
bun run lint -- --fix
```

### Build for Production

```bash
# Create optimized production build
bun run build

# Output goes to dist/ folder
# This is what gets deployed to Vercel
```

---

## Database Operations

### View Database

1. Go to Supabase Dashboard
2. Click **SQL Editor**
3. Run queries to explore tables

### Create New Table

```sql
-- In Supabase SQL Editor
CREATE TABLE my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Enable RLS if needed
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
```

### Export Data

1. Go to Supabase Studio
2. Click **Database → Backups**
3. Download backup file

---

## VS Code Setup

### Recommended Extensions

Install from VS Code Extensions Marketplace:

1. **ES7+ React/Redux/React-Native snippets**
   - Publisher: dsznajder
   
2. **Tailwind CSS IntelliSense**
   - Publisher: bradlc

3. **TypeScript Vue Plugin**
   - Publisher: Vue

4. **Prettier - Code formatter**
   - Publisher: esbenp

5. **ESLint**
   - Publisher: dbaeumer

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src",
      "sourceMapPathOverride": {
        "webpack:///./~/*": "${workspaceFolder}/node_modules/*",
        "webpack:///../*/src/*": "${workspaceFolder}/src/*"
      }
    }
  ]
}
```

---

## Next Steps

1. ✅ Complete setup
2. 👉 Read [DEVELOPER_README.md](DEVELOPER_README.md) for overview
3. 👉 Read [ARCHITECTURE.md](ARCHITECTURE.md) for design patterns
4. 👉 Read [COMPONENTS.md](COMPONENTS.md) for component library
5. 👉 Make your first contribution!

---

## Common Commands Reference

| Command | Purpose |
|---------|---------|
| `bun install` | Install dependencies |
| `bun run dev` | Start dev server |
| `bun run build` | Build for production |
| `bun run preview` | Preview production build |
| `bun run test` | Run tests |
| `bun run test:watch` | Run tests in watch mode |
| `bun run lint` | Check code style |
| `git status` | Check changed files |
| `git add .` | Stage all changes |
| `git commit -m "msg"` | Commit with message |
| `git push origin branch` | Push branch to GitHub |

---

## Helpful Resources

- **Supabase CLI Docs**: https://supabase.com/docs/guides/cli
- **Vite Documentation**: https://vitejs.dev/guide/
- **React Documentation**: https://react.dev
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs/installation

---

## Getting Help

If you get stuck:

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Read relevant documentation file
3. Check project GitHub issues/discussions
4. Ask team members or create GitHub discussion

---

**Ready to code? Start with [DEVELOPER_README.md](DEVELOPER_README.md) next!**

*Last Updated: February 27, 2026*
