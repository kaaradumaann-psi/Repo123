import type { UserRole } from './authTypes';

export const AUTH_STORAGE_KEY = 'mmpi566.auth.users.v1';
export const AUTH_SESSION_KEY = 'mmpi566.auth.session.v1';
const PASSWORD_ITERATIONS = 180_000;
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

type PasswordHash = {
  algorithm: 'PBKDF2-SHA-256';
  iterations: number;
  salt: string;
  hash: string;
};

export type StoredUser = {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  identifier: string;
  password: PasswordHash;
  active: boolean;
  createdAt: string;
};

export type AuthenticatedUser = Omit<StoredUser, 'password'>;
export type AuthSession = { userId: string; issuedAt: string; expiresAt: string };

function storage(kind: 'localStorage' | 'sessionStorage'): Storage | null {
  if (typeof window === 'undefined') return null;
  try { return window[kind]; } catch { return null; }
}

function readJson<T>(store: Storage | null, key: string, fallback: T): T {
  if (!store) return fallback;
  try {
    const value: unknown = JSON.parse(store.getItem(key) ?? 'null');
    return value === null ? fallback : value as T;
  } catch { return fallback; }
}

function writeJson(store: Storage | null, key: string, value: unknown): void {
  if (!store) throw new Error('Bu tarayıcı yerel depolamayı kullanamıyor. Gizli modu kapatıp yeniden deneyin.');
  try { store.setItem(key, JSON.stringify(value)); }
  catch { throw new Error('Yerel depolama alanı dolu veya kullanılamıyor.'); }
}

function randomHex(bytes: number): string {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return Array.from(values, value => value.toString(16).padStart(2, '0')).join('');
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), value => value.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[a-f0-9]+$/i.test(value) || value.length % 2 !== 0) throw new Error('Geçersiz parola özeti.');
  const result = new Uint8Array(new ArrayBuffer(value.length / 2));
  for (let index = 0; index < result.length; index++) result[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  return result;
}

function validIdentifier(value: string): string {
  const normalized = value.trim().toLocaleLowerCase('tr-TR');
  if (normalized.length < 3 || normalized.length > 160 || /[\u0000-\u001f]/.test(normalized)) {
    throw new Error('E-posta veya kullanıcı adı 3–160 karakter arasında olmalıdır.');
  }
  return normalized;
}

function validName(value: string, field: string): string {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (normalized.length < 2 || normalized.length > 80) throw new Error(`${field} 2–80 karakter arasında olmalıdır.`);
  return normalized;
}

function validPassword(value: string): string {
  if (value.length < 10 || value.length > 128) throw new Error('Şifre en az 10, en çok 128 karakter olmalıdır.');
  return value;
}

async function derivePassword(password: string, salt: string, iterations: number): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error('Bu tarayıcı güvenli parola işlemlerini desteklemiyor. Güncel bir tarayıcı kullanın.');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: hexToBytes(salt), iterations, hash: 'SHA-256' }, key, 256);
  return bytesToHex(bits);
}

export async function createPasswordHash(password: string): Promise<PasswordHash> {
  const checked = validPassword(password);
  const salt = randomHex(16);
  return { algorithm: 'PBKDF2-SHA-256', iterations: PASSWORD_ITERATIONS, salt, hash: await derivePassword(checked, salt, PASSWORD_ITERATIONS) };
}

async function verifyPassword(password: string, stored: PasswordHash): Promise<boolean> {
  if (stored.algorithm !== 'PBKDF2-SHA-256' || stored.iterations < 100_000 || stored.iterations > 500_000) return false;
  try { return (await derivePassword(password, stored.salt, stored.iterations)) === stored.hash; }
  catch { return false; }
}

function withoutPassword(user: StoredUser): AuthenticatedUser {
  const { password: _password, ...safe } = user;
  return safe;
}

