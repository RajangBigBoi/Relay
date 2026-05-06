# Relay

Relay is a React + Firebase hotel operations app for:
- incident tracking and case history
- shift handover notes
- task/checklist management
- team visibility and audit logs

It is designed as an MVP that can be hosted on low-cost/free platforms (for example Vercel) while using Firebase Auth + Firestore as the backend.

## Tech Stack
- React + Vite + TypeScript
- Firebase Authentication
- Cloud Firestore
- Tailwind CSS

## Getting Started

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment variables
Copy `.env.example` to `.env.local` and fill in your Firebase project values:

```bash
cp .env.example .env.local
```

Required variables:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

You can find these in **Firebase Console → Project settings → General → Your apps → SDK setup and configuration**.

### 3) Run locally
```bash
npm run dev
```

### 4) Build for production
```bash
npm run build
```

### 5) Preview production build locally
```bash
npm run preview
```

## Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, import the GitHub repository.
3. Framework preset: **Vite** (auto-detected in most cases).
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add the same Firebase environment variables in **Vercel → Project Settings → Environment Variables**.
7. Deploy.

This repo includes a `vercel.json` rewrite so SPA routes work on refresh.

## Notes
- Firebase security rules are kept as-is for backend authorization.
- No paid services are required for this deployment path.
