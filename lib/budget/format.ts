// Shared across every Concepts Of Budget Pipeline widget so a number always
// reads the same way regardless of which section printed it.
export const fmtRupee = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
