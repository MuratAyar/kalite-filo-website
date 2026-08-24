export const VEHICLE_CART_STORAGE_KEY = "kalite-filo-vehicle-cart-v1";
export const VEHICLE_CART_CHANGE_EVENT = "kalite-filo:vehicle-cart-change";

export type VehicleCartItem = {
  annualKilometres: number;
  durationMonths: number;
  fuelLabel: string;
  image: { alt: string; height: number; src: string; width: number };
  key: string;
  make: string;
  model: string;
  priceAmountMinor: number;
  quantity: number;
  slug: string;
  transmissionLabel: string;
  trim: string;
};

function isCartItem(value: unknown): value is VehicleCartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<VehicleCartItem>;
  return typeof item.key === "string"
    && typeof item.slug === "string"
    && typeof item.make === "string"
    && typeof item.model === "string"
    && typeof item.trim === "string"
    && typeof item.fuelLabel === "string"
    && typeof item.transmissionLabel === "string"
    && Number.isInteger(item.durationMonths)
    && Number.isInteger(item.annualKilometres)
    && Number.isInteger(item.priceAmountMinor)
    && Number.isInteger(item.quantity)
    && (item.quantity ?? 0) > 0
    && !!item.image
    && typeof item.image.src === "string"
    && typeof item.image.alt === "string"
    && Number.isInteger(item.image.width)
    && Number.isInteger(item.image.height);
}

export function readVehicleCart(): VehicleCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(VEHICLE_CART_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isCartItem).slice(0, 32) : [];
  } catch {
    return [];
  }
}

export function writeVehicleCart(items: readonly VehicleCartItem[]) {
  localStorage.setItem(VEHICLE_CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(VEHICLE_CART_CHANGE_EVENT));
}

export function addVehicleCartItem(item: Omit<VehicleCartItem, "key" | "quantity">) {
  const key = `${item.slug}:${item.durationMonths}:${item.annualKilometres}`;
  const items = readVehicleCart();
  const existing = items.find((candidate) => candidate.key === key);
  if (existing) existing.quantity = Math.min(99, existing.quantity + 1);
  else items.push({ ...item, key, quantity: 1 });
  writeVehicleCart(items);
}

export function getVehicleCartQuantity(items: readonly VehicleCartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function subscribeToVehicleCart(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === VEHICLE_CART_STORAGE_KEY) listener();
  };
  window.addEventListener(VEHICLE_CART_CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(VEHICLE_CART_CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}
