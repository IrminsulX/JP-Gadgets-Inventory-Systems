# JP Gadgets Inventory System

A web-based inventory management system for JP Gadgets, built with vanilla HTML/CSS/JS frontend and a **Node.js + Express + SQLite** backend.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (vanilla) |
| Backend | Node.js, Express |
| Database | SQLite via `better-sqlite3` |
| Auth | localStorage-based demo login |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open in browser
# http://localhost:3000
```

The database (`jp_ims.db`) is auto-created and seeded with sample data on first run.

## Project Structure

```
├── server.js          # Express backend + SQLite schema + REST API
├── package.json
├── .env.example       # Environment variable template
├── css/
│   ├── styles.css     # Shared styles (auth, nav, modals, toast)
│   ├── dashboard.css  # Dashboard page styles
│   ├── inventory.css  # Inventory page styles
│   ├── sales.css      # Sales page styles
│   └── expenses.css   # Expenses page styles
├── js/
│   ├── common.js      # Shared nav, auth check, toast
│   ├── auth.js        # Login / Signup logic
│   ├── api.js         # Fetch wrapper for REST API
│   └── inventory.js   # Inventory page logic
├── login.html         # Login page
├── signup.html        # Registration page
├── dashboard.html     # Dashboard home
├── inventory.html     # Batch & unit management
├── sales.html         # Sales data
└── expenses.html      # Expense tracking
```

## API Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/batches` | List all batches with items + repairs |
| `POST` | `/api/batches` | Create a batch |
| `PUT` | `/api/batches/:id` | Update batch name/date |
| `DELETE` | `/api/batches/:id` | Delete batch (cascades) |
| `POST` | `/api/batches/:id/items` | Add item to batch |
| `PUT` | `/api/items/:id` | Update item fields |
| `DELETE` | `/api/items/:id` | Delete item |
| `GET` | `/api/items/:id/repairs` | List repairs for item |
| `POST` | `/api/items/:id/repairs` | Add repair record |

## Environment Variables

Copy `.env.example` to `.env` and customize:

```
PORT=3000
```
