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
Edit `public/js/firebase-config.js`:

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

## 7) Auto Deploy with GitHub Actions

- Workflow file: `.github/workflows/firebase-hosting-deploy.yml`
- Trigger: push to `main`
- Required GitHub Actions secret:
  - `FIREBASE_SERVICE_ACCOUNT_POOP_WIZARD`

How to create the secret value:
1. Firebase Console -> Project Settings -> Service accounts.
2. Click `Generate new private key` and download JSON.
3. GitHub repo -> Settings -> Secrets and variables -> Actions -> New repository secret.
4. Name: `FIREBASE_SERVICE_ACCOUNT_POOP_WIZARD`
5. Value: paste full JSON content.

## Security note
- `scores/{uid}` is writable only by that logged-in uid.
- Rules validate `uid`, `userId`, `score`, `stage`, `level`, `updatedAt`.
- Only score/stage/level non-decreasing updates are allowed.
- `delete` on scores is blocked.
