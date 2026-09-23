export interface GSTCalculationItem {
  variantId: string;
  sku: string;
  name: string;
  hsnCode: string;
  quantity: number;
  unitPricePaise: number; // MRP / selling price inclusive of tax
  discountPaise?: number;
  gstRate: number; // e.g., 5 for 5%
}

export interface GSTCalculationResult {
  placeOfSupply: string;
  supplyType: 'intra' | 'inter';
  items: {
    variantId: string;
    sku: string;
    name: string;
    hsnCode: string;
    quantity: number;
    unitPricePaise: number;
    discountPaise: number;
    taxableValuePaise: number;
    gstRate: number;
    cgstPaise: number;
    sgstPaise: number;
    igstPaise: number;
    lineTotalPaise: number;
  }[];
  taxableTotalPaise: number;
  cgstTotalPaise: number;
  sgstTotalPaise: number;
  igstTotalPaise: number;
  taxTotalPaise: number;
  subtotalPaise: number;
  discountTotalPaise: number;
  shippingTaxablePaise: number;
  shippingGstPaise: number;
  grandTotalPaise: number;
  roundOffPaise: number;
  amountInWords: string;
}

export function computeGSTBreakdown(
  items: GSTCalculationItem[],
  sellerStateCode: string,
  buyerStateCode: string,
  shippingChargePaise: number = 0,
  couponDiscountPaise: number = 0
): GSTCalculationResult {
  const isIntraState = sellerStateCode.trim().toLowerCase() === buyerStateCode.trim().toLowerCase();
  const supplyType: 'intra' | 'inter' = isIntraState ? 'intra' : 'inter';

  let rawSubtotal = 0;
  for (const it of items) {
    rawSubtotal += it.unitPricePaise * it.quantity;
  }

  let totalItemDiscounts = 0;
  let computedItems = items.map((it) => {
    const itemGross = it.unitPricePaise * it.quantity;
    
    // Distribute coupon discount proportionately if any
    let itemDiscount = it.discountPaise || 0;
    if (couponDiscountPaise > 0 && rawSubtotal > 0) {
      const proportionalDiscount = Math.round((itemGross / rawSubtotal) * couponDiscountPaise);
      itemDiscount += proportionalDiscount;
    }
    // Cap discount at itemGross
    itemDiscount = Math.min(itemGross, itemDiscount);
    totalItemDiscounts += itemDiscount;

    const netLineTotal = Math.max(0, itemGross - itemDiscount);

    // Tax-inclusive formula: Taxable = Round(NetTotal / (1 + Rate/100))
    const rateFactor = 1 + it.gstRate / 100;
    const taxableValuePaise = Math.round(netLineTotal / rateFactor);
    const totalTaxPaise = Math.max(0, netLineTotal - taxableValuePaise);

    let cgstPaise = 0;
    let sgstPaise = 0;
    let igstPaise = 0;

    if (isIntraState) {
      cgstPaise = Math.floor(totalTaxPaise / 2);
      sgstPaise = totalTaxPaise - cgstPaise;
    } else {
      igstPaise = totalTaxPaise;
    }

    return {
      variantId: it.variantId,
      sku: it.sku,
      name: it.name,
      hsnCode: it.hsnCode,
      quantity: it.quantity,
      unitPricePaise: it.unitPricePaise,
      discountPaise: itemDiscount,
      taxableValuePaise,
      gstRate: it.gstRate,
      cgstPaise,
      sgstPaise,
      igstPaise,
      lineTotalPaise: netLineTotal,
    };
  });

  const taxableTotalPaise = computedItems.reduce((acc, it) => acc + it.taxableValuePaise, 0);
  const cgstTotalPaise = computedItems.reduce((acc, it) => acc + it.cgstPaise, 0);
  const sgstTotalPaise = computedItems.reduce((acc, it) => acc + it.sgstPaise, 0);
  const igstTotalPaise = computedItems.reduce((acc, it) => acc + it.igstPaise, 0);
  const taxTotalPaise = cgstTotalPaise + sgstTotalPaise + igstTotalPaise;

  // Shipping GST (typically 18% standard courier or 5% bundled, assuming standard 5% for tea dispatch or pass through)
  const shippingTaxablePaise = shippingChargePaise > 0 ? Math.round(shippingChargePaise / 1.05) : 0;
  const shippingGstPaise = shippingChargePaise - shippingTaxablePaise;

  const rawGrandTotal = (rawSubtotal - totalItemDiscounts) + shippingChargePaise;
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOffPaise = roundedGrandTotal - rawGrandTotal;

  const amountInWords = numberToWordsIndianPaise(roundedGrandTotal);

  return {
    placeOfSupply: buyerStateCode,
    supplyType,
    items: computedItems,
    taxableTotalPaise,
    cgstTotalPaise,
    sgstTotalPaise,
    igstTotalPaise,
    taxTotalPaise,
    subtotalPaise: rawSubtotal,
    discountTotalPaise: totalItemDiscounts,
    shippingTaxablePaise,
    shippingGstPaise,
    grandTotalPaise: roundedGrandTotal,
    roundOffPaise,
    amountInWords,
  };
}

/**
 * Helper to convert integer paise into Indian currency words
 */
export function numberToWordsIndianPaise(paise: number): string {
  if (paise <= 0) return 'Zero Rupees Only';

  const rupees = Math.floor(paise / 100);
  const remainderPaise = paise % 100;

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 10) return singleDigits[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    const unit = n % 10;
    const ten = Math.floor(n / 10);
    return tens[ten] + (unit > 0 ? ' ' + singleDigits[unit] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rem = n % 100;
    let res = '';
    if (hundred > 0) res += singleDigits[hundred] + ' Hundred';
    if (rem > 0) res += (res ? ' and ' : '') + convertTwoDigits(rem);
    return res;
  }

  let words = '';
  let temp = rupees;

  const crore = Math.floor(temp / 10000000);
  temp %= 10000000;
  const lakh = Math.floor(temp / 100000);
  temp %= 100000;
  const thousand = Math.floor(temp / 1000);
  temp %= 1000;
  const hundreds = temp;

  if (crore > 0) words += convertThreeDigits(crore) + ' Crore ';
  if (lakh > 0) words += convertTwoDigits(lakh) + ' Lakh ';
  if (thousand > 0) words += convertTwoDigits(thousand) + ' Thousand ';
  if (hundreds > 0) words += convertThreeDigits(hundreds) + ' ';

  words = words.trim() || 'Zero';
  let finalResult = `Rupees ${words}`;

  if (remainderPaise > 0) {
    finalResult += ` and ${convertTwoDigits(remainderPaise)} Paise`;
  }

  return `${finalResult} Only`;
}
