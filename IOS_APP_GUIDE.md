# Vietnamese Revival Church - Native iOS App & Architecture Guide

---

## 1. How to Fix "Missing Package product CapApp-SPM" in Xcode

When you first open the project in Xcode, Xcode may display:
`Missing Package product CapApp-SPM`

### The 2-Step Fix:
1. **Ensure `node_modules` is installed on your Mac**:
   Capacitor plugins (`@capacitor/local-notifications`) reside in `node_modules`. In Terminal on your Mac, inside the project folder, run:
   ```bash
   npm install
   npm run ios:sync
   ```

2. **Resolve Packages in Xcode**:
   In Xcode's top menu bar:
   - Click **File** ➔ **Packages** ➔ **Resolve Package Versions**
   *(Or **File** ➔ **Packages** ➔ **Reset Package Caches**)*.
   - Xcode will instantly link `CapApp-SPM` and download the official Capacitor Swift dependencies (`capacitor-swift-pm`).
   - Hit **Play (▶ Run)** — it will build and launch successfully!

---

## 2. Refactored Clean Project Architecture

The codebase has been refactored into modular, maintainable layers:

```text
src/
├── vrc-db/                    # DATABASE LAYER
│   ├── schema.ts              # PostgreSQL table definitions & relations
│   └── index.ts               # Connection pool & Drizzle ORM client
│
├── vrc-backend/               # SERVICE & SERVER LAYER
│   ├── app.ts                 # Express application & router mounting
│   ├── routes/                # Modular API endpoints
│   │   ├── authRoutes.ts      # Admin login, sessions, admin user management
│   │   ├── eventRoutes.ts     # Church calendar events & RSVPs
│   │   ├── verseRoutes.ts     # Daily scriptures & pastoral reflections
│   │   ├── notifRoutes.ts     # Push notification feeds
│   │   └── devotionalRoutes.ts# AI devotional assistant
│   ├── services/              # Business logic
│   │   ├── authService.ts     # PBKDF2 password hashing & HMAC session tokens
│   │   ├── notificationService.ts # Server-side notification logger
│   │   └── devotionalService.ts   # Gemini AI pastoral reflection generator
│   └── middleware/            # Security & error handling
│       ├── authMiddleware.ts  # requireAdmin route protection
│       ├── securityMiddleware.ts # Rate limiting (brute force protection) & CORS
│       └── errorHandler.ts    # Safe error reporting (hides DB internals)
│
├── vrc-frontend/              # UI & CLIENT LAYER
│   ├── components/            # Reusable UI components
│   │   ├── Navbar.tsx         # Responsive header (VRC/HTTLVN on mobile)
│   │   ├── IosTabBar.tsx      # Native iOS bottom tab bar
│   │   ├── EventsSection.tsx  # iOS pill carousel filter & event cards
│   │   ├── DailyVerseCard.tsx # Daily verse card, TTS audio & archive
│   │   ├── ChurchInfoSection.tsx # Tempe, AZ worship times & location
│   │   ├── AdminPortal.tsx    # Admin dashboard (events, verses, admin accounts)
│   │   ├── AdminLoginModal.tsx# Custom admin login credentials modal
│   │   └── AnnouncementBar.tsx# Church banner announcements
│   ├── context/               # State management
│   │   ├── AuthContext.tsx    # Admin credentials & session token
│   │   └── LanguageContext.tsx# Bilingual EN (default) / VI translation engine
│   ├── services/
│   │   └── notificationClient.ts # Client notification triggers (iOS & Web)
│   ├── utils/
│   │   ├── api.ts             # Dynamic API base routing
│   │   └── calendar.ts        # Google Calendar & Apple .ics export
│   └── types/
│       └── index.ts           # TypeScript interfaces (Event, Verse, Admin, Notif)
│
├── App.tsx                    # Clean root view connecting vrc-frontend
└── server.ts                  # Server entry importing vrc-backend/app.ts
```

---

## 3. Security Hardening Review

- **Brute Force Protection**: Added sliding-window rate limiting (`authRateLimiter`) on `/api/auth/login` and `/api/auth/change-password` (max 15 attempts per 15 minutes per IP).
- **PBKDF2 Password Hashing**: Passwords hashed with **SHA-512** using **100,000 iterations** and **32-byte cryptographic salts**.
- **Timing-Safe Equality**: Verification uses `crypto.timingSafeEqual` to eliminate timing attacks.
- **HMAC Session Tokens**: Cryptographically signed tokens with expiration checks (`exp`) that survive server restarts.
- **Error Masking**: Database schema errors or stack traces are never sent to clients in production.
- **CORS Protection**: CORS middleware permits requests from iOS Capacitor apps and approved domains while blocking unauthorized origins.
