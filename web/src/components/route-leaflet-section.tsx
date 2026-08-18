"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import {
  Download,
  Expand,
  Minus,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RouteLeafletSettings } from "@/lib/route-leaflet";

const minimumZoom = 1;
const maximumZoom = 4;
const zoomStep = 0.5;

type Position = {
  x: number;
  y: number;
};

function clampZoom(value: number) {
  return Math.min(maximumZoom, Math.max(minimumZoom, value));
}

function LeafletViewer({
  settings,
  onClose,
}: {
  settings: RouteLeafletSettings;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(minimumZoom);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const dragStart = useRef<Position | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const resetView = useCallback(() => {
    setZoom(minimumZoom);
    setPosition({ x: 0, y: 0 });
  }, []);

  const changeZoom = useCallback((nextZoom: number) => {
    const safeZoom = clampZoom(nextZoom);
    setZoom(safeZoom);
    if (safeZoom === minimumZoom) setPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setZoom((current) => clampZoom(current + zoomStep));
      }
      if (event.key === "-") {
        event.preventDefault();
        setZoom((current) => {
          const nextZoom = clampZoom(current - zoomStep);
          if (nextZoom === minimumZoom) setPosition({ x: 0, y: 0 });
          return nextZoom;
        });
      }
      if (event.key === "0") {
        event.preventDefault();
        resetView();
      }
      if (event.key.startsWith("Arrow")) {
        event.preventDefault();
        const movement = 40;
        setPosition((current) => ({
          x:
            current.x +
            (event.key === "ArrowLeft"
              ? movement
              : event.key === "ArrowRight"
                ? -movement
                : 0),
          y:
            current.y +
            (event.key === "ArrowUp"
              ? movement
              : event.key === "ArrowDown"
                ? -movement
                : 0),
        }));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, resetView]);

  function startDragging(event: ReactPointerEvent<HTMLDivElement>) {
    if (zoom === minimumZoom) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };
  }

  function dragImage(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    setPosition({
      x: event.clientX - dragStart.current.x,
      y: event.clientY - dragStart.current.y,
    });
  }

  function stopDragging(event: ReactPointerEvent<HTMLDivElement>) {
    dragStart.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function zoomWithWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    changeZoom(zoom + (event.deltaY < 0 ? zoomStep : -zoomStep));
  }

  return (
    <div
      className="fixed inset-0 z-[200] grid h-[100dvh] grid-rows-[auto_1fr] overflow-hidden overscroll-contain bg-[#07100d]/96 text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Panfleto ampliado dos roteiros turísticos"
    >
      <button
        ref={closeButtonRef}
        type="button"
        className="fixed z-[220] flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/80 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 12px)",
          right: "calc(env(safe-area-inset-right, 0px) + 12px)",
        }}
        onClick={onClose}
        aria-label="Fechar panfleto"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="flex items-center gap-4 border-b border-white/12 px-3 pb-3 pr-16 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] sm:px-5 sm:pr-20">
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/12 hover:text-white"
            onClick={() => changeZoom(zoom - zoomStep)}
            disabled={zoom <= minimumZoom}
            aria-label="Diminuir zoom"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-xs tabular-nums text-white/70">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/12 hover:text-white"
            onClick={() => changeZoom(zoom + zoomStep)}
            disabled={zoom >= maximumZoom}
            aria-label="Aumentar zoom"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden text-white hover:bg-white/12 hover:text-white sm:inline-flex"
            onClick={resetView}
            aria-label="Restaurar visualização"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        className={`relative min-h-0 overflow-hidden ${
          zoom > minimumZoom ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        style={{ touchAction: zoom > minimumZoom ? "none" : "pan-y" }}
        onPointerDown={startDragging}
        onPointerMove={dragImage}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onWheel={zoomWithWheel}
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div
          className="absolute inset-4 transition-transform duration-150 ease-out sm:inset-8"
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})`,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <Image
            src={settings.imageUrl}
            alt={settings.altText}
            fill
            sizes="100vw"
            quality={90}
            className="select-none object-contain"
            draggable={false}
            priority
          />
        </div>
      </div>
    </div>
  );
}

export function RouteLeafletSection({
  settings,
}: {
  settings: RouteLeafletSettings;
}) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  if (!settings.isActive || !settings.imageUrl) return null;

  return (
    <>
      <section id="route-leaflet" className="border-b border-border/70 bg-background py-14 md:py-20">
        <div className="container">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              
            </p>
          </div>

          <div className="mt-9 grid items-start gap-7 lg:grid-cols-[minmax(0,620px)_minmax(280px,340px)] lg:justify-center lg:gap-8 xl:grid-cols-[minmax(0,680px)_minmax(300px,360px)] xl:gap-10">
            <button
              type="button"
              onClick={() => setIsViewerOpen(true)}
              className="group relative w-full overflow-hidden rounded-sm border border-border bg-muted/25 text-left shadow-[0_10px_30px_rgba(11,24,19,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:shadow-[0_10px_30px_rgba(0,0,0,0.18)] lg:max-w-[680px] lg:justify-self-center"
              aria-label="Ampliar panfleto dos roteiros turísticos"
            >
              <span className="relative block aspect-[1131/1387] w-full lg:max-h-[760px]">
                <Image
                  src={settings.imageUrl}
                  alt={settings.altText}
                  fill
                  sizes="(max-width: 1023px) 100vw, (max-width: 1279px) 620px, 680px"
                  quality={82}
                  className="object-contain"
                />
              </span>
              <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-md border border-white/25 bg-[#10201b]/88 text-white shadow-sm transition-colors group-hover:bg-[#10201b]">
                <Expand className="h-4 w-4" />
              </span>
            </button>

            <aside className="border-l-2 border-alpine-sunset py-2 pl-5 lg:mt-1 lg:py-0 lg:pl-7">
              <h3 className="hidden font-display text-2xl font-semibold leading-tight text-foreground lg:block">
                Consulte os cinco roteiros
              </h3>
              <p className="text-base leading-7 text-muted-foreground lg:mt-3">
                Veja os pontos incluídos em cada percurso e organize sua visita por Cerro Corá.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-nowrap">
                <Button
                  type="button"
                  variant="warm"
                  className="w-full sm:flex-1"
                  onClick={() => setIsViewerOpen(true)}
                >
                  <Expand className="h-4 w-4" />
                  Ampliar roteiro
                </Button>
                {settings.downloadUrl ? (
                  <Button asChild variant="outline" className="w-full sm:flex-1">
                    <a href={settings.downloadUrl} download>
                      <Download className="h-4 w-4" />
                      Baixar panfleto
                    </a>
                  </Button>
                ) : null}
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Selecione a imagem para ampliar.
              </p>
            </aside>
          </div>
        </div>
      </section>

      {isMounted && isViewerOpen
        ? createPortal(
            <LeafletViewer
              settings={settings}
              onClose={() => setIsViewerOpen(false)}
            />,
            document.body,
          )
        : null}
    </>
  );
}
