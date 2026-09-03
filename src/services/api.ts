import { Musician, ServiceDate, SlotKey, SlotConfig } from '../types';
import {
  tursoGetMusicians,
  tursoCreateMusician,
  tursoUpdateMusician,
  tursoDeleteMusician,
  tursoGetServices,
  tursoSaveService,
  tursoDeleteService,
  tursoUpdateSlots,
} from './tursoDirect';

const API_BASE = '/api';

// --- Músicos ---

export const apiGetMusicians = async (): Promise<Musician[] | null> => {
  // 1. Intentar conexión directa a Turso SQLite
  const directData = await tursoGetMusicians();
  if (directData && directData.length > 0) {
    return directData;
  }

  // 2. Fallback a endpoint serverless /api
  try {
    const res = await fetch(`${API_BASE}/musicians`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Ignorar si no hay serverless activo
  }

  return null;
};

export const apiCreateMusician = async (musician: Partial<Musician>): Promise<Musician | null> => {
  const fullMusician: Musician = {
    id: musician.id || `m_${Date.now()}`,
    fullName: musician.fullName?.trim() || '',
    age: musician.age || 20,
    pin: musician.pin || '1234',
    primaryInstrument: musician.primaryInstrument || 'Voz Director',
    phone: musician.phone?.trim(),
    createdAt: musician.createdAt || new Date().toISOString(),
  };

  // Guardar en Turso SQLite
  await tursoCreateMusician(fullMusician);

  // También notificar al endpoint /api si existe
  try {
    fetch(`${API_BASE}/musicians`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullMusician),
    }).catch(() => {});
  } catch {}

  return fullMusician;
};

export const apiUpdateMusician = async (musician: Musician): Promise<boolean> => {
  // Actualizar en Turso SQLite
  await tursoUpdateMusician(musician);

  try {
    fetch(`${API_BASE}/musicians`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(musician),
    }).catch(() => {});
  } catch {}

  return true;
};

export const apiDeleteMusician = async (id: string): Promise<boolean> => {
  // Eliminar en Turso SQLite
  await tursoDeleteMusician(id);

  try {
    fetch(`${API_BASE}/musicians?id=${id}`, {
      method: 'DELETE',
    }).catch(() => {});
  } catch {}

  return true;
};

// --- Servicios / Cultos ---

export const apiGetServices = async (): Promise<ServiceDate[] | null> => {
  // 1. Intentar conexión directa a Turso SQLite
  const directServices = await tursoGetServices();
  if (directServices && directServices.length > 0) {
    return directServices;
  }

  // 2. Fallback a endpoint serverless /api
  try {
    const res = await fetch(`${API_BASE}/services`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Ignorar si no hay serverless activo
  }

  return null;
};

export const apiCreateService = async (serviceData: {
  date: string;
  time: string;
  title: string;
  rehearsalTime?: string;
  notes?: string;
  enabledSlots?: Record<SlotKey, boolean>;
  registrationDeadline?: string;
}): Promise<ServiceDate | null> => {
  const serviceId = `service_${serviceData.date}_${Date.now()}`;
  const newService: ServiceDate = {
    id: serviceId,
    date: serviceData.date,
    time: serviceData.time || '09:30',
    title: serviceData.title || 'Servicio de Alabanza',
    rehearsalTime: serviceData.rehearsalTime,
    notes: serviceData.notes,
    isOpen: true,
    registrationDeadline: serviceData.registrationDeadline,
    slots: {} as any,
    createdAt: new Date().toISOString(),
  };

  await tursoSaveService(newService);

  try {
    fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...serviceData }),
    }).catch(() => {});
  } catch {}

  return newService;
};

export const apiUpdateServiceConfig = async (
  serviceId: string,
  updates: {
    date?: string;
    time?: string;
    title?: string;
    rehearsalTime?: string;
    notes?: string;
    enabledSlots?: Record<SlotKey, boolean>;
    registrationDeadline?: string;
  }
): Promise<boolean> => {
  // Si tenemos los servicios, guardamos la actualización en Turso
  try {
    fetch(`${API_BASE}/services`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: serviceId, ...updates }),
    }).catch(() => {});
  } catch {}

  return true;
};

export const apiDeleteService = async (serviceId: string): Promise<boolean> => {
  await tursoDeleteService(serviceId);

  try {
    fetch(`${API_BASE}/services?id=${serviceId}`, {
      method: 'DELETE',
    }).catch(() => {});
  } catch {}

  return true;
};

export const apiSaveWholeService = async (service: ServiceDate): Promise<boolean> => {
  await tursoSaveService(service);
  return true;
};

export const apiClaimSlot = async (
  serviceId: string,
  slotKey: SlotKey,
  musicianId: string,
  musicianName: string,
  allSlots?: Record<SlotKey, SlotConfig>
): Promise<{ success: boolean; slots?: Record<SlotKey, SlotConfig>; error?: string }> => {
  if (allSlots) {
    await tursoUpdateSlots(serviceId, allSlots);
  }

  try {
    fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'claim',
        serviceId,
        slotKey,
        musicianId,
        musicianName,
      }),
    }).catch(() => {});
  } catch {}

  return { success: true };
};

export const apiReleaseSlot = async (
  serviceId: string,
  slotKey: SlotKey,
  allSlots?: Record<SlotKey, SlotConfig>
): Promise<{ success: boolean; slots?: Record<SlotKey, SlotConfig> }> => {
  if (allSlots) {
    await tursoUpdateSlots(serviceId, allSlots);
  }

  try {
    fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'release',
        serviceId,
        slotKey,
      }),
    }).catch(() => {});
  } catch {}

  return { success: true };
};

export const apiAdminAssignSlot = async (
  serviceId: string,
  slotKey: SlotKey,
  targetMusicianId: string,
  allSlots?: Record<SlotKey, SlotConfig>
): Promise<boolean> => {
  if (allSlots) {
    await tursoUpdateSlots(serviceId, allSlots);
  }

  try {
    fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'admin-assign',
        serviceId,
        slotKey,
        targetMusicianId,
      }),
    }).catch(() => {});
  } catch {}

  return true;
};

export const apiAdminClearSlot = async (
  serviceId: string,
  slotKey: SlotKey,
  allSlots?: Record<SlotKey, SlotConfig>
): Promise<boolean> => {
  if (allSlots) {
    await tursoUpdateSlots(serviceId, allSlots);
  }

  try {
    fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'admin-clear',
        serviceId,
        slotKey,
      }),
    }).catch(() => {});
  } catch {}

  return true;
};

export const apiToggleServiceOpen = async (serviceId: string): Promise<boolean> => {
  try {
    fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'toggle-open',
        serviceId,
      }),
    }).catch(() => {});
  } catch {}

  return true;
};
