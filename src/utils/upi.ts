
/**
 * UPI Utility for BachatKaro
 * Generates standard UPI intent links for mobile apps (GPay, PhonePe, Paytm, etc.)
 */

export interface UPILinkParams {
  payeeVpa: string;
  payeeName: string;
  amount: string;
  note: string;
}

export const generateUPILink = ({
  payeeVpa,
  payeeName,
  amount,
  note
}: UPILinkParams): string => {
  const link = `upi://pay?pa=${payeeVpa}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  console.log("🚀 UPI LINK GENERATED:", link);
  return link;
};
