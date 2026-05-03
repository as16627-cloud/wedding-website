This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Private Guest SMS

The `/guest-list` page can send real RSVP SMS messages through Twilio. Real sending is disabled until server-side provider credentials are configured.

Required environment variables:

```bash
PUBLIC_SITE_URL="https://your-public-wedding-site.example"
TWILIO_ACCOUNT_SID=""
TWILIO_API_KEY_SID=""
TWILIO_API_KEY_SECRET=""
TWILIO_FROM_NUMBER=""
```

You can use `TWILIO_MESSAGING_SERVICE_SID` instead of `TWILIO_FROM_NUMBER`. For local testing only, `TWILIO_AUTH_TOKEN` can be used instead of the API key pair.

The SMS endpoint is protected by the guest-list passcode, rate-limited, capped at 25 recipients per request, and only sends the built-in RSVP invitation text with each guest's private invite link.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
