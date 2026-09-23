import { jsonToCSV } from "react-papaparse";

// JavaScript writes numbers below 1e-6 (and above 1e21) in exponent notation
// ("4.39e-7"), which spreadsheets then show in scientific format. The data
// source aggregates hit this all the time — face blendshapes and band powers
// are often tiny — so those values are written out as plain decimals instead.
// 15 significant digits is as much as a double reliably holds, so nothing
// meaningful is lost; every other value is left exactly as it was.
function plain(value) {
  if (typeof value !== "number" || !String(value).includes("e")) return value;
  return value.toLocaleString("en-US", {
    useGrouping: false,
    maximumSignificantDigits: 15,
  });
}

/**
 * Drop-in for react-papaparse's `jsonToCSV({ fields, data })` that never
 * writes a number in exponent notation.
 */
export default function csvWithPlainNumbers({ fields, data }) {
  const rows = data.map((row) =>
    Object.fromEntries(
      Object.entries(row || {}).map(([key, value]) => [key, plain(value)])
    )
  );
  return jsonToCSV({ fields, data: rows });
}
