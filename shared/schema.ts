import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
  googleId: text("google_id").unique(),
  email: text("email"),
  name: text("name"),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  source: text("source").default("manual"), // 'manual', 'google', 'simplepractice'
  sourceId: text("source_id"),
  calendarId: text("calendar_id"), // For Google Calendar events
  color: text("color").default("#6495ED"),
  notes: text("notes"),
  actionItems: text("action_items"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dailyNotes = pgTable("daily_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDailyNotesSchema = createInsertSchema(dailyNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type DailyNote = typeof dailyNotes.$inferSelect;
export type InsertDailyNote = z.infer<typeof insertDailyNotesSchema>;
