import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Affiliate disclosure — SkyBook" };

export default function DisclosurePage() {
  return (
    <LegalPage title="Affiliate disclosure">
      <p>
        Some links on SkyBook are affiliate links. If you click one and make a booking, we may
        receive a commission from the airline or travel partner. This does not change the price you
        pay.
      </p>
      <p>
        Commissions never decide which flights we show or how we sort them. Results are ordered by
        the criteria you pick, such as price or duration.
      </p>
      <p>
        We are not the seller of your ticket. Please read the booking site&rsquo;s terms,
        cancellation and refund policy before you pay.
      </p>
    </LegalPage>
  );
}
