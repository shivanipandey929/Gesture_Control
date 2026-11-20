# AeroTouch — Touchless AI Hand Gesture Web Studio

AeroTouch is a touchless spatial hand gesture control system that works offline after the first load in modern web browsers. Powered by Google MediaPipe Vision compiled into WebAssembly (WASM), 1€ adaptive filtering, K-Nearest Neighbors custom gesture learning, and offline-first IndexedDB persistence.

<!-- Badges & Links -->
[![CI](https://github.com/shivanipandey/aerotouch/actions/workflows/ci.yml/badge.svg)](https://github.com/shivanipandey/aerotouch/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Demo-Live_Deployment-cyan.svg)](https://aerotouch.vercel.app)

---

## 📸 Media & Demos
- **Live Demo Link**: [https://aerotouch.vercel.app](https://aerotouch.vercel.app) *(Deploy URL placeholder)*
- **Demo Video Walkthrough**: `[Demo Video Placeholder — Coming Soon]`
- **App Screenshots**:
  - Desktop Studio: `![AeroTouch Desktop View](public/screenshots/wide.png)`
  - Mobile Interface: `![AeroTouch Mobile View](public/screenshots/narrow.png)`

---

## 🚀 The Problem It Solves
Traditional computing relies upon continuous physical contact with keyboards, mice, and touchscreens. In many environments, mechanical touch is inconvenient, unhygienic, or impractical:
- **Culinary / Kitchen**: Sticky or wet hands while following interactive recipes and timers.
- **Sterile / Medical**: Cleanrooms and medical settings requiring strict touch avoidance.
- **Presentations & Stages**: Presentation speakers who want natural hand gestures without a physical clicker.
- **Accessibility**: Users with motor impairments or tremors who benefit from dwell-clicking and relaxed timing filters.

AeroTouch turns any standard webcam into a responsive, touchless air controller — operating client-side with zero video data ever leaving the user's computer.

---

## ✨ Features

### 1. Vision & Gesture Pipeline
- **21-Landmark Skeleton Tracking**: Real-time hand keypoint tracking overlaid on video with responsive rendering.
- **1€ (One-Euro) Adaptive Smoothing**: Multi-dimensional frequency filtering eliminating micro-jitter without adding perceptible movement delay.
- **Temporal Stability & Cooldown**: Requires 350 ms of sustained hand hold to confirm static gestures; 600 ms cooldown lockout to eliminate repeat misfires.
- **Wrist Velocity Swiping**: Dynamic sliding-window velocity analyzer ($\Delta x / \Delta t$) recognizing rapid left and right navigational flicks.
- **Custom Gesture Training Studio**: Train custom gestures with 8 rapid samples normalized by wrist position and hand size, powered by an offline KNN Euclidean classifier.

### 2. Workspaces & Specialized Modes
- **Presentation Deck**: Slide viewer controlled with swipes (`Swipe_Right` = Next, `Swipe_Left` = Previous) and clenches (`Closed_Fist` = Play, `Open_Palm` = Pause). Supports PDF upload and slides.
- **Synthesized Media Theater**: Audio/video player with play/pause, continuous volume adjustment (`Thumb_Up` / `Thumb_Down`), and snapshot capture (`Victory ✌`).
- **Long-form Document Reader**: Hands-free smooth auto-scrolling with `Pointing_Up` and `Open_Palm` halt.
- **Virtual Pointer Pad**: Touchless cursor targeting with 1.5-second dwell click and clench clicks.
- **Balloon Popper Practice Arena**: Interactive target-practice game using index finger pointing to burst floating neon balloons.
- **Touchless Kitchen Assistant**: High-contrast, large-font culinary interface where `Open_Palm` halts cooking countdown timers.

### 3. Accessibility & Ergonomics
- **WCAG Compliant Accessibility Mode**: Relaxed gesture hold duration (500 ms), high-contrast theme (`#000000` with cyan borders), large readable typography, and single-hand control.
- **1.5-Second Dwell Click**: Holding the virtual cursor still for 1.5 seconds triggers a click with an animated circular progress ring.
- **3-Minute Ergonomic Fatigue Reminder**: Continuous hand-up tracker alerts the user to rest and relax their shoulder and wrist.
- **Low-End Laptop Mode**: Scales camera down to 320x240 @ 15-20 FPS with a live hardware monitor to save battery and reduce thermal load.

### 4. Offline PWA & Cloud Synchronization
- **Progressive Web App**: Precached assets including WASM binaries and the 8MB float16 neural model (`gesture_recognizer.task`). Operates seamlessly in Airplane Mode after first load.
- **IndexedDB via Dexie**: Local-first storage for user settings, custom gestures, sessions, and telemetry with `synced: false` flags.
- **Supabase Cloud Sync**: Batch uploads telemetry and custom gestures to Supabase when logged in and online.
- **Guest-First Architecture**: Full feature set available instantly without mandatory sign-up.

---

## 🌐 Multi-Language Support (23 Languages)
AeroTouch features comprehensive internationalization (i18n) across 23 languages, including dynamic Google Noto font loading, RTL layout mirroring for Urdu, Sindhi, and Kashmiri, and regional number formatting.

| Language | Code | Script | Translation Review Status |
| :--- | :--- | :--- | :--- |
| **English** | `en` | Latin | Human-verified & Reviewed |
| **Hindi (हिंदी)** | `hi` | Devanagari | Human-verified & Reviewed |
| **Marathi (मराठी)** | `mr` | Devanagari | Human-verified & Reviewed |
| Assamese (অসমীয়া) | `as` | Bengali-Assamese | Machine-translated (`_machine_translated: true`) |
| Bengali (বাংলা) | `bn` | Bengali | Machine-translated (`_machine_translated: true`) |
| Bodo (बड़ो) | `brx` | Devanagari | Machine-translated (`_machine_translated: true`) |
| Dogri (डोगरी) | `doi` | Devanagari | Machine-translated (`_machine_translated: true`) |
| Gujarati (ગુજરાતી) | `gu` | Gujarati | Machine-translated (`_machine_translated: true`) |
| Kannada (ಕನ್ನಡ) | `kn` | Kannada | Machine-translated (`_machine_translated: true`) |
| Kashmiri (کٲشُر) | `ks` | Perso-Arabic (RTL) | Machine-translated (`_machine_translated: true`) |
| Konkani (कोंकणी) | `kok` | Devanagari | Machine-translated (`_machine_translated: true`) |
| Maithili (मैथिली) | `mai` | Devanagari | Machine-translated (`_machine_translated: true`) |
| Malayalam (മലയാളം) | `ml` | Malayalam | Machine-translated (`_machine_translated: true`) |
| Manipuri (মৈতৈলোন্) | `mni` | Meetei Mayek / Bengali | Machine-translated (`_machine_translated: true`) |
| Nepali (नेपाली) | `ne` | Devanagari | Machine-translated (`_machine_translated: true`) |
| Odia (ଓଡ଼ିଆ) | `or` | Odia | Machine-translated (`_machine_translated: true`) |
| Punjabi (ਪੰਜਾਬੀ) | `pa` | Gurmukhi | Machine-translated (`_machine_translated: true`) |
| Sanskrit (संस्कृतम्) | `sa` | Devanagari | Machine-translated (`_machine_translated: true`) |
| Santali (ᱥᱟᱱᱛᱟᱲᱤ) | `sat` | Ol Chiki | Machine-translated (`_machine_translated: true`) |
| Sindhi (سنڌي) | `sd` | Arabic (RTL) | Machine-translated (`_machine_translated: true`) |
| Tamil (தமிழ்) | `ta` | Tamil | Machine-translated (`_machine_translated: true`) |
| Telugu (తెలుగు) | `te` | Telugu | Machine-translated (`_machine_translated: true`) |
| Urdu (اردو) | `ur` | Arabic (RTL) | Machine-translated (`_machine_translated: true`) |

---

## 🔐 Authentication & Sync
- **Email OTP & Confirmation**: Sign up using standard email with 6-digit verification code or email magic link.
- **Google OAuth**: Fast single-click sign-in with Google account.
- **Guest Mode**: Complete local device privacy with zero account registration requirement.
- **Session Persistence**: Stored via secure local storage, restoring sessions automatically upon reload.

---

## 🧪 Testing & Quality Assurance
Unit tests are implemented using **Vitest**:
- **1€ Smoothing Filter**: Verifies initial frame passthrough, micro-jitter damping, and filter reset.
- **Gesture Filter**: Verifies confidence threshold (0.70), 350 ms hold stability, and 600 ms cooldown enforcement.
- **Swipe Detector**: Verifies velocity threshold calculations and directional classification in mirrored coordinate space.
- **KNN Classifier**: Verifies wrist translation invariance, scale invariance, and nearest-neighbor classification.

Run tests:
```bash
npm run test:run
```

---

## 🛠 Tech Stack
- **Framework**: React 19, TypeScript, Vite 8
- **Styling**: Tailwind CSS 3.4, PostCSS, Glassmorphism, Bundled Fontsource Inter & Space Grotesk
- **AI & Vision**: `@mediapipe/tasks-vision` (WebAssembly SIMD Runtime, float16 model)
- **Local Persistence**: `dexie` (IndexedDB Wrapper)
- **Offline / PWA**: `vite-plugin-pwa`, `workbox-window`
- **Cloud & Auth**: `@supabase/supabase-js` (PostgreSQL with Row Level Security)
- **Visualization**: `recharts`
- **Animations & Effects**: `framer-motion`, `canvas-confetti`, `lucide-react`

---

## ⚡ Setup & Local Development

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Webcam**: Standard monocular RGB webcam

### 2. Installation
```bash
git clone <repository-url>
cd Gesture_control
npm install
```

### 3. Environment Variables (Optional)
If you wish to enable cloud synchronization with Supabase, copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```
*(Both legacy JWT anon keys and modern `sb_publishable_` keys are supported).*

### 4. Running the Dev Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Production Build & Offline Preview
```bash
npm run build
npm run preview
```

---

## 🌐 Supabase Database Setup
To set up the cloud database tables and Row Level Security:
1. Navigate to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor** from the left navigation sidebar.
3. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql).
4. Click **Run**. The tables, foreign keys, triggers, and Row Level Security (RLS) policies will be provisioned.

---

## 🚀 Vercel Deployment Instructions
1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/dashboard), click **Add New Project** and import the repository.
3. Framework Preset: **Vite**.
4. Root Directory: `./`.
5. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: Your Supabase URL (e.g. `https://your-project-id.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase publishable key (e.g. `sb_publishable_...`)
6. In Supabase Dashboard -> **Authentication** -> **URL Configuration**:
   - Set **Site URL** to your Vercel URL (e.g. `https://aerotouch.vercel.app`)
   - Add **Redirect URLs**:
     - `https://aerotouch.vercel.app/**`
     - `http://localhost:5173/**`
7. Click **Deploy**.

---

## ⚠️ Known Limitations
- **Sandbox Boundary**: As an in-browser Web application, AeroTouch cannot control operating system cursor events or third-party desktop windows outside the browser tab due to browser security boundaries. It controls internal web workspaces, presentations, videos, and games within its DOM.
- **Lighting Sensitivity**: Optical computer vision requires adequate contrast. Dimly lit environments (luminance $< 40$) will trigger an assistive low-light notification.
- **Single Primary Hand**: Currently optimized for one dominant interacting hand at a time.

---

## 🗺 Roadmap
- [ ] **Phone SMS OTP Authentication**: Support mobile phone number SMS login alongside Email OTP.
- [ ] **Desktop Companion Helper**: Optional lightweight native tray daemon (Electron/Tauri) allowing AeroTouch browser gestures to send native OS keyboard & mouse events globally across the entire operating system.
- [ ] **Custom Gesture Cloud Community Sharing**: Public gallery allowing users to discover and download gesture profiles created by the community.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
