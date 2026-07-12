export type WeekdayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type BusinessDayHours = {
  closed?: boolean;
  open?: string;
  close?: string;
  secondOpen?: string;
  secondClose?: string;
};

export type BusinessHoursMode = "regular" | "24h" | "appointment";

export type BusinessHours = {
  mode?: BusinessHoursMode;
  days?: Partial<Record<WeekdayKey, BusinessDayHours>>;
};

export type BusinessStatusKind =
  | "open"
  | "closing_soon"
  | "closed"
  | "always_open"
  | "appointment"
  | "unknown";

export type BusinessStatus = {
  status: BusinessStatusKind;
  isOpen: boolean;
  nextOpening?: string;
  closingTime?: string;
  message: string;
};

export type BusinessStatusContext = "food" | "lodging" | "service";

export type BusinessStatusPresentation = {
  label: string;
  message: string;
};

export const businessTimezone = "America/Fortaleza";

export const weekdayLabels: Record<WeekdayKey, string> = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};

export const weekdays: WeekdayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const shortWeekdayToKey: Record<string, WeekdayKey> = {
  seg: "monday",
  segunda: "monday",
  ter: "tuesday",
  terca: "tuesday",
  terça: "tuesday",
  qua: "wednesday",
  quarta: "wednesday",
  qui: "thursday",
  quinta: "thursday",
  sex: "friday",
  sexta: "friday",
  sab: "saturday",
  sáb: "saturday",
  sabado: "saturday",
  sábado: "saturday",
  dom: "sunday",
  domingo: "sunday",
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseTimeToMinutes(value?: string) {
  if (!value) return null;

  const match = value.trim().match(/^(\d{1,2})(?::|h)?(\d{2})?$/i);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2] || 0);

  if (hour < 0 || hour > 24 || minute < 0 || minute > 59) return null;
  if (hour === 24 && minute !== 0) return null;

  return hour * 60 + minute;
}

