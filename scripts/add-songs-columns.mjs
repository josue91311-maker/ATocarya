import { createClient } from '@libsql/client/web';

const client = createClient({
  url: 'libsql://atocarya-db-jothejmaster.aws-us-west-2.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg0NjA4MTMsImlkIjoiMDFhMDY4OTEtZjkwMS03MWE0LWI5YzYtZDE2Mzc1MjNiZTFiIiwia2lkIjoiWVEybHJTYVROWk9hU3BRYUtrM0UtN3BqWnBXbkExa045SVdXSTQ5N0hPVSIsInJpZCI6IjQzOGRhODNjLWQzMTYtNDI0Yi1iMzk3LTcxMzZlZGU1NDkzMiJ9.ThZ8YS1HyVPIZJNT9jdwQxlmUcpj4PnBDBsOiq3OzIDU58cbW8V43j_u2i5SVdkH7aedbVJuM-X5C5lbVBKdDw'
});

async function main() {
  const columnsInfo = await client.execute('PRAGMA table_info(services)');
  const existingCols = columnsInfo.rows.map(r => String(r.name));
  console.log('Current columns in services:', existingCols);

  if (!existingCols.includes('songs')) {
    await client.execute('ALTER TABLE services ADD COLUMN songs TEXT');
    console.log('Added column: songs');
  } else {
    console.log('Column songs already exists.');
  }

  if (!existingCols.includes('is_songs_published')) {
    await client.execute('ALTER TABLE services ADD COLUMN is_songs_published INTEGER DEFAULT 0');
    console.log('Added column: is_songs_published');
  } else {
    console.log('Column is_songs_published already exists.');
  }

  const checkS = await client.execute('SELECT count(*) as count FROM services');
  console.log('Services count preserved intact:', checkS.rows[0].count);
  const checkM = await client.execute('SELECT count(*) as count FROM musicians');
  console.log('Musicians count preserved intact:', checkM.rows[0].count);
}

main().catch(console.error);
