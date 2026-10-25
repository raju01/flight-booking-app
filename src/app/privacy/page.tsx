import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Privacy — SkyBook" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <p>
        <strong className="text-slate-800">What we handle.</strong> When you search, your route,
        dates and cabin class are sent to our servers and to our data providers (Google Flights data
        through SerpApi, and AirLabs for flight status) to fetch fares and status. We do not take
        payments or collect card details.
      </p>
      <p>
        <strong className="text-slate-800">Stored in your browser.</strong> Recent searches, fare
        alerts and similar preferences are saved in your browser&rsquo;s local storage on your own
        device. You can clear them any time by clearing site data.
      </p>
      <p>
        <strong className="text-slate-800">Partner sites.</strong> When you click through to an
        airline or travel partner, their privacy policy applies. Affiliate links may set a cookie on
        their site so a booking can be credited to us.
      </p>
      <p>
        <strong className="text-slate-800">Contact.</strong>{" "}
        {process.env.NEXT_PUBLIC_CONTACT_EMAIL ? (
          <>
            Email{" "}
            <a className="text-indigo-600 font-semibold" href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}>
              {process.env.NEXT_PUBLIC_CONTACT_EMAIL}
            </a>{" "}
            for any privacy question.
          </>
        ) : (
          "Add a contact email in your site settings."
        )}
      </p>
    </LegalPage>
  );
}
