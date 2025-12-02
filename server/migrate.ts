import { migrate } from 'drizzle-orm/libsql/migrator';
import { createDbClient } from './db/client';
import * as dotenv from 'dotenv';

dotenv.config();

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL) {
  throw new Error('TURSO_DATABASE_URL is required');
}

async function main() {
  console.log('Running migrations...');

  const db = createDbClient(TURSO_DATABASE_URL, TURSO_AUTH_TOKEN);

  await migrate(db, { migrationsFolder: './drizzle' });

  console.log('Migrations completed successfully!');
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
