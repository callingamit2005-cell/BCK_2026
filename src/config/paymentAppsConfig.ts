export type PaymentAppType = 'upi' | 'wallet' | 'netbanking';

export interface PaymentAppConfig {
  id: string;
  name: string;
  type: PaymentAppType;
  packageName?: string;
  icon?: string;
  scheme?: string;
}

export const PAYMENT_APPS: PaymentAppConfig[] = [
  {
    id: "gpay",
    name: "Google Pay",
    type: "upi",
    packageName: "com.google.android.apps.nbu.paisa.user",
    scheme: "upi://pay"
  },
  {
    id: "phonepe",
    name: "PhonePe",
    type: "upi",
    packageName: "com.phonepe.app",
    scheme: "upi://pay"
  },
  {
    id: "paytm",
    name: "Paytm",
    type: "upi",
    packageName: "net.one97.paytm",
    scheme: "upi://pay"
  },
  {
    id: "cred",
    name: "CRED",
    type: "upi",
    packageName: "com.dreamplug.android.cred",
    scheme: "upi://pay"
  },
  {
    id: "amazonpay",
    name: "Amazon Pay",
    type: "upi",
    packageName: "in.amazon.mShop.android.shopping",
    scheme: "upi://pay"
  },
  {
    id: "bhim",
    name: "BHIM",
    type: "upi",
    packageName: "in.org.npci.upiapp",
    scheme: "upi://pay"
  }
];

export const LAST_USED_PAY_APP_KEY = "bachatkaro_last_pay_app";
