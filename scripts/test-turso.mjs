import 'dotenv/config';

const url = process.env.TURSO_DATABASE_URL || 'libsql://atocarya-db-jothejmaster.aws-us-west-2.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log('Conectando a Turso SQLite...');
const db = createClient({ url, authToken });

async function run() {
  try {
    // 1. Crear tabla musicians
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
    console.log('✓ Tabla musicians lista');

    // 2. Crear tabla services
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
    console.log('✓ Tabla services lista');

    // 3. Crear tabla settings
    await db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
    console.log('✓ Tabla settings lista');

    // Comprobar filas de músicos
    const mResult = await db.execute('SELECT COUNT(*) as count FROM musicians');
    console.log(`Músicos en base de datos: ${mResult.rows[0].count}`);

    // Comprobar filas de cultos
    const sResult = await db.execute('SELECT COUNT(*) as count FROM services');
    console.log(`Cultos en base de datos: ${sResult.rows[0].count}`);

    console.log('¡Conexión y migración a Turso SQLite exitosa al 100%!');
  } catch (err) {
    console.error('Error al conectar a Turso:', err);
  }
}

run();
