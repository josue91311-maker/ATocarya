import { createClient, Client } from '@libsql/client/web';
import { Musician, ServiceDate, SlotKey, SlotConfig } from '../types';

const TURSO_URL = (import.meta as any).env?.VITE_TURSO_DATABASE_URL || 'libsql://atocarya-db-jothejmaster.aws-us-west-2.turso.io';
const TURSO_TOKEN = (import.meta as any).env?.VITE_TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg0NjA4MTMsImlkIjoiMDFhMDY4OTEtZjkwMS03MWE0LWI5YzYtZDE2Mzc1MjNiZTFiIiwia2lkIjoiWVEybHJTYVROWk9hU3BRYUtrM0UtN3BqWnBXbkExa045SVdXSTQ5N0hPVSIsInJpZCI6IjQzOGRhODNjLWQzMTYtNDI0Yi1iMzk3LTcxMzZlZGU1NDkzMiJ9.ThZ8YS1HyVPIZJNT9jdwQxlmUcpj4PnBDBsOiq3OzIDU58cbW8V43j_u2i5SVdkH7aedbVJuM-X5C5lbVBKdDw';

let client: Client | null = null;

export const getTursoClient = (): Client => {
  if (!client) {
    client = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN,
    });
  }
  return client;
};

// --- Músicos Directo en Turso SQLite ---

export const tursoGetMusicians = async (): Promise<Musician[] | null> => {
  try {
    const db = getTursoClient();
    const result = await db.execute('SELECT * FROM musicians ORDER BY full_name ASC');
    return result.rows.map(r => ({
      id: String(r.id),
      fullName: String(r.full_name),
      age: Number(r.age),
      pin: String(r.pin),
      primaryInstrument: String(r.primary_instrument) as any,
      phone: r.phone ? String(r.phone) : undefined,
      createdAt: String(r.created_at),
    }));
  } catch (err) {
    console.warn('Error al obtener músicos desde Turso:', err);
    return null;
  }
};

export const tursoCreateMusician = async (musician: Musician): Promise<boolean> => {
  try {
    const db = getTursoClient();
    await db.execute({
      sql: `INSERT OR REPLACE INTO musicians (id, full_name, age, pin, primary_instrument, phone, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        musician.id,
        musician.fullName.trim(),
        musician.age,
        musician.pin,
        musician.primaryInstrument,
        musician.phone?.trim() || null,
        musician.createdAt || new Date().toISOString(),
      ],
    });
    return true;
  } catch (err) {
    console.warn('Error al crear músico en Turso:', err);
    return false;
  }
};

export const tursoUpdateMusician = async (musician: Musician): Promise<boolean> => {
  try {
    const db = getTursoClient();
    await db.execute({
      sql: `UPDATE musicians 
            SET full_name = ?, age = ?, pin = ?, primary_instrument = ?, phone = ?
            WHERE id = ?`,
      args: [
        musician.fullName.trim(),
        musician.age,
        musician.pin,
        musician.primaryInstrument,
        musician.phone?.trim() || null,
        musician.id,
      ],
    });
    return true;
  } catch (err) {
    console.warn('Error al actualizar músico en Turso:', err);
    return false;
  }
};

export const tursoDeleteMusician = async (id: string): Promise<boolean> => {
  try {
    const db = getTursoClient();
    await db.execute({
      sql: 'DELETE FROM musicians WHERE id = ?',
      args: [id],
    });
    return true;
  } catch (err) {
    console.warn('Error al eliminar músico en Turso:', err);
    return false;
  }
};

// --- Servicios Directo en Turso SQLite ---
import { createEmptySlots } from '../data/initialData';

export const normalizeServiceSlots = (rawSlots: any): Record<SlotKey, SlotConfig> => {
  const base = createEmptySlots();
  if (!rawSlots || typeof rawSlots !== 'object') return base;
  for (const key of Object.keys(base) as SlotKey[]) {
    if (rawSlots[key]) {
      base[key] = {
        ...base[key],
        ...rawSlots[key],
        musicianId: rawSlots[key].musicianId || null,
        enabled: rawSlots[key].enabled !== false,
      };
    }
  }
  return base;
};

export const tursoGetServices = async (): Promise<ServiceDate[] | null> => {
  try {
    const db = getTursoClient();
    const result = await db.execute('SELECT * FROM services ORDER BY date ASC');
    return result.rows.map(r => {
      let parsed = {};
      try {
        parsed = JSON.parse(String(r.slots || '{}'));
      } catch (e) {}

      return {
        id: String(r.id),
        date: String(r.date),
        time: String(r.time),
        title: String(r.title),
        rehearsalTime: r.rehearsal_time ? String(r.rehearsal_time) : undefined,
        notes: r.notes ? String(r.notes) : undefined,
        isOpen: Boolean(r.is_open),
        registrationDeadline: r.registration_deadline ? String(r.registration_deadline) : undefined,
        slots: normalizeServiceSlots(parsed),
        createdAt: String(r.created_at),
      };
    });
  } catch (err) {
    console.warn('Error al obtener cultos desde Turso:', err);
    return null;
  }
};

export const tursoSaveService = async (service: ServiceDate): Promise<boolean> => {
  try {
    const db = getTursoClient();

    // Si ya existe un servicio para esta misma fecha y hora, reutilizar su ID para evitar duplicados
    const existing = await db.execute({
      sql: 'SELECT id FROM services WHERE date = ? AND time = ?',
      args: [service.date, service.time],
    });
    const targetId = existing.rows.length > 0 ? String(existing.rows[0].id) : service.id;

    await db.execute({
      sql: `INSERT OR REPLACE INTO services (id, date, time, title, rehearsal_time, notes, is_open, registration_deadline, slots, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        targetId,
        service.date,
        service.time,
        service.title,
        service.rehearsalTime || null,
        service.notes || null,
        service.isOpen ? 1 : 0,
        service.registrationDeadline || null,
        JSON.stringify(service.slots),
        service.createdAt,
      ],
    });
    return true;
  } catch (err) {
    console.warn('Error al guardar servicio en Turso:', err);
    return false;
  }
};

export const tursoDeleteService = async (serviceId: string): Promise<boolean> => {
  try {
    const db = getTursoClient();
    await db.execute({
      sql: 'DELETE FROM services WHERE id = ?',
      args: [serviceId],
    });
    return true;
  } catch (err) {
    console.warn('Error al borrar culto en Turso:', err);
    return false;
  }
};

export const tursoUpdateSlots = async (serviceId: string, slots: Record<SlotKey, SlotConfig>): Promise<boolean> => {
  try {
    const db = getTursoClient();
    await db.execute({
      sql: 'UPDATE services SET slots = ? WHERE id = ?',
      args: [JSON.stringify(slots), serviceId],
    });
    return true;
  } catch (err) {
    console.warn('Error al actualizar cupos en Turso:', err);
    return false;
  }
};
