/** Response and request shapes of the PHP API (`/api/...`). */

/** F = Früh (morning), A = Abend (evening). */
export type SlotCode = 'F' | 'A';

/** "YYYY-MM-DD|F" */
export type VisitKey = `${string}|${SlotCode}`;

/** Visit slot → sitter id. Missing keys are unassigned slots. */
export type VisitMap = Partial<Record<VisitKey, string>>;

export interface Sitter {
  id: string;
  first: string;
  last: string;
}

export interface CatRef {
  id: string;
  name: string;
}

export interface Owner {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  cats: CatRef[];
}

export interface Booking {
  id: string;
  ownerId: string;
  cats: CatRef[];
  /** ISO date, inclusive */
  from: string;
  /** ISO date, inclusive */
  to: string;
  /** € per visit, fixed per booking */
  price: number;
  archived: boolean;
  visits: VisitMap;
}

export interface Settings {
  defaultPrice: number;
}

export interface ApiError {
  error: string;
}

export interface CreateOwnerRequest {
  name: string;
  address: string;
  phone: string;
  email: string;
  cats: string[];
}

export interface CreateBookingRequest {
  ownerId: string | null;
  ownerName: string;
  address: string;
  phone: string;
  email: string;
  cats: string[];
  from: string;
  to: string;
  price: number;
}

export interface UpdateBookingRequest {
  price?: number;
  archived?: boolean;
}

export interface CreateSitterRequest {
  first: string;
  last: string;
}
