import { Flight, Passenger } from "@/types/flight";
import { SeatSelectionMap } from "@/types/seat";
import { GstDetails } from "@/types/gst";

export type BookingStatus = "confirmed" | "cancelled";

export interface SavedBooking {
  confirmationCode: string;
  createdAt: string; // ISO
  status: BookingStatus;
  cancelledAt?: string; // ISO
  cancellationFee?: number;
  refundAmount?: number;
  outbound?: Flight;
  returnFlight?: Flight | null;
  legs?: Flight[] | null;
  passengers: Passenger[];
  seatSelections: SeatSelectionMap;
  totalPrice: number;
  gstDetails?: GstDetails | null;
}
