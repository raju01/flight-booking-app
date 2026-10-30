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
# flight-booking-app
# flight-booking-app

## Live flight data

Copy `.env.example` to `.env.local` and fill in the keys. Without a key (or if the provider is
unreachable) the app falls back to generated sample data and shows a "Sample data" badge.

- **Flight search** uses Google Flights data via [SerpApi](https://serpapi.com) (`SERPAPI_API_KEY`),
  which covers Indian airlines. It is search and prices only; booking in this app is still a mock.
  Every search spends one SerpApi credit; results are cached in memory for 10 minutes.
- **Fare calendar** needs 7 searches per view, so with live data it is hidden unless
  `SERPAPI_FARE_CALENDAR=1` is set.
- **Flight status** uses [AirLabs](https://airlabs.co) (`AIRLABS_API_KEY`). It only knows flights
  running today or very soon.
- **Bus search** uses Google bus schedules via the same SerpApi key. A fare is shown when Google publishes one. If the search fails, the page falls back to sample data.
- Price-trend hints and seat maps are still generated sample data.
