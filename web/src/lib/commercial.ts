export type CommercialPlan = "bronze" | "silver" | "gold";
export type LegacyCommercialPlan = "basic" | "pro";
export type PlanStatus = "active" | "inactive" | "trial" | "expired" | "suspended";
export type ListingType = "commercial" | "public_service";

export type CommercialFeatureKey =
  | "card"
  | "whatsapp"
  | "maps"
  | "instagram"
  | "basicAnalytics"
  | "individualPage"
  | "carousel"
  | "gallery"
  | "highlighted"
  | "priorityFeatured"
  | "professionalPhotography"
  | "socialMediaPromotion"
  | "advancedReport"
  | "monthlyComparison"
  | "prioritySupport"
  | "seasonalCampaign"
  | "establishmentStory"
  | "bookingButton";

export type CommercialFeatures = Record<CommercialFeatureKey, boolean>;
export type CustomCommercialFeatures = Partial<Record<CommercialFeatureKey, boolean>>;

export type CommercialFeatureOptions = {
  status?: PlanStatus | string | null;
  listingType?: ListingType | string | null;
  customFeatures?: CustomCommercialFeatures | null;
  pageEnabled?: boolean | null;
  galleryEnabled?: boolean | null;
  carouselEnabled?: boolean | null;
  highlighted?: boolean | null;
  bookingEnabled?: boolean | null;
};

export type PlanDefinition = {
  id: CommercialPlan;
  label: string;
  description: string;
  priority: number;
  defaultCarouselPhotoLimit: number;
  defaultGalleryPhotoLimit: number;
  features: CommercialFeatures;
};

const bronzeFeatures: CommercialFeatures = {
  card: true,
  whatsapp: true,
  maps: true,
  instagram: true,
  basicAnalytics: true,
  individualPage: false,
  carousel: false,
  gallery: false,
  highlighted: false,
  priorityFeatured: false,
  professionalPhotography: false,
  socialMediaPromotion: false,
  advancedReport: false,
  monthlyComparison: false,
  prioritySupport: false,
  seasonalCampaign: false,
  establishmentStory: false,
  bookingButton: false,
};

export const planDefinitions: Record<CommercialPlan, PlanDefinition> = {
  bronze: {
    id: "bronze",
    label: "Bronze",
    description: "Presença básica no portal.",
    priority: 1,
    defaultCarouselPhotoLimit: 1,
    defaultGalleryPhotoLimit: 0,
    features: bronzeFeatures,
  },
  silver: {
    id: "silver",
    label: "Prata",
    description: "Página individual e galeria.",
    priority: 2,
    defaultCarouselPhotoLimit: 1,
    defaultGalleryPhotoLimit: 12,
    features: {
      ...bronzeFeatures,
      individualPage: true,
      gallery: true,
      bookingButton: true,
    },
  },
  gold: {
    id: "gold",
    label: "Ouro",
    description: "Destaque prioritário, produção profissional e relatório avançado.",
    priority: 3,
    defaultCarouselPhotoLimit: 8,
    defaultGalleryPhotoLimit: 30,
    features: {
      ...bronzeFeatures,
      individualPage: true,
      carousel: true,
      gallery: true,
      highlighted: true,
      priorityFeatured: true,
      professionalPhotography: true,
      socialMediaPromotion: true,
      advancedReport: true,
      monthlyComparison: true,
      prioritySupport: true,
      seasonalCampaign: true,
      establishmentStory: true,
      bookingButton: true,
    },
  },
};

export const defaultWhatsappMessage =
  "Olá! Encontrei seu estabelecimento através do Portal Turístico de Cerro Corá e gostaria de obter mais informações. Obrigado!";

export function normalizeCommercialPlan(plan?: string | null): CommercialPlan {
  if (plan === "gold") return "gold";
  if (plan === "silver" || plan === "pro") return "silver";
  return "bronze";
}

export function normalizePlanStatus(status?: string | null): PlanStatus {
  if (["active", "inactive", "trial", "expired", "suspended"].includes(status || "")) {
    return status as PlanStatus;
  }
  return "active";
}

