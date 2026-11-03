import { test } from "node:test";
import assert from "node:assert/strict";
import { rankOffers } from "./offerTrust.ts";

const offers = (list: [string, number][]) => list.map(([seller, price]) => ({ seller, price, url: "", postData: "" }));
const flagged = (list: [string, number][], airline = "IndiGo") => {
  const ranked = rankOffers(offers(list), airline);
  return ranked.offers.filter((o) => ranked.doubtful.has(o)).map((o) => o.seller).sort();
};

test("flags a group of sellers far below the main cluster, as seen on BLR-GOP", () => {
  const list: [string, number][] = [
    ["kiss&fly", 48240], ["BudgetAir", 50100], ["Kiwi.com", 52000], ["Trip.com", 54300],
    ["Akasa Air", 79902], ["MakeMyTrip", 78500], ["Goibibo", 79000], ["Cleartrip", 80500],
    ["Yatra", 81200], ["EaseMyTrip", 77800], ["Paytm", 79300], ["Ixigo", 82000],
  ];
  assert.deepEqual(flagged(list, "Akasa Air"), ["BudgetAir", "Kiwi.com", "Trip.com", "kiss&fly"]);
  assert.equal(rankOffers(offers(list), "Akasa Air").offers[0].seller, "EaseMyTrip");
});

test("leaves an ordinary spread of prices alone", () => {
  assert.deepEqual(flagged([["a", 7000], ["b", 7200], ["c", 7400], ["d", 8100], ["e", 9000]]), []);
  assert.deepEqual(flagged([["a", 6300], ["b", 7000], ["c", 7100], ["d", 7200]]), []);
});

test("does not judge two sellers, or an even split, without a yardstick", () => {
  assert.deepEqual(flagged([["a", 5000], ["b", 9000]]), []);
  assert.deepEqual(flagged([["a", 5000], ["b", 5100], ["c", 9000], ["d", 9100]]), []);
  assert.deepEqual(flagged([["a", 5000], ["b", 5100], ["c", 5200], ["d", 9100]]), []);
});

test("uses the airline's own price only when another seller agrees with it", () => {
  assert.deepEqual(flagged([["IndiGo", 10000], ["a", 10200], ["b", 6000]]), ["b"]);
  assert.deepEqual(flagged([["IndiGo", 12000], ["a", 7000], ["b", 7100], ["c", 7300]]), []);
  // The airline and one agent on a pricier fare type must not outvote three cheaper sellers.
  assert.deepEqual(flagged([["IndiGo", 12000], ["a", 12500], ["b", 7000], ["c", 7100], ["d", 7300]]), []);
});

test("lists consistent prices first, cheapest first, then the doubtful ones", () => {
  const ranked = rankOffers(offers([["x", 9840], ["y", 14300], ["z", 14000], ["w", 14600], ["v", 15000], ["u", 15200]]), "IndiGo");
  assert.deepEqual(ranked.offers.map((o) => o.seller), ["z", "y", "w", "v", "u", "x"]);
});
