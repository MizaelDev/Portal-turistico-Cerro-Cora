"use client";

import { useMemo, useState, useTransition } from "react";
import { DatabaseBackup, Edit3, ImagePlus, Loader2, LogOut, Plus, Save, Trash2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  deleteAdminItem,
  logoutAction,
  saveAdminItem,
  seedDefaultContent,
  uploadAdminImages,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  AdminData,
  AdminEntity,
  PontoTuristicoRow,
  PousadaRow,
  RestauranteRow,
} from "@/lib/supabase";

type FormState = Record<string, string | boolean>;
type AdminRow = PontoTuristicoRow | PousadaRow | RestauranteRow;

const entityLabels: Record<AdminEntity, string> = {
  pontos_turisticos: "Pontos Turísticos",
  pousadas: "Pousadas",
  restaurantes: "Restaurantes",
};

const entityDescriptions: Record<AdminEntity, string> = {
  pontos_turisticos: "Cadastre mirantes, trilhas, áreas naturais e pontos de visitação.",
  pousadas: "Gerencie hospedagens, faixas de preço, WhatsApp e galerias.",
  restaurantes: "Gerencie restaurantes, bares, cafés e lanchonetes.",
};

const emptyForms: Record<AdminEntity, FormState> = {
  pontos_turisticos: {
    nome: "",
    descricao: "",
    categoria: "mirante",
    localizacao: "",
    imagem_url: "",
    imagens_urls: "",
    ativo: true,
  },
  pousadas: {
    nome: "",
    descricao: "",
    localizacao: "",
    distancia_centro: "",
    faixa_preco_min: "",
    faixa_preco_max: "",
    whatsapp: "",
    imagens_urls: "",
    ativo: true,
  },
  restaurantes: {
    nome: "",
    descricao: "",
    categoria: "restaurante",
    horario_funcionamento: "",
    endereco: "",
    mapa_url: "",
    instagram: "",
    instagram_url: "",
    whatsapp: "",
    imagem_url: "",
    tags: "",
    ativo: true,
  },
};

const attractionCategories = [
  ["mirante", "Mirante"],
  ["natureza", "Natureza"],
  ["geoturismo", "Geoturismo"],
  ["ecoturismo", "Ecoturismo"],
  ["trilha", "Trilha"],
  ["aventura", "Aventura"],
] as const;

const restaurantCategories = [
  ["restaurante", "Restaurante"],
  ["almoço", "Almoço"],
  ["bar", "Bar"],
  ["café", "Café"],
  ["lanchonete", "Lanchonete"],
] as const;

const restaurantTags = [
  "Açaí",
  "Almoço",
  "Bar",
  "Café",
  "Delivery",
  "Hambúrguer",
  "Jantar",
  "Lanches",
  "Petiscos",
  "Pizza",
  "Pratos regionais",
  "Sobremesas",
] as const;

