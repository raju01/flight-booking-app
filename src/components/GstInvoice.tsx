"use client";

import { Flight } from "@/types/flight";
import { GstDetails } from "@/types/gst";
import { computeGstBreakdown } from "@/lib/gst";
import { formatPrice } from "@/lib/currency";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function GstInvoice({
  flights,
  gstDetails,
  confirmationCode,
}: {
  flights: Flight[];
  gstDetails: GstDetails;
  confirmationCode: string;
}) {
  const rows = flights.map((flight) => ({
    flight,
    breakdown: computeGstBreakdown(flight.price, flight.cabinClass),
  }));

  const totals = rows.reduce(
    (acc, { breakdown }) => ({
      taxableValue: acc.taxableValue + breakdown.taxableValue,
      cgst: acc.cgst + breakdown.cgst,
      sgst: acc.sgst + breakdown.sgst,
      total: acc.total + breakdown.total,
    }),
    { taxableValue: 0, cgst: 0, sgst: 0, total: 0 }
  );

  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 print:break-inside-avoid">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Tax Invoice</h2>
          <p className="text-xs text-slate-500">GST-compliant invoice for air travel services</p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>
            Invoice No: <span className="font-mono font-semibold text-slate-800">INV-{confirmationCode}</span>
          </p>
          <p>Date: {formatDate(new Date().toISOString())}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 text-sm">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
            Billed to
          </p>
          <p className="font-bold text-slate-900">{gstDetails.companyName}</p>
          <p className="text-slate-600">GSTIN: {gstDetails.gstin}</p>
          <p className="text-slate-600 whitespace-pre-line">{gstDetails.billingAddress}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
            Supplier
          </p>
          <p className="font-bold text-slate-900">SkyBook Travels Pvt. Ltd.</p>
          <p className="text-slate-600">GSTIN: 07AASCS1234K1Z5</p>
          <p className="text-slate-600">Demo booking experience — no real GST is filed</p>
        </div>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b-2 border-slate-200 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              <th className="py-2 pr-3">Flight</th>
              <th className="py-2 pr-3">Cabin</th>
              <th className="py-2 pr-3 text-right">Taxable value</th>
              <th className="py-2 pr-3 text-right">CGST</th>
              <th className="py-2 pr-3 text-right">SGST</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ flight, breakdown }, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-2.5 pr-3 font-medium text-slate-800">
                  {flight.segments[0].airline} {flight.segments[0].flightNumber}
                </td>
                <td className="py-2.5 pr-3 text-slate-600">{flight.cabinClass}</td>
                <td className="py-2.5 pr-3 text-right text-slate-600">
                  {formatPrice(breakdown.taxableValue)}
                </td>
                <td className="py-2.5 pr-3 text-right text-slate-600">
                  {formatPrice(breakdown.cgst)} ({(breakdown.rate * 50).toFixed(1)}%)
                </td>
                <td className="py-2.5 pr-3 text-right text-slate-600">
                  {formatPrice(breakdown.sgst)} ({(breakdown.rate * 50).toFixed(1)}%)
                </td>
                <td className="py-2.5 text-right font-bold text-slate-900">
                  {formatPrice(breakdown.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4">
        <div className="w-full sm:w-64 text-sm">
          <div className="flex justify-between py-1 text-slate-600">
            <span>Taxable value</span>
            <span>{formatPrice(totals.taxableValue)}</span>
          </div>
          <div className="flex justify-between py-1 text-slate-600">
            <span>Total CGST</span>
            <span>{formatPrice(totals.cgst)}</span>
          </div>
          <div className="flex justify-between py-1 text-slate-600">
            <span>Total SGST</span>
            <span>{formatPrice(totals.sgst)}</span>
          </div>
          <div className="flex justify-between py-2 mt-1 border-t-2 border-slate-200 font-extrabold text-slate-900">
            <span>Grand total</span>
            <span>{formatPrice(totals.total)}</span>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 mt-6">
        This is a system-generated demo invoice for a mock booking. It does not represent a real
        tax document and has no legal or financial validity.
      </p>
    </div>
  );
}
