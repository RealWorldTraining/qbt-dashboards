import { pgTable, text, timestamp, serial, varchar, json, boolean } from 'drizzle-orm/pg-core';

// Tasks Board
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('backlog'), // backlog, in_progress, blocked, done
  priority: varchar('priority', { length: 20 }).notNull().default('medium'), // low, medium, high, urgent
  assignedTo: varchar('assigned_to', { length: 100 }), // 'aaron' or 'claude'
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Memory Viewer
export const memories = pgTable('memories', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  tags: json('tags').$type<string[]>(), // Array of tag strings
  pinned: boolean('pinned').notNull().default(false),
  category: varchar('category', { length: 50 }), // decision, context, reference, insight, bug
  date: timestamp('date').notNull().defaultNow(),
  conversationRef: text('conversation_ref'), // Discord message ID or session reference
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Calendar / Cron Jobs
export const cronJobs = pgTable('cron_jobs', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  schedule: varchar('schedule', { length: 100 }).notNull(), // cron expression
  scheduleHuman: varchar('schedule_human', { length: 200 }), // "Every Monday at 9 AM"
  lastRun: timestamp('last_run'),
  nextRun: timestamp('next_run'),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, paused, error
  n8nWorkflowId: varchar('n8n_workflow_id', { length: 100 }),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Content Pipeline
export const contentPipeline = pgTable('content_pipeline', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  platform: varchar('platform', { length: 50 }), // youtube, twitter, linkedin, etc.
  status: varchar('status', { length: 50 }).notNull().default('ideas'), // ideas, scripting, review, ready_to_film, published
  script: text('script'),
  thumbnailUrl: text('thumbnail_url'),
  notes: text('notes'),
  dueDate: timestamp('due_date'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Team Members
export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  role: varchar('role', { length: 200 }),
  type: varchar('type', { length: 50 }).notNull().default('human'), // human, ai_main, ai_desktop, ai_subagent
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, idle, offline
  avatar: varchar('avatar', { length: 50 }), // emoji or icon key
  description: text('description'),
  responsibilities: json('responsibilities').$type<string[]>(),
  currentWork: text('current_work'),
  lastActive: timestamp('last_active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Type exports for TypeScript
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type Memory = typeof memories.$inferSelect;
export type NewMemory = typeof memories.$inferInsert;

export type CronJob = typeof cronJobs.$inferSelect;
export type NewCronJob = typeof cronJobs.$inferInsert;

export type ContentItem = typeof contentPipeline.$inferSelect;
export type NewContentItem = typeof contentPipeline.$inferInsert;

export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
