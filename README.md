# AeroTouch — Next-Gen AI Hand Gesture Web Studio

AeroTouch is a high-performance, touchless spatial hand gesture control system running 100% offline in modern browsers. Powered by Google MediaPipe Vision compiled into WebAssembly (WASM), 1€ adaptive filtering, K-Nearest Neighbors custom gesture learning, and offline-first IndexedDB persistence.

---

## 🚀 The Problem It Solves
Traditional computing relies upon continuous physical contact with keyboards, mice, and touchscreens. In many environments, mechanical touch is impossible, unhygienic, or inconvenient:
- **Culinary / Kitchen**: Sticky, floured, or oily hands while following interactive recipes.
- **Sterile / Medical**: Operating rooms and cleanrooms requiring strict touch avoidance.
- **Presentations & Public Displays**: Public kiosks and stage presentations where reaching for a clicker interrupts delivery.
- **Accessibility**: Users with tremors, motor impairments, or single-arm limitations requiring dwell-clicking and relaxed temporal gestures.

AeroTouch solves this by turning any standard webcam into an ultra-low latency, touchless air controller — completely offline with zero video data ever leaving the user's device.

---

## ✨ Features

### 1. Vision & Gesture Pipeline
- **21-Landmark Skeleton Tracking**: Real-time hand keypoint tracking overlaid on video with cyan-to-violet glowing gradients.
- **1€ (One-Euro) Adaptive Smoothing**: Multi-dimensional frequency filtering eliminating micro-jitter without adding movement latency.
- **Temporal Stability & Cooldown**: Requires 350 ms of sustained hand hold to confirm static gestures; 600 ms cooldown lockout to eliminate repeat misfires.
- **Wrist Velocity Swiping**: Dynamic sliding-window velocity analyzer ($\Delta x / \Delta t$) recognizing rapid left and right navigational flicks.
- **Custom Gesture Training Studio**: Train any unique gesture with 8 rapid samples normalized by wrist position and hand size, powered by an offline KNN Euclidean classifier.

### 2. Workspaces & Specialized Modes
- **Presentation Deck**: Slide viewer controlled with swipes (`Swipe_Right` = Next, `Swipe_Left` = Previous) and clenches (`Closed_Fist` = Play, `Open_Palm` = Pause).
- **Synthesized Media Theater**: Audio/video player with play/pause, continuous volume adjustment (`Thumb_Up` / `Thumb_Down`), and instant screenshot snapshot capture (`Victory ✌`).
- **Long-form Document Reader**: Hands-free smooth auto-scrolling with `Pointing_Up` and `Open_Palm` halt.
- **Virtual Pointer Pad**: Touchless cursor targeting with 1.5-second dwell click and clench clicks.
- **Balloon Popper Practice Arena**: Interactive target-practice game using index finger pointing to burst floating neon balloons.
- **Touchless Kitchen Assistant**: High-contrast, large-font culinary interface where `Open_Palm` instantly halts cooking countdown timers.

### 3. Accessibility & Performance
- **Accessibility Mode**: Slower gesture thresholds (500 ms), high-contrast theme (`#000000` with cyan borders), large readable typography, and single-hand control optimization.
- **1.5-Second Dwell Click**: Holding the virtual cursor still for 1.5 seconds triggers a click with an animated circular progress ring.
- **3-Minute Ergonomic Fatigue Reminder**: Continuous hand-up tracker alerts the user to rest and relax their shoulder and wrist.
- **Low-End Laptop Mode**: Scales camera down to 320x240 @ 15-20 FPS with a live hardware monitor to save battery and reduce thermal load.

### 4. Offline PWA & Cloud Synchronization
- **Progressive Web App**: Precached assets including WASM binaries and the 8MB quantized neural model. Operates seamlessly in Airplane Mode.
- **IndexedDB via Dexie**: Local-first storage for user settings, custom gestures, sessions, and telemetry with `synced: false` flags.
- **Supabase Cloud Sync**: Batch uploads telemetry and custom gestures to Supabase when logged in and online.
- **Guest-First Architecture**: Full feature set available instantly without mandatory sign-up.

---

## 🛠 Tech Stack
- **Framework**: React 19, TypeScript, Vite 8
- **Styling**: Tailwind CSS 3.4, PostCSS, Glassmorphism
- **AI & Vision**: `@mediapipe/tasks-vision` (WebAssembly SIMD Runtime)
- **Local Persistence**: `dexie` (IndexedDB Wrapper)
- **Offline / PWA**: `vite-plugin-pwa`, `workbox-window`
- **Cloud & Auth**: `@supabase/supabase-js` (PostgreSQL with Row Level Security)
- **Visualization**: `recharts`
- **Animations & Effects**: `framer-motion`, `canvas-confetti`, `lucide-react`

---

