import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, initDb } from './db.js';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    // GET /api/services - Obtener todos los servicios
    if (req.method === 'GET') {
      const result = await db.execute('SELECT * FROM services ORDER BY date ASC');

      const list = result.rows.map(r => ({
        id: String(r.id),
        date: String(r.date),
        time: String(r.time),
        title: String(r.title),
        rehearsalTime: r.rehearsal_time ? String(r.rehearsal_time) : undefined,
        notes: r.notes ? String(r.notes) : undefined,
        isOpen: Boolean(r.is_open),
        registrationDeadline: r.registration_deadline ? String(r.registration_deadline) : undefined,
        slots: JSON.parse(String(r.slots)),
        createdAt: String(r.created_at),
      }));

      return res.status(200).json(list);
    }

    // POST /api/services - Acciones operativas
    if (req.method === 'POST') {
      const { action, serviceId, slotKey, musicianId, musicianName } = req.body;

      // 1. Tomar un puesto con 1-clic rápido (Claim Slot)
      if (action === 'claim') {
        const row = await db.execute({
          sql: 'SELECT * FROM services WHERE id = ?',
          args: [serviceId],
        });

        if (row.rows.length === 0) {
          return res.status(404).json({ error: 'Servicio no encontrado' });
        }

        const serviceRow = row.rows[0];
        const isOpen = Boolean(serviceRow.is_open);
        const slots = JSON.parse(String(serviceRow.slots));

        if (!isOpen) {
          return res.status(400).json({ error: 'Las inscripciones para esta fecha están cerradas' });
        }

        const target = slots[slotKey];
        if (!target || target.enabled === false) {
          return res.status(400).json({ error: 'Instrumento no disponible en este culto' });
        }
        if (target.musicianId && target.musicianId !== musicianId) {
          return res.status(400).json({ error: `El puesto ya fue ocupado por ${target.musicianName}` });
        }

        // Regla: Solo 1 puesto por músico por fecha
        const existingKey = Object.keys(slots).find(k => slots[k].musicianId === musicianId);
        if (existingKey && existingKey !== slotKey) {
          return res.status(400).json({ error: `Ya estás anotado en ${slots[existingKey].label} para esta fecha.` });
        }

        slots[slotKey] = {
          ...target,
          musicianId,
          musicianName,
          assignedAt: new Date().toISOString(),
        };

        await db.execute({
          sql: 'UPDATE services SET slots = ? WHERE id = ?',
          args: [JSON.stringify(slots), serviceId],
        });

        return res.status(200).json({ success: true, slots });
      }

      // 2. Liberar puesto (Release Slot)
      if (action === 'release') {
        const row = await db.execute({
          sql: 'SELECT * FROM services WHERE id = ?',
          args: [serviceId],
        });

        if (row.rows.length === 0) {
          return res.status(404).json({ error: 'Servicio no encontrado' });
        }

        const serviceRow = row.rows[0];
        const slots = JSON.parse(String(serviceRow.slots));

        if (slots[slotKey]) {
          slots[slotKey] = {
            ...slots[slotKey],
            musicianId: null,
            musicianName: undefined,
            assignedAt: undefined,
          };

          await db.execute({
            sql: 'UPDATE services SET slots = ? WHERE id = ?',
            args: [JSON.stringify(slots), serviceId],
          });
        }

        return res.status(200).json({ success: true, slots });
      }

      // 3. Crear nuevo servicio desde admin
      if (action === 'create') {
        const { date, time, title, rehearsalTime, notes, enabledSlots, registrationDeadline } = req.body;

        if (!date) {
          return res.status(400).json({ error: 'Fecha requerida' });
        }

        const initialSlots = createEmptySlots() as any;
        if (enabledSlots) {
          Object.keys(enabledSlots).forEach(k => {
            if (initialSlots[k]) {
              initialSlots[k].enabled = enabledSlots[k];
            }
          });
        }

        const newId = `service_${date}_${Date.now()}`;
        const createdAt = new Date().toISOString();

        await db.execute({
          sql: `INSERT INTO services (id, date, time, title, rehearsal_time, notes, is_open, registration_deadline, slots, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            newId,
            date,
            time || '09:30',
            title?.trim() || 'Servicio de Alabanza',
            rehearsalTime || '08:30',
            notes?.trim() || null,
            1,
            registrationDeadline?.trim() || null,
            JSON.stringify(initialSlots),
            createdAt,
          ],
        });

        return res.status(201).json({
          id: newId,
          date,
          time: time || '09:30',
          title: title?.trim() || 'Servicio de Alabanza',
          rehearsalTime: rehearsalTime || '08:30',
          notes: notes?.trim() || undefined,
          isOpen: true,
          registrationDeadline: registrationDeadline?.trim() || undefined,
          slots: initialSlots,
          createdAt,
        });
      }

      // 4. Asignación manual de admin
      if (action === 'admin-assign') {
        const { targetMusicianId } = req.body;
        const mRow = await db.execute({
          sql: 'SELECT full_name FROM musicians WHERE id = ?',
          args: [targetMusicianId],
        });
        const mName = mRow.rows[0]?.full_name ? String(mRow.rows[0].full_name) : 'Músico';

        const sRow = await db.execute({
          sql: 'SELECT slots FROM services WHERE id = ?',
          args: [serviceId],
        });
        if (sRow.rows.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });

        const slots = JSON.parse(String(sRow.rows[0].slots));
        if (slots[slotKey]) {
          slots[slotKey] = {
            ...slots[slotKey],
            musicianId: targetMusicianId,
            musicianName: mName,
            assignedAt: new Date().toISOString(),
          };
          await db.execute({
            sql: 'UPDATE services SET slots = ? WHERE id = ?',
            args: [JSON.stringify(slots), serviceId],
          });
        }
        return res.status(200).json({ success: true, slots });
      }

      // 5. Limpieza de slot por admin
      if (action === 'admin-clear') {
        const sRow = await db.execute({
          sql: 'SELECT slots FROM services WHERE id = ?',
          args: [serviceId],
        });
        if (sRow.rows.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });

        const slots = JSON.parse(String(sRow.rows[0].slots));
        if (slots[slotKey]) {
          slots[slotKey] = {
            ...slots[slotKey],
            musicianId: null,
            musicianName: undefined,
            assignedAt: undefined,
          };
          await db.execute({
            sql: 'UPDATE services SET slots = ? WHERE id = ?',
            args: [JSON.stringify(slots), serviceId],
          });
        }
        return res.status(200).json({ success: true, slots });
      }

      // 6. Toggle Open/Close
      if (action === 'toggle-open') {
        const sRow = await db.execute({
          sql: 'SELECT is_open FROM services WHERE id = ?',
          args: [serviceId],
        });
        if (sRow.rows.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });

        const current = Boolean(sRow.rows[0].is_open);
        const next = current ? 0 : 1;

        await db.execute({
          sql: 'UPDATE services SET is_open = ? WHERE id = ?',
          args: [next, serviceId],
        });

        return res.status(200).json({ success: true, isOpen: Boolean(next) });
      }

      return res.status(400).json({ error: 'Acción no reconocida' });
    }

    // PUT /api/services - Actualizar configuración de servicio
    if (req.method === 'PUT') {
      const { id, date, time, title, rehearsalTime, notes, enabledSlots, registrationDeadline } = req.body;

      if (!id) return res.status(400).json({ error: 'ID de servicio requerido' });

      const sRow = await db.execute({
        sql: 'SELECT * FROM services WHERE id = ?',
        args: [id],
      });
      if (sRow.rows.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });

      const currentSlots = JSON.parse(String(sRow.rows[0].slots));
      if (enabledSlots) {
        Object.keys(enabledSlots).forEach(k => {
          if (currentSlots[k]) {
            const isEnabled = enabledSlots[k];
            currentSlots[k] = {
              ...currentSlots[k],
              enabled: isEnabled,
              musicianId: isEnabled ? currentSlots[k].musicianId : null,
              musicianName: isEnabled ? currentSlots[k].musicianName : undefined,
              assignedAt: isEnabled ? currentSlots[k].assignedAt : undefined,
            };
          }
        });
      }

      await db.execute({
        sql: `UPDATE services 
              SET date = ?, time = ?, title = ?, rehearsal_time = ?, notes = ?, registration_deadline = ?, slots = ?
              WHERE id = ?`,
        args: [
          date || String(sRow.rows[0].date),
          time || String(sRow.rows[0].time),
          title || String(sRow.rows[0].title),
          rehearsalTime !== undefined ? rehearsalTime : String(sRow.rows[0].rehearsal_time),
          notes !== undefined ? notes : String(sRow.rows[0].notes),
          registrationDeadline !== undefined ? registrationDeadline : String(sRow.rows[0].registration_deadline),
          JSON.stringify(currentSlots),
          id,
        ],
      });

      return res.status(200).json({ success: true });
    }

    // DELETE /api/services - Eliminar servicio por completo de SQLite
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'ID de servicio requerido' });
      }

      await db.execute({
        sql: 'DELETE FROM services WHERE id = ?',
        args: [id],
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error: any) {
    console.error('API Services Error:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}
