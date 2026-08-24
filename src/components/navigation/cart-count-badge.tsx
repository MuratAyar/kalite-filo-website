"use client";

import { useEffect, useState } from "react";

import { getVehicleCartQuantity, readVehicleCart, subscribeToVehicleCart } from "@/lib/vehicle-cart";

export function CartCountBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(getVehicleCartQuantity(readVehicleCart()));
    update();
    return subscribeToVehicleCart(update);
  }, []);

  if (count < 1) {
    return <span aria-hidden="true" className="w-16" />;
  }

  return (
    <a
      aria-label={`Sepetim formuna git. Sepette ${count} araç var.`}
      className="relative z-0 inline-flex min-h-12 w-16 origin-left animate-[cart-reveal_500ms_cubic-bezier(0.22,1,0.36,1)_both] items-center justify-center gap-1.5 overflow-hidden rounded-r-control bg-error font-semibold text-white no-underline transition-[background-color,filter] duration-200 hover:brightness-75 motion-reduce:animate-none motion-reduce:transition-none"
      data-cart-count
      href="/teklif-al/?form=sepet"
    >
      <svg aria-hidden="true" className="size-5 shrink-0" fill="none" viewBox="0 0 24 24">
        <path d="M3.5 4h2l1.7 10.2a2 2 0 0 0 2 1.7h7.9a2 2 0 0 0 1.9-1.5L20.5 8H6.3M9.5 20a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm9 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
      <span>{count}</span>
    </a>
  );
}