function selectedTags(value: string | boolean | undefined) {
  return String(value || "")
    .split("|")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function rowToForm(entity: AdminEntity, row: AdminRow): FormState {
  if (entity === "pousadas") {
    const lodging = row as PousadaRow;
    return {
      nome: lodging.nome,
      descricao: lodging.descricao,
      localizacao: lodging.localizacao,
      distancia_centro: lodging.distancia_centro || "",
      faixa_preco_min: lodging.faixa_preco_min?.toString() || "",
      faixa_preco_max: lodging.faixa_preco_max?.toString() || "",
      whatsapp: lodging.whatsapp,
      imagens_urls: lodging.imagens_urls.join("\n"),
      ativo: lodging.ativo,
    };
  }

  if (entity === "restaurantes") {
    const restaurant = row as RestauranteRow;
    return {
      nome: restaurant.nome,
      descricao: restaurant.descricao,
      categoria: restaurant.categoria,
      horario_funcionamento: restaurant.horario_funcionamento,
      endereco: restaurant.endereco,
      mapa_url: restaurant.mapa_url || "",
      instagram: restaurant.instagram || "",
      instagram_url: restaurant.instagram_url || "",
      whatsapp: restaurant.whatsapp,
      imagem_url: restaurant.imagem_url,
      tags: (restaurant.tags || []).join("|"),
      ativo: restaurant.ativo,
    };
  }

  const attraction = row as PontoTuristicoRow;
  return {
    nome: attraction.nome,
    descricao: attraction.descricao,
    categoria: attraction.categoria,
    localizacao: attraction.localizacao,
    imagem_url: attraction.imagem_url,
    imagens_urls: (attraction.imagens_urls || []).join("\n"),
    ativo: attraction.ativo,
  };
}

function rowSummary(entity: AdminEntity, row: AdminRow) {
  if (entity === "pousadas") {
    const lodging = row as PousadaRow;
    return lodging.localizacao;
  }

  if (entity === "restaurantes") {
    const restaurant = row as RestauranteRow;
    return `${restaurant.categoria} · ${restaurant.endereco}`;
  }

  const attraction = row as PontoTuristicoRow;
  return `${attraction.categoria} · ${attraction.localizacao}`;
}

export function AdminDashboard({ initialData }: { initialData: AdminData }) {
  const router = useRouter();
  const [entity, setEntity] = useState<AdminEntity>("pontos_turisticos");
  const [form, setForm] = useState<FormState>(emptyForms.pontos_turisticos);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; text: string }>({
    type: "idle",
    text: "Selecione uma categoria para cadastrar ou editar conteúdos.",
  });
  const [isPending, startTransition] = useTransition();
  const [isUploading, startUploadTransition] = useTransition();

  const rows = useMemo(() => initialData[entity] as AdminRow[], [entity, initialData]);

  function selectEntity(nextEntity: AdminEntity) {
    setEntity(nextEntity);
    setForm(emptyForms[nextEntity]);
    setEditingId(null);
    setStatus({
      type: "idle",
      text: `Pronto para gerenciar ${entityLabels[nextEntity].toLowerCase()}.`,
    });
  }

  function updateField(name: string, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm(emptyForms[entity]);
    setEditingId(null);
  }

  function editRow(row: AdminRow) {
    setForm(rowToForm(entity, row));
    setEditingId(row.id);
    setStatus({ type: "idle", text: `Editando: ${row.nome}` });
  }

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await saveAdminItem(entity, editingId, formData);
      setStatus({ type: result.ok ? "success" : "error", text: result.message });
      if (result.ok) {
        resetForm();
        router.refresh();
        window.location.reload();
      }
    });
  }

  function removeRow(row: AdminRow) {
    const confirmed = window.confirm(`Excluir "${row.nome}"? Essa ação não pode ser desfeita.`);
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteAdminItem(entity, row.id);
      setStatus({ type: result.ok ? "success" : "error", text: result.message });
      if (result.ok) {
        resetForm();
        router.refresh();
      }
    });
  }

  function restoreDefaultContent() {
    const confirmed = window.confirm(
      "Repor os dados padrão do site? Itens com o mesmo nome serão atualizados, e itens faltantes serão cadastrados.",
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await seedDefaultContent();
      setStatus({ type: result.ok ? "success" : "error", text: result.message });
      if (result.ok) {
        router.refresh();
      }
    });
  }

  function uploadLodgingImages(files: FileList | null) {
    if (!files?.length) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    startUploadTransition(async () => {
      try {
        const result = await uploadAdminImages("pousadas", formData);
        setStatus({ type: result.ok ? "success" : "error", text: result.message });

        if (result.ok && result.urls.length) {
          setForm((current) => {
            const currentImages = String(current.imagens_urls || "").trim();
            const nextImages = [...(currentImages ? [currentImages] : []), ...result.urls].join("\n");
            return { ...current, imagens_urls: nextImages };
          });
        }
      } catch {
        setStatus({
          type: "error",
          text: "Não foi possível enviar as imagens. Tente fotos menores ou verifique o Supabase Storage.",
        });
      }
    });
  }

  function uploadAttractionImage(files: FileList | null) {
    if (!files?.length) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    startUploadTransition(async () => {
      try {
        const result = await uploadAdminImages("pontos_turisticos", formData);
        setStatus({ type: result.ok ? "success" : "error", text: result.message });

        if (result.ok && result.urls.length) {
          setForm((current) => {
            const currentImages = String(current.imagens_urls || "").trim();
            const nextImages = [...(currentImages ? [currentImages] : []), ...result.urls].join("\n");

            return {
              ...current,
              imagem_url: String(current.imagem_url || "").trim() || result.urls[0],
              imagens_urls: nextImages,
            };
          });
        }
      } catch {
        setStatus({
          type: "error",
          text: "Não foi possível enviar as imagens. Tente fotos menores ou verifique o Supabase Storage.",
        });
      }
    });
  }

  function uploadRestaurantImage(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("files", file);

    startUploadTransition(async () => {
      try {
        const result = await uploadAdminImages("restaurantes", formData);
        setStatus({ type: result.ok ? "success" : "error", text: result.message });

        if (result.ok && result.urls[0]) {
          setForm((current) => ({ ...current, imagem_url: result.urls[0] }));
        }
      } catch {
        setStatus({
          type: "error",
          text: "Não foi possível enviar a imagem. Tente uma foto menor ou verifique o Supabase Storage.",
        });
      }
    });
  }

  function toggleRestaurantTag(tag: string, checked: boolean) {
    setForm((current) => {
      const tags = new Set(selectedTags(current.tags));
      if (checked) {
        tags.add(tag);
      } else {
        tags.delete(tag);
      }
      return { ...current, tags: Array.from(tags).join("|") };
    });
  }

  return (
    <div className="grid gap-8">
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-card p-4 shadow-sm md:flex-row md:items-center">
        <div className="grid gap-2 md:grid-cols-3">
          {(Object.keys(entityLabels) as AdminEntity[]).map((item) => (
            <Button
              key={item}
              type="button"
              variant={entity === item ? "default" : "outline"}
              onClick={() => selectEntity(item)}
            >
              {entityLabels[item]}
            </Button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={restoreDefaultContent} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseBackup className="h-4 w-4" />}
            Repor dados padrão
          </Button>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </form>
        </div>
      </div>

      <div
        className={`rounded-md border p-4 text-sm ${
          status.type === "success"
            ? "border-primary/30 bg-primary/10 text-primary"
            : status.type === "error"
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-border bg-accent/45 text-muted-foreground"
        }`}
      >
        {status.text}
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{editingId ? "Editar conteúdo" : "Novo conteúdo"}</CardTitle>
            <p className="text-sm text-muted-foreground">{entityDescriptions[entity]}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitForm} className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={String(form.nome || "")}
                  onChange={(event) => updateField("nome", event.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  name="descricao"
                  value={String(form.descricao || "")}
                  onChange={(event) => updateField("descricao", event.target.value)}
                  required
                />
              </div>

              {entity !== "pousadas" ? (
                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Select
                    value={String(form.categoria || "")}
                    onValueChange={(value) => updateField("categoria", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(entity === "pontos_turisticos"
                        ? attractionCategories
                        : restaurantCategories
                      ).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="categoria" value={String(form.categoria || "")} />
                </div>
              ) : null}

              {entity === "pontos_turisticos" ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="localizacao">Localização</Label>
                    <Input
                      id="localizacao"
                      name="localizacao"
                      value={String(form.localizacao || "")}
                      onChange={(event) => updateField("localizacao", event.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="imagem_url">Imagem principal e carrossel</Label>
                    <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-accent/40 p-6 text-center transition-colors hover:bg-accent/70">
                      {isUploading ? (
                        <Loader2 className="mb-3 h-7 w-7 animate-spin text-muted-foreground" />
                      ) : (
                        <ImagePlus className="mb-3 h-7 w-7 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">
                        {isUploading ? "Enviando imagens..." : "Selecionar fotos do roteiro"}
                      </span>
                      <span className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
                        A primeira foto enviada preenche a imagem principal. Todas entram no carrossel do card.
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        className="sr-only"
                        disabled={isUploading}
                        onChange={(event) => {
                          uploadAttractionImage(event.target.files);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    {String(form.imagens_urls || "").trim() ? (
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <UploadCloud className="h-3.5 w-3.5" />
                        {String(form.imagens_urls || "").split(/\n+/).filter(Boolean).length} imagem
                        {String(form.imagens_urls || "").split(/\n+/).filter(Boolean).length === 1 ? "" : "s"} no carrossel.
                      </p>
                    ) : null}
                    <Input
                      id="imagem_url"
                      name="imagem_url"
                      placeholder="/images/cruzeiro-img.png ou https://..."
                      value={String(form.imagem_url || "")}
                      onChange={(event) => updateField("imagem_url", event.target.value)}
                      required
                    />
                    <Textarea
                      id="imagens_urls"
                      name="imagens_urls"
                      value={String(form.imagens_urls || "")}
                      onChange={(event) => updateField("imagens_urls", event.target.value)}
                      placeholder="As URLs enviadas aparecem aqui automaticamente. Você também pode colar uma imagem por linha."
                    />
                  </div>
                </>
              ) : null}

              {entity === "pousadas" ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="localizacao">Localização</Label>
                      <Input
                        id="localizacao"
                        name="localizacao"
                        value={String(form.localizacao || "")}
                        onChange={(event) => updateField("localizacao", event.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="distancia_centro">Distância do centro</Label>
                      <Input
                        id="distancia_centro"
                        name="distancia_centro"
                        value={String(form.distancia_centro || "")}
                        onChange={(event) => updateField("distancia_centro", event.target.value)}
                        placeholder="Ex: 0,6 km do centro"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="faixa_preco_min">Preço mínimo</Label>
                      <Input
                        id="faixa_preco_min"
                        name="faixa_preco_min"
                        inputMode="decimal"
                        value={String(form.faixa_preco_min || "")}
                        onChange={(event) => updateField("faixa_preco_min", event.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="faixa_preco_max">Preço máximo</Label>
                      <Input
                        id="faixa_preco_max"
                        name="faixa_preco_max"
                        inputMode="decimal"
                        value={String(form.faixa_preco_max || "")}
                        onChange={(event) => updateField("faixa_preco_max", event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      value={String(form.whatsapp || "")}
                      onChange={(event) => updateField("whatsapp", event.target.value)}
                      placeholder="5584999999999"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="imagens_urls">Imagens da galeria</Label>
                    <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-accent/40 p-6 text-center transition-colors hover:bg-accent/70">
                      {isUploading ? (
                        <Loader2 className="mb-3 h-7 w-7 animate-spin text-muted-foreground" />
                      ) : (
                        <ImagePlus className="mb-3 h-7 w-7 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">
                        {isUploading ? "Enviando imagens..." : "Selecionar fotos da pousada"}
                      </span>
                      <span className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
                        A primeira imagem enviada será usada como foto principal. As demais aparecem na galeria.
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        className="sr-only"
                        disabled={isUploading}
                        onChange={(event) => {
                          uploadLodgingImages(event.target.files);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    {String(form.imagens_urls || "").trim() ? (
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <UploadCloud className="h-3.5 w-3.5" />
                        {String(form.imagens_urls || "").split(/\n+/).filter(Boolean).length} imagem
                        {String(form.imagens_urls || "").split(/\n+/).filter(Boolean).length === 1 ? "" : "s"} na lista.
                      </p>
                    ) : null}
                    <Textarea
                      id="imagens_urls"
                      name="imagens_urls"
                      value={String(form.imagens_urls || "")}
                      onChange={(event) => updateField("imagens_urls", event.target.value)}
                      placeholder="As URLs enviadas aparecem aqui automaticamente. Você também pode colar uma imagem por linha."
                      required
                    />
                  </div>
                </>
              ) : null}

              {entity === "restaurantes" ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="horario_funcionamento">Horário</Label>
                      <Input
                        id="horario_funcionamento"
                        name="horario_funcionamento"
                        value={String(form.horario_funcionamento || "")}
                        onChange={(event) => updateField("horario_funcionamento", event.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endereco">Endereço</Label>
                      <Input
                        id="endereco"
                        name="endereco"
                        value={String(form.endereco || "")}
                        onChange={(event) => updateField("endereco", event.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mapa_url">Link do Google Maps</Label>
                    <Input
                      id="mapa_url"
                      name="mapa_url"
                      value={String(form.mapa_url || "")}
                      onChange={(event) => updateField("mapa_url", event.target.value)}
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        name="instagram"
                        value={String(form.instagram || "")}
                        onChange={(event) => updateField("instagram", event.target.value)}
                        placeholder="@perfil"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="instagram_url">Link do Instagram</Label>
                      <Input
                        id="instagram_url"
                        name="instagram_url"
                        value={String(form.instagram_url || "")}
                        onChange={(event) => updateField("instagram_url", event.target.value)}
                        placeholder="https://www.instagram.com/perfil/"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        name="whatsapp"
                        value={String(form.whatsapp || "")}
                        onChange={(event) => updateField("whatsapp", event.target.value)}
                        placeholder="5584999999999"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Tags do estabelecimento</Label>
                    <div className="grid gap-2 rounded-lg border border-border bg-accent/25 p-4 sm:grid-cols-2">
                      {restaurantTags.map((tag) => {
                        const checked = selectedTags(form.tags).includes(tag);
                        return (
                          <label key={tag} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              name="tags"
                              value={tag}
                              checked={checked}
                              onChange={(event) => toggleRestaurantTag(tag, event.target.checked)}
                              className="h-4 w-4 rounded border-border"
                            />
                            {tag}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="imagem_url">Imagem</Label>
                    <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-accent/40 p-5 text-center transition-colors hover:bg-accent/70">
                      {isUploading ? (
                        <Loader2 className="mb-3 h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <ImagePlus className="mb-3 h-6 w-6 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">
                        {isUploading ? "Enviando imagem..." : "Selecionar foto do restaurante"}
                      </span>
                      <span className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
                        A URL será preenchida automaticamente após o envio.
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="sr-only"
                        disabled={isUploading}
                        onChange={(event) => {
                          uploadRestaurantImage(event.target.files);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    <Input
                      id="imagem_url"
                      name="imagem_url"
                      value={String(form.imagem_url || "")}
                      onChange={(event) => updateField("imagem_url", event.target.value)}
                      placeholder="/banners/cafe.jpg ou https://..."
                      required
                    />
                  </div>
                </>
              ) : null}

              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  name="ativo"
                  checked={Boolean(form.ativo)}
                  onChange={(event) => updateField("ativo", event.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Ativo no site
              </label>

              <div
                className={`rounded-md border p-3 text-sm ${
                  status.type === "success"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : status.type === "error"
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-border bg-accent/45 text-muted-foreground"
                }`}
              >
                {status.text}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" variant="warm" disabled={isPending}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingId ? "Salvar edição" : "Cadastrar"}
                </Button>
                {editingId ? (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    <Plus className="h-4 w-4" />
                    Novo cadastro
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{entityLabels[entity]} cadastrados</CardTitle>
            <p className="text-sm text-muted-foreground">
              {rows.length} item{rows.length === 1 ? "" : "s"} encontrado{rows.length === 1 ? "" : "s"}.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3">
            {rows.length ? (
              rows.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col justify-between gap-4 rounded-md border border-border bg-background/60 p-4 md:flex-row md:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{row.nome}</h3>
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        {row.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{rowSummary(entity, row)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => editRow(row)}>
                      <Edit3 className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(row)}>
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Nenhum item cadastrado nesta categoria.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
