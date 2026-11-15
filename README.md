# ScholaMetrics — Indian Student & Faculty Performance Analytics

ScholaMetrics is a multipurpose academic analytics web application built with **semantic HTML5**, **modular CSS3**, and **vanilla ES6+ JavaScript** (zero runtime UI framework dependencies). Tailored for **Indian University CBCS (Choice Based Credit System)** standards, it supports both **Faculty / Mentor** cohort oversight and **Student Self-Service** performance tracking from a single unified dataset.

## Dual-Portal Capabilities

### 1. Faculty & Mentor Portal
- **Cohort Performance Overview**:
  - Live KPI calculations: **Mean & Median CGPA (10.0 CBCS scale)**, **Standard Deviation**, **Pass Rate (≥ 40%)**, **Mean Attendance**, and **Academic Alert Count**.
  - **Semester Assessment Trajectory (SVG)**: Tracks cohort progression across **CIA 1**, **Mid-Sem**, **Lab / Viva**, and **End-Sem** with a `Score (%)` / `CGPA (10.0)` toggle.
  - **CBCS Grade Distribution (SVG)**: Interactive histogram (`O`, `A+`, `A`, `B+`, `B`, `C`, `P`, `F`) with click-to-filter support.
  - **Attendance vs. Aggregate Marks (Canvas)**: Retina-ready scatter plot computing real-time **Pearson correlation ($r$)** and **ordinary least-squares regression ($y = mx + b$)** against the **75% UGC exam eligibility norm**.
  - **Priority Watchlist**: Highlights students facing arrear/backlog risk (`< 40%`) or attendance shortage.
- **Student Roster & Slide-Over Mentor Drawer**:
  - Live search by Roll No (`24CSE101`, `24ECE103`, etc.), student name, or branch, with multi-column sorting.
  - Slide-over drawer with inline editable subject marks & attendance percentage, automated eligibility diagnostics, assessment sparkline, and mentor intervention log (`Remedial Class Referral`, `Attendance Shortage Notice`, `Merit Commendation`).
- **Daily Attendance Register (Roll-Call Collection)**:
  - Accessible via **Mark Attendance** in the top bar or **Attendance Register** in the sidebar.
  - Select **Lecture Date**, **Subject / Practical**, **Department / Branch**, and **Semester** to mark each student as **Present (`P`)**, **Absent (`A`)**, or **On-Duty (`OD`)** (with bulk **Mark All Present** support).
  - Automatically recalculates each student's attended/total class ratio and UGC 75% eligibility, persists saved registers to `localStorage`, and supports reloading/editing past sessions without double-counting.
- **AI Cohort Insights & 1:1 Mentor Briefs (Gemini)**:
  - Server-side `/api/ai/insights` endpoint powered by `@google/genai` (`gemini-4-hydrogen`) synthesizes active filtered cohort metrics, CBCS arrear patterns, and UGC 75% attendance bottlenecks into structured findings and faculty action steps.
  - Inside any student's slide-over drawer, **AI Mentor Brief** produces tailored 1:1 diagnostics and a one-click **Copy to Note Draft** button.
- **Intervention Queue & CSV Management**:
  - Dedicated queue for flagged students, drag-and-drop CSV import with schema validation, filtered CSV export, and printable summary reports.

### 2. Student Self-Service Portal
- **My Academic Dashboard**:
  - Personal **10.0 Semester CGPA**, aggregate percentage, cohort percentile rank, **75% UGC attendance eligibility status**, and enrolled CBCS credits (`1st Year`–`4th Year`).
  - **AI Study & Attendance Coach**: Generates a personalized study roadmap, identifies backlog risks and exact classes needed to meet the 75% UGC norm, and answers target goals (e.g., *"Reach 8.5 CGPA"*).
  - **My Courses vs. Cohort Average**: Visual comparison bars showing personal marks alongside batch averages.
  - **My Assessment Trajectory**: CIA-to-End-Sem progression chart and automated standing diagnostics.
