# Deployment & Production Operations Guide

## 1. Deployment Overview

The Tea Nest platform can be deployed to modern cloud hosting platforms such as Firebase Hosting, Google Cloud Run, Vercel, or AWS Amplify.

---

## 2. Environment Configuration

Copy `.env.example` to `.env` in the root and in both application folders:

```env
# Application Settings
VITE_APP_NAME="Tea Nest"
VITE_BRAND_TAGLINE="Born in Assam, Loved Everywhere"
VITE_BUSINESS_PHONE="+919854012345"
VITE_BUSINESS_WHATSAPP="+919854012345"

# Firebase Client Configuration
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="tea-nest.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="tea-nest"
VITE_FIREBASE_STORAGE_BUCKET="tea-nest.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="38350226211"
VITE_FIREBASE_APP_ID="1:38350226211:web:5d21b282b14cac92c18296"
VITE_FIREBASE_MEASUREMENT_ID="G-SVLBRJVH71"

# Business Compliance Details
VITE_COMPANY_NAME="Fortunate Ventures"
VITE_COMPANY_ADDRESS="Naharkatia, Dist - Dibrugarh, Assam, PIN - 786610"
VITE_COMPANY_GSTIN="18AABCF1234F1Z5"
VITE_COMPANY_PAN="AABCF1234F"
VITE_COMPANY_EMAIL="fortunateventures123@gmail.com"
```

---

## 3. Building for Production

Compile both Storefront and Admin applications:

```bash
npm run build
```

This compiles:
- `apps/storefront/dist/` (Storefront static bundle)
- `apps/admin/dist/` (Admin console static bundle)

---

## 4. Firebase Hosting Deployment

Deploy using the Firebase CLI:

### 4.1 Login and Select Project
```bash
npx firebase login
npx firebase use --add tea-nest
```

### 4.2 Deploy Rules and Hosting
```bash
# Deploy Firestore security rules and composite indexes
npx firebase deploy --only firestore

# Deploy Cloud Storage security rules
npx firebase deploy --only storage

# Deploy both web applications
npx firebase deploy --only hosting
```

The multi-site setup configured in `firebase.json` automatically deploys:
- `apps/storefront/dist` $\rightarrow$ `https://teanest.in`
- `apps/admin/dist` $\rightarrow$ `https://admin.teanest.in`

---

## 5. Continuous Integration / Continuous Deployment (CI/CD)

Recommended GitHub Actions workflow `.github/workflows/deploy.yml`:

```yaml
name: Tea Nest Production CI/CD

on:
  push:
    branches: [main]

jobs:
  test_and_build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - name: Deploy to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_TEA_NEST }}'
          channelId: live
          projectId: tea-nest
```

---

## 6. Health & Disaster Recovery

- **Snapshot Backup**: In the Admin portal under `/security`, click **"Create State Snapshot"** to download a cryptographic JSON backup of all collections.
- **Audit Logs**: Review all staff actions under `/audit-logs` for compliance verification.
- **Stock Reconciliation**: Review `/inventory` audit ledger for any manual inventory adjustments.
