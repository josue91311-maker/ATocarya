import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, initDb } from './db.js';

const INITIAL_SEEDS = [
  { id: 'm1', fullName: 'David Morales', age: 28, pin: '1111', primaryInstrument: 'Voz Principal', phone: '+51 987654321' },
  { id: 'm2', fullName: 'Mateo Fernández', age: 24, pin: '2222', primaryInstrument: 'Batería', phone: '+51 987654322' },
  { id: 'm3', fullName: 'Saraí Benítez', age: 22, pin: '3333', primaryInstrument: 'Piano / Teclado', phone: '+51 987654323' },
  { id: 'm4', fullName: 'Caleb Rodríguez', age: 26, pin: '4444', primaryInstrument: 'Bajo Eléctrico', phone: '+51 987654324' },
  { id: 'm5', fullName: 'Lucas Salazar', age: 27, pin: '5555', primaryInstrument: 'Guitarra Eléctrica', phone: '+51 987654325' },
  { id: 'm6', fullName: 'Noemí Paredes', age: 21, pin: '6666', primaryInstrument: 'Coros / Voz', phone: '+51 987654326' },
  { id: 'm7', fullName: 'Josué Herrera', age: 30, pin: '7771', primaryInstrument: 'Sonido & Audio', phone: '+51 987654327' },
  { id: 'm8', fullName: 'Priscila Vega', age: 23, pin: '8888', primaryInstrument: 'Guitarra Acústica', phone: '+51 987654328' },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar headers CORS para llamadas API seguras
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDb();
    const db = getDb();

    // GET /api/musicians - Listar todos los músicos
    if (req.method === 'GET') {
      const result = await db.execute('SELECT * FROM musicians ORDER BY full_name ASC');

      const list = result.rows.map(r => ({
        id: String(r.id),
        fullName: String(r.full_name),
        age: Number(r.age),
        pin: String(r.pin),
        primaryInstrument: String(r.primary_instrument),
        phone: r.phone ? String(r.phone) : undefined,
        createdAt: String(r.created_at),
      }));

      return res.status(200).json(list);
    }

    // POST /api/musicians - Registrar nuevo músico
    if (req.method === 'POST') {
      const { id, fullName, age, pin, primaryInstrument, phone } = req.body;

      if (!fullName || !pin || !primaryInstrument) {
        return res.status(400).json({ error: 'Faltan datos obligatorios del músico' });
      }

      const musicianId = id || `m_${Date.now()}`;
      const createdAt = new Date().toISOString();

      await db.execute({
        sql: `INSERT INTO musicians (id, full_name, age, pin, primary_instrument, phone, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [musicianId, fullName.trim(), Number(age) || 20, String(pin).trim(), primaryInstrument, phone?.trim() || null, createdAt],
      });

      return res.status(201).json({
        id: musicianId,
        fullName: fullName.trim(),
        age: Number(age) || 20,
        pin: String(pin).trim(),
        primaryInstrument,
        phone: phone?.trim() || undefined,
        createdAt,
      });
    }

    // PUT /api/musicians - Actualizar datos de un músico
    if (req.method === 'PUT') {
      const { id, fullName, age, pin, primaryInstrument, phone } = req.body;

      if (!id || !fullName || !pin) {
        return res.status(400).json({ error: 'ID, nombre y PIN son requeridos' });
      }

      await db.execute({
        sql: `UPDATE musicians 
              SET full_name = ?, age = ?, pin = ?, primary_instrument = ?, phone = ?
              WHERE id = ?`,
        args: [fullName.trim(), Number(age), String(pin).trim(), primaryInstrument, phone?.trim() || null, id],
      });

      // Actualizar el nombre en los servicios donde esté asignado
      const servicesResult = await db.execute('SELECT id, slots FROM services');
      for (const row of servicesResult.rows) {
        try {
          const slots = JSON.parse(String(row.slots));
          let changed = false;
          Object.keys(slots).forEach(k => {
            if (slots[k].musicianId === id) {
              slots[k].musicianName = fullName.trim();
              changed = true;
            }
          });
          if (changed) {
            await db.execute({
              sql: 'UPDATE services SET slots = ? WHERE id = ?',
              args: [JSON.stringify(slots), String(row.id)],
            });
          }
        } catch (err) {
          console.error('Error updating service slots for musician:', err);
        }
      }

      return res.status(200).json({ success: true });
    }

    // DELETE /api/musicians - Eliminar músico y liberar sus puestos
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'ID de músico requerido' });
      }

      await db.execute({
        sql: 'DELETE FROM musicians WHERE id = ?',
        args: [id],
      });

      // Limpiar asignaciones en servicios
      const servicesResult = await db.execute('SELECT id, slots FROM services');
      for (const row of servicesResult.rows) {
        try {
          const slots = JSON.parse(String(row.slots));
          let changed = false;
          Object.keys(slots).forEach(k => {
            if (slots[k].musicianId === id) {
              slots[k].musicianId = null;
              slots[k].musicianName = undefined;
              slots[k].assignedAt = undefined;
              changed = true;
            }
          });
          if (changed) {
            await db.execute({
              sql: 'UPDATE services SET slots = ? WHERE id = ?',
              args: [JSON.stringify(slots), String(row.id)],
            });
          }
        } catch (err) {
          console.error('Error clearing musician slots in service:', err);
        }
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error: any) {
    console.error('API Musicians Error:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}