## 📁 Folder Structure
```
Gesture_control/
├── public/
│   ├── models/
│   │   └── gesture_recognizer.task   # MediaPipe neural model (8.37 MB)
│   ├── wasm/                         # Offline MediaPipe WASM runtime
│   │   ├── vision_wasm_internal.js
│   │   ├── vision_wasm_internal.wasm
│   │   ├── vision_wasm_module_internal.js
│   │   └── vision_wasm_module_internal.wasm
│   ├── favicon.svg
│   ├── pwa-192x192.svg
│   └── pwa-512x512.svg
├── src/
│   ├── components/
│   │   └── common/
│   │       ├── ErrorBoundary.tsx     # Graceful UI failure catcher
│   │       ├── Navbar.tsx           # Header with live Online/Offline badge
│   │       ├── PipCamera.tsx        # Picture-in-Picture tracking widget
│   │       └── PwaInstallPrompt.tsx # Desktop install banner
│   ├── context/
│   │   ├── AccessibilityContext.tsx # Dwell click, contrast, 3-min fatigue tracker
│   │   └── AuthContext.tsx          # Supabase auth & Guest session state
│   ├── db/
│   │   └── db.ts                    # Dexie schema (settings, sessions, events, gestures)
│   ├── engine/
│   │   ├── actionDispatcher.ts      # Semantic mapping, Web Audio feedback
│   │   ├── gestureFilter.ts         # 350ms hold, 0.70 confidence, 600ms cooldown
│   │   ├── knnClassifier.ts         # Scale & wrist landmark normalizer, KNN
│   │   ├── smoothing.ts             # 1€ adaptive filter for 21 keypoints
│   │   ├── swipeDetector.ts         # Sliding-window wrist velocity detector
│   │   └── index.ts                 # Unified useGestureEngine hook
│   ├── hooks/
│   │   └── useOnlineStatus.ts       # Live network connectivity hook
│   ├── pages/
│   │   ├── workspaces/
│   │   │   ├── CursorWorkspace.tsx
│   │   │   ├── MediaWorkspace.tsx
│   │   │   ├── PresentationWorkspace.tsx
│   │   │   └── ScrollWorkspace.tsx
│   │   ├── Analytics.tsx            # Recharts telemetry graphs & feedback
│   │   ├── AuthPage.tsx             # Login, Signup, Guest button
│   │   ├── ControlModesHub.tsx      # Demo workspaces hub
│   │   ├── CustomTrainer.tsx        # 8-sample KNN gesture training studio
│   │   ├── Help.tsx                 # Reference handbook & FAQ
│   │   ├── KitchenMode.tsx          # Touchless cooking with palm timer pause
│   │   ├── Landing.tsx              # Hero page with specs
│   │   ├── LiveStudio.tsx           # Real-time skeleton studio & diagnostics
│   │   ├── NotFound.tsx             # 404 glass fallback
│   │   ├── OfflineFallback.tsx      # Offline status screen
│   │   ├── Onboarding.tsx           # Camera, lighting & 10s calibration
│   │   ├── Practice.tsx             # Balloon Popper pointing game
│   │   ├── Privacy.tsx              # Zero-video-upload technical guarantee
│   │   └── Settings.tsx             # Remap, sensitivity, and accessibility
│   ├── services/
│   │   ├── mediapipe.ts             # Offline WASM resolver with CPU fallback
│   │   ├── supabase.ts              # Supabase client initializer
│   │   └── syncService.ts           # Batch IndexedDB-to-Supabase synchronizer
│   ├── types/
│   │   └── gesture.ts               # Core TypeScript interfaces
│   ├── utils/
│   │   ├── handDrawer.ts            # Canvas 21-landmark skeleton drawer
│   │   └── lighting.ts              # Frame luminance analyzer
│   ├── App.tsx                      # Routes & provider nesting
│   ├── index.css                    # Tailwind base, dark palette, high contrast
│   └── main.tsx                     # Entrypoint
├── supabase/
│   └── schema.sql                   # Postgres DDL & Row Level Security policies
├── .env.example                     # Sample Supabase credentials
├── package.json
├── tailwind.config.js
└── vite.config.ts                   # PWA precaching & Vite config
```

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
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
*(Note: If left unconfigured, the app runs completely in Guest/Offline mode using IndexedDB without errors).*

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

## 🌐 Supabase SQL Setup
To set up the cloud database:
1. Navigate to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor** from the left navigation sidebar.
3. Paste the contents of [`supabase/schema.sql`](file:///c:/Gesture_control/supabase/schema.sql).
4. Click **Run**. The tables, foreign keys, triggers, and Row Level Security (RLS) policies will be provisioned.

---

## 🚀 Vercel Deployment Instructions
1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/dashboard), click **Add New Project** and import the repository.
3. Framework Preset: **Vite**.
4. Root Directory: `./`.
5. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
6. Click **Deploy**.

> **⚠️ CRITICAL CAMERA PERMISSION REQUIREMENT**:
> Modern web browsers restrict `navigator.mediaDevices.getUserMedia` solely to **secure origins** (`https://` or `localhost`). Vercel provides automatic HTTPS SSL certificates on all deployment domains (`*.vercel.app`), ensuring seamless camera access.

---

## ⚠️ Limitations
- **Sandbox Boundary**: As an in-browser Web application, AeroTouch cannot control operating system cursor events or third-party applications outside the browser window due to browser security boundaries. It controls internal web workspaces, presentations, videos, and games within its sandboxed DOM.
- **Lighting Sensitivity**: Optical computer vision requires adequate contrast. Dimly lit environments (luminance $< 40$) will trigger an assistive low-light notification.
