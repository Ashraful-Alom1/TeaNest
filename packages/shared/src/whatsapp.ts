export interface WhatsAppOrderIntentParams {
  phoneNumber: string; // configured business phone number
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
}

/**
 * Generates an official WhatsApp click-to-chat order intent link.
 */
export function generateWhatsAppOrderUrl(params: WhatsAppOrderIntentParams): string {
  // Normalize phone number (strip '+', spaces, dashes)
  let cleanPhone = params.phoneNumber.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`; // Default to India country code if 10 digits
  }

  const itemsText = params.items
    .map(
      (item) =>
        `• Product: ${item.name} (${item.weight}${item.unit})\n  Quantity: ${item.quantity}\n  Price: ₹${(item.price * item.quantity).toFixed(2)}`
    )
    .join('\n\n');

  const addressText = params.shippingAddress ? `Address: ${params.shippingAddress}\n` : '';

  const message = `Hello Tea Nest,

I would like to order:

${itemsText}

Total Amount: ₹${params.grandTotal.toFixed(2)}
Order ID: ${params.orderNumber}

Customer Details:
Name: ${params.customerName}
Mobile: ${params.customerMobile}
Email: ${params.customerEmail}
${addressText}
Please confirm my order.`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
