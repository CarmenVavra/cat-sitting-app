import { Owner } from '../models/api.models';

/** Autocomplete rules for the "Neue Betreuung" form. */

const MAX_OWNER_SUGGESTIONS = 5;
const MAX_CAT_SUGGESTIONS = 6;

const norm = (s: string): string => s.trim().toLocaleLowerCase('de-DE');

/** Owners whose name contains the query (max. 5), excluding the currently selected one. */
export function ownerSuggestions(
  owners: readonly Owner[],
  query: string,
  selectedId: string | null,
): Owner[] {
  const q = norm(query);
  if (!q) {
    return [];
  }
  return owners
    .filter((o) => o.id !== selectedId && norm(o.name).includes(q))
    .slice(0, MAX_OWNER_SUGGESTIONS);
}

/** Owner with exactly this name (case-insensitive). */
export function findOwnerByName(owners: readonly Owner[], name: string): Owner | undefined {
  const q = norm(name);
  return q ? owners.find((o) => norm(o.name) === q) : undefined;
}

export interface CatSuggestion {
  name: string;
  /** "von Maria Huber" or "bekannt" */
  source: string;
}

function allCatNames(owners: readonly Owner[]): string[] {
  return owners.flatMap((o) => o.cats.map((c) => c.name));
}

/**
 * First the selected owner's cats, then other known cats that match the query (max. 6).
 * Already chosen cats are left out.
 */
export function catSuggestions(
  owners: readonly Owner[],
  selectedOwner: Owner | null,
  chosen: readonly string[],
  query: string,
): CatSuggestion[] {
  const q = norm(query);
  const isChosen = (name: string): boolean => chosen.some((c) => norm(c) === norm(name));
  const matches = (name: string): boolean => !q || norm(name).includes(q);

  const own = (selectedOwner?.cats.map((c) => c.name) ?? []).filter(
    (name) => !isChosen(name) && matches(name),
  );
  const ownKeys = new Set(own.map(norm));

  const others = q
    ? [
        ...new Set(
          allCatNames(owners.filter((o) => o.id !== selectedOwner?.id)).filter(
            (name) => !isChosen(name) && !ownKeys.has(norm(name)) && matches(name),
          ),
        ),
      ]
    : [];

  return [
    ...own.map((name) => ({ name, source: `von ${selectedOwner?.name ?? ''}` })),
    ...others.map((name) => ({ name, source: 'bekannt' })),
  ].slice(0, MAX_CAT_SUGGESTIONS);
}

/** True if any owner already has a cat with exactly this name. */
export function isKnownCat(owners: readonly Owner[], name: string): boolean {
  const q = norm(name);
  return !!q && allCatNames(owners).some((c) => norm(c) === q);
}

/** Uses the spelling of an already known cat, otherwise the trimmed input. */
export function canonicalCatName(owners: readonly Owner[], raw: string): string {
  const q = norm(raw);
  return allCatNames(owners).find((c) => norm(c) === q) ?? raw.trim();
}

export function containsName(names: readonly string[], name: string): boolean {
  return names.some((n) => norm(n) === norm(name));
}
