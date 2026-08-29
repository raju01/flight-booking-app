"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Flight, Passenger } from "@/types/flight";
import { formatPrice } from "@/lib/currency";
import { CheckCircleIcon, PlaneIcon } from "@/components/icons";
import Ticket from "@/components/Ticket";

interface BookingMeta {
  passengers: number;
  cabinClass: string;
  tripType: "one-way" | "round-trip";
}

const inputClass =
  "border-2 border-slate-200 rounded-2xl px-4 py-2.5 bg-white/70 transition-colors focus:outline-none focus:border-indigo-400 focus:bg-white";

function emptyPassenger(): Passenger {
  return { firstName: "", lastName: "", dob: "", gender: "Male" };
}

function loadBooking() {
  if (typeof window === "undefined") return null;

  const outboundRaw = sessionStorage.getItem("selectedOutbound");
  const returnRaw = sessionStorage.getItem("selectedReturn");
  const metaRaw = sessionStorage.getItem("bookingMeta");
  if (!outboundRaw || !metaRaw) return null;

  return {
    outbound: JSON.parse(outboundRaw) as Flight,
    returnFlight: returnRaw ? (JSON.parse(returnRaw) as Flight) : null,
    meta: JSON.parse(metaRaw) as BookingMeta,
  };
}

const STEPS = ["details", "payment", "confirmed"] as const;
type Step = (typeof STEPS)[number];

export default function BookPage() {
  const router = useRouter();
  const [booking] = useState(loadBooking);
  const outbound = booking?.outbound ?? null;
  const returnFlight = booking?.returnFlight ?? null;
  const meta = booking?.meta ?? null;
  const [passengers, setPassengers] = useState<Passenger[]>(() =>
    booking ? Array.from({ length: booking.meta.passengers }, emptyPassenger) : []
  );
  const [step, setStep] = useState<Step>("details");
  const [confirmationCode, setConfirmationCode] = useState("");

  useEffect(() => {
    if (!booking) router.push("/");
  }, [booking, router]);

  const totalPrice = useMemo(() => {
    if (!outbound || !meta) return 0;
    const base = (outbound.price + (returnFlight?.price ?? 0)) * meta.passengers;
    return base;
  }, [outbound, returnFlight, meta]);

  function updatePassenger(index: number, field: keyof Passenger, value: string) {
    setPassengers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep("payment");
  }

  function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    const code = `BK${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setConfirmationCode(code);
    setStep("confirmed");
    sessionStorage.removeItem("selectedOutbound");
    sessionStorage.removeItem("selectedReturn");
    sessionStorage.removeItem("bookingMeta");
  }

  if (!outbound || !meta) {
    return <div className="px-4 py-16 text-center text-slate-500">Loading…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
      <StepIndicator current={step} />
      <FlightSummary outbound={outbound} returnFlight={returnFlight} totalPrice={totalPrice} />

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
          <button
            type="submit"
            className="bg-gradient-to-r from-indigo-600 to-fuchsia-500 hover:shadow-xl hover:shadow-violet-300/50 text-white font-bold rounded-full px-6 py-3.5 self-start transition-all cursor-pointer"
          >
            Continue to payment
          </button>
        </form>
      )}

      {step === "payment" && (
        <form onSubmit={handlePayment} className="mt-8 flex flex-col gap-4 max-w-md">
          <h2 className="text-lg font-bold text-slate-900">Payment (mock)</h2>
          <p className="text-xs text-slate-500">
            This is a demo checkout. No real payment is processed.
          </p>
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
          <button
            type="submit"
            className="bg-gradient-to-r from-indigo-600 to-fuchsia-500 hover:shadow-xl hover:shadow-violet-300/50 text-white font-bold rounded-full px-6 py-3.5 transition-all cursor-pointer"
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
              <div className="flex items-center gap-4 mt-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-fuchsia-500 hover:shadow-lg hover:shadow-violet-300/50 text-white text-sm font-bold rounded-full px-5 py-2.5 transition-all cursor-pointer"
                >
                  Print / Save ticket
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

          <Ticket
            outbound={outbound}
            returnFlight={returnFlight}
            passengers={passengers}
            confirmationCode={confirmationCode}
          />
        </div>
      )}
    </div>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const labels: Record<Step, string> = {
    details: "Details",
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
  totalPrice,
}: {
  outbound: Flight;
  returnFlight: Flight | null;
  totalPrice: number;
}) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <h1 className="text-xl font-extrabold text-slate-900 mb-3">Review your trip</h1>
      <SegmentRow flight={outbound} label="Outbound" />
      {returnFlight && <SegmentRow flight={returnFlight} label="Return" />}
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
        </p>
      </div>
      <p className="font-bold text-slate-800">{formatPrice(flight.price)}</p>
    </div>
  );
}
