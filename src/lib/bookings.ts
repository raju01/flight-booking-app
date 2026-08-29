import { Flight, Passenger } from "@/types/flight";
import { SavedBooking } from "@/types/booking";

const STORAGE_KEY = "skybook_bookings";
const DEFAULT_CANCELLATION_RATE = 0.3;
export const NAME_CORRECTION_FEE = 350;

export function loadAllBookings(): SavedBooking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAllBookings(bookings: SavedBooking[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch {
    // localStorage unavailable — booking just won't persist
  }
}

export function saveBooking(booking: SavedBooking) {
  const all = loadAllBookings();
  saveAllBookings([booking, ...all.filter((b) => b.confirmationCode !== booking.confirmationCode)].slice(0, 100));
}

export function findBooking(confirmationCode: string, lastName: string): SavedBooking | null {
  const all = loadAllBookings();
  const code = confirmationCode.trim().toUpperCase();
  const name = lastName.trim().toLowerCase();
  return (
    all.find(
      (b) =>
        b.confirmationCode.toUpperCase() === code &&
        b.passengers.some((p) => p.lastName.trim().toLowerCase() === name)
    ) ?? null
  );
}

function flightCancellationFee(flight: Flight): number {
  if (flight.fareTier) {
    return flight.fareTier.cancellationFee === "free" ? 0 : flight.fareTier.cancellationFee;
  }
  return Math.round((flight.price * DEFAULT_CANCELLATION_RATE) / 10) * 10;
}

export function estimateCancellationFee(booking: SavedBooking): number {
  const flights = booking.legs?.length
    ? booking.legs
    : [booking.outbound, booking.returnFlight].filter((f): f is Flight => Boolean(f));
  const passengerCount = booking.passengers.length || 1;
  return flights.reduce((sum, f) => sum + flightCancellationFee(f), 0) * passengerCount;
}

export function updatePassenger(
  confirmationCode: string,
  passengerIndex: number,
  updates: Partial<Passenger>
): SavedBooking | null {
  const all = loadAllBookings();
  const index = all.findIndex((b) => b.confirmationCode === confirmationCode);
  if (index === -1) return null;

  const booking = all[index];
  if (booking.status === "cancelled" || !booking.passengers[passengerIndex]) return booking;

  const passengers = [...booking.passengers];
  passengers[passengerIndex] = { ...passengers[passengerIndex], ...updates };
  const updated: SavedBooking = { ...booking, passengers };

  const copy = [...all];
  copy[index] = updated;
  saveAllBookings(copy);
  return updated;
}

export function cancelBooking(confirmationCode: string): SavedBooking | null {
  const all = loadAllBookings();
  const index = all.findIndex((b) => b.confirmationCode === confirmationCode);
  if (index === -1) return null;

  const booking = all[index];
  if (booking.status === "cancelled") return booking;

  const fee = estimateCancellationFee(booking);
  const refund = Math.max(0, booking.totalPrice - fee);

  const updated: SavedBooking = {
    ...booking,
    status: "cancelled",
    cancelledAt: new Date().toISOString(),
    cancellationFee: fee,
    refundAmount: refund,
  };

  const copy = [...all];
  copy[index] = updated;
  saveAllBookings(copy);
  return updated;
}
