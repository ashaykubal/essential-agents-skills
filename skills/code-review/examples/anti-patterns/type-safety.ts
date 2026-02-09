/**
 * Type Safety Anti-Patterns
 *
 * DO NOT use these patterns in production code.
 * Each example demonstrates a type safety hole.
 */

// Explicit `any` - bypasses type checking entirely
function processDataUnsafe(data: any) {
  // No type checking, any access is allowed
  return data.deeply.nested.property.that.might.not.exist;
}

// Return type `any` - loses type information for callers
async function fetchUserUnsafe(id: string): Promise<any> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// Variable typed as `any`
const configUnsafe: any = JSON.parse(rawConfig);
console.log(configUnsafe.setting.that.might.not.exist);

// Implicit `any` from missing parameter type (with noImplicitAny: false)
function calculateUnsafe(a, b) {
  return a + b; // Could be string concatenation or number addition
}

// Non-null assertion abuse
interface User {
  name: string;
  profile?: {
    avatar?: string;
  };
}

function getAvatarUnsafe(user: User | null): string {
  // BAD: Assumes user and profile exist
  return user!.profile!.avatar!;
}

// Optional chaining gap - mixed `.` and `?.`
function getNameUnsafe(user: User | null): string {
  // BAD: `profile` could be undefined, but we use `.avatar`
  return user?.profile.avatar ?? 'default';
}

// Truthy check when 0 or "" is valid
function getCountUnsafe(items?: number): number {
  // BAD: Returns 10 when items is 0
  if (!items) {
    return 10;
  }
  return items;
}

// Double assertion - almost always wrong
function convertUnsafe(value: string): number {
  // BAD: Forces incompatible type conversion
  return value as unknown as number;
}

// Type assertion without validation
interface Config {
  apiUrl: string;
  timeout: number;
}

function loadConfigUnsafe(): Config {
  const raw = JSON.parse(process.env.CONFIG!);
  // BAD: No validation that raw matches Config shape
  return raw as Config;
}

// Widening to `any` then narrowing
function parseResponseUnsafe(response: Response): UserData {
  const data = response.json() as any;
  // BAD: Loses all type safety
  return data as UserData;
}

// Type assertion on non-overlapping types (via unknown)
function stringToNumberUnsafe(str: string): number {
  // This compiles but is nonsensical
  return str as unknown as number;
}

// Ignoring null/undefined with assertion
async function getFirstUserUnsafe(): Promise<User> {
  const users = await fetchUsers();
  // BAD: Array could be empty
  return users[0]!;
}

// Untyped catch clause
async function fetchDataUnsafe() {
  try {
    return await fetch('/api/data');
  } catch (e) {
    // BAD: `e` is `unknown` but used as Error
    console.log(e.message); // TypeScript error in strict mode
  }
}

// Generic constraint `any` - defeats purpose of generics
function wrapUnsafe<T extends any>(value: T): { wrapped: T } {
  return { wrapped: value };
}
