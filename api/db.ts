import { createClient, Client } from '@libsql/client';

let client: Client | null = null;

export const getDb = (): Client => {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
    const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

    client = createClient({
      url,
      authToken,
    });
  }
  return client;
};

/**
 * Inicializa las tablas de SQLite en Turso si aún no existen
 */
export const initDb = async () => {
  const db = getDb();

  // 1. Tabla de músicos
  await db.execute(`
    CREATE TABLE IF NOT EXISTS musicians (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      age INTEGER NOT NULL,
      pin TEXT NOT NULL,
      primary_instrument TEXT NOT NULL,
      phone TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // 2. Tabla de servicios / cultos
  await db.execute(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      title TEXT NOT NULL,
      rehearsal_time TEXT,
      notes TEXT,
      is_open INTEGER NOT NULL DEFAULT 1,
      registration_deadline TEXT,
      slots TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // 3. Tabla de configuración (ej. PIN admin)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Sembrar PIN de administrador por defecto si no existe
  const adminPinRow = await db.execute({
    sql: 'SELECT value FROM settings WHERE key = ?',
    args: ['admin_pin'],
  });

  if (adminPinRow.rows.length === 0) {
    await db.execute({
      sql: 'INSERT INTO settings (key, value) VALUES (?, ?)',
      args: ['admin_pin', '7777'],
    });
  }
};
