import * as functions from 'firebase-functions/v2';
import { HttpsError } from 'firebase-functions/v2/https';
import { v2 as cloudinary } from 'cloudinary';

export const getCloudinarySignature = functions.https.onCall(
  { region: 'asia-south1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const { folder, tags } = request.data || {};
    const timestamp = Math.round(Date.now() / 1000);
    const apiSecret = process.env.CLOUDINARY_API_SECRET || 'sample_secret';
    const apiKey = process.env.CLOUDINARY_API_KEY || 'sample_key';
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'teanest';

    const targetFolder = folder || 'tea-nest/products';
    const paramsToSign: Record<string, any> = {
      folder: targetFolder,
      timestamp,
    };
    if (tags) {
      paramsToSign.tags = tags;
    }

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return {
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder: targetFolder,
    };
  }
);
