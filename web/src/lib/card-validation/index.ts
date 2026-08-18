import { CATEGORIES, type GameCard } from "@/types/game";

export function validateCards(cards: GameCard[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const words = new Set<string>();
  for (const card of cards) {
    const normalizedWord = card.word.trim().toLocaleLowerCase("pt-BR");
    if (!card.id.trim() || !normalizedWord || !card.category || !card.difficulty) errors.push(`${card.id || "sem-id"}: campo vazio`);
    if (ids.has(card.id)) errors.push(`${card.id}: ID duplicado`);
    if (words.has(normalizedWord)) errors.push(`${card.id}: palavra principal duplicada`);
    if (card.forbidden.length !== 5) errors.push(`${card.id}: precisa ter cinco proibidas`);
    const forbidden = card.forbidden.map((word) => word.trim().toLocaleLowerCase("pt-BR"));
    if (forbidden.some((word) => !word)) errors.push(`${card.id}: proibida vazia`);
    if (new Set(forbidden).size !== forbidden.length) errors.push(`${card.id}: proibida duplicada`);
    if (forbidden.includes(normalizedWord)) errors.push(`${card.id}: principal entre proibidas`);
    if (!CATEGORIES.includes(card.category)) errors.push(`${card.id}: categoria inválida`);
    ids.add(card.id);
    words.add(normalizedWord);
  }
  return errors;
}

export function assertValidCards(cards: GameCard[]): void {
  if (process.env.NODE_ENV === "production") return;
  const errors = validateCards(cards);
  if (errors.length) throw new Error(`Baralho inválido:\n${errors.join("\n")}`);
}
