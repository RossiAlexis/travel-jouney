import type { D1Database } from "@cloudflare/workers-types";
import { AccountRepository } from "./account.repository";
import { MemoryRepository } from "./memory.repository";
import { ExpenseRepository } from "./expense.repository";
import { SessionRepository } from "./session.repository";
import { TripRepository } from "./trip.repository";
import { UserRepository } from "./user.repository";

export interface Repositories {
  users: UserRepository;
  accounts: AccountRepository;
  sessions: SessionRepository;
  trips: TripRepository;
  memories: MemoryRepository;
  expenses: ExpenseRepository;
}

export function createRepositories(db: D1Database): Repositories {
  return {
    users: new UserRepository(db),
    accounts: new AccountRepository(db),
    sessions: new SessionRepository(db),
    trips: new TripRepository(db),
    memories: new MemoryRepository(db),
    expenses: new ExpenseRepository(db),
  };
}

export {
  AccountRepository,
  MemoryRepository,
  ExpenseRepository,
  SessionRepository,
  TripRepository,
  UserRepository,
};
