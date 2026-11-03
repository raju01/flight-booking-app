export type StayKind = "hotel" | "vacation rental";

export interface Hotel {
  id: string; // Google's property token; also what the seller lookup needs
  name: string;
  kind: StayKind;
  description?: string;
  stars: number | null; // official hotel class, 1-5
  rating: number | null; // guest rating out of 5
  reviews: number | null;
  pricePerNight: number | null; // lowest nightly rate Google found, for the whole party
  totalPrice: number | null; // for the whole stay
  image?: string;
  amenities: string[];
  checkInTime?: string;
  checkOutTime?: string;
}

// One booking site's price for a stay. `url` is Google's hand-off link to that site.
export interface HotelOffer {
  seller: string;
  logo?: string;
  official: boolean; // the hotel's own website
  pricePerNight: number;
  totalPrice: number | null;
  freeCancellation: boolean;
  cancelUntil?: string; // e.g. "Nov 18"
  url: string;
}
