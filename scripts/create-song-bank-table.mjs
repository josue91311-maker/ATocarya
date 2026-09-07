import { createClient } from '@libsql/client/web';

const client = createClient({
  url: 'libsql://atocarya-db-jothejmaster.aws-us-west-2.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg0NjA4MTMsImlkIjoiMDFhMDY4OTEtZjkwMS03MWE0LWI5YzYtZDE2Mzc1MjNiZTFiIiwia2lkIjoiWVEybHJTYVROWk9hU3BRYUtrM0UtN3BqWnBXbkExa045SVdXSTQ5N0hPVSIsInJpZCI6IjQzOGRhODNjLWQzMTYtNDI0Yi1iMzk3LTcxMzZlZGU1NDkzMiJ9.ThZ8YS1HyVPIZJNT9jdwQxlmUcpj4PnBDBsOiq3OzIDU58cbW8V43j_u2i5SVdkH7aedbVJuM-X5C5lbVBKdDw'
});

async function main() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS song_bank (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist TEXT,
      default_key TEXT,
      original_key TEXT,
      bpm INTEGER,
      youtube_url TEXT,
      chords_url TEXT,
      chord_chart TEXT,
      lyrics TEXT,
      notes TEXT,
      created_at TEXT
    )
  `);

  console.log('Tabla song_bank creada exitosamente en Turso.');
  const count = await client.execute('SELECT count(*) as c FROM song_bank');
  console.log('Total en song_bank:', count.rows[0].c);

  const checkS = await client.execute('SELECT count(*) as count FROM services');
  console.log('Services count preserved intact:', checkS.rows[0].count);
  const checkM = await client.execute('SELECT count(*) as count FROM musicians');
  console.log('Musicians count preserved intact:', checkM.rows[0].count);
}

main().catch(console.error);
