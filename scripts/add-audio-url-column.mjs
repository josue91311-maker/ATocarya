import { createClient } from '@libsql/client/web';

const client = createClient({
  url: 'libsql://atocarya-db-jothejmaster.aws-us-west-2.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg0NjA4MTMsImlkIjoiMDFhMDY4OTEtZjkwMS03MWE0LWI5YzYtZDE2Mzc1MjNiZTFiIiwia2lkIjoiWVEybHJTYVROWk9hU3BRYUtrM0UtN3BqWnBXbkExa045SVdXSTQ5N0hPVSIsInJpZCI6IjQzOGRhODNjLWQzMTYtNDI0Yi1iMzk3LTcxMzZlZGU1NDkzMiJ9.ThZ8YS1HyVPIZJNT9jdwQxlmUcpj4PnBDBsOiq3OzIDU58cbW8V43j_u2i5SVdkH7aedbVJuM-X5C5lbVBKdDw'
});

async function migrate() {
  try {
    await client.execute('ALTER TABLE song_bank ADD COLUMN audio_url TEXT');
    console.log('Columna audio_url agregada exitosamente.');
  } catch (err) {
    if (err.message?.includes('duplicate column name')) {
      console.log('Columna audio_url ya existia.');
    } else {
      console.warn('Nota en migracion:', err.message);
    }
  }
  const check = await client.execute('SELECT * FROM song_bank LIMIT 1');
  console.log('Columnas disponibles:', Object.keys(check.rows[0] || {}));
  const s = await client.execute('SELECT count(*) as count FROM services');
  console.log('Servicios intactos:', s.rows[0].count);
  const m = await client.execute('SELECT count(*) as count FROM musicians');
  console.log('Musicos intactos:', m.rows[0].count);
}

migrate().catch(console.error);
