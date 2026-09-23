import * as functions from 'firebase-functions/v2';
import { auth as authTrigger } from 'firebase-functions/v1';
import { HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { db, auth, Timestamp } from '../firebaseAdmin';
import { UserDoc } from '../types';

/**
 * Triggered on new user creation in Firebase Authentication
 */
export const onUserCreate = authTrigger.user().onCreate(async (user) => {
  const userRef = db.collection('users').doc(user.uid);
  const now = Timestamp.now();

  const newUser: UserDoc = {
    name: user.displayName || 'Customer',
    email: user.email || '',
    phone: user.phoneNumber || undefined,
    role: 'customer',
    isActive: true,
    marketingOptIn: true,
    segment: 'new',
    tags: [],
    stats: {
      ordersCount: 0,
      lifetimeValuePaise: 0,
      lastOrderAt: null,
    },
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  };

  await userRef.set(newUser, { merge: true });
});

/**
 * Middleware check for Admin custom claims
 */
export function assertAdmin(request: CallableRequest) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  if (request.auth.token.admin !== true) {
    throw new HttpsError('permission-denied', 'Administrative privileges required.');
  }
}

/**
 * Set admin custom claim for designated owner email/uid
 */
export const setAdminClaim = functions.https.onCall(
  { region: 'asia-south1' },
  async (request) => {
    const { targetEmail, secretKey } = request.data || {};
    
    // Safety check with secret or existing admin auth
    const configuredSecret = process.env.ADMIN_SETUP_SECRET || 'teanest-owner-setup-2026';
    const isOwnerSecretValid = secretKey && secretKey === configuredSecret;
    const isCurrentAdmin = request.auth?.token?.admin === true;

    if (!isOwnerSecretValid && !isCurrentAdmin) {
      throw new HttpsError('permission-denied', 'Unauthorized setup attempt.');
    }

    if (!targetEmail) {
      throw new HttpsError('invalid-argument', 'Target email is required.');
    }

    const user = await auth.getUserByEmail(targetEmail);
    await auth.setCustomUserClaims(user.uid, { admin: true });

    // Also update role in firestore
    await db.collection('users').doc(user.uid).set(
      {
        role: 'admin',
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    return { success: true, message: `Admin custom claim set for ${targetEmail}` };
  }
);