- **What-If CGPA & Grade Simulator**:
  - Interactive sliders for all 5 subjects and attendance to preview projected **10.0 CGPA**, **CBCS letter grade**, arrear/backlog warnings, and UGC exam eligibility without altering official marks.
- **Course Benchmarks (Shared View)**:
  - Subject-level score dispersion, pass rates (`≥ 40%`), and departmental comparisons across `Computer Science & Engg.`, `Electronics & Comm.`, `Mechanical Engg.`, and `Commerce & Economics`.
- **Grade Card, Attendance Log & Mentorship**:
  - Subject-by-subject credit and grade point breakdown, lecture-wise recorded attendance sessions, and a shared mentor communication log.

### 3. Dedicated My Profile & Governance View
- Accessible from both portals via the sidebar (`My Profile`) and the top-bar profile popover (`View & Edit My Profile`).
- **Faculty Mode**: Displays realistic Dean/Mentor portrait, institutional `.ac.in` contact info, cabin & consultation hours (IST), mentorship caseload metrics, and live **CBCS & UGC Regulation Threshold** controls (`40%` pass mark, `55%` alert aggregate, `75%` UGC attendance norm).
- **Student Mode**: Displays student portrait, Roll No, degree programme (`B.Tech` / `B.Com (Hons)`), UGC exam eligibility status, editable campus contact/bio details, and a built-in **Student Account Switcher**.

## Project Structure

```text
├── server.js           # Express server (plain JS) on port 3000 with Vite middleware & /api/ai/insights Gemini route
├── index.html          # Semantic HTML5 shell for Faculty, Student & My Profile views, drawer, and modal
├── css/
│   └── styles.css      # CSS custom properties (light/dark themes), AI insight cards, meters, print styles
├── js/
│   ├── data.js         # 24-student Indian CBCS dataset, faculty profile, thresholds, localStorage persistence
│   ├── analytics.js    # 10.0 CBCS CGPA scale, arrear/UGC diagnostics, Pearson r, regression, CSV parser
│   ├── charts.js       # Custom SVG (line, CBCS bar) and HTML5 Canvas (scatter) visualizations
│   └── app.js          # Dual-portal controller, AI Insights client, profile editor, CGPA simulator
└── README.md           # Project documentation
```

## Indian CBCS Academic Methodology

- **Aggregate Marks**: Arithmetic mean across 5 core subjects (`Data Structures`, `Engg. Mathematics`, `Database Systems`, `Professional Comm.`, `Practical Lab`).
- **10-Point CBCS Grade Scale**:
  - `≥ 90%`: **O** (10.0)
  - `≥ 80%`: **A+** (9.0)
  - `≥ 70%`: **A** (8.0)
  - `≥ 60%`: **B+** (7.0)
  - `≥ 50%`: **B** (6.0)
  - `≥ 45%`: **C** (5.0)
  - `≥ 40%`: **P** (4.0)
  - `< 40%`: **F** (0.0 — Arrear / Backlog)
- **Configurable Standing Rules (Defaults)**:
  - `Academic Alert`: Aggregate `< 55%` OR attendance `< 75%` (UGC exam norm) OR any subject `< 40%` (arrear risk)
  - `Needs Review`: Aggregate `< 68%` OR attendance `< 82%` OR CIA completion `< 80%`
  - `On Track`: All CBCS & UGC thresholds met

## CSV Import Schema

```csv
rollNo,name,email,department,term,year,credits,attendance,completion,dsa,maths,dbms,comm,lab
24CSE201,Vivaan Nair,vivaan.nair@nit-campus.ac.in,Computer Science & Engg.,Odd Sem 2026,3rd Year,22,92,94,89,85,91,84,92
```

## Running Locally

Configure `GEMINI_API_KEY` in your environment (or AI Studio **Settings > Secrets**), then start the Express + Vite server:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

