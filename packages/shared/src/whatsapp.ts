export interface WhatsAppOrderIntentParams {
  phoneNumber: string; // configured admin business phone number
  orderNumber: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  shippingAddress?: string;
  items: Array<{
    name: string;
    weight: number;
    unit: string;
    quantity: number;
    price: number;
  }>;
  grandTotal: number;
  notes?: string;
}

/**
 * Generates an official WhatsApp click-to-chat order enquiry link
 * sent directly to the Admin Business WhatsApp phone number.
 */
export function generateWhatsAppOrderUrl(params: WhatsAppOrderIntentParams): string {
  // Normalize phone number (strip '+', spaces, dashes)
  let cleanPhone = (params.phoneNumber || '918822308551').replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.includes('9876543210') || cleanPhone === '1234567890' || cleanPhone.length < 10) {
    cleanPhone = '918822308551';
  }
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`; // Default to India country code if 10 digits
  }
  if (cleanPhone === '8822308551') {
    cleanPhone = '918822308551';
  }

  const itemsList = params.items
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.name}* (${item.weight}${item.unit})\n   • Qty: *${item.quantity}*\n   • Price: ₹${(item.price * item.quantity).toFixed(2)}`
    )
    .join('\n\n');

  const notesText = params.notes ? `\n📝 *Notes:* ${params.notes}` : '';

  const message = `🌿 *TEA NEST — NEW ORDER ENQUIRY* 🌿

📦 *Order Number:* ${params.orderNumber}
💰 *Total Amount:* ₹${params.grandTotal.toFixed(2)} (Incl. 5% GST)

👤 *CUSTOMER DETAILS:*
• Name: ${params.customerName}
• Phone: ${params.customerMobile}
• Email: ${params.customerEmail}
📍 *Delivery Address:* ${params.shippingAddress || 'Not specified'}${notesText}

🛍️ *ORDER ITEMS:*
${itemsList}

---
_Sent automatically from Tea Nest Official Online Store._`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Generates customer support enquiry link for an existing order.
 */
export function generateOrderSupportWhatsAppUrl(
  phoneNumber: string,
  orderNumber: string,
  customerName: string
): string {
  let cleanPhone = (phoneNumber || '918822308551').replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.includes('9876543210') || cleanPhone === '1234567890' || cleanPhone.length < 10) {
    cleanPhone = '918822308551';
  }
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }
  if (cleanPhone === '8822308551') {
    cleanPhone = '918822308551';
  }

  const message = `Hello Tea Nest Support,\n\nI would like to inquire about the tracking status of my Order *${orderNumber}* (Name: ${customerName}). Could you please share the latest update? Thank you!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
