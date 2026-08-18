"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { ImagePlus, Loader2, Save, UploadCloud } from "lucide-react";
import { uploadAdminImages } from "@/app/admin/actions";
import { saveRouteLeafletSettings } from "@/app/admin/route-leaflet-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RouteLeafletSettings } from "@/lib/route-leaflet";

type Feedback = {
  type: "idle" | "success" | "error";
  text: string;
};

export function RouteLeafletAdmin({
  initialSettings,
}: {
  initialSettings: RouteLeafletSettings;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [feedback, setFeedback] = useState<Feedback>({
    type: "idle",
    text: "A seção aparece na página de Roteiros quando estiver ativa e possuir uma imagem.",
  });
  const [isSaving, startSaving] = useTransition();
  const [isUploading, startUploading] = useTransition();

  function uploadLeaflet(files: FileList | null) {
    if (!files?.length) return;

    const formData = new FormData();
    formData.append("files", files[0]);

    startUploading(async () => {
      setFeedback({ type: "idle", text: "Enviando o panfleto..." });
      const result = await uploadAdminImages("route_leaflet", formData);

      if (!result.ok || !result.urls[0]) {
        setFeedback({ type: "error", text: result.message });
        return;
      }

      const imageUrl = result.urls[0];
      setSettings((current) => ({
        ...current,
        imageUrl,
        downloadUrl: imageUrl,
      }));
      setFeedback({
        type: "success",
        text: "Imagem enviada. Salve a configuração para publicar a alteração.",
      });
    });
  }

  function submitSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("is_active", String(settings.isActive));

    startSaving(async () => {
      setFeedback({ type: "idle", text: "Salvando configuração..." });
      const result = await saveRouteLeafletSettings(formData);
      setFeedback({
        type: result.ok ? "success" : "error",
        text: result.message,
      });
    });
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Panfleto dos roteiros</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Configure o material oficial exibido antes dos cards de pontos turísticos.
        </p>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={submitSettings}
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]"
        >
          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label>Imagem do panfleto</Label>
              <label className="flex min-h-28 cursor-pointer items-center gap-4 rounded-md border border-dashed border-border bg-accent/25 p-4 transition-colors hover:bg-accent/50">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  <ImagePlus className="h-6 w-6 shrink-0 text-muted-foreground" />
                )}
                <span>
                  <strong className="block text-sm font-semibold">
                    {isUploading ? "Enviando imagem..." : "Selecionar imagem"}
                  </strong>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    Use JPG, PNG ou WebP. A proporção original será preservada.
                  </span>
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={isUploading}
                  onChange={(event) => {
                    uploadLeaflet(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
              <Input
                id="route_leaflet_image_url"
                name="image_url"
                value={settings.imageUrl}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    imageUrl: event.target.value,
                  }))
                }
                placeholder="/images/roteiros/panfleto.jpeg ou https://..."
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="route_leaflet_alt_text">Texto alternativo</Label>
              <Input
                id="route_leaflet_alt_text"
                name="alt_text"
                value={settings.altText}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    altText: event.target.value,
                  }))
                }
                maxLength={220}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="route_leaflet_download_url">
                Arquivo para download (opcional)
              </Label>
              <Input
                id="route_leaflet_download_url"
                name="download_url"
                value={settings.downloadUrl || ""}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    downloadUrl: event.target.value || null,
                  }))
                }
                placeholder="/images/roteiros/panfleto.jpeg ou https://..."
              />
              <p className="text-xs leading-5 text-muted-foreground">
                Pode ser a própria imagem. Deixe vazio para ocultar o botão de download.
              </p>
            </div>

            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={settings.isActive}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-border accent-primary"
              />
              Exibir a seção na página de Roteiros
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={isSaving || isUploading}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar panfleto
              </Button>
              <p
                aria-live="polite"
                className={`text-sm ${
                  feedback.type === "error"
                    ? "text-destructive"
                    : feedback.type === "success"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                }`}
              >
                {feedback.text}
              </p>
            </div>
          </div>

          <div className="self-start">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <UploadCloud className="h-3.5 w-3.5" />
              Prévia
            </p>
            <div className="relative aspect-[1131/1387] overflow-hidden rounded-md border border-border bg-accent/30">
              {settings.imageUrl ? (
                <Image
                  src={settings.imageUrl}
                  alt=""
                  fill
                  sizes="260px"
                  className="object-contain"
                />
              ) : null}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
