import { Seat, SeatLayout, SeatColumnType } from "@/types/seat";
import { CabinClass } from "@/types/flight";
import { seededRandom, seedFromString } from "@/lib/seededRandom";

const LAYOUT_BY_CABIN: Record<CabinClass, { rows: number; columns: string[] }> = {
  Economy: { rows: 24, columns: ["A", "B", "C", "D", "E", "F"] },
  "Premium Economy": { rows: 14, columns: ["A", "B", "C", "D", "E", "F"] },
  Business: { rows: 8, columns: ["A", "C", "D", "F"] },
  First: { rows: 4, columns: ["A", "D"] },
};

function columnType(columns: string[], index: number): SeatColumnType {
  const groupSize = columns.length / 2;
  const posInGroup = index % groupSize;
  if (posInGroup === 0) return "window";
  if (posInGroup === groupSize - 1) return "aisle";
  return "middle";
}

export function generateSeatLayout(flightId: string, cabinClass: CabinClass): SeatLayout {
  const { rows, columns } = LAYOUT_BY_CABIN[cabinClass];
  const rand = seededRandom(seedFromString(`seatmap-${flightId}`));
  const extraLegroomRows = new Set([1, Math.ceil(rows / 2) + 1]);

  const seats: Seat[] = [];
  for (let row = 1; row <= rows; row++) {
    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      const column = columns[colIndex];
      const isExtraLegroom = extraLegroomRows.has(row);
      const type = columnType(columns, colIndex);
      const occupied = rand() < 0.3;
      let priceDelta = 0;
      if (isExtraLegroom) priceDelta = 450;
      else if (type === "window") priceDelta = 150;

      seats.push({
        id: `${row}${column}`,
        row,
        column,
        type,
        occupied,
        priceDelta,
        isExtraLegroom,
      });
    }
  }

  return {
    rows,
    columns,
    aisleAfterColumnIndex: columns.length / 2 - 1,
    seats,
  };
}