function formatMinutes(minutes: number) {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function weekdayFromIntl(value: string): WeekdayKey {
  const normalized = normalizeText(value);

  if (normalized.startsWith("mon") || normalized.startsWith("seg")) return "monday";
  if (normalized.startsWith("tue") || normalized.startsWith("ter")) return "tuesday";
  if (normalized.startsWith("wed") || normalized.startsWith("qua")) return "wednesday";
  if (normalized.startsWith("thu") || normalized.startsWith("qui")) return "thursday";
  if (normalized.startsWith("fri") || normalized.startsWith("sex")) return "friday";
  if (normalized.startsWith("sat") || normalized.startsWith("sab")) return "saturday";
  return "sunday";
}

function getZonedNow(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = Number(values.hour === "24" ? "0" : values.hour);
  const minute = Number(values.minute);
  const weekday = weekdayFromIntl(values.weekday || "sun");

  return {
    weekday,
    weekdayIndex: weekdays.indexOf(weekday),
    minutes: hour * 60 + minute,
  };
}

function normalizeBusinessHours(hours?: BusinessHours | null): BusinessHours | null {
  if (!hours || typeof hours !== "object") return null;

  if (hours.mode === "24h" || hours.mode === "appointment") {
    return { mode: hours.mode, days: {} };
  }

  const normalizedDays: Partial<Record<WeekdayKey, BusinessDayHours>> = {};

  for (const day of weekdays) {
    const value = hours.days?.[day];
    const open = value?.open?.trim();
    const close = value?.close?.trim();

    normalizedDays[day] = {
      closed: Boolean(value?.closed) || !open || !close,
      open,
      close,
      secondOpen: value?.secondOpen?.trim() || undefined,
      secondClose: value?.secondClose?.trim() || undefined,
    };
  }

  return {
    mode: "regular",
    days: normalizedDays,
  };
}

function scheduleWindow(openValue: string | undefined, closeValue: string | undefined, offsetDays: number) {
  const open = parseTimeToMinutes(openValue);
  const close = parseTimeToMinutes(closeValue);

  if (open === null || close === null) return null;

  const base = offsetDays * 1440;
  const closesNextDay = close <= open;

  return {
    open: base + open,
    close: base + close + (closesNextDay ? 1440 : 0),
  };
}

function dayScheduleWindows(day: BusinessDayHours | undefined, offsetDays: number) {
  if (!day || day.closed) return [];

  return [
    scheduleWindow(day.open, day.close, offsetDays),
    scheduleWindow(day.secondOpen, day.secondClose, offsetDays),
  ]
    .filter((window): window is { open: number; close: number } => Boolean(window))
    .sort((first, second) => first.open - second.open);
}

function relativeOpeningLabel(offsetDays: number, day: WeekdayKey, openingTime: string) {
  if (offsetDays === 0) return `Abre hoje às ${openingTime}`;
  if (offsetDays === 1) return `Abre amanhã às ${openingTime}`;
  return `Abre ${weekdayLabels[day].toLowerCase()} às ${openingTime}`;
}

function findNextOpening(hours: BusinessHours, todayIndex: number, currentMinutes: number) {
  for (let offset = 0; offset <= 7; offset += 1) {
    const dayKey = weekdays[(todayIndex + offset) % 7];
    const day = hours.days?.[dayKey];
    for (const window of dayScheduleWindows(day, offset)) {
      if (window.open > currentMinutes) {
        return {
          label: relativeOpeningLabel(offset, dayKey, formatMinutes(window.open)),
          time: formatMinutes(window.open),
        };
      }
    }
  }

  return null;
}

export function getBusinessStatus(
  input?: BusinessHours | null,
  options?: {
    now?: Date;
    timeZone?: string;
    closingSoonMinutes?: number;
  },
): BusinessStatus {
  const hours = normalizeBusinessHours(input);

  if (!hours) {
    return {
      status: "unknown",
      isOpen: false,
      message: "Horário a confirmar",
    };
  }

  if (hours.mode === "24h") {
    return {
      status: "always_open",
      isOpen: true,
      message: "Atendimento 24 horas",
    };
  }

  if (hours.mode === "appointment") {
    return {
      status: "appointment",
      isOpen: false,
      message: "Atendimento mediante agendamento",
    };
  }

  const timeZone = options?.timeZone || businessTimezone;
  const closingSoonMinutes = options?.closingSoonMinutes ?? 30;
  const { weekdayIndex, minutes } = getZonedNow(options?.now || new Date(), timeZone);
  const currentAbsoluteMinutes = minutes;

  for (const offset of [-1, 0]) {
    const dayKey = weekdays[(weekdayIndex + offset + 7) % 7];
    const day = hours.days?.[dayKey];
    for (const window of dayScheduleWindows(day, offset)) {
      if (currentAbsoluteMinutes < window.open || currentAbsoluteMinutes >= window.close) continue;
      const minutesToClose = window.close - currentAbsoluteMinutes;
      const closingTime = formatMinutes(window.close);

      if (minutesToClose <= closingSoonMinutes) {
        return {
          status: "closing_soon",
          isOpen: true,
          closingTime,
          message: `Fecha em ${minutesToClose} min`,
        };
      }

      return {
        status: "open",
        isOpen: true,
        closingTime,
        message: `Fecha às ${closingTime}`,
      };
    }
  }

  const nextOpening = findNextOpening(hours, weekdayIndex, currentAbsoluteMinutes);

  return {
    status: "closed",
    isOpen: false,
    nextOpening: nextOpening?.time,
    message: nextOpening?.label || "Horário a confirmar",
  };
}

function compactTime(value?: string) {
  if (!value) return null;
  const [hour, minute] = value.split(":");
  return minute === "00" ? `${Number(hour)}h` : `${Number(hour)}h${minute}`;
}

function contextualNextOpening(message: string, context: BusinessStatusContext) {
  const contextual = context === "lodging" ? message.replace(/^Abre/, "Retorna") : message;
  return contextual.replace(/(\d{2}):(\d{2})/g, (_, hour: string, minute: string) =>
    minute === "00" ? `${Number(hour)}h` : `${Number(hour)}h${minute}`,
  );
}

export function getBusinessStatusPresentation(
  status: BusinessStatus,
  context: BusinessStatusContext = "food",
): BusinessStatusPresentation {
  if (context === "lodging") {
    const closingTime = compactTime(status.closingTime);
    const labels: Record<BusinessStatusKind, string> = {
      open: "Recepção disponível",
      closing_soon: "Recepção encerra em breve",
      closed: "Recepção fechada",
      always_open: "Atendimento 24 horas",
      appointment: "Atendimento mediante reserva",
      unknown: "Horário da recepção a confirmar",
    };

    return {
      label: labels[status.status],
      message:
        (status.status === "open" || status.status === "closing_soon") && closingTime
          ? `Atendimento até ${closingTime}`
          : status.status === "closed"
            ? contextualNextOpening(status.message, context)
            : labels[status.status],
    };
  }

  const labels: Record<BusinessStatusKind, string> = context === "service"
    ? {
        open: "Atendimento disponível",
        closing_soon: "Atendimento encerra em breve",
        closed: "Atendimento encerrado",
        always_open: "Atendimento 24 horas",
        appointment: "Atendimento mediante agendamento",
        unknown: "Horário a confirmar",
      }
    : {
        open: "Aberto agora",
        closing_soon: "Fecha em breve",
        closed: "Fechado",
        always_open: "Atendimento 24 horas",
        appointment: "Somente agendamento",
        unknown: "Horário a confirmar",
      };

  return {
    label: labels[status.status],
    message: status.message,
  };
}

function parseDayToken(value: string) {
  const key = normalizeText(value).replace(/\./g, "");
  return shortWeekdayToKey[key] || null;
}

function daysBetween(start: WeekdayKey, end: WeekdayKey) {
  const startIndex = weekdays.indexOf(start);
  const endIndex = weekdays.indexOf(end);
  const days: WeekdayKey[] = [];

  for (let cursor = startIndex; ; cursor = (cursor + 1) % 7) {
    days.push(weekdays[cursor]);
    if (cursor === endIndex) break;
  }

  return days;
}

function parseDays(value: string) {
  const normalized = normalizeText(value).replace(/\./g, "");

  if (normalized.includes("todos os dias") || normalized.includes("seg a dom")) {
    return weekdays;
  }

  const rangeMatch = normalized.match(/(seg|ter|qua|qui|sex|sab|dom)\s*a\s*(seg|ter|qua|qui|sex|sab|dom)/);
  if (rangeMatch) {
    const start = parseDayToken(rangeMatch[1]);
    const end = parseDayToken(rangeMatch[2]);
    if (start && end) return daysBetween(start, end);
  }

  const found = new Set<WeekdayKey>();
  for (const token of normalized.split(/,|\se\s|\s+/)) {
    const day = parseDayToken(token);
    if (day) found.add(day);
  }

  return Array.from(found);
}

function normalizeTimeText(value: string) {
  const match = value.match(/(\d{1,2})(?:h|:)?(\d{2})?/i);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  if (hour < 0 || hour > 24 || minute < 0 || minute > 59) return null;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function parseLegacyBusinessHours(value?: string | null): BusinessHours | null {
  if (!value) return null;

  const normalized = normalizeText(value);
  if (normalized.includes("agendamento")) return { mode: "appointment", days: {} };
  if (normalized.includes("24 horas") || normalized.includes("24h")) return { mode: "24h", days: {} };

  const days: Partial<Record<WeekdayKey, BusinessDayHours>> = {};
  const segments = value.split("|").map((segment) => segment.trim()).filter(Boolean);

  for (const segment of segments) {
    const [rawDays, rawTimes = ""] = segment.includes(":")
      ? segment.split(/:(.+)/).filter(Boolean)
      : segment.split(/-(.+)/).filter(Boolean);
    const parsedDays = parseDays(rawDays || segment);
    const times = rawTimes.match(/(\d{1,2}(?:h|:)?\d{0,2})/gi) || [];

    if (!parsedDays.length || times.length < 2) continue;

    const open = normalizeTimeText(times[0]!);
    const close = normalizeTimeText(times[1]!);
    if (!open || !close) continue;

    for (const day of parsedDays) {
      days[day] = { closed: false, open, close };
    }
  }

  return Object.keys(days).length ? { mode: "regular", days } : null;
}

export function parseBusinessHours(value: unknown): BusinessHours | null {
  if (!value) return null;

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as BusinessHours;
    } catch {
      return null;
    }
  }

  if (typeof value === "object") {
    return value as BusinessHours;
  }

  return null;
}

export function serializeBusinessHours(value?: BusinessHours | null) {
  return JSON.stringify(normalizeBusinessHours(value) || { mode: "regular", days: {} });
}
