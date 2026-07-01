# CEBAR

A premium, high-fidelity **React + Vite** dashboard built to display and analyze budget allocation, expenditure, and revenue figures from the Supabase database.

## Features

1. **Budget Report View**:
   - Computes total allotted budgets using the formula `Allotted Budget (A) + Reallotted Budget (B) - Distributed Budget (C) - Transferred Budget (D) + Re-Appropritaion Receipt (E) - Re-Appropritaion Transferred (F) + Reserved Budget (G)`.
   - Aggregates actual expenditures from the `e-Lekha` table by matching the office name.
   - Highlights variance with color-coded badges (e.g. Critical Over-Budget alert > 100%, Warning 85-100%, Safe < 85%).
2. **e-Lekha Report View**:
   - A server-side paginated grid of transactions supporting 174,000+ records.
   - Search input and columns filters (Region, DDO Code, HOA).
3. **Vertical Revenue View**:
   - Select a Head of Account (HOA Code) and view consolidated receipts, payments, and net revenues grouped by DDO code.
4. **General Controls**:
   - Month-level filter (All Months, April 2026, May 2026) that dynamically filters all views.
   - Dark mode / Light mode theme toggling.

## How to Run Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (which includes `npm`) installed.

### Setup and Running
1. Open your terminal and navigate to the project folder:
   ```bash
   cd midas-dashboard
   ```
2. Install the required packages:
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:3000` (or the port specified in the terminal).

---

## How to Push to GitHub

To push this codebase to a new repository on GitHub:

1. Open your terminal in the `midas-dashboard` folder.
2. Initialize Git:
   ```bash
   git init
   ```
3. Stage and commit the files:
   ```bash
   git add .
   git commit -m "feat: Add MIDAS dashboard codebase in React"
   ```
4. Create a repository on GitHub (e.g. `midas-dashboard`).
5. Link it to your local git folder:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   ```
6. Rename the default branch and push:
   ```bash
   git branch -M main
   git push -u origin main
   ```
