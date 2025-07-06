import { users, events, dailyNotes, type User, type InsertUser, type Event, type InsertEvent, type DailyNote, type InsertDailyNote } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getEvents(userId: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(eventId: number, updates: Partial<Event>): Promise<Event>;
  deleteEvent(eventId: number): Promise<void>;
  getDailyNote(userId: number, date: string): Promise<DailyNote | undefined>;
  createOrUpdateDailyNote(note: InsertDailyNote): Promise<DailyNote>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getEvents(userId: number): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.userId, userId));
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db
      .insert(events)
      .values(event)
      .returning();
    return newEvent;
  }

  async updateEvent(eventId: number, updates: Partial<Event>): Promise<Event> {
    const [updatedEvent] = await db
      .update(events)
      .set(updates)
      .where(eq(events.id, eventId))
      .returning();
    return updatedEvent;
  }

  async deleteEvent(eventId: number): Promise<void> {
    await db.delete(events).where(eq(events.id, eventId));
  }

  async getDailyNote(userId: number, date: string): Promise<DailyNote | undefined> {
    const [note] = await db
      .select()
      .from(dailyNotes)
      .where(and(eq(dailyNotes.userId, userId), eq(dailyNotes.date, date)));
    return note || undefined;
  }

  async createOrUpdateDailyNote(note: InsertDailyNote): Promise<DailyNote> {
    const existing = await this.getDailyNote(note.userId!, note.date);
    
    if (existing) {
      const [updatedNote] = await db
        .update(dailyNotes)
        .set({ content: note.content })
        .where(eq(dailyNotes.id, existing.id))
        .returning();
      return updatedNote;
    } else {
      const [newNote] = await db
        .insert(dailyNotes)
        .values(note)
        .returning();
      return newNote;
    }
  }
}

export const storage = new DatabaseStorage();
