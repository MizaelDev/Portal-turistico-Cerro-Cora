"use client";

import { useRef, type TouchEventHandler } from "react";

const swipeThreshold = 45;

export function useCarouselSwipe({
  enabled,
  onPrevious,
  onNext,
}: {
  enabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const touchStartX = useRef<number | null>(null);

  const onTouchStart: TouchEventHandler<HTMLElement> = (event) => {
    if (!enabled) return;
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd: TouchEventHandler<HTMLElement> = (event) => {
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (!enabled || startX === null) return;

    const endX = event.changedTouches[0]?.clientX;
    if (endX === undefined) return;

    const distance = endX - startX;
    if (Math.abs(distance) < swipeThreshold) return;
    if (distance > 0) onPrevious();
    else onNext();
  };

  const onTouchCancel: TouchEventHandler<HTMLElement> = () => {
    touchStartX.current = null;
  };

  return { onTouchStart, onTouchEnd, onTouchCancel };
}
