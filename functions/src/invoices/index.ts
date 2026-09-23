import * as functions from 'firebase-functions/v2';
import { HttpsError } from 'firebase-functions/v2/https';
import { v2 as cloudinary } from 'cloudinary';
import { db } from '../firebaseAdmin';
import { InvoiceDoc } from '../types';

/**
 * Generates short-lived signed download URL for private GST Invoices
 */
export const getInvoiceUrl = functions.https.onCall(
  { region: 'asia-south1' },
  async (request) => {
    const { invoiceId } = request.data || {};
    if (!invoiceId) {
      throw new HttpsError('invalid-argument', 'Invoice ID is required.');
    }

    const uid = request.auth?.uid;
    const isAdmin = request.auth?.token?.admin === true;

    // Fetch invoice document
    const invoiceDoc = await db.collection('invoices').doc(invoiceId).get();
    if (!invoiceDoc.exists) {
      throw new HttpsError('not-found', 'Invoice not found.');
    }

    const invoice = invoiceDoc.data() as InvoiceDoc;

    // Security check: Must be the invoice owner or admin
    if (!isAdmin && invoice.userId !== uid) {
      throw new HttpsError('permission-denied', 'You do not have permission to access this invoice.');
    }

    // If PDF is stored in Cloudinary authenticated storage, generate signed download URL
    if (process.env.CLOUDINARY_CLOUD_NAME && invoice.pdf?.publicId) {
      const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour validity
      const signedUrl = cloudinary.utils.private_download_url(
        invoice.pdf.publicId,
        'pdf',
        {
          resource_type: 'raw',
          type: 'authenticated',
          expires_at: expiresAt,
          attachment: true,
        }
      );
      return { url: signedUrl, expiresAt };
    }

    // Fallback URL
    return {
      url: invoice.pdf?.url || '',
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    };
  }
);
