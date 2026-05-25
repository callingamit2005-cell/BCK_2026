# Razorpay + Vite Environment Setup

This project now uses one frontend base URL variable:

`VITE_BASE_URL`

The app reads it from the active Vite mode, so you do not need to manually change URLs when moving between localhost, ngrok, and production.

## 1. Environment files

Use these files at the project root:

### `.env.development`

```env
VITE_BASE_URL=http://localhost:8081
```

### `.env.ngrok`

```env
VITE_BASE_URL=https://YOUR-NGROK-LINK.ngrok-free.dev
```

### `.env.production`

```env
VITE_BASE_URL=https://yourdomain.com
```

## 2. Reusable frontend config

Use the shared helper from `src/config/env.ts` and `src/services/paymentApi.ts`.

Safe fallback:

```ts
const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8081";
```

In this project, that fallback is now centralized so you do not repeat it in every component.

## 3. How to call your backend

Instead of hardcoding:

```ts
fetch("http://localhost:8081/api/payment")
```

Use:

```ts
fetch(`${import.meta.env.VITE_BASE_URL}/api/payment`)
```

Or use the shared helper:

```ts
import { PAYMENT_API_URL } from "@/services/paymentApi";

fetch(PAYMENT_API_URL)
```

## 4. Razorpay callback URL

Use:

```ts
callback_url: `${import.meta.env.VITE_BASE_URL}/api/payment/verify`
```

In this project, the reusable constant is:

```ts
import { PAYMENT_VERIFY_URL } from "@/services/paymentApi";
```

## 5. Run commands

Local development:

```bash
npm run dev
```

Ngrok mode:

```bash
npm run dev:ngrok
```

Production build:

```bash
npm run build:production
```

Ngrok build:

```bash
npm run build:ngrok
```

## 6. Example `Payment.tsx`

See:

`src/examples/Payment.tsx`

That example shows:

- `BASE_URL` fallback
- `fetch` through reusable payment API helpers
- Razorpay `callback_url` using the active environment

## 7. Testing checklist

- Start local mode and confirm payment requests go to `http://localhost:8081/api/payment`.
- Start ngrok mode and confirm payment requests go to your `https://...ngrok-free.dev/api/payment` URL.
- Build production and confirm payment requests go to `https://yourdomain.com/api/payment`.
- Open Razorpay checkout and verify the callback points to `/api/payment/verify` on the active base URL.
- Confirm there are no frontend hardcoded `localhost` payment URLs left in your payment flow.
- If you change the ngrok URL, update only `.env.ngrok`.
