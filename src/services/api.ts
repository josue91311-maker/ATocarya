import { Musician, ServiceDate, SlotKey, SlotConfig } from '../types';

const API_BASE = '/api';

/**
 * Verifica si el backend serverless de SQLite está disponible
 */
let isApiAvailable: boolean | null = null;

const checkApiHealth = async (): Promise<boolean> => {
  if (isApiAvailable !== null) return isApiAvailable;
  try {
    const res = await fetch(`${API_BASE}/musicians`, { method: 'GET' });
    isApiAvailable = res.ok;
    return isApiAvailable;
  } catch {
    isApiAvailable = false;
    return false;
  }
};

// --- Músicos ---

export const apiGetMusicians = async (): Promise<Musician[] | null> => {
  try {
    const res = await fetch(`${API_BASE}/musicians`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
};

export const apiCreateMusician = async (musician: Partial<Musician>): Promise<Musician | null> => {
  try {
    const res = await fetch(`${API_BASE}/musicians`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(musician),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
};

export const apiUpdateMusician = async (musician: Musician): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/musicians`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(musician),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
};

export const apiDeleteMusician = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/musicians?id=${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    return false;
  }
};

// --- Servicios / Cultos ---

export const apiGetServices = async (): Promise<ServiceDate[] | null> => {
  try {
    const res = await fetch(`${API_BASE}/services`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
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
  try {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...serviceData }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
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
  try {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: serviceId, ...updates }),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
};

export const apiDeleteService = async (serviceId: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/services?id=${serviceId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    return false;
  }
};

export const apiClaimSlot = async (
  serviceId: string,
  slotKey: SlotKey,
  musicianId: string,
  musicianName: string
): Promise<{ success: boolean; slots?: Record<SlotKey, SlotConfig>; error?: string }> => {
  try {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'claim',
        serviceId,
        slotKey,
        musicianId,
        musicianName,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Error al reclamar puesto' };
    }
    return { success: true, slots: data.slots };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const apiReleaseSlot = async (
  serviceId: string,
  slotKey: SlotKey
): Promise<{ success: boolean; slots?: Record<SlotKey, SlotConfig> }> => {
  try {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'release',
        serviceId,
        slotKey,
      }),
    });
    const data = await res.json();
    return { success: res.ok, slots: data.slots };
  } catch (err) {
    return { success: false };
  }
};

export const apiAdminAssignSlot = async (
  serviceId: string,
  slotKey: SlotKey,
  targetMusicianId: string
): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'admin-assign',
        serviceId,
        slotKey,
        targetMusicianId,
      }),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
};

export const apiAdminClearSlot = async (
  serviceId: string,
  slotKey: SlotKey
): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'admin-clear',
        serviceId,
        slotKey,
      }),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
};

export const apiToggleServiceOpen = async (serviceId: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'toggle-open',
        serviceId,
      }),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
};
