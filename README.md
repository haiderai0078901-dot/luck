
# RadAssist AI – Smarter NHS Radiology Workflows

A modern, interactive web demo platform that visualizes post-imaging follow-up tracking for NHS radiology departments. Built as a professional NHS-ready SaaS dashboard with live Supabase integration and GitHub data fallback.

## 🏥 Features

- **Dashboard**: Key statistics with charts showing total scans, pending/completed/overdue follow-ups
- **Worklist**: Interactive table with search and filter capabilities for patient follow-ups
- **Reports**: Radiology reports with detailed view modals
- **Alerts**: Real-time monitoring of overdue cases with visual indicators
- **Data Preview**: Admin route showing raw data from active source

## 🔧 Data Sources

### Primary: Supabase Database
The application prioritizes live Supabase data when available.

### Fallback: GitHub Repository
Falls back to synthetic data from: `AI-2025-001-Clean-Synthetic-Dataset-for-Backlog-Demo`

## 📊 Supabase Setup

### 1. Get Supabase Credentials
- Go to your Supabase project
- Navigate to: **Project → Settings → API**
- Copy: **Project URL** and **anon public key**

### 2. Environment Variables
Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 3. Database Schema
Create the following tables in your Supabase database:

```sql
-- Follow-ups table
CREATE TABLE followups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_ref TEXT NOT NULL,
  scan_date DATE NOT NULL,
  action_required TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT CHECK (status IN ('Pending', 'Completed', 'Overdue')) NOT NULL,
  assigned_to TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('Low', 'Medium', 'High')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_ref TEXT NOT NULL,
  patient_ref TEXT NOT NULL,
  scan_type TEXT NOT NULL,
  radiologist TEXT NOT NULL,
  report_date DATE NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff table
CREATE TABLE staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT NOT NULL,
  team TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Row Level Security (RLS)
For demo purposes, you can either:
- **Option A**: Disable RLS (simpler for demo)
- **Option B**: Add read-only policies for anonymous users:

```sql
-- Enable RLS
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access
CREATE POLICY "Allow anonymous read access" ON followups FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON reports FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON staff FOR SELECT USING (true);
```

### 5. Import Sample Data
- Use Supabase Table Editor → Import to load CSV/JSON data
- Or insert sample records manually
- **Important**: Use only synthetic, non-patient identifiable data

## 🚀 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📱 Data Source Behavior

### Console Logs
- **Supabase Success**: `✅ Supabase data loaded (RadAssist AI)`
- **GitHub Fallback**: `✅ GitHub demo data loaded (fallback)`
- **Error**: `⚠️ Data load error; using fallback if available`

### Automatic Fallback
1. Try Supabase connection first
2. If Supabase unavailable/empty → use GitHub data
3. If both fail → show error with cached data if available

## 🔒 Security & Compliance

- All data must remain synthetic and non-patient identifiable
- Environment variables keep API keys secure
- RLS policies control database access
- Demo disclaimer included in footer

## 🎨 Design Standards

- NHS blue color scheme (#005EB8, #E8F0FE)
- Professional typography (Poppins)
- Responsive layout with proper navigation
- Alert badges and status indicators

## 📋 Verification Checklist

- [ ] Supabase environment variables configured
- [ ] Database tables created with correct schema
- [ ] Sample data imported (synthetic only)
- [ ] Dashboard shows live counts from database
- [ ] Console shows "✅ Supabase data loaded (RadAssist AI)"
- [ ] Fallback works when Supabase unavailable
- [ ] Alerts reflect overdue follow-ups from active source
- [ ] Data Preview shows correct source indicator

---

**Demo Disclaimer**: All data shown are synthetic and for demonstration purposes only.

**Footer**: Empowering NHS Radiology Teams – Smarter Follow-ups, Safer Patients.
