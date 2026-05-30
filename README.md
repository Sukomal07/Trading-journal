# Gold Journal — Forex Trading Tracker

A professional, self-hosted trading journal built for XAUUSD (gold) traders. Track trades, analyze performance, manage risk, and maintain discipline — all in a sleek, dark-themed web app.

---

## Features

- **Trade Journal** — Log every trade with entry, exit, setup, session, emotion, screenshots, and tags.
- **Dashboard** — Real-time account balance, win rate, profit factor, equity curve, and 14-day PnL chart.
- **Risk Calculator** — Auto-calculate lot size, stop loss, and take profit based on your risk % and R:R ratio.
- **Kill Switch** — Daily risk guardrails that warn you when you hit your max loss or max trades for the day.
- **Balance Tracker** — Record deposits and withdrawals with automatic balance adjustment.
- **Analytics** — Break down performance by setup, session, emotion, and time.
- **Settings** — Customize account balance, risk per trade, max daily loss, broker, and trading name.
- **Data Reset** — One-click clear all trades and balance history while keeping settings.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js](https://nextjs.org/) 16 (App Router) |
| UI | React 19, Tailwind CSS 4, CSS-in-JS |
| Charts | [Recharts](https://recharts.org/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Database | SQLite (via [Prisma](https://prisma.io/)) |
| ORM | Prisma 7 |
| Runtime | Node.js / Bun |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) or Node.js 20+

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd trading-journal

# Install dependencies
bun install

# Set up the database
bunx prisma migrate dev --name init

# Generate Prisma client
bunx prisma generate

# Start the development server
bun run dev
```

The app will be available at `http://localhost:3000`.

### Build for Production

```bash
bun run build
bun run start
```

---

## Project Structure

```
trading-journal/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── trades/route.ts       # Trade CRUD + P&L calculation
│   │   ├── balance/route.ts      # Deposit / withdrawal tracking
│   │   ├── settings/route.ts     # User settings
│   │   └── reset/route.ts        # Data reset
│   ├── dashboard/page.tsx        # Dashboard view
│   ├── journal/page.tsx          # Trade journal view
│   ├── analytics/page.tsx        # Performance analytics
│   ├── calculator/page.tsx       # Risk calculator + balance tracker
│   ├── settings/page.tsx         # Settings editor
│   ├── page.tsx                  # Redirects to /dashboard
│   ├── layout.tsx                # Root layout + fonts
│   └── globals.css               # Global styles + CSS variables
├── components/
│   └── TradingApp.tsx            # Main UI component (all views)
├── lib/
│   ├── db.ts                     # Database CRUD helpers
│   ├── prisma.ts                 # Prisma client singleton
│   └── types.ts                  # Shared TypeScript types
├── prisma/
│   └── schema.prisma             # Database schema
├── CORE_LOGIC.md                 # Detailed business logic docs
└── package.json
```

---

## Core Concepts

### Trade Lifecycle

1. **Open Trade** — Enter symbol, direction, entry price, lot size, stop loss, and take profit. The trade is marked `OPEN`.
2. **Close Trade** — Add the `exitPrice`. The server auto-calculates **PnL**, **pips**, **result** (WIN/LOSS/BREAKEVEN), and **R:R ratio**.
3. **Review** — Tag trades, attach screenshots, and log emotions for post-trade analysis.

### Risk Management

- **Risk Per Trade** — Default is `2%` of account balance.
- **Max Daily Loss** — Default is `6%` of account balance.
- **Max Daily Trades** — Auto-calculated as `floor(maxDailyLoss / riskPerTrade)`.
- **Kill Switch** — Triggers when daily loss limit or max trades are hit.

### P&L Calculation (XAUUSD)

- 1 pip = `$0.10` on a `0.01` lot.
- `PnL = pips * $0.10 * (lotSize / 0.01)`

For a full breakdown of formulas and rules, see [**CORE_LOGIC.md**](./CORE_LOGIC.md).

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/trades?status=&date=` | List trades (filtered) |
| `POST` | `/api/trades` | Create a new trade |
| `PUT` | `/api/trades` | Update an existing trade |
| `DELETE` | `/api/trades?id=` | Delete a trade |
| `GET` | `/api/balance` | List balance history |
| `POST` | `/api/balance` | Add deposit or withdrawal |
| `DELETE` | `/api/balance?id=` | Remove a balance entry |
| `GET` | `/api/settings` | Get current settings |
| `PUT` | `/api/settings` | Update settings |
| `POST` | `/api/reset` | Clear all trades & balance history |

---

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./dev.db"
```

SQLite is used by default. The database file is created automatically by Prisma.

---

## Screenshots

> *(Add screenshots of Dashboard, Journal, Calculator, and Analytics here)*

---

## License

MIT

---

## Acknowledgements

- Fonts: [Syne](https://fonts.google.com/specimen/Syne) & [DM Mono](https://fonts.google.com/specimen/DM+Mono) via Google Fonts
- Icons: [Lucide](https://lucide.dev/)
- Charts: [Recharts](https://recharts.org/)
