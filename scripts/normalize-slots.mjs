import { createClient } from '@libsql/client/web';

const client = createClient({
  url: 'libsql://atocarya-db-jothejmaster.aws-us-west-2.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg0NjA4MTMsImlkIjoiMDFhMDY4OTEtZjkwMS03MWE0LWI5YzYtZDE2Mzc1MjNiZTFiIiwia2lkIjoiWVEybHJTYVROWk9hU3BRYUtrM0UtN3BqWnBXbkExa045SVdXSTQ5N0hPVSIsInJpZCI6IjQzOGRhODNjLWQzMTYtNDI0Yi1iMzk3LTcxMzZlZGU1NDkzMiJ9.ThZ8YS1HyVPIZJNT9jdwQxlmUcpj4PnBDBsOiq3OzIDU58cbW8V43j_u2i5SVdkH7aedbVJuM-X5C5lbVBKdDw'
});

const DEFAULT_SLOTS = {
  piano_1: { key: 'piano_1', label: 'Piano 1', category: 'Teclados', icon: 'Piano', musicianId: null, enabled: true },
  piano_2: { key: 'piano_2', label: 'Piano 2', category: 'Teclados', icon: 'Piano', musicianId: null, enabled: true },
  guitarra_1: { key: 'guitarra_1', label: 'Guitarra 1 (Eléctrica)', category: 'Guitarras', icon: 'Guitar', musicianId: null, enabled: true },
  guitarra_2: { key: 'guitarra_2', label: 'Guitarra 2 (Eléctrica)', category: 'Guitarras', icon: 'Guitar', musicianId: null, enabled: true },
  guitarra_acustica: { key: 'guitarra_acustica', label: 'Guitarra Acústica', category: 'Guitarras', icon: 'Guitar', musicianId: null, enabled: true },
  voz_director: { key: 'voz_director', label: 'Voz Director', category: 'Voces', icon: 'Mic2', musicianId: null, enabled: true },
  voz_coro_1: { key: 'voz_coro_1', label: 'Voz Coro 1', category: 'Voces', icon: 'Mic', musicianId: null, enabled: true },
  voz_coro_2: { key: 'voz_coro_2', label: 'Voz Coro 2', category: 'Voces', icon: 'Mic', musicianId: null, enabled: true },
  voz_coro_3: { key: 'voz_coro_3', label: 'Voz Coro 3', category: 'Voces', icon: 'Mic', musicianId: null, enabled: true },
  voz_coro_4: { key: 'voz_coro_4', label: 'Voz Coro 4', category: 'Voces', icon: 'Mic', musicianId: null, enabled: true },
  bateria: { key: 'bateria', label: 'Batería', category: 'Ritmo', icon: 'Drum', musicianId: null, enabled: true },
  bajo: { key: 'bajo', label: 'Bajo', category: 'Ritmo', icon: 'Radio', musicianId: null, enabled: true },
  sonido: { key: 'sonido', label: 'Sonido & Streaming', category: 'Técnica', icon: 'Sliders', musicianId: null, enabled: true },
};

async function main() {
  const servicesRes = await client.execute('SELECT id, title, date, slots FROM services');
  console.log(`Found ${servicesRes.rows.length} services to normalize in Turso.`);
  for (const s of servicesRes.rows) {
    let raw = {};
    try {
      raw = JSON.parse(s.slots || '{}');
    } catch (e) {}

    const merged = {};
    for (const [k, def] of Object.entries(DEFAULT_SLOTS)) {
      merged[k] = {
        ...def,
        ...(raw[k] || {}),
        musicianId: (raw[k] && raw[k].musicianId) ? raw[k].musicianId : null,
        enabled: (raw[k] && raw[k].enabled !== false),
      };
    }

    await client.execute({
      sql: 'UPDATE services SET slots = ? WHERE id = ?',
      args: [JSON.stringify(merged), s.id]
    });
    console.log(`Normalized slots for service: ${s.title} (${s.date})`);
  }
  console.log('SUCCESS: All services in Turso have the complete 13 slots populated and ready!');
}

main().catch(console.error);
