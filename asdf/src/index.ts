/**
 * TypeScript cheatsheet
 *
 * Hover over names in your editor to inspect inferred types.
 * Run `npx tsc -p asdf/tsconfig.json --noEmit` from the project root
 * to type-check this file without creating output files.
 */

// -----------------------------------------------------------------------------
// 1. Primitive values and type inference
// -----------------------------------------------------------------------------

const username = "aden"; // inferred as string
let age: number = 20;
let isLearning: boolean = true;
let nothingHere: null = null;
let notSetYet: undefined = undefined;

// Prefer `const`; use `let` only when the value will change.
age += 1;
isLearning = !isLearning;

const score: number | undefined = Math.random() > 0.5 ? 100 : undefined;
const displayedScore = score ?? 0; // `??` only falls back for null/undefined

// -----------------------------------------------------------------------------
// 2. Arrays, tuples, and readonly values
// -----------------------------------------------------------------------------

const numbers: number[] = [1, 2, 3];
const names: Array<string> = ["Aden", "Sam"];

const coordinate: [number, number] = [12, 24];
const [x, y] = coordinate;

const readOnlyTags: readonly string[] = ["typescript", "learning"];
// readOnlyTags.push("new"); // Error: readonly arrays cannot be mutated.

// With `noUncheckedIndexedAccess`, an array lookup may be undefined.
const firstName: string | undefined = names[0];

// -----------------------------------------------------------------------------
// 3. Object types, optional properties, and readonly properties
// -----------------------------------------------------------------------------

type Person = {
  readonly id: number;
  name: string;
  email?: string;
  retire: (date: Date) => void;
};

const person: Person = {
  id: 1,
  name: "John",
  retire(date) {
    console.log(`${this.name} retired on ${date.toDateString()}`);
  },
};

person.name = "Jane";
// person.id = 2; // Error: `id` is readonly.

// Optional properties are not automatically `string | undefined` when writing
// with `exactOptionalPropertyTypes` enabled.
// person.email = undefined; // Error
person.email = "jane@example.com";

// -----------------------------------------------------------------------------
// 4. Functions
// -----------------------------------------------------------------------------

function greet(name: string, greeting = "Hello"): string {
  return `${greeting}, ${name}!`;
}

function calculateTotal(
  subtotal: number,
  taxRate?: number,
  ...discounts: number[]
): number {
  const discountTotal = discounts.reduce((total, discount) => total + discount, 0);
  return (subtotal - discountTotal) * (1 + (taxRate ?? 0));
}

type NumberTransformer = (value: number) => number;

function transformAll(
  values: readonly number[],
  transform: NumberTransformer,
): number[] {
  return values.map(transform);
}

// -----------------------------------------------------------------------------
// 5. Literal types, `as const`, enums, and `satisfies`
// -----------------------------------------------------------------------------

type Theme = "light" | "dark";
let theme: Theme = "dark";
// theme = "blue"; // Error: not part of the Theme union.

enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT",
}

const roles = ["admin", "editor", "viewer"] as const;
type Role = (typeof roles)[number]; // "admin" | "editor" | "viewer"

type AppSettings = {
  host: string;
  port: number;
  secure?: boolean;
};

// `satisfies` checks the shape without widening useful inferred literals.
const settings = {
  host: "localhost",
  port: 3000,
} satisfies AppSettings;

// -----------------------------------------------------------------------------
// 6. Unions, intersections, and narrowing
// -----------------------------------------------------------------------------

function kgToLbs(weight: number | string): number {
  if (typeof weight === "number") {
    return weight * 2.20462;
  }

  return Number.parseFloat(weight) * 2.20462;
}

type HasId = { id: number };
type HasTimestamps = { createdAt: Date; updatedAt: Date };
type DatabaseRecord = HasId & HasTimestamps;

