import { createClient } from '@libsql/client/web';

const client = createClient({
  url: 'libsql://atocarya-db-jothejmaster.aws-us-west-2.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg0NjA4MTMsImlkIjoiMDFhMDY4OTEtZjkwMS03MWE0LWI5YzYtZDE2Mzc1MjNiZTFiIiwia2lkIjoiWVEybHJTYVROWk9hU3BRYUtrM0UtN3BqWnBXbkExa045SVdXSTQ5N0hPVSIsInJpZCI6IjQzOGRhODNjLWQzMTYtNDI0Yi1iMzk3LTcxMzZlZGU1NDkzMiJ9.ThZ8YS1HyVPIZJNT9jdwQxlmUcpj4PnBDBsOiq3OzIDU58cbW8V43j_u2i5SVdkH7aedbVJuM-X5C5lbVBKdDw',
});

async function run() {
  // Eliminar los "Servicio Dominical de Alabanza" que se generaron automáticamente
  await client.execute("DELETE FROM services WHERE title LIKE '%Servicio Dominical%'");
  
  // Limpiar duplicados de cualquier otro servicio conservando solo 1 por (date, time)
  const allServices = await client.execute("SELECT id, date, time, title, created_at FROM services ORDER BY created_at ASC");
  console.log('Servicios antes de deduplicar:', allServices.rows);

  const seen = new Set();
  for (const s of allServices.rows) {
    const key = `${s.date}_${s.time}`;
    if (seen.has(key)) {
      console.log('Eliminando duplicado:', s.id, s.title, s.date, s.time);
      await client.execute({
        sql: 'DELETE FROM services WHERE id = ?',
        args: [s.id],
      });
    } else {
      seen.add(key);
    }
  }

  const finalServices = await client.execute("SELECT id, date, time, title FROM services");
  console.log('Servicios finales en Turso:', finalServices.rows);
}

run().catch(console.error);
