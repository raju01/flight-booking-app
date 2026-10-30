import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "About — SkyBook",
  description: "SkyBook compares flight fares across airlines and booking sites. We do not sell tickets.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <LegalPage title="About SkyBook">
      <p>
        SkyBook is a flight search and price comparison site for travel within India and around the
        world. For every flight we show the fare from the airline and from each booking site that
        sells it, cheapest first, so you can compare before you book.
      </p>
      <p>
        <strong className="text-slate-800">We do not sell tickets.</strong> When you choose a
        flight, we send you to the airline or a travel partner to complete the booking and payment.
        Your ticket, refund and changes are handled by them under their terms.
      </p>
      <p>
        Fares, seller prices and price insights come from Google Flights data, and flight status
        from AirLabs. Prices can change quickly, so always confirm the final price and baggage rules
        on the booking site. Where a page is marked &ldquo;Sample data&rdquo; or &ldquo;Sample
        fares&rdquo;, the results are examples and not real fares.
      </p>
      {process.env.NEXT_PUBLIC_CONTACT_EMAIL && (
        <p>
          Questions? Email{" "}
          <a className="text-indigo-600 font-semibold" href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}>
            {process.env.NEXT_PUBLIC_CONTACT_EMAIL}
          </a>
          .
        </p>
      )}
    </LegalPage>
  );
}