const record: DatabaseRecord = {
  id: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

type Fish = { kind: "fish"; swim: () => void };
type Bird = { kind: "bird"; fly: () => void };
type Pet = Fish | Bird;

function move(pet: Pet): void {
  switch (pet.kind) {
    case "fish":
      pet.swim();
      break;
    case "bird":
      pet.fly();
      break;
    default:
      assertNever(pet);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

// `in` also narrows object unions.
function printContact(contact: { email: string } | { phone: string }): void {
  if ("email" in contact) {
    console.log(contact.email);
  } else {
    console.log(contact.phone);
  }
}

// -----------------------------------------------------------------------------
// 7. Type aliases and interfaces
// -----------------------------------------------------------------------------

type UserId = string | number;

interface User {
  id: UserId;
  name: string;
}

interface Admin extends User {
  permissions: string[];
}

const admin: Admin = {
  id: "user-1",
  name: "Aden",
  permissions: ["manage-users"],
};

// Use `type` for unions, intersections, mapped types, and computed types.
// Use `interface` when modeling extendable object-shaped contracts.

// -----------------------------------------------------------------------------
// 8. `unknown`, `any`, type guards, and assertions
// -----------------------------------------------------------------------------

// Avoid `any`: it disables TypeScript checking.
function parseJson(json: string): unknown {
  return JSON.parse(json) as unknown;
}

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value &&
    typeof value.name === "string"
  );
}

const possibleUser = parseJson('{"id": 1, "name": "Aden"}');

if (isUser(possibleUser)) {
  console.log(possibleUser.name); // safely narrowed to User
}

// Use assertions only when you know more than TypeScript can infer.
// const input = document.querySelector("input") as HTMLInputElement | null;

// -----------------------------------------------------------------------------
// 9. Null safety
// -----------------------------------------------------------------------------

type ApiUser = {
  profile?: {
    displayName?: string;
  };
};

const apiUser: ApiUser = {};
const displayName = apiUser.profile?.displayName ?? "Anonymous";

// -----------------------------------------------------------------------------
// 10. Classes, access modifiers, and abstract classes
// -----------------------------------------------------------------------------

interface Serializable {
  serialize(): string;
}

class Account implements Serializable {
  #balance = 0; // JavaScript runtime-private field

  constructor(
    public readonly id: number,
    private owner: string,
  ) {}

  deposit(amount: number): void {
    if (amount <= 0) {
      throw new Error("Deposit must be positive.");
    }

    this.#balance += amount;
  }

  getBalance(): number {
    return this.#balance;
  }

  serialize(): string {
    return JSON.stringify({ id: this.id, owner: this.owner, balance: this.#balance });
  }
}

abstract class Shape {
  abstract area(): number;

  describe(): string {
    return `Area: ${this.area()}`;
  }
}

class Circle extends Shape {
  constructor(private readonly radius: number) {
    super();
  }

  area(): number {
    return Math.PI * this.radius ** 2;
  }
}

// -----------------------------------------------------------------------------
// 11. Generics and constraints
// -----------------------------------------------------------------------------

function firstItem<T>(items: readonly T[]): T | undefined {
  return items[0];
}

function getProperty<T extends object, K extends keyof T>(
  object: T,
  key: K,
): T[K] {
  return object[key];
}

const firstNumber = firstItem(numbers); // number | undefined
const adminName = getProperty(admin, "name"); // string

// -----------------------------------------------------------------------------
// 12. Utility, mapped, and conditional types
// -----------------------------------------------------------------------------

type UserPreview = Pick<User, "id" | "name">;
type UserWithoutId = Omit<User, "id">;
type UserUpdate = Partial<User>;
type ReadonlyUser = Readonly<User>;
type RolePermissions = Record<Role, readonly string[]>;

const permissions: RolePermissions = {
  admin: ["read", "write", "delete"],
  editor: ["read", "write"],
  viewer: ["read"],
};

type Nullable<T> = {
  [Property in keyof T]: T[Property] | null;
};

type ApiResponse<T> = T extends readonly (infer Item)[] ? Item : T;

type NullableUser = Nullable<User>;
type ListItem = ApiResponse<readonly User[]>; // User

// -----------------------------------------------------------------------------
// 13. Function overloads
// -----------------------------------------------------------------------------

function formatValue(value: number): string;
function formatValue(value: Date): string;
function formatValue(value: number | Date): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value.toFixed(2);
}

// -----------------------------------------------------------------------------
// Runnable examples
// -----------------------------------------------------------------------------

function main(): void {
  console.log(greet(username));
  console.log(`Coordinate: ${x}, ${y}`);
  console.log(`100 kg is ${kgToLbs(100).toFixed(2)} lbs`);
  console.log(`Total: ${calculateTotal(100, 0.1, 5, 10)}`);
  console.log(transformAll([1, 2, 3], (value) => value * 2));

  const account = new Account(1, "Aden");
  account.deposit(50);
  console.log(account.serialize());

  console.log(new Circle(3).describe());
  console.log(formatValue(new Date()));
}

main();
