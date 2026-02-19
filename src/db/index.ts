import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Check if DATABASE_URL exists - gracefully handle missing connection
export const getDatabaseConnection = () => {
  const dbUrl = process.env.DATABASE_URL || process.env.STORAGE_URL || process.env.POSTGRES_URL;
  
  if (!dbUrl) {
    console.warn('⚠️ No DATABASE_URL found - Mission Control will use mock data. Add DATABASE_URL to enable persistence.');
    return null;
  }
  
  const sql = neon(dbUrl);
  return drizzle(sql, { schema });
};

export const db = getDatabaseConnection();
export const isConnected = db !== null;
