# TypeFace Personal Finance — Frontend

[DEMO DRIVE LINK](https://drive.google.com/drive/folders/1M3_63Lv_ZFmn6UYgLKQgIkbsfCK4NXfF)

A beautiful, animated **vanilla HTML/CSS/JS** frontend for a personal finance app.  
It talks to a Flask + MongoDB Atlas backend (session cookies; no JWT required).

This doc explains **exactly how to run the frontend**, how it’s wired to the API, what each file does, and how to test imports (receipts & tabular PDFs).

---

## 📦 What’s in this repo (matches your screenshot)
```bash
├─ index.html # Login page
├─ signup.html # Signup page
├─ transaction_guide.md? # (optional helper notes you added)
├─ sample_receipt.pdf # Test: POS/receipt OCR (image/PDF)
├─ sample_receipt_table.pdf # Test: tabular statement PDF
├─ styles/
│ ├─ variable.css # Theme tokens (colors, spacing, radii, fonts)
│ ├─ global.css # Resets, base typography, layout shell
│ ├─ component.css # Buttons, inputs, cards, table, modal, toast
│ ├─ login.css # Auth screen polish
│ └─ dashboard.css # Topbar, KPIs, analytics, uploader, pagination
└─ scripts/
├─ utils.js # DOM helpers, toast(), modal(), debounce(), etc
├─ auth.js # Login & signup POST flows
├─ dashboard.js # Session guard, filters, charts, add/import logic
├─ FileUpload.js # (older helper; now merged via dashboard.js flow)
└─ app.js # (optional bootstrap; safe to keep)
```

> If your filenames differ slightly (e.g. `js/` instead of `scripts/`), the instructions still apply—just ensure the HTML `<script>` tags point to the right paths.

---

## 🚀 Run the Frontend (no build step)

This project is pure static files. Use **Python 3**’s built-in server.

### Option A — Port **5173** (recommended)
```bash
cd <this-frontend-folder>
python3 -m http.server 5173

And open localhost:5173/index.html

🔐 Auth Flow

Signup → POST /api/auth/signup → sets session cookie → redirect dashboard.html
Login → POST /api/auth/login
Check session → GET /api/auth/me (redirects to index.html if none)
Logout → POST /api/auth/logout

📊 Dashboard Features

KPIs: Income, Expenses, Net, Budget Health (+ MoM deltas)
Filters: text search, category, date
Pagination: server-driven
Analytics (Chart.js):
    Doughnut: Expenses by Category
    Line: Income vs Expense per month
    Bar: All-time totals
    Add Transaction form

Import:
Receipt → OCR → modal confirmation → save
Tabular PDF → parse → confirm → save