import { pgTable, serial, text, varchar, integer, uniqueIndex, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  accessCode: varchar('access_code', { length: 256 }).notNull().unique(),
  isAdmin: integer('is_admin').notNull().default(0),
});

// Teams Table
export type Team = typeof teams.$inferSelect;

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  apiId: integer('api_id').notNull().unique(),
  name: varchar('name', { length: 256 }).notNull(),
  shortName: varchar('short_name', { length: 256 }),
  abbr: varchar('abbr', { length: 10 }),
  actualPosition: integer('actual_position'),
  points: integer('points').default(0),
  lastUpdated: timestamp('last_updated').defaultNow(),
});

// Predictions Table
export const predictions = pgTable('predictions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  teamId: integer('team_id').notNull().references(() => teams.id),
  predictedPosition: integer('predicted_position').notNull(),
}, (table) => {
  return {
    userTeamUnique: uniqueIndex('user_team_unique_idx').on(table.userId, table.teamId),
  };
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  predictions: many(predictions),
}));

export const predictionsRelations = relations(predictions, ({ one }) => ({
  user: one(users, {
    fields: [predictions.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [predictions.teamId],
    references: [teams.id],
  }),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
    predictions: many(predictions),
}));
