"use client";

import { getImageProps } from "next/image";
import { useEffect, useMemo } from "react";

type AdjacentImagePreloadOptions = {
  images: string[];
  activeIndex: number;
  sizes: string;
  quality: number;
  enabled?: boolean;
};

export function useAdjacentImagePreload({
  images,
  activeIndex,
  sizes,
  quality,
  enabled = true,
}: AdjacentImagePreloadOptions) {
  const adjacentImages = useMemo(() => {
    if (!enabled || images.length < 2) return [];

    const previousIndex = activeIndex === 0 ? images.length - 1 : activeIndex - 1;
    const nextIndex = (activeIndex + 1) % images.length;

    return Array.from(new Set([images[previousIndex], images[nextIndex]]))
      .map((image) => image?.trim())
      .filter((image): image is string => Boolean(image && image !== images[activeIndex]));
  }, [activeIndex, enabled, images]);

  useEffect(() => {
    adjacentImages.forEach((src) => {
      const { props } = getImageProps({
        src,
        alt: "",
        fill: true,
        sizes,
        quality,
      });
      const image = new window.Image();

      image.decoding = "async";
      if (typeof props.sizes === "string") image.sizes = props.sizes;
      if (typeof props.srcSet === "string") image.srcset = props.srcSet;
      image.src = typeof props.src === "string" ? props.src : src;
    });
  }, [adjacentImages, quality, sizes]);
}
