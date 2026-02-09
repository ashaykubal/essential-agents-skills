/**
 * Type Safety Recommended Patterns
 *
 * These examples demonstrate type-safe coding practices.
 */

// Proper typing instead of `any`
interface ProcessableData {
  id: string;
  payload: Record<string, unknown>;
}

function processDataSafe(data: ProcessableData) {
  // Type-safe access
  return data.payload;
}

// Typed return with proper interface
interface User {
  id: string;
  name: string;
  email: string;
}

async function fetchUserSafe(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();

  // Validate shape before returning
  if (!isUser(data)) {
    throw new Error('Invalid user data');
  }
  return data;
}

// Type guard for runtime validation
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'email' in data
  );
}

// JSON parsing with validation
import { z } from 'zod';

const ConfigSchema = z.object({
  apiUrl: z.string().url(),
  timeout: z.number().positive(),
});

type Config = z.infer<typeof ConfigSchema>;

function loadConfigSafe(): Config {
  const raw = JSON.parse(process.env.CONFIG ?? '{}');
  return ConfigSchema.parse(raw); // Throws if invalid
}

// Explicit parameter types
function calculateSafe(a: number, b: number): number {
  return a + b;
}

// Safe null handling with type narrowing
interface UserProfile {
  name: string;
  profile?: {
    avatar?: string;
  };
}

function getAvatarSafe(user: UserProfile | null): string {
  if (!user) {
    return 'default-avatar.png';
  }
  return user.profile?.avatar ?? 'default-avatar.png';
}

// Consistent optional chaining
function getNameSafe(user: UserProfile | null): string {
  // All access uses optional chaining consistently
  return user?.profile?.avatar ?? 'default';
}

// Nullish coalescing for valid falsy values
function getCountSafe(items?: number): number {
  // Uses ?? to only default on null/undefined, not 0
  return items ?? 10;
}

// Type narrowing instead of assertion
function convertSafe(value: string): number {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Cannot convert "${value}" to number`);
  }
  return parsed;
}

// Type guard for API responses
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function parseResponseSafe<T>(
  response: ApiResponse<T>,
  guard: (data: unknown) => data is T
): T {
  if (!response.success || !response.data) {
    throw new Error(response.error ?? 'Request failed');
  }

  if (!guard(response.data)) {
    throw new Error('Invalid response shape');
  }

  return response.data;
}

// Safe array access with validation
async function getFirstUserSafe(): Promise<User> {
  const users = await fetchUsers();

  if (users.length === 0) {
    throw new Error('No users found');
  }

  return users[0]; // Now guaranteed to exist
}

// Typed catch clause
async function fetchDataSafe() {
  try {
    return await fetch('/api/data');
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
    } else {
      console.log('Unknown error:', error);
    }
  }
}

// Proper generic constraints
interface Identifiable {
  id: string;
}

function wrapSafe<T extends Identifiable>(value: T): { wrapped: T; id: string } {
  return { wrapped: value, id: value.id };
}

// Discriminated unions for exhaustive checking
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function handleResult<T>(result: Result<T>): T {
  if (result.success) {
    return result.data;
  }
  throw new Error(result.error);
}

// Branded types for semantic safety
type UserId = string & { readonly __brand: 'UserId' };
type OrderId = string & { readonly __brand: 'OrderId' };

function createUserId(id: string): UserId {
  return id as UserId;
}

function getUserById(id: UserId): Promise<User> {
  // Can only be called with UserId, not OrderId
  return fetch(`/api/users/${id}`).then((r) => r.json());
}
