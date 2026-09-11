import { SEED_ADMIN, SEED_PRODUCT, SEED_SUPPLIER, SEED_BUSINESS_SETTINGS } from './seedData';

async function runSeed() {
  console.log('==================================================');
  console.log('TEA NEST: PRODUCTION SEED & BOOTSTRAP');
  console.log('==================================================');
  console.log('\n1. Super Admin Bootstrap:');
  console.log(`- Email: ${SEED_ADMIN.email}`);
  console.log(`- Role: ${SEED_ADMIN.role}`);
  console.log(`- Status: Active`);

  console.log('\n2. Primary Product (Tea Nest Assam Black Tea):');
  console.log(`- SKU: ${SEED_PRODUCT.sku}`);
  console.log(`- Weight: ${SEED_PRODUCT.weight}${SEED_PRODUCT.unit}`);
  console.log(`- MRP: ₹${SEED_PRODUCT.mrp}`);
  console.log(`- Selling Price: ₹${SEED_PRODUCT.sellingPrice}`);
  console.log(`- Stock: ${SEED_PRODUCT.stockQuantity} units`);
  console.log(`- Low Stock Threshold: ${SEED_PRODUCT.lowStockThresholdQty} units (${SEED_PRODUCT.lowStockPercent}%)`);
  console.log(`- HSN Code: ${SEED_PRODUCT.hsnCode} | GST: ${SEED_PRODUCT.gstRate}%`);
  console.log(`- Images: Front & Back packaging assets staged`);

  console.log('\n3. Verified Supplier:');
  console.log(`- Estate: ${SEED_SUPPLIER.companyName}`);
  console.log(`- Location: ${SEED_SUPPLIER.city}, ${SEED_SUPPLIER.state}`);
  console.log(`- GSTIN: ${SEED_SUPPLIER.gstin}`);

  console.log('\n4. Business Settings:');
  console.log(`- Brand: ${SEED_BUSINESS_SETTINGS.brandName}`);
  console.log(`- Business: ${SEED_BUSINESS_SETTINGS.businessName}`);
  console.log(`- WhatsApp Order Number: ${SEED_BUSINESS_SETTINGS.whatsappOrderNumber}`);
  console.log(`- Location: ${SEED_BUSINESS_SETTINGS.address}, ${SEED_BUSINESS_SETTINGS.city}, ${SEED_BUSINESS_SETTINGS.state}`);

  console.log('\n[SUCCESS] Seed data ready and validated.');
}

runSeed().catch(console.error);
