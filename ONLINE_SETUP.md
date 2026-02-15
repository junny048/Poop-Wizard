# Poop Wizard Online Setup

## 1) Set Project ID
Edit `.firebaserc`:

```json
{
  "projects": {
    "default": "YOUR_FIREBASE_PROJECT_ID"
  }
}
```

## 2) Fill Firebase Web Config
Edit `firebase-config.js`:

```js
window.POOP_WIZARD_FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

## 3) Install Firebase CLI (one-time)

```bash
npm i -g firebase-tools
firebase login
```

## 4) Deploy Firestore Rules + Function

```bash
cd functions
npm install
cd ..
firebase deploy --only firestore:rules,functions:submitScore
```

## 5) (Optional) Deploy Hosting

```bash
firebase deploy --only hosting
```

## Security note
- `scores` direct client writes are blocked by `firestore.rules`.
- Score submission is only through callable Cloud Function `submitScore`.
- Function enforces auth + payload validation + server timestamp write.
