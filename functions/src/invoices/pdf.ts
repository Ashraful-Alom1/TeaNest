import PDFDocument from 'pdfkit';
import { v2 as cloudinary } from 'cloudinary';
import { InvoiceDoc } from '../types';

// Configure Cloudinary if environment variables exist
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Generates a PDFKit buffer for the GST Tax Invoice
 */
export async function generateInvoicePDFBuffer(invoice: InvoiceDoc): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Header
      doc.fontSize(18).text('TAX INVOICE', { align: 'center', underline: true });
      doc.moveDown(0.5);

      // Seller Info & Invoice Details
      doc.fontSize(10);
      const topY = doc.y;

      // Left Column: Seller
      doc.text(`Seller: ${invoice.seller.tradeName || invoice.seller.legalName}`, 40, topY, { bold: true } as any);
      doc.text(`${invoice.seller.address}`);
      doc.text(`GSTIN: ${invoice.seller.gstin}`);
      doc.text(`PAN: ${invoice.seller.pan}`);
      doc.text(`State Code: ${invoice.seller.stateCode}`);
      doc.text(`Phone: ${invoice.seller.phone} | Email: ${invoice.seller.email}`);

      // Right Column: Invoice metadata
      const rightX = 350;
      doc.text(`Invoice No: ${invoice.invoiceNumber}`, rightX, topY, { bold: true } as any);
      const dateStr = invoice.invoiceDate.toDate ? invoice.invoiceDate.toDate().toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
      doc.text(`Invoice Date: ${dateStr}`, rightX);
      doc.text(`Financial Year: ${invoice.financialYear}`, rightX);
      doc.text(`Order ID: ${invoice.orderId}`, rightX);
      doc.text(`Place of Supply: ${invoice.placeOfSupply}`, rightX);
      doc.text(`Supply Type: ${invoice.supplyType.toUpperCase()}`, rightX);

      doc.moveDown(2);
      const buyerY = Math.max(doc.y, topY + 90);

      // Buyer Info
      doc.text(`Bill To / Ship To:`, 40, buyerY, { underline: true });
      doc.text(`Name: ${invoice.buyer.name}`, 40, buyerY + 15);
      doc.text(`Address: ${invoice.buyer.address}`, 40, buyerY + 30);
      doc.text(`Phone: ${invoice.buyer.phone} | State Code: ${invoice.buyer.stateCode}`, 40, buyerY + 45);
      if (invoice.buyerGstin) {
        doc.text(`Buyer GSTIN: ${invoice.buyerGstin}`, 40, buyerY + 60);
      }

      // Items Table
      const tableTop = buyerY + 80;
      doc.fontSize(9);

      // Table Header
      doc.rect(40, tableTop, 515, 20).fill('#2d3748');
      doc.fillColor('#ffffff');
      doc.text('Item Description', 45, tableTop + 5, { width: 140 });
      doc.text('HSN', 190, tableTop + 5, { width: 45 });
      doc.text('Qty', 240, tableTop + 5, { width: 30 });
      doc.text('Rate', 275, tableTop + 5, { width: 50 });
      doc.text('Taxable', 330, tableTop + 5, { width: 55 });
      doc.text('GST Rate', 390, tableTop + 5, { width: 45 });
      doc.text('Tax (Rs)', 440, tableTop + 5, { width: 45 });
      doc.text('Total (Rs)', 490, tableTop + 5, { width: 60, align: 'right' });

      doc.fillColor('#000000');
      let currentY = tableTop + 25;

      for (const item of invoice.items) {
        const itemTax = (item.cgstPaise + item.sgstPaise + item.igstPaise) / 100;
        doc.text(item.description, 45, currentY, { width: 140 });
        doc.text(item.hsnCode || '0902', 190, currentY, { width: 45 });
        doc.text(String(item.quantity), 240, currentY, { width: 30 });
        doc.text(`₹${(item.ratePaise / 100).toFixed(2)}`, 275, currentY, { width: 50 });
        doc.text(`₹${(item.taxableValuePaise / 100).toFixed(2)}`, 330, currentY, { width: 55 });
        doc.text(`${item.gstRate}%`, 390, currentY, { width: 45 });
        doc.text(`₹${itemTax.toFixed(2)}`, 440, currentY, { width: 45 });
        doc.text(`₹${(item.totalPaise / 100).toFixed(2)}`, 490, currentY, { width: 60, align: 'right' });
        currentY += 20;
      }

      // Horizontal Line
      doc.moveTo(40, currentY).lineTo(555, currentY).stroke('#cbd5e0');
      currentY += 10;

      // Summary on bottom right
      doc.fontSize(9);
      doc.text(`Taxable Amount:`, 350, currentY);
      doc.text(`₹${(invoice.taxableTotalPaise / 100).toFixed(2)}`, 480, currentY, { align: 'right', width: 70 });
      currentY += 15;

      if (invoice.cgstTotalPaise > 0) {
        doc.text(`CGST:`, 350, currentY);
        doc.text(`₹${(invoice.cgstTotalPaise / 100).toFixed(2)}`, 480, currentY, { align: 'right', width: 70 });
        currentY += 15;
      }
      if (invoice.sgstTotalPaise > 0) {
        doc.text(`SGST:`, 350, currentY);
        doc.text(`₹${(invoice.sgstTotalPaise / 100).toFixed(2)}`, 480, currentY, { align: 'right', width: 70 });
        currentY += 15;
      }
      if (invoice.igstTotalPaise > 0) {
        doc.text(`IGST:`, 350, currentY);
        doc.text(`₹${(invoice.igstTotalPaise / 100).toFixed(2)}`, 480, currentY, { align: 'right', width: 70 });
        currentY += 15;
      }
      if (invoice.shippingTaxablePaise > 0) {
        doc.text(`Shipping Charges:`, 350, currentY);
        doc.text(`₹${(invoice.shippingTaxablePaise / 100).toFixed(2)}`, 480, currentY, { align: 'right', width: 70 });
        currentY += 15;
      }
      if (invoice.roundOffPaise !== 0) {
        doc.text(`Round Off:`, 350, currentY);
        doc.text(`₹${(invoice.roundOffPaise / 100).toFixed(2)}`, 480, currentY, { align: 'right', width: 70 });
        currentY += 15;
      }

      doc.rect(345, currentY, 210, 20).fill('#edf2f7');
      doc.fillColor('#000000');
      doc.fontSize(10);
      doc.text(`Total Amount:`, 350, currentY + 5, { bold: true } as any);
      doc.text(`₹${(invoice.grandTotalPaise / 100).toFixed(2)}`, 480, currentY + 5, { align: 'right', width: 70, bold: true } as any);
      currentY += 30;

      // Amount in words
      doc.fontSize(9).text(`Amount in Words: ${invoice.amountInWords}`, 40, currentY, { italic: true } as any);
      currentY += 40;

      // Signatory
      doc.text('For ' + (invoice.seller.tradeName || invoice.seller.legalName), 380, currentY);
      doc.moveDown(2);
      doc.text('Authorized Signatory', 380, doc.y);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Uploads invoice PDF to Cloudinary as private authenticated raw file
 */
export async function uploadInvoicePDFToCloudinary(
  invoiceId: string,
  pdfBuffer: Buffer
): Promise<{ publicId: string; secureUrl: string }> {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'tea-nest/invoices',
          public_id: `invoice_${invoiceId}`,
          resource_type: 'raw',
          type: 'authenticated', // Private authenticated delivery
          format: 'pdf',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            publicId: result?.public_id || `tea-nest/invoices/invoice_${invoiceId}`,
            secureUrl: result?.secure_url || '',
          });
        }
      );
      uploadStream.end(pdfBuffer);
    });
  }

  // Fallback for local emulator
  return {
    publicId: `tea-nest/invoices/invoice_${invoiceId}`,
    secureUrl: `data:application/pdf;base64,${pdfBuffer.toString('base64')}`,
  };
}
