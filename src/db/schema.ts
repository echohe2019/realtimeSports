import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  pgEnum,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const matchStatusEnum = pgEnum("match_status", [
  "scheduled",
  "live",
  "finished",
]);

export const matches = pgTable(
  "matches",
  {
    id: serial("id").primaryKey(),
    sport: text("sport").notNull(),
    homeTeam: text("home_team").notNull(),
    awayTeam: text("away_team").notNull(),
    status: matchStatusEnum("status").notNull().default('scheduled'),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time"),
    homeScore: integer("home_score").notNull().default(0),
    awayScore: integer("away_score").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("match_status_idx").on(table.status),
    index("match_start_time_idx").on(table.startTime),
  ],
);

export const commentary = pgTable(
  "commentary",
  {
    id: serial("id").primaryKey(),
    matchId: integer("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    minute: integer("minute").notNull(),
    sequence: integer("sequence").notNull(),
    period: text("period").notNull(),
    eventType: text("event_type").notNull(),
    actor: text("actor"),
    team: text("team"),
    message: text("message").notNull(),
    metadata: jsonb("metadata"),
    tags: text("tags").array(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("commentary_match_id_idx").on(table.matchId),
    index("commentary_minute_idx").on(table.minute),
    index("commentary_event_type_idx").on(table.eventType),
  ],
);

export const demoUser = pgTable("demo_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
