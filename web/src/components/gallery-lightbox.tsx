"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRef, type ReactNode, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GalleryLightboxProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  hasMultipleImages: boolean;
  onPrevious: () => void;
  onNext: () => void;
  counter: string;
  imageContainerClassName?: string;
  zIndexClassName?: string;
  returnFocusRef?: RefObject<HTMLElement | null>;
};

export function GalleryLightbox({
  open,
  onOpenChange,
  title,
  children,
  hasMultipleImages,
  onPrevious,
  onNext,
  counter,
  imageContainerClassName,
  zIndexClassName = "z-[100]",
  returnFocusRef,
}: GalleryLightboxProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const fallbackReturnFocusRef = useRef<HTMLElement | null>(null);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn("fixed inset-0 bg-black/90 backdrop-blur-sm", zIndexClassName)} />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            "fixed inset-0 flex items-center justify-center p-4 outline-none sm:p-8",
            zIndexClassName,
          )}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            if (document.activeElement instanceof HTMLElement) {
              fallbackReturnFocusRef.current = document.activeElement;
            }
            closeButtonRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            (returnFocusRef?.current || fallbackReturnFocusRef.current)?.focus();
          }}
          onKeyDown={(event) => {
            if (!hasMultipleImages) return;
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              onPrevious();
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              onNext();
            }
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) onOpenChange(false);
          }}
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <Dialog.Close asChild>
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Fechar galeria"
              className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-md border border-white/20 bg-black/70 text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-6 sm:top-6"
            >
              <X aria-hidden="true" className="h-6 w-6" />
            </button>
          </Dialog.Close>

          <div className={cn("relative h-full w-full max-w-[1600px]", imageContainerClassName)}>
            {children}
          </div>

          {hasMultipleImages ? (
            <>
              <Button
                type="button"
                variant="glass"
                size="icon"
                aria-label="Foto anterior"
                className="absolute left-3 top-1/2 z-20 -translate-y-1/2 sm:left-6"
                onClick={onPrevious}
              >
                <ChevronLeft aria-hidden="true" className="h-6 w-6" />
              </Button>
              <Button
                type="button"
                variant="glass"
                size="icon"
                aria-label="Próxima foto"
                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 sm:right-6"
                onClick={onNext}
              >
                <ChevronRight aria-hidden="true" className="h-6 w-6" />
              </Button>
            </>
          ) : null}

          <span className="absolute bottom-4 right-4 z-20 rounded-md border border-white/20 bg-black/60 px-3 py-1 text-xs font-semibold text-white sm:bottom-6 sm:right-6">
            {counter}
          </span>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
