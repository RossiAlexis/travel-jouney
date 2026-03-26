import type { D1Database } from "@cloudflare/workers-types";
import { AccountRepository } from "./account.repository";
import { EntryRepository } from "./entry.repository";
import { ExpenseRepository } from "./expense.repository";
import { SessionRepository } from "./session.repository";
import { TripRepository } from "./trip.repository";
import { UserRepository } from "./user.repository";

export interface Repositories {
  users: UserRepository;
  accounts: AccountRepository;
  sessions: SessionRepository;
  trips: TripRepository;
  entries: EntryRepository;
  expenses: ExpenseRepository;
}

export function createRepositories(db: D1Database): Repositories {
  return {
    users: new UserRepository(db),
    accounts: new AccountRepository(db),
    sessions: new SessionRepository(db),
    trips: new TripRepository(db),
    entries: new EntryRepository(db),
    expenses: new ExpenseRepository(db),
  };
}

export {
  AccountRepository,
  EntryRepository,
  ExpenseRepository,
  SessionRepository,
  TripRepository,
  UserRepository,
};
