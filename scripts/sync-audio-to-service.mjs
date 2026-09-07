import { createClient } from '@libsql/client/web';

const client = createClient({
  url: 'libsql://atocarya-db-jothejmaster.aws-us-west-2.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg0NjA4MTMsImlkIjoiMDFhMDY4OTEtZjkwMS03MWE0LWI5YzYtZDE2Mzc1MjNiZTFiIiwia2lkIjoiWVEybHJTYVROWk9hU3BRYUtrM0UtN3BqWnBXbkExa045SVdXSTQ5N0hPVSIsInJpZCI6IjQzOGRhODNjLWQzMTYtNDI0Yi1iMzk3LTcxMzZlZGU1NDkzMiJ9.ThZ8YS1HyVPIZJNT9jdwQxlmUcpj4PnBDBsOiq3OzIDU58cbW8V43j_u2i5SVdkH7aedbVJuM-X5C5lbVBKdDw'
});

async function main() {
  const bankRes = await client.execute('SELECT title, audio_url FROM song_bank');
  const bankMap = new Map();
  for (const row of bankRes.rows) {
    if (row.audio_url) bankMap.set(row.title.trim().toLowerCase(), String(row.audio_url));
  }

  const sRes = await client.execute({
    sql: 'SELECT id, songs FROM services WHERE id = ?',
    args: ['service_2026-09-12_1788466647040']
  });

  if (sRes.rows[0]?.songs) {
    const songs = JSON.parse(sRes.rows[0].songs);
    const updated = songs.map(s => {
      const matchAudio = bankMap.get(s.title.trim().toLowerCase());
      return {
        ...s,
        audioUrl: s.audioUrl || matchAudio || undefined
      };
    });

    await client.execute({
      sql: 'UPDATE services SET songs = ? WHERE id = ?',
      args: [JSON.stringify(updated), 'service_2026-09-12_1788466647040']
    });

    console.log('Culto 12-Sep sincronizado con exito con los audios del banco.');
  }
}

main().catch(console.error);
