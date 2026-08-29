"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Flight, Passenger } from "@/types/flight";
import { formatPrice } from "@/lib/currency";
import { CheckCircleIcon, PlaneIcon, SeatIcon, CardIcon, QrCodeIcon, WalletIcon, ClockIcon } from "@/components/icons";
import Ticket from "@/components/Ticket";
import SeatMap from "@/components/SeatMap";
import GstInvoice from "@/components/GstInvoice";
import { generateSeatLayout } from "@/lib/seatMap";
import { SeatSelectionMap } from "@/types/seat";
import { GstDetails } from "@/types/gst";
import { isValidGstin } from "@/lib/gst";
import { pointsForBooking, addLoyaltyTransaction } from "@/lib/loyalty";
import { StarIcon } from "@/components/icons";

interface BookingMeta {
  passengers: number;
  cabinClass: string;
  tripType: "one-way" | "round-trip" | "multi-city";
}

const inputClass =
  "border-2 border-slate-200 rounded-2xl px-4 py-2.5 bg-white/70 transition-colors focus:outline-none focus:border-indigo-400 focus:bg-white";

function emptyPassenger(): Passenger {
  return { firstName: "", lastName: "", dob: "", gender: "Male" };
}

type CheckInState = "too-early" | "open" | "closed";

function checkInState(departureIso: string): { state: CheckInState; hoursToOpen: number } {
  const hoursToDeparture = (new Date(departureIso).getTime() - Date.now()) / 3_600_000;
  if (hoursToDeparture > 48) return { state: "too-early", hoursToOpen: hoursToDeparture - 48 };
  if (hoursToDeparture < 1) return { state: "closed", hoursToOpen: 0 };
  return { state: "open", hoursToOpen: 0 };
}

function loadBooking() {
  if (typeof window === "undefined") return null;

  const metaRaw = sessionStorage.getItem("bookingMeta");
  if (!metaRaw) return null;
  const meta = JSON.parse(metaRaw) as BookingMeta;

  if (meta.tripType === "multi-city") {
    const legsRaw = sessionStorage.getItem("selectedLegs");
    if (!legsRaw) return null;
    const legs = JSON.parse(legsRaw) as Flight[];
    if (legs.length === 0 || legs.some((f) => !f)) return null;
    return { outbound: legs[0], returnFlight: null, legs, meta };
  }

  const outboundRaw = sessionStorage.getItem("selectedOutbound");
  const returnRaw = sessionStorage.getItem("selectedReturn");
  if (!outboundRaw) return null;

  return {
    outbound: JSON.parse(outboundRaw) as Flight,
    returnFlight: returnRaw ? (JSON.parse(returnRaw) as Flight) : null,
    legs: null as Flight[] | null,
    meta,
  };
}

const STEPS = ["details", "seats", "payment", "confirmed"] as const;
type Step = (typeof STEPS)[number];

type PaymentMethod = "card" | "upi" | "wallet";

const WALLET_BALANCE = 12500;

