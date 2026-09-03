import 'dotenv/config';
import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL || 'libsql://atocarya-db-jothejmaster.aws-us-west-2.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken });

const INITIAL_MUSICIANS = [
  { id: 'm1', fullName: 'David Morales', age: 28, pin: '1111', primaryInstrument: 'Voz Principal', phone: '+51 987654321' },
  { id: 'm2', fullName: 'Mateo Fernández', age: 24, pin: '2222', primaryInstrument: 'Batería', phone: '+51 987654322' },
  { id: 'm3', fullName: 'Saraí Benítez', age: 22, pin: '3333', primaryInstrument: 'Piano / Teclado', phone: '+51 987654323' },
  { id: 'm4', fullName: 'Caleb Rodríguez', age: 26, pin: '4444', primaryInstrument: 'Bajo Eléctrico', phone: '+51 987654324' },
  { id: 'm5', fullName: 'Lucas Salazar', age: 27, pin: '5555', primaryInstrument: 'Guitarra Eléctrica', phone: '+51 987654325' },
  { id: 'm6', fullName: 'Noemí Paredes', age: 21, pin: '6666', primaryInstrument: 'Coros / Voz', phone: '+51 987654326' },
  { id: 'm7', fullName: 'Josué Herrera', age: 30, pin: '7771', primaryInstrument: 'Sonido & Audio', phone: '+51 987654327' },
  { id: 'm8', fullName: 'Priscila Vega', age: 23, pin: '8888', primaryInstrument: 'Guitarra Acústica', phone: '+51 987654328' },
];

const createEmptySlots = () => ({
  voz_director: { key: 'voz_director', label: 'Voz Director', category: 'Voces', musicianId: null },
  voz_coro_1: { key: 'voz_coro_1', label: 'Voz Coro 1', category: 'Voces', musicianId: null },
  voz_coro_2: { key: 'voz_coro_2', label: 'Voz Coro 2', category: 'Voces', musicianId: null },
  voz_coro_3: { key: 'voz_coro_3', label: 'Voz Coro 3', category: 'Voces', musicianId: null },
  voz_coro_4: { key: 'voz_coro_4', label: 'Voz Coro 4', category: 'Voces', musicianId: null },
  piano_1: { key: 'piano_1', label: 'Piano 1', category: 'Teclados', musicianId: null },
  piano_2: { key: 'piano_2', label: 'Piano 2', category: 'Teclados', musicianId: null },
  guitarra_1: { key: 'guitarra_1', label: 'Guitarra Eléctrica 1', category: 'Guitarras', musicianId: null },
  guitarra_2: { key: 'guitarra_2', label: 'Guitarra Eléctrica 2', category: 'Guitarras', musicianId: null },
  guitarra_acustica: { key: 'guitarra_acustica', label: 'Guitarra Acústica', category: 'Guitarras', musicianId: null },
  bateria: { key: 'bateria', label: 'Batería', category: 'Ritmo', musicianId: null },
  bajo: { key: 'bajo', label: 'Bajo', category: 'Ritmo', musicianId: null },
  sonido: { key: 'sonido', label: 'Sonido & Audio', category: 'Técnica', musicianId: null },
});

async function seed() {
  try {
    const now = new Date().toISOString();

    // Insertar músicos
    for (const m of INITIAL_MUSICIANS) {
      await db.execute({
        sql: `INSERT OR REPLACE INTO musicians (id, full_name, age, pin, primary_instrument, phone, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [m.id, m.fullName, m.age, m.pin, m.primaryInstrument, m.phone, now],
      });
    }
    console.log(`✓ ${INITIAL_MUSICIANS.length} músicos insertados en Turso SQLite`);

    // Insertar PIN maestro admin
    await db.execute({
      sql: `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
      args: ['admin_pin', '7777'],
    });
    console.log('✓ Configuración admin guardada');

    // Insertar 4 próximos servicios dominicales
    const d = new Date();
    const day = d.getDay();
    const diff = (7 - day) % 7;
    d.setDate(d.getDate() + (diff === 0 ? 0 : diff));

    for (let i = 0; i < 4; i++) {
      const nextDate = new Date(d);
      nextDate.setDate(d.getDate() + i * 7);
      const year = nextDate.getFullYear();
      const month = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dayNum = String(nextDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayNum}`;

      const slots = createEmptySlots();
      if (i === 0) {
        slots.voz_director.musicianId = 'm1';
        slots.voz_director.musicianName = 'David Morales';
        slots.voz_director.assignedAt = now;

        slots.bateria.musicianId = 'm2';
        slots.bateria.musicianName = 'Mateo Fernández';
        slots.bateria.assignedAt = now;

        slots.piano_1.musicianId = 'm3';
        slots.piano_1.musicianName = 'Saraí Benítez';
        slots.piano_1.assignedAt = now;

        slots.bajo.musicianId = 'm4';
        slots.bajo.musicianName = 'Caleb Rodríguez';
        slots.bajo.assignedAt = now;
      }

      const serviceId = `service-${dateStr}`;

      await db.execute({
        sql: `INSERT OR REPLACE INTO services (id, date, time, title, rehearsal_time, notes, is_open, registration_deadline, slots, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          serviceId,
          dateStr,
          '09:30',
          i === 0 ? 'Servicio Dominical - Comunión' : 'Servicio Dominical de Alabanza y Adoración',
          '08:30',
          i === 0 ? 'Repertorio: 1. Grande y Fuerte | 2. Cuan Grande es Dios | 3. En Tu Presencia.' : '',
          1,
          null,
          JSON.stringify(slots),
          now,
        ],
      });
    }

    console.log('✓ 4 Cultos dominicales iniciales insertados en Turso SQLite');
    console.log('¡Sembrado completado con éxito!');
  } catch (err) {
    console.error('Error al sembrar:', err);
  }
}

seed();
