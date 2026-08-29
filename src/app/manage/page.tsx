"use client";

import { useState } from "react";
import {
  findBooking,
  cancelBooking,
  estimateCancellationFee,
  updatePassenger,
  NAME_CORRECTION_FEE,
} from "@/lib/bookings";
import { SavedBooking } from "@/types/booking";
import { formatPrice } from "@/lib/currency";
import Ticket from "@/components/Ticket";
import { CheckCircleIcon, XCircleIcon, PlaneIcon } from "@/components/icons";

const inputClass =
  "w-full border-2 border-slate-200 rounded-2xl px-4 py-2.5 bg-white/70 transition-colors focus:outline-none focus:border-indigo-400 focus:bg-white";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ManageBookingPage() {
  const [code, setCode] = useState("");
  const [lastName, setLastName] = useState("");
  const [booking, setBooking] = useState<SavedBooking | null | undefined>(undefined);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setBooking(findBooking(code, lastName));
    setConfirmingCancel(false);
  }

  function handleCancel() {
    if (!booking) return;
    const updated = cancelBooking(booking.confirmationCode);
    setBooking(updated);
    setConfirmingCancel(false);
  }

  function startEditing(index: number) {
    if (!booking) return;
    setEditingIndex(index);
    setEditFirstName(booking.passengers[index].firstName);
    setEditLastName(booking.passengers[index].lastName);
  }

  function saveEdit() {
    if (!booking || editingIndex === null) return;
    const updated = updatePassenger(booking.confirmationCode, editingIndex, {
      firstName: editFirstName,
      lastName: editLastName,
    });
    setBooking(updated);
    setEditingIndex(null);
  }

  const flightLegs = booking
    ? booking.legs?.length
      ? booking.legs
      : [booking.outbound, booking.returnFlight].filter((f): f is NonNullable<typeof f> => Boolean(f))
    : [];

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2 mb-1">
        <PlaneIcon className="w-6 h-6 text-fuchsia-500" />
        Manage booking
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Look up a booking made on this device by confirmation code and passenger last name.
      </p>

      <form
        onSubmit={handleLookup}
        className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row gap-3 mb-8"
      >
        <input
          required
          placeholder="Confirmation code, e.g. BK1A2B3C"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className={`${inputClass} font-mono sm:flex-1`}
        />
        <input
          required
          placeholder="Passenger last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className={`${inputClass} sm:flex-1`}
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-indigo-600 to-fuchsia-500 hover:shadow-lg hover:shadow-violet-300/50 text-white font-bold rounded-full px-6 py-2.5 transition-all cursor-pointer whitespace-nowrap"
        >
          Find booking
        </button>
      </form>

      {booking === null && (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-sm bg-white/50">
          No booking found for that confirmation code and last name on this device. Bookings are
          only stored in the browser you booked from.
        </div>
      )}

      {booking && (
        <div className="flex flex-col gap-6">
          <div className="glass-card rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`flex items-center justify-center w-11 h-11 rounded-full text-white shrink-0 ${
                  booking.status === "cancelled"
                    ? "bg-gradient-to-br from-red-500 to-rose-400"
                    : "bg-gradient-to-br from-emerald-500 to-teal-400"
                }`}
              >
                {booking.status === "cancelled" ? (
                  <XCircleIcon className="w-6 h-6" />
                ) : (
                  <CheckCircleIcon className="w-6 h-6" />
                )}
              </span>
              <div>
                <p className="font-extrabold text-slate-900">
                  {booking.status === "cancelled" ? "Booking cancelled" : "Booking confirmed"}
                </p>
                <p className="text-xs text-slate-500">
                  {booking.confirmationCode} · Booked {formatDateTime(booking.createdAt)}
                </p>
              </div>
            </div>
            <p className="text-xl font-extrabold text-slate-900">
              {formatPrice(booking.totalPrice)}
            </p>
          </div>

          {booking.status === "confirmed" && (
            <div className="glass-card rounded-2xl p-5">
              {!confirmingCancel ? (
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">Need to cancel?</p>
                    <p className="text-xs text-slate-500">
                      Estimated cancellation fee:{" "}
                      <span className="font-semibold text-slate-700">
                        {formatPrice(estimateCancellationFee(booking))}
                      </span>{" "}
                      based on your fare type.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmingCancel(true)}
                    className="text-sm font-bold text-red-600 hover:bg-red-50 rounded-full px-4 py-2 transition-colors cursor-pointer"
                  >
                    Cancel booking
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-slate-700">
                    You&apos;ll be refunded{" "}
                    <span className="font-bold text-emerald-700">
                      {formatPrice(booking.totalPrice - estimateCancellationFee(booking))}
                    </span>{" "}
                    after a{" "}
                    <span className="font-bold text-red-600">
                      {formatPrice(estimateCancellationFee(booking))}
                    </span>{" "}
                    cancellation fee. This cannot be undone.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-full px-5 py-2.5 transition-colors cursor-pointer"
                    >
                      Confirm cancellation
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingCancel(false)}
                      className="text-sm font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Keep booking
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {booking.status === "cancelled" && (
            <div className="glass-card rounded-2xl p-5 text-sm text-slate-600">
              Cancelled {booking.cancelledAt && formatDateTime(booking.cancelledAt)} ·
              Cancellation fee {formatPrice(booking.cancellationFee ?? 0)} · Refund{" "}
              <span className="font-bold text-emerald-700">
                {formatPrice(booking.refundAmount ?? 0)}
              </span>
            </div>
          )}

          {booking.status === "confirmed" && (
            <div className="glass-card rounded-2xl p-5">
              <p className="text-sm font-bold text-slate-800 mb-3">Passenger details</p>
              <div className="flex flex-col divide-y divide-slate-100">
                {booking.passengers.map((p, i) => (
                  <div key={i} className="py-3 first:pt-0 last:pb-0">
                    {editingIndex === i ? (
                      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                        <input
                          value={editFirstName}
                          onChange={(e) => setEditFirstName(e.target.value)}
                          placeholder="First name"
                          className={`${inputClass} sm:flex-1`}
                        />
                        <input
                          value={editLastName}
                          onChange={(e) => setEditLastName(e.target.value)}
                          placeholder="Last name"
                          className={`${inputClass} sm:flex-1`}
                        />
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={saveEdit}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-full px-4 py-2 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingIndex(null)}
                            className="text-sm font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {p.firstName} {p.lastName}
                            {p.travelerType !== "adult" && (
                              <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100 rounded-full px-1.5 py-0.5">
                                {p.travelerType}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400">
                            Name correction fee: {formatPrice(NAME_CORRECTION_FEE)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => startEditing(i)}
                          className="text-sm font-bold text-indigo-600 hover:underline cursor-pointer whitespace-nowrap"
                        >
                          Edit name
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Ticket
            outbound={booking.outbound}
            returnFlight={booking.returnFlight}
            legs={booking.legs ?? undefined}
            passengers={booking.passengers}
            confirmationCode={booking.confirmationCode}
            seatSelections={booking.seatSelections}
          />

          {flightLegs.length === 0 && (
            <p className="text-sm text-slate-400">No flight details saved for this booking.</p>
          )}
        </div>
      )}
    </div>
  );
}
