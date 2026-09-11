export interface GstCalculationResult {
  taxableAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
}

/**
 * Calculates GST breakdown given a taxable base amount.
 */
export function calculateGstFromBase(
  taxableAmount: number,
  gstRate: number,
  isInterState: boolean = false
): GstCalculationResult {
  const roundedTaxable = Math.round(taxableAmount * 100) / 100;
  const totalTax = Math.round(((roundedTaxable * gstRate) / 100) * 100) / 100;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isInterState) {
    igst = totalTax;
  } else {
    cgst = Math.round((totalTax / 2) * 100) / 100;
    sgst = Math.round((totalTax - cgst) * 100) / 100;
  }

  return {
    taxableAmount: roundedTaxable,
    gstRate,
    cgst,
    sgst,
    igst,
    totalTax,
    grandTotal: Math.round((roundedTaxable + totalTax) * 100) / 100,
  };
}

/**
 * Calculates taxable value from a GST-inclusive selling price.
 */
export function calculateTaxableFromInclusive(
  inclusivePrice: number,
  gstRate: number,
  isInterState: boolean = false
): GstCalculationResult {
  const taxableAmount = Math.round((inclusivePrice / (1 + gstRate / 100)) * 100) / 100;
  return calculateGstFromBase(taxableAmount, gstRate, isInterState);
}
