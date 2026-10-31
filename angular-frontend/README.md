# Grace & Truth Church App - Angular 21 Frontend

This directory contains the standalone **Angular 21** frontend client designed to connect with either your **Java 21 Spring Boot** backend (`/java-backend`) or your **Node.js PostgreSQL** API.

---

## 1. How to Run Locally

### Prerequisites
- Node.js 20+ installed
- Angular CLI installed globally:
  ```bash
  npm install -g @angular/cli
  ```

### Start Development Server
```bash
cd angular-frontend
npm install
ng serve
```
Open your browser at `http://localhost:4200`.

---

## 2. Features in this Angular 21 App
- **Standalone Components & Angular Signals**: Modern Angular architecture (`signal<ChurchEvent[]>`, `inject(HttpClient)`).
- **Church Events Calendar**: Categorized event cards, search filtering, and RSVP registration modal.
- **Daily Scripture & Reflection**: Verse of the day and pastoral devotionals.
- **Prayer Wall**: Community petitions and praise reports with interactive prayer counters.
- **Admin Portal**: Post new gatherings directly to your database.
- **Tailwind CSS Styling**: Polished, responsive church design.
