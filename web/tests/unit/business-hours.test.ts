import assert from "node:assert/strict";
import test from "node:test";
import {
  getBusinessStatus,
  getBusinessStatusPresentation,
  type BusinessHours,
} from "../../src/lib/business-hours.ts";

const mondaySchedule: BusinessHours = {
  mode: "regular",
  days: {
    monday: { open: "18:00", close: "23:00" },
    tuesday: { open: "18:00", close: "23:00" },
  },
};

test("calcula horário aberto no fuso de Fortaleza", () => {
  const status = getBusinessStatus(mondaySchedule, {
    now: new Date("2026-07-06T22:00:00.000Z"),
  });

  assert.equal(status.status, "open");
  assert.equal(status.closingTime, "23:00");
});

test("sinaliza fechamento próximo", () => {
  const status = getBusinessStatus(mondaySchedule, {
    now: new Date("2026-07-07T01:45:00.000Z"),
    closingSoonMinutes: 30,
  });

  assert.equal(status.status, "closing_soon");
  assert.equal(status.message, "Fecha em 15 min");
});

test("mantém aberto após meia-noite quando o expediente atravessa o dia", () => {
  const overnight: BusinessHours = {
    mode: "regular",
    days: { monday: { open: "18:00", close: "02:00" } },
  };
  const status = getBusinessStatus(overnight, {
    now: new Date("2026-07-07T04:00:00.000Z"),
  });

  assert.equal(status.status, "open");
  assert.equal(status.closingTime, "02:00");
});

test("trata atendimento 24 horas e por agendamento", () => {
  assert.equal(getBusinessStatus({ mode: "24h" }).status, "always_open");
  assert.equal(getBusinessStatus({ mode: "appointment" }).status, "appointment");
});

test("calcula o segundo período de atendimento no mesmo dia", () => {
  const splitSchedule: BusinessHours = {
    mode: "regular",
    days: {
      monday: {
        open: "08:00",
        close: "12:00",
        secondOpen: "14:00",
        secondClose: "18:00",
      },
    },
  };

  assert.equal(
    getBusinessStatus(splitSchedule, { now: new Date("2026-07-06T18:30:00.000Z") }).status,
    "open",
  );
});

test("personaliza o status para recepção de hospedagem", () => {
  const open = getBusinessStatusPresentation(
    { status: "open", isOpen: true, closingTime: "22:00", message: "Fecha às 22:00" },
    "lodging",
  );
  const closingSoon = getBusinessStatusPresentation(
    { status: "closing_soon", isOpen: true, closingTime: "22:00", message: "Fecha em 15 min" },
    "lodging",
  );
  const closed = getBusinessStatusPresentation(
    { status: "closed", isOpen: false, nextOpening: "08:00", message: "Abre amanhã às 08:00" },
    "lodging",
  );

  assert.deepEqual(open, { label: "Recepção disponível", message: "Atendimento até 22h" });
  assert.deepEqual(closingSoon, { label: "Recepção encerra em breve", message: "Atendimento até 22h" });
  assert.deepEqual(closed, { label: "Recepção fechada", message: "Retorna amanhã às 8h" });
  assert.equal(
    getBusinessStatusPresentation(getBusinessStatus({ mode: "24h" }), "lodging").label,
    "Atendimento 24 horas",
  );
  assert.equal(
    getBusinessStatusPresentation(getBusinessStatus({ mode: "appointment" }), "lodging").label,
    "Atendimento mediante reserva",
  );
});