export function getEffectivePlanStatus(
  status?: string | null,
  expiresAt?: string | null,
  now = new Date(),
): PlanStatus {
  const normalized = normalizePlanStatus(status);
  if (
    (normalized === "active" || normalized === "trial") &&
    expiresAt &&
    Number.isFinite(new Date(expiresAt).getTime()) &&
    new Date(expiresAt).getTime() <= now.getTime()
  ) {
    return "expired";
  }
  return normalized;
}

export function getPlanFeatures(plan?: string | null) {
  return { ...planDefinitions[normalizeCommercialPlan(plan)].features };
}

export function getEffectiveFeatures(
  plan?: string | null,
  options: CommercialFeatureOptions = {},
): CommercialFeatures {
  if (options.listingType === "public_service") {
    return {
      ...bronzeFeatures,
      bookingButton: false,
    };
  }

  const normalizedPlan = normalizeCommercialPlan(plan);
  const status = normalizePlanStatus(options.status);
  const billablePlan = status === "active" || status === "trial" ? normalizedPlan : "bronze";
  const features = {
    ...planDefinitions[billablePlan].features,
    ...(options.customFeatures || {}),
  };

  if (billablePlan === "bronze") {
    features.individualPage = false;
    features.carousel = false;
    features.gallery = false;
    features.highlighted = false;
    features.priorityFeatured = false;
    features.professionalPhotography = false;
    features.socialMediaPromotion = false;
    features.advancedReport = false;
    features.monthlyComparison = false;
    features.prioritySupport = false;
    features.seasonalCampaign = false;
    features.establishmentStory = false;
    features.bookingButton = false;
  }

  if (billablePlan === "silver") {
    features.carousel = false;
  }

  if (options.pageEnabled === false) features.individualPage = false;
  if (options.galleryEnabled === false) features.gallery = false;
  if (options.carouselEnabled === false) features.carousel = false;
  if (
    options.highlighted === true &&
    billablePlan === "silver" &&
    options.customFeatures?.highlighted === undefined
  ) {
    features.highlighted = true;
  }
  if (options.bookingEnabled === false) features.bookingButton = false;

  if (!features.individualPage) {
    features.gallery = false;
    features.establishmentStory = false;
  }
  if (!features.gallery) features.carousel = false;

  return features;
}

export const getCommercialFeatures = getEffectiveFeatures;

export function hasFeature(
  plan: string | null | undefined,
  feature: CommercialFeatureKey,
  options?: CommercialFeatureOptions,
) {
  return getEffectiveFeatures(plan, options)[feature];
}

export function getPlanPriority(plan?: string | null, status?: string | null) {
  const normalizedStatus = normalizePlanStatus(status);
  if (normalizedStatus !== "active" && normalizedStatus !== "trial") return planDefinitions.bronze.priority;
  return planDefinitions[normalizeCommercialPlan(plan)].priority;
}

export function getPhotoLimits(
  plan?: string | null,
  carouselPhotoLimit?: number | null,
  galleryPhotoLimit?: number | null,
) {
  const normalizedPlan = normalizeCommercialPlan(plan);
  const definition = planDefinitions[normalizedPlan];

  if (normalizedPlan === "bronze") {
    return { carousel: 1, gallery: 0 };
  }

  if (normalizedPlan === "silver") {
    return {
      carousel: 1,
      gallery: Math.max(0, Math.min(galleryPhotoLimit ?? definition.defaultGalleryPhotoLimit, 60)),
    };
  }

  const requestedCarouselLimit = carouselPhotoLimit || definition.defaultCarouselPhotoLimit;
  const carouselLimit = Math.max(1, Math.min(requestedCarouselLimit, 30));

  return {
    carousel: carouselLimit,
    gallery: Math.max(0, Math.min(galleryPhotoLimit ?? definition.defaultGalleryPhotoLimit, 60)),
  };
}

export function isSilverPlan(plan?: string | null) {
  return normalizeCommercialPlan(plan) === "silver";
}

export function isGoldPlan(plan?: string | null) {
  return normalizeCommercialPlan(plan) === "gold";
}

// Compatibilidade temporária para componentes antigos: Prata e Ouro possuem recursos avançados.
export function isProPlan(plan?: string | null) {
  return normalizeCommercialPlan(plan) !== "bronze";
}

export function whatsappUrl(phone: string, message?: string | null) {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  const text = encodeURIComponent(message?.trim() || defaultWhatsappMessage);

  return `https://wa.me/${normalized}?text=${text}`;
}
