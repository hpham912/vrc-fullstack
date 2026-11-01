# Vietnamese Revival Church - Native iOS App Guide

This application is packaged and Xcode-ready using **Capacitor 8**.

---

## 1. Quick Start in Xcode (Mac)

### Prerequisites
- macOS with **Xcode** (Version 15 or 16) installed from the Mac App Store.
- Node.js 20+ installed.

### Opening the Project in Xcode
From this project directory, run:
```bash
npm run ios:open
```
*(Or manually open the file: `ios/App/App.xcodeproj` in Xcode).*

---

## 2. Running on iOS Simulator or Physical iPhone

1. In Xcode, select your target device from the top toolbar:
   - **Simulator**: e.g., *iPhone 16 Pro* or *iPhone 15*
   - **Physical Device**: Connect your iPhone with a USB-C / Lightning cable and select your device.
2. Click the **Play (▶ Run)** button (or press `Cmd + R`).
3. The app will launch with:
   - Native iOS Status Bar & Safe Area Insets.
   - Native iOS Bottom Tab Bar (`Events`, `Scripture`, `Schedule`, `Admin`).
   - Smooth iOS segmented controls and card interactions.
   - Full live database connection to your Google Cloud SQL PostgreSQL backend.

---

## 3. Administrator Credentials
- **Username**: `admin`
- **Password**: `Vrc2026`

Admins can post events, draft daily devotionals, and provision new administrator accounts directly from within the app.

---

## 4. Syncing Future Updates to iOS
Whenever you make web changes, simply run:
```bash
npm run ios:sync
```
This builds the latest web assets (`dist/`) and syncs them directly into the Xcode iOS bundle (`ios/App/App/public`).
