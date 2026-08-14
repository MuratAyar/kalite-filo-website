/** Format an owner-approved whole-lira monthly list-net amount. */
export function formatVehicleListNetPrice(amountMinor) {
  if (
    !Number.isSafeInteger(amountMinor) ||
    amountMinor <= 0 ||
    amountMinor % 100 !== 0
  ) {
    throw new TypeError("Vehicle list-net price must be positive whole TRY in minor units.");
  }

  const amountTry = amountMinor / 100;
  return `₺${String(amountTry).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