export default function BookPage() {
  const router = useRouter();
  const [booking] = useState(loadBooking);
  const outbound = booking?.outbound ?? null;
  const returnFlight = booking?.returnFlight ?? null;
  const legs = booking?.legs ?? null;
  const meta = booking?.meta ?? null;
  const [passengers, setPassengers] = useState<Passenger[]>(() =>
    booking ? Array.from({ length: booking.meta.passengers }, emptyPassenger) : []
  );
  const [step, setStep] = useState<Step>("details");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [seatSelections, setSeatSelections] = useState<SeatSelectionMap>({});
  const [activeLegForSeats, setActiveLegForSeats] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [upiId, setUpiId] = useState("");
  const [wantsGstInvoice, setWantsGstInvoice] = useState(false);
  const [gstDetails, setGstDetails] = useState<GstDetails>({
    gstin: "",
    companyName: "",
    billingAddress: "",
  });
  const [gstinError, setGstinError] = useState("");
  const [confirmedGstDetails, setConfirmedGstDetails] = useState<GstDetails | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);

  useEffect(() => {
    if (!booking) router.push("/");
  }, [booking, router]);

  const flightLegs = useMemo<Flight[]>(() => {
    if (legs) return legs;
    if (!outbound) return [];
    return returnFlight ? [outbound, returnFlight] : [outbound];
  }, [legs, outbound, returnFlight]);

  const seatPriceTotal = useMemo(() => {
    let sum = 0;
    for (let legIndex = 0; legIndex < flightLegs.length; legIndex++) {
      const layout = generateSeatLayout(flightLegs[legIndex].id, flightLegs[legIndex].cabinClass);
      for (let p = 0; p < passengers.length; p++) {
        const seatId = seatSelections[`${legIndex}-${p}`];
        const seat = layout.seats.find((s) => s.id === seatId);
        if (seat) sum += seat.priceDelta;
      }
    }
    return sum;
  }, [flightLegs, passengers.length, seatSelections]);

  const totalPrice = useMemo(() => {
    if (!meta) return 0;
    if (legs) return legs.reduce((sum, f) => sum + f.price, 0) * meta.passengers + seatPriceTotal;
    if (!outbound) return 0;
    const base = (outbound.price + (returnFlight?.price ?? 0)) * meta.passengers;
    return base + seatPriceTotal;
  }, [outbound, returnFlight, legs, meta, seatPriceTotal]);

  const allSeatsAssigned = useMemo(() => {
    for (let legIndex = 0; legIndex < flightLegs.length; legIndex++) {
      for (let p = 0; p < passengers.length; p++) {
        if (!seatSelections[`${legIndex}-${p}`]) return false;
      }
    }
    return flightLegs.length > 0 && passengers.length > 0;
  }, [flightLegs.length, passengers.length, seatSelections]);

  function updatePassenger(index: number, field: keyof Passenger, value: string) {
    setPassengers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function selectSeat(legIndex: number, passengerIndex: number, seatId: string) {
    setSeatSelections((prev) => ({ ...prev, [`${legIndex}-${passengerIndex}`]: seatId }));
  }

  function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (wantsGstInvoice) {
      if (!isValidGstin(gstDetails.gstin)) {
        setGstinError("Enter a valid 15-character GSTIN (e.g. 07AASCS1234K1Z5).");
        return;
      }
      setGstinError("");
    }
    setActiveLegForSeats(0);
    setStep("seats");
  }

  function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    const code = `BK${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setConfirmationCode(code);
    setConfirmedGstDetails(wantsGstInvoice ? gstDetails : null);

    const earned = pointsForBooking(totalPrice);
    setPointsEarned(earned);
    addLoyaltyTransaction(`Booking ${code}`, earned);

    setStep("confirmed");
    sessionStorage.removeItem("selectedOutbound");
    sessionStorage.removeItem("selectedReturn");
    sessionStorage.removeItem("selectedLegs");
    sessionStorage.removeItem("bookingMeta");
  }

  if ((!outbound && !legs) || !meta) {
    return <div className="px-4 py-16 text-center text-slate-500">Loading…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
      <StepIndicator current={step} />
      <FlightSummary
        outbound={outbound}
        returnFlight={returnFlight}
        legs={legs}
        totalPrice={totalPrice}
      />

      {step === "details" && (
        <form onSubmit={handleDetailsSubmit} className="mt-8 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-slate-900">Passenger details</h2>
          {passengers.map((p, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <p className="sm:col-span-2 text-sm font-bold text-indigo-600">
                Passenger {i + 1}
              </p>
              <input
                required
                placeholder="First name"
                value={p.firstName}
                onChange={(e) => updatePassenger(i, "firstName", e.target.value)}
                className={inputClass}
              />
              <input
                required
                placeholder="Last name"
                value={p.lastName}
                onChange={(e) => updatePassenger(i, "lastName", e.target.value)}
                className={inputClass}
              />
              <input
                required
                type="date"
                value={p.dob}
                onChange={(e) => updatePassenger(i, "dob", e.target.value)}
                className={inputClass}
              />
              <select
                value={p.gender}
                onChange={(e) => updatePassenger(i, "gender", e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          ))}

          <div className="glass-card rounded-2xl p-4">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <p className="text-sm font-bold text-slate-800">Booking for business?</p>
                <p className="text-xs text-slate-500">
                  Add your GSTIN to get a GST-compliant invoice with this ticket.
                </p>
              </div>
              <input
                type="checkbox"
                checked={wantsGstInvoice}
                onChange={(e) => setWantsGstInvoice(e.target.checked)}
                className="accent-indigo-600 w-4 h-4 cursor-pointer shrink-0"
              />
            </label>

            {wantsGstInvoice && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  required
                  placeholder="Company name"
                  value={gstDetails.companyName}
                  onChange={(e) => setGstDetails((prev) => ({ ...prev, companyName: e.target.value }))}
                  className={`${inputClass} sm:col-span-2`}
                />
                <input
                  required
                  placeholder="GSTIN (e.g. 07AASCS1234K1Z5)"
                  value={gstDetails.gstin}
                  onChange={(e) =>
                    setGstDetails((prev) => ({ ...prev, gstin: e.target.value.toUpperCase() }))
                  }
                  className={`${inputClass} sm:col-span-2 font-mono`}
                  maxLength={15}
                />
                <textarea
                  required
                  placeholder="Billing address"
                  value={gstDetails.billingAddress}
                  onChange={(e) =>
                    setGstDetails((prev) => ({ ...prev, billingAddress: e.target.value }))
                  }
                  rows={2}
                  className={`${inputClass} sm:col-span-2 resize-none`}
                />
                {gstinError && <p className="sm:col-span-2 text-sm text-red-600">{gstinError}</p>}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="bg-gradient-to-r from-indigo-600 to-fuchsia-500 hover:shadow-xl hover:shadow-violet-300/50 text-white font-bold rounded-full px-6 py-3.5 self-start transition-all cursor-pointer"
          >
            Continue to seat selection
          </button>
        </form>
      )}

      {step === "seats" && (
        <div className="mt-8 flex flex-col gap-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <SeatIcon className="w-5 h-5 text-fuchsia-500" />
              Choose your seats
            </h2>
            {seatPriceTotal > 0 && (
              <span className="text-sm font-semibold text-indigo-600">
                +{formatPrice(seatPriceTotal)} for seats
              </span>
            )}
          </div>

          {flightLegs.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {flightLegs.map((f, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveLegForSeats(i)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                    activeLegForSeats === i
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {f.segments[0].from.code} → {f.segments[0].to.code}
                </button>
              ))}
            </div>
          )}

          <div className="glass-card rounded-2xl p-5">
            <p className="text-sm text-slate-500 mb-4">
              {flightLegs[activeLegForSeats]?.segments[0].from.code} →{" "}
              {flightLegs[activeLegForSeats]?.segments[0].to.code} ·{" "}
              {flightLegs[activeLegForSeats]?.segments[0].airline}
            </p>

            <div className="flex flex-col gap-6">
              {passengers.map((p, passengerIndex) => {
                const key = `${activeLegForSeats}-${passengerIndex}`;
                const otherSelections = Object.entries(seatSelections)
                  .filter(([k]) => k.startsWith(`${activeLegForSeats}-`) && k !== key)
                  .map(([, v]) => v);
                return (
                  <div key={passengerIndex}>
                    <p className="text-sm font-bold text-indigo-600 mb-2">
                      {p.firstName || `Passenger ${passengerIndex + 1}`}
                      {seatSelections[key] && (
                        <span className="ml-2 text-xs font-semibold text-emerald-600">
                          Seat {seatSelections[key]}
                        </span>
                      )}
                    </p>
                    <SeatMap
                      flightId={flightLegs[activeLegForSeats].id}
                      cabinClass={flightLegs[activeLegForSeats].cabinClass}
                      selectedSeatId={seatSelections[key] ?? null}
                      disabledSeatIds={otherSelections}
                      onSelect={(seat) => selectSeat(activeLegForSeats, passengerIndex, seat.id)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            disabled={!allSeatsAssigned}
            onClick={() => setStep("payment")}
            className="bg-gradient-to-r from-indigo-600 to-fuchsia-500 hover:shadow-xl hover:shadow-violet-300/50 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-full px-6 py-3.5 self-start transition-all cursor-pointer"
          >
            Continue to payment
          </button>
        </div>
      )}

      {step === "payment" && (
        <form onSubmit={handlePayment} className="mt-8 flex flex-col gap-4 max-w-md">
          <h2 className="text-lg font-bold text-slate-900">Payment (mock)</h2>
          <p className="text-xs text-slate-500">
            This is a demo checkout. No real payment is processed.
          </p>

          <div className="flex gap-2">
            {(
              [
                ["card", "Card", CardIcon],
                ["upi", "UPI", QrCodeIcon],
                ["wallet", "Wallet", WalletIcon],
              ] as [PaymentMethod, string, typeof CardIcon][]
            ).map(([method, label, Icon]) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                  paymentMethod === method
                    ? "bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-white shadow-md shadow-violet-300"
                    : "bg-white border-2 border-slate-200 text-slate-600 hover:border-indigo-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {paymentMethod === "card" && (
            <>
              <input
                required
                placeholder="Card number"
                defaultValue="4242 4242 4242 4242"
                className={inputClass}
              />
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="MM/YY" defaultValue="12/29" className={inputClass} />
                <input required placeholder="CVC" defaultValue="123" className={inputClass} />
              </div>
            </>
          )}

          {paymentMethod === "upi" && (
            <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-28 h-28 shrink-0 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center">
                <QrCodeIcon className="w-16 h-16 text-slate-700" />
              </div>
              <div className="flex-1 w-full">
                <p className="text-xs text-slate-500 mb-2">
                  Scan the QR code in any UPI app, or enter your UPI ID below.
                </p>
                <input
                  required
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className={`${inputClass} w-full`}
                />
              </div>
            </div>
          )}

          {paymentMethod === "wallet" && (
            <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-white">
                  <WalletIcon className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">SkyBook Wallet</p>
                  <p className="text-xs text-slate-500">Available balance</p>
                </div>
              </div>
              <p className="text-lg font-extrabold text-slate-900">{formatPrice(WALLET_BALANCE)}</p>
            </div>
          )}

          {paymentMethod === "wallet" && totalPrice > WALLET_BALANCE && (
            <p className="text-sm text-red-600 animate-[shake_0.3s_ease-in-out]">
              Insufficient wallet balance for this booking. Choose Card or UPI instead.
            </p>
          )}

          <button
            type="submit"
            disabled={paymentMethod === "wallet" && totalPrice > WALLET_BALANCE}
            className="bg-gradient-to-r from-indigo-600 to-fuchsia-500 hover:shadow-xl hover:shadow-violet-300/50 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-full px-6 py-3.5 transition-all cursor-pointer"
          >
            Pay {formatPrice(totalPrice)}
          </button>
        </form>
      )}

      {step === "confirmed" && (
        <div className="mt-8 flex flex-col gap-6">
          <div className="glass-card rounded-3xl p-8 text-center relative overflow-hidden print:hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="relative flex flex-col items-center gap-3">
              <span className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-200">
                <CheckCircleIcon className="w-8 h-8" />
              </span>
              <p className="text-emerald-700 font-extrabold text-xl">Booking confirmed!</p>
              <p className="text-sm text-slate-600">
                Confirmation code:{" "}
                <span className="font-mono font-bold text-slate-800">{confirmationCode}</span>
              </p>
              {pointsEarned > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-full px-3 py-1.5">
                  <StarIcon className="w-3.5 h-3.5" filled />
                  You earned {pointsEarned} SkyBook Reward Points
                </div>
              )}
              <div className="flex items-center gap-4 mt-2 flex-wrap justify-center">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-fuchsia-500 hover:shadow-lg hover:shadow-violet-300/50 text-white text-sm font-bold rounded-full px-5 py-2.5 transition-all cursor-pointer"
                >
                  Print / Save ticket
                </button>
                <button
                  onClick={() => router.push("/rewards")}
                  className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold hover:underline cursor-pointer"
                >
                  <StarIcon className="w-4 h-4" filled />
                  View rewards
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold hover:underline cursor-pointer"
                >
                  <PlaneIcon className="w-4 h-4" />
                  Book another flight
                </button>
              </div>
            </div>
          </div>

          {flightLegs[0] && <CheckInBanner flight={flightLegs[0]} />}

          <Ticket
            outbound={outbound ?? undefined}
            returnFlight={returnFlight}
            legs={legs ?? undefined}
            passengers={passengers}
            confirmationCode={confirmationCode}
            seatSelections={seatSelections}
          />

          {confirmedGstDetails && (
            <GstInvoice
              flights={flightLegs}
              gstDetails={confirmedGstDetails}
              confirmationCode={confirmationCode}
            />
          )}
        </div>
      )}
    </div>
  );
}

function CheckInBanner({ flight }: { flight: Flight }) {
  const segment = flight.segments[0];
  const { state, hoursToOpen } = checkInState(segment.departureTime);

  if (state === "closed") return null;

  if (state === "too-early") {
    const days = Math.floor(hoursToOpen / 24);
    const hours = Math.round(hoursToOpen % 24);
    return (
      <div className="glass-card rounded-2xl p-4 flex items-center gap-3 print:hidden">
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-500 shrink-0">
          <ClockIcon className="w-4 h-4" />
        </span>
        <p className="text-sm text-slate-600">
          Web check-in for {segment.airline} {segment.flightNumber} opens in{" "}
          <span className="font-bold text-slate-800">
            {days > 0 ? `${days}d ${hours}h` : `${hours}h`}
          </span>{" "}
          (48 hours before departure).
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-600 to-fuchsia-500 text-white print:hidden">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white/20 shrink-0">
          <ClockIcon className="w-4 h-4" />
        </span>
        <p className="text-sm font-medium">
          Web check-in is now open for {segment.airline} {segment.flightNumber}.
        </p>
      </div>
      <button
        type="button"
        onClick={() => alert("This is a demo — web check-in isn't actually processed.")}
        className="bg-white text-indigo-700 text-sm font-bold rounded-full px-4 py-2 whitespace-nowrap hover:shadow-md transition-all cursor-pointer"
      >
        Check in now
      </button>
    </div>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const labels: Record<Step, string> = {
    details: "Details",
    seats: "Seats",
    payment: "Payment",
    confirmed: "Confirmed",
  };
  const currentIndex = STEPS.indexOf(current);

  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                i <= currentIndex
                  ? "bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-white"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`text-xs font-semibold hidden sm:inline ${
                i <= currentIndex ? "text-slate-800" : "text-slate-400"
              }`}
            >
              {labels[s]}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-0.5 flex-1 rounded-full transition-colors ${
                i < currentIndex ? "bg-gradient-to-r from-indigo-500 to-fuchsia-400" : "bg-slate-100"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function FlightSummary({
  outbound,
  returnFlight,
  legs,
  totalPrice,
}: {
  outbound: Flight | null;
  returnFlight: Flight | null;
  legs: Flight[] | null;
  totalPrice: number;
}) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <h1 className="text-xl font-extrabold text-slate-900 mb-3">Review your trip</h1>
      {legs
        ? legs.map((f, i) => <SegmentRow key={i} flight={f} label={`Flight ${i + 1}`} />)
        : outbound && (
            <>
              <SegmentRow flight={outbound} label="Outbound" />
              {returnFlight && <SegmentRow flight={returnFlight} label="Return" />}
            </>
          )}
      <div className="border-t border-slate-200 mt-3 pt-3 flex justify-between items-center">
        <span className="text-sm text-slate-500 font-medium">Total price</span>
        <span className="text-xl font-extrabold gradient-text [--gradient-from:theme(colors.indigo.600)] [--gradient-to:theme(colors.fuchsia.500)]">
          {formatPrice(totalPrice)}
        </span>
      </div>
    </div>
  );
}

function SegmentRow({ flight, label }: { flight: Flight; label: string }) {
  const segment = flight.segments[0];
  return (
    <div className="flex justify-between text-sm py-2 border-b border-slate-100 last:border-0">
      <div>
        <p className="font-semibold text-slate-800">
          {label}: {segment.from.code} → {segment.to.code}
        </p>
        <p className="text-slate-500">
          {segment.airline} · {segment.flightNumber}
          {flight.fareTier && (
            <span className="ml-1.5 text-indigo-600 font-semibold">· {flight.fareTier.name}</span>
          )}
          {flight.priceLocked && (
            <span className="ml-1.5 text-amber-600 font-semibold">· Price locked</span>
          )}
        </p>
      </div>
      <p className="font-bold text-slate-800">{formatPrice(flight.price)}</p>
    </div>
  );
}
