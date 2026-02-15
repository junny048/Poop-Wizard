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

## 4) Enable Firebase Products (Spark available)

- Authentication: Email/Password
- Firestore Database: Create in production mode
- Hosting: Enable

## 5) Deploy Firestore Rules (Spark)

```bash
firebase deploy --only firestore:rules
```

## 6) Deploy Hosting

```bash
firebase deploy --only hosting
```

## Security note
- `scores/{uid}` is writable only by that logged-in uid.
- Rules validate `uid`, `userId`, `score`, `stage`, `level`, `updatedAt`.
- Only score/stage/level non-decreasing updates are allowed.
- `delete` on scores is blocked.
