"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { futureDate } from "@/lib/dates";

const subscribe = () => () => {};

// The date is picked in the browser so a prerendered page never links to a day that has passed.
export default function RouteSearchButton({
  from,
  to,
  label,
  className = "",
}: {
  from: string;
  to: string;
  label: string;
  className?: string;
}) {
  const date = useSyncExternalStore(subscribe, () => futureDate(14), () => "");
  const href = `/search?${new URLSearchParams({
    from,
    to,
    departDate: date,
    passengers: "1",
    adults: "1",
    children: "0",
    infants: "0",
    cabinClass: "Economy",
    tripType: "one-way",
  })}`;
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}