function isStoredUser(value: unknown): value is StoredUser {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StoredUser>;
  const password = candidate.password;
  return typeof candidate.id === 'string' && (candidate.role === 'ADMIN' || candidate.role === 'PSYCHOLOG') &&
    typeof candidate.firstName === 'string' && typeof candidate.lastName === 'string' && typeof candidate.identifier === 'string' &&
    typeof candidate.active === 'boolean' && typeof candidate.createdAt === 'string' && !!password &&
    password.algorithm === 'PBKDF2-SHA-256' && typeof password.salt === 'string' && typeof password.hash === 'string' &&
    Number.isInteger(password.iterations);
}

export function listUsers(): AuthenticatedUser[] {
  const raw = readJson<unknown[]>(storage('localStorage'), AUTH_STORAGE_KEY, []);
  return Array.isArray(raw) ? raw.filter(isStoredUser).map(withoutPassword) : [];
}

function listStoredUsers(): StoredUser[] {
  const raw = readJson<unknown[]>(storage('localStorage'), AUTH_STORAGE_KEY, []);
  return Array.isArray(raw) ? raw.filter(isStoredUser) : [];
}

function saveUsers(users: StoredUser[]): void { writeJson(storage('localStorage'), AUTH_STORAGE_KEY, users); }

export async function createUser(input: {
  role: UserRole;
  firstName: string;
  lastName: string;
  identifier: string;
  password: string;
}): Promise<AuthenticatedUser> {
  const firstName = validName(input.firstName, 'Ad');
  const lastName = validName(input.lastName, 'Soyad');
  const identifier = validIdentifier(input.identifier);
  if (input.role !== 'ADMIN' && input.role !== 'PSYCHOLOG') throw new Error('Geçersiz kullanıcı rolü.');
  const users = listStoredUsers();
  if (users.some(user => user.identifier === identifier)) throw new Error('Bu e-posta veya kullanıcı adı zaten kullanılıyor.');
  const user: StoredUser = { id: `usr-${randomHex(12)}`, role: input.role, firstName, lastName, identifier,
    password: await createPasswordHash(input.password), active: true, createdAt: new Date().toISOString() };
  saveUsers([...users, user]);
  return withoutPassword(user);
}

export function setUserActive(userId: string, active: boolean): AuthenticatedUser[] {
  const users = listStoredUsers();
  const target = users.find(user => user.id === userId);
  if (!target) throw new Error('Kullanıcı bulunamadı.');
  if (target.role === 'ADMIN' && !active && users.filter(user => user.role === 'ADMIN' && user.active).length <= 1) {
    throw new Error('Son aktif admin pasifleştirilemez.');
  }
  target.active = active;
  saveUsers(users);
  return users.map(withoutPassword);
}

export async function authenticate(identifier: string, password: string): Promise<AuthenticatedUser> {
  const normalized = validIdentifier(identifier);
  const user = listStoredUsers().find(candidate => candidate.identifier === normalized);
  if (!user || !user.active || !(await verifyPassword(password, user.password))) {
    throw new Error('Giriş bilgileri geçersiz veya hesap pasif.');
  }
  const issuedAt = new Date();
  const session: AuthSession = { userId: user.id, issuedAt: issuedAt.toISOString(), expiresAt: new Date(issuedAt.getTime() + SESSION_TTL_MS).toISOString() };
  writeJson(storage('sessionStorage'), AUTH_SESSION_KEY, session);
  return withoutPassword(user);
}

export function currentUser(): AuthenticatedUser | null {
  const session = readJson<Partial<AuthSession> | null>(storage('sessionStorage'), AUTH_SESSION_KEY, null);
  if (!session || typeof session.userId !== 'string' || typeof session.expiresAt !== 'string' ||
    !Number.isFinite(Date.parse(session.expiresAt)) || Date.parse(session.expiresAt) <= Date.now()) {
    clearSession();
    return null;
  }
  const user = listStoredUsers().find(candidate => candidate.id === session.userId && candidate.active);
  return user ? withoutPassword(user) : null;
}

export function clearSession(): void { storage('sessionStorage')?.removeItem(AUTH_SESSION_KEY); }

export function hasUsers(): boolean { return listStoredUsers().length > 0; }

export function displayName(user: Pick<AuthenticatedUser, 'firstName' | 'lastName'>): string {
  return `${user.firstName} ${user.lastName}`.trim();
}
