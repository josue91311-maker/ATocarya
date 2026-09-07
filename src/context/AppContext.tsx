import React, { createContext, useContext, useState, useEffect } from 'react';
import { Musician, ServiceDate, CurrentUser, SlotKey, SlotConfig, PrimaryInstrument, SongItem } from '../types';
import { INITIAL_MUSICIANS, generateInitialServices, createEmptySlots } from '../data/initialData';
import { isServiceExpired } from '../utils/dateUtils';
import { 
  apiGetMusicians, 
  apiGetServices, 
  apiCreateMusician, 
  apiUpdateMusician, 
  apiDeleteMusician, 
  apiCreateService, 
  apiUpdateServiceConfig, 
  apiDeleteService, 
  apiClaimSlot, 
  apiReleaseSlot, 
  apiAdminAssignSlot, 
  apiAdminClearSlot, 
  apiToggleServiceOpen,
  apiSaveWholeService,
  apiUpdateServiceSongs
} from '../services/api';

interface AppContextType {
  musicians: Musician[];
  services: ServiceDate[];
  adminPin: string;
  // Separate auth sessions for Musician and Admin links
  musicianUser: Musician | null;
  isAdminAuthenticated: boolean;
  
  // Musician Auth
  loginMusician: (identifier: string, pin: string) => { success: boolean; message?: string };
  logoutMusician: () => void;

  // Admin Auth
  loginAdmin: (pin: string) => { success: boolean; message?: string };
  logoutAdmin: () => void;

  // Musician slot actions
  claimSlot: (serviceId: string, slotKey: SlotKey) => { success: boolean; message?: string };
  releaseSlot: (serviceId: string, slotKey: SlotKey) => { success: boolean; message?: string };

  // Admin musician management
  registerMusician: (fullName: string, age: number, pin: string, primaryInstrument: PrimaryInstrument, phone?: string) => { success: boolean; message?: string; musician?: Musician };
  updateMusician: (musicianId: string, data: { fullName: string; age: number; pin: string; primaryInstrument: PrimaryInstrument; phone?: string }) => { success: boolean; message?: string };
  deleteMusician: (musicianId: string) => void;
  updateMusicianPin: (musicianId: string, newPin: string) => void;

  // Admin service actions
  createService: (date: string, time: string, title: string, rehearsalTime?: string, notes?: string, enabledSlots?: Record<SlotKey, boolean>, registrationDeadline?: string) => { success: boolean; message?: string };
  generateSundays: (count?: number) => void;
  duplicateService: (sourceServiceId: string, newDate: string, newRegistrationDeadline?: string, copyMusicians?: boolean) => { success: boolean; message?: string };
  generateRecurringServices: (options: { weekday: number; count: number; time: string; rehearsalTime?: string; title?: string; startDate?: string }) => { success: boolean; count: number; message?: string };
  deleteService: (serviceId: string) => void;
  toggleServiceOpen: (serviceId: string) => void;
  updateServiceDetails: (serviceId: string, updates: Partial<Omit<ServiceDate, 'id' | 'slots'>>) => void;
  updateServiceConfig: (serviceId: string, updates: { date?: string; time?: string; title?: string; rehearsalTime?: string; notes?: string; enabledSlots?: Record<SlotKey, boolean>; registrationDeadline?: string }) => { success: boolean; message?: string };
  adminAssignSlot: (serviceId: string, slotKey: SlotKey, musicianId: string) => void;
  adminClearSlot: (serviceId: string, slotKey: SlotKey) => void;

  // Repertorio de Canciones (Admin y Voz Director asignado)
  updateServiceSongs: (serviceId: string, songs: SongItem[], isPublished: boolean) => Promise<{ success: boolean; message?: string }>;
  
  // Database backup
  resetAllData: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => { success: boolean; message?: string };
}

const STORAGE_KEYS = {
  MUSICIANS: 'atocarya_musicians_v3',
  SERVICES: 'atocarya_services_v3',
  MUSICIAN_USER: 'atocarya_musician_user_v3',
  ADMIN_AUTH: 'atocarya_admin_auth_v3',
  ADMIN_PIN: 'atocarya_admin_pin_v3',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [musicians, setMusicians] = useState<Musician[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MUSICIANS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [services, setServices] = useState<ServiceDate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [musicianUser, setMusicianUser] = useState<Musician | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MUSICIAN_USER);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return null;
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  });

  const [adminPin, setAdminPin] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || '7777';
  });

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MUSICIANS, JSON.stringify(musicians));
  }, [musicians]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    if (musicianUser) {
      localStorage.setItem(STORAGE_KEYS.MUSICIAN_USER, JSON.stringify(musicianUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.MUSICIAN_USER);
    }
  }, [musicianUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, isAdminAuthenticated ? 'true' : 'false');
  }, [isAdminAuthenticated]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, adminPin);
  }, [adminPin]);

  // Sync state con backend SQLite (Turso) al iniciar la aplicación
  useEffect(() => {
    const fetchRemoteData = async () => {
      try {
        const [remoteMusicians, remoteServices] = await Promise.all([
          apiGetMusicians(),
          apiGetServices(),
        ]);
        if (remoteMusicians !== null) {
          setMusicians(remoteMusicians);
        }
        if (remoteServices !== null) {
          setServices(remoteServices);
        }
      } catch (err) {
        console.warn('Operando con persistencia local:', err);
      }
    };
    fetchRemoteData();
  }, []);

  // Musician Auth
  const loginMusician = (identifier: string, pin: string) => {
    const trimmed = identifier.trim().toLowerCase();
    const musician = musicians.find(
      m => (m.id === identifier || m.fullName.toLowerCase() === trimmed) && m.pin === pin
    );

    if (!musician) {
      return { success: false, message: 'Nombre o PIN incorrecto. Verifica los 4 dígitos.' };
    }

    setMusicianUser(musician);
    return { success: true };
  };

  const logoutMusician = () => {
    setMusicianUser(null);
  };

  // Admin Auth
  const loginAdmin = (pin: string) => {
    if (pin.trim() === adminPin || pin.trim() === '7777') {
      setIsAdminAuthenticated(true);
      return { success: true };
    }
    return { success: false, message: 'PIN de Administrador incorrecto.' };
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
  };

  // Musician Slot Actions
  const claimSlot = (serviceId: string, slotKey: SlotKey) => {
    if (!musicianUser) {
      return { success: false, message: 'Debes iniciar sesión con tu PIN de músico.' };
    }

    const service = services.find(s => s.id === serviceId);
    if (!service) {
      return { success: false, message: 'Servicio no encontrado.' };
    }
    if (!service.isOpen || isServiceExpired(service)) {
      return { success: false, message: 'Las inscripciones para esta fecha han expirado o están cerradas.' };
    }

    const targetSlot = service.slots[slotKey];
    if (targetSlot.enabled === false) {
      return { success: false, message: 'Este instrumento no está programado para este servicio.' };
    }
    if (targetSlot.musicianId && targetSlot.musicianId !== musicianUser.id) {
      return { success: false, message: `Este puesto ya fue tomado por ${targetSlot.musicianName}.` };
    }

    // Regla: Solo 1 puesto por músico por fecha de servicio
    const currentHoldingSlotKey = (Object.keys(service.slots) as SlotKey[]).find(
      k => service.slots[k].musicianId === musicianUser.id
    );

    if (currentHoldingSlotKey && currentHoldingSlotKey !== slotKey) {
      return {
        success: false,
        message: `Ya estás anotado en "${service.slots[currentHoldingSlotKey].label}" para esta fecha. Solo se permite 1 puesto por músico.`,
      };
    }

    const updatedSlots = {
      ...service.slots,
      [slotKey]: {
        ...service.slots[slotKey],
        musicianId: musicianUser.id,
        musicianName: musicianUser.fullName,
        assignedAt: new Date().toISOString(),
      },
    };

    setServices(prev =>
      prev.map(s => {
        if (s.id !== serviceId) return s;
        return {
          ...s,
          slots: updatedSlots,
        };
      })
    );

    // Sync persistente con SQLite en la nube (Turso)
    apiClaimSlot(serviceId, slotKey, musicianUser.id, musicianUser.fullName, updatedSlots);

    return { success: true };
  };

  const releaseSlot = (serviceId: string, slotKey: SlotKey) => {
    if (!musicianUser) return { success: false, message: 'No has iniciado sesión.' };

    const service = services.find(s => s.id === serviceId);
    if (!service) return { success: false, message: 'Servicio no encontrado.' };

    const targetSlot = service.slots[slotKey];
    if (targetSlot.musicianId !== musicianUser.id) {
      return { success: false, message: 'Solo puedes liberar puestos que te pertenecen.' };
    }

    const updatedSlots = {
      ...service.slots,
      [slotKey]: {
        ...service.slots[slotKey],
        musicianId: null,
        musicianName: undefined,
        assignedAt: undefined,
      },
    };

    setServices(prev =>
      prev.map(s => {
        if (s.id !== serviceId) return s;
        return {
          ...s,
          slots: updatedSlots,
        };
      })
    );

    // Sync persistente con SQLite en la nube (Turso)
    apiReleaseSlot(serviceId, slotKey, updatedSlots);

    return { success: true };
  };

  // Admin Musician Management
  const registerMusician = (
    fullName: string,
    age: number,
    pin: string,
    primaryInstrument: PrimaryInstrument,
    phone?: string
  ) => {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      return { success: false, message: 'El nombre completo es requerido.' };
    }
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return { success: false, message: 'El PIN debe ser exactamente de 4 dígitos numéricos.' };
    }
    if (!age || age < 5 || age > 100) {
      return { success: false, message: 'Por favor ingresa una edad válida.' };
    }

    const existing = musicians.find(m => m.fullName.toLowerCase() === trimmedName.toLowerCase());
    if (existing) {
      return { success: false, message: 'Ya existe un músico registrado con este nombre completo.' };
    }

    const newMusician: Musician = {
      id: `m_${Date.now()}`,
      fullName: trimmedName,
      age: Number(age),
      pin,
      primaryInstrument,
      phone: phone?.trim(),
      createdAt: new Date().toISOString(),
    };

    setMusicians(prev => [...prev, newMusician]);
    apiCreateMusician(newMusician);

    return { success: true, musician: newMusician };
  };

  const deleteMusician = (musicianId: string) => {
    setMusicians(prev => prev.filter(m => m.id !== musicianId));
    
    // Clear slots where this musician was assigned
    setServices(prev =>
      prev.map(s => {
        const slots = { ...s.slots };
        (Object.keys(slots) as SlotKey[]).forEach(k => {
          if (slots[k].musicianId === musicianId) {
            slots[k] = {
              ...slots[k],
              musicianId: null,
              musicianName: undefined,
              assignedAt: undefined,
            };
          }
        });
        return { ...s, slots };
      })
    );

    if (musicianUser && musicianUser.id === musicianId) {
      setMusicianUser(null);
    }

    apiDeleteMusician(musicianId);
  };

  const updateMusicianPin = (musicianId: string, newPin: string) => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) return;
    setMusicians(prev =>
      prev.map(m => {
        if (m.id === musicianId) {
          const updated = { ...m, pin: newPin };
          apiUpdateMusician(updated);
          return updated;
        }
        return m;
      })
    );
  };

  const updateMusician = (
    musicianId: string,
    data: {
      fullName: string;
      age: number;
      pin: string;
      primaryInstrument: PrimaryInstrument;
      phone?: string;
    }
  ) => {
    const trimmedName = data.fullName.trim();
    if (!trimmedName) {
      return { success: false, message: 'El nombre completo no puede estar vacío.' };
    }
    if (!data.age || data.age < 5 || data.age > 100) {
      return { success: false, message: 'La edad debe estar entre 5 y 100 años.' };
    }
    if (!/^\d{4}$/.test(data.pin)) {
      return { success: false, message: 'El PIN debe contener exactamente 4 números.' };
    }

    const updatedMusician: Musician = {
      id: musicianId,
      fullName: trimmedName,
      age: data.age,
      pin: data.pin,
      primaryInstrument: data.primaryInstrument,
      phone: data.phone?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    setMusicians(prev =>
      prev.map(m => (m.id === musicianId ? { ...m, ...updatedMusician } : m))
    );

    // Actualizar el nombre en todas las asignaciones existentes de cultos
    setServices(prev =>
      prev.map(s => {
        const slots = { ...s.slots };
        let hasChanges = false;
        (Object.keys(slots) as SlotKey[]).forEach(k => {
          if (slots[k].musicianId === musicianId) {
            slots[k] = {
              ...slots[k],
              musicianName: trimmedName,
            };
            hasChanges = true;
          }
        });
        return hasChanges ? { ...s, slots } : s;
      })
    );

    // Si el usuario en sesión es el modificado, actualizar su sesión
    if (musicianUser && musicianUser.id === musicianId) {
      setMusicianUser(prev => prev ? {
        ...prev,
        ...updatedMusician,
      } : null);
    }

    apiUpdateMusician(updatedMusician);

    return { success: true };
  };

  // Admin Services Actions
  const createService = (
    date: string,
    time: string,
    title: string,
    rehearsalTime?: string,
    notes?: string,
    enabledSlots?: Record<SlotKey, boolean>,
    registrationDeadline?: string
  ) => {
    if (!date) return { success: false, message: 'Selecciona una fecha válida.' };

    const exists = services.find(s => s.date === date && s.time === time);
    if (exists) {
      return { success: false, message: 'Ya existe un servicio programado para esta fecha y hora.' };
    }

    const initialSlots = createEmptySlots();
    if (enabledSlots) {
      (Object.keys(enabledSlots) as SlotKey[]).forEach(k => {
        if (initialSlots[k]) {
          initialSlots[k].enabled = enabledSlots[k];
        }
      });
    }

    const newService: ServiceDate = {
      id: `service_${date}_${Date.now()}`,
      date,
      time: time || '09:30',
      rehearsalTime: rehearsalTime || '08:30',
      title: title.trim() || 'Servicio de Alabanza',
      notes: notes?.trim() || '',
      isOpen: true,
      registrationDeadline: registrationDeadline?.trim() || undefined,
      slots: initialSlots,
      createdAt: new Date().toISOString(),
    };

    setServices(prev => [...prev, newService].sort((a, b) => a.date.localeCompare(b.date)));
    apiCreateService({ date, time, title, rehearsalTime, notes, enabledSlots, registrationDeadline });
    return { success: true };
  };

  const generateSundays = (count = 4) => {
    const existingDates = new Set(services.map(s => s.date));
    const d = new Date();
    const day = d.getDay();
    const diff = (7 - day) % 7;
    d.setDate(d.getDate() + (diff === 0 ? 0 : diff));

    const newServicesList: ServiceDate[] = [];
    for (let i = 0; i < count; i++) {
      const nextDate = new Date(d);
      nextDate.setDate(d.getDate() + i * 7);
      const year = nextDate.getFullYear();
      const month = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dateNum = String(nextDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dateNum}`;

      if (!existingDates.has(dateStr)) {
        const item: ServiceDate = {
          id: `service_${dateStr}_${Date.now()}_${i}`,
          date: dateStr,
          time: '09:30',
          rehearsalTime: '08:30',
          title: 'Servicio Dominical de Alabanza',
          notes: 'Ensayo previo general a las 08:30 AM.',
          isOpen: true,
          slots: createEmptySlots(),
          createdAt: new Date().toISOString(),
        };
        newServicesList.push(item);
        apiCreateService({
          date: item.date,
          time: item.time,
          title: item.title,
          rehearsalTime: item.rehearsalTime,
          notes: item.notes,
        });
      }
    }

    if (newServicesList.length > 0) {
      setServices(prev => [...prev, ...newServicesList].sort((a, b) => a.date.localeCompare(b.date)));
    }
  };

  const duplicateService = (
    sourceServiceId: string,
    newDate: string,
    newRegistrationDeadline?: string,
    copyMusicians = false
  ) => {
    if (!newDate) {
      return { success: false, message: 'Por favor ingresa la nueva fecha del evento.' };
    }

    const source = services.find(s => s.id === sourceServiceId);
    if (!source) {
      return { success: false, message: 'Servicio de origen no encontrado.' };
    }

    const exists = services.find(s => s.date === newDate && s.time === source.time);
    if (exists) {
      return { success: false, message: `Ya existe un servicio programado el ${newDate} a las ${source.time}.` };
    }

    const duplicatedSlots: Record<SlotKey, SlotConfig> = {} as any;
    (Object.keys(source.slots) as SlotKey[]).forEach(k => {
      const orig = source.slots[k];
      duplicatedSlots[k] = {
        ...orig,
        musicianId: copyMusicians ? orig.musicianId : null,
        musicianName: copyMusicians ? orig.musicianName : undefined,
        assignedAt: copyMusicians && orig.musicianId ? new Date().toISOString() : undefined,
      };
    });

    const newService: ServiceDate = {
      id: `service_${newDate}_${Date.now()}`,
      date: newDate,
      time: source.time,
      title: source.title,
      rehearsalTime: source.rehearsalTime,
      notes: source.notes,
      isOpen: true,
      registrationDeadline: newRegistrationDeadline?.trim() || undefined,
      slots: duplicatedSlots,
      createdAt: new Date().toISOString(),
    };

    setServices(prev => [...prev, newService].sort((a, b) => a.date.localeCompare(b.date)));
    apiSaveWholeService(newService);

    return { success: true };
  };

  const generateRecurringServices = (options: {
    weekday: number;
    count: number;
    time: string;
    rehearsalTime?: string;
    title?: string;
    startDate?: string;
  }) => {
    const existingDateTimes = new Set(services.map(s => `${s.date}_${s.time}`));
    
    const baseDate = options.startDate ? new Date(options.startDate + 'T12:00:00') : new Date();
    const currentDay = baseDate.getDay(); // 0 (Dom) a 6 (Sáb)
    let daysUntilTarget = (options.weekday - currentDay + 7) % 7;
    if (daysUntilTarget === 0 && !options.startDate) {
      // Si hoy es el mismo día y no se dio fecha fija, empezar en la siguiente semana
      daysUntilTarget = 7;
    }

    const firstOccurrence = new Date(baseDate);
    firstOccurrence.setDate(baseDate.getDate() + daysUntilTarget);

    const newServicesList: ServiceDate[] = [];
    for (let i = 0; i < options.count; i++) {
      const occurrence = new Date(firstOccurrence);
      occurrence.setDate(firstOccurrence.getDate() + i * 7);

      const year = occurrence.getFullYear();
      const month = String(occurrence.getMonth() + 1).padStart(2, '0');
      const day = String(occurrence.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const timeStr = options.time || '19:30';

      const key = `${dateStr}_${timeStr}`;
      if (!existingDateTimes.has(key)) {
        existingDateTimes.add(key);

        const newService: ServiceDate = {
          id: `service_${dateStr}_${Date.now()}_${i}`,
          date: dateStr,
          time: timeStr,
          rehearsalTime: options.rehearsalTime || '18:30',
          title: options.title?.trim() || 'Culto de Alabanza',
          notes: '',
          isOpen: true,
          slots: createEmptySlots(),
          createdAt: new Date().toISOString(),
        };

        newServicesList.push(newService);
        apiSaveWholeService(newService);
      }
    }

    if (newServicesList.length > 0) {
      setServices(prev => [...prev, ...newServicesList].sort((a, b) => a.date.localeCompare(b.date)));
    }

    return { success: true, count: newServicesList.length };
  };

  const deleteService = (serviceId: string) => {
    setServices(prev => prev.filter(s => s.id !== serviceId));
    apiDeleteService(serviceId);
  };

  const toggleServiceOpen = (serviceId: string) => {
    setServices(prev =>
      prev.map(s => (s.id === serviceId ? { ...s, isOpen: !s.isOpen } : s))
    );
    apiToggleServiceOpen(serviceId);
  };

  const updateServiceDetails = (
    serviceId: string,
    updates: Partial<Omit<ServiceDate, 'id' | 'slots'>>
  ) => {
    setServices(prev =>
      prev.map(s => (s.id === serviceId ? { ...s, ...updates } : s))
    );
  };

  const updateServiceConfig = (
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
  ) => {
    setServices(prev =>
      prev.map(s => {
        if (s.id !== serviceId) return s;

        const updatedSlots = { ...s.slots };
        if (updates.enabledSlots) {
          (Object.keys(updates.enabledSlots) as SlotKey[]).forEach(k => {
            if (updatedSlots[k]) {
              const isEnabled = updates.enabledSlots![k];
              updatedSlots[k] = {
                ...updatedSlots[k],
                enabled: isEnabled,
                musicianId: isEnabled ? updatedSlots[k].musicianId : null,
                musicianName: isEnabled ? updatedSlots[k].musicianName : undefined,
                assignedAt: isEnabled ? updatedSlots[k].assignedAt : undefined,
              };
            }
          });
        }

        return {
          ...s,
          date: updates.date !== undefined ? updates.date : s.date,
          time: updates.time !== undefined ? updates.time : s.time,
          title: updates.title !== undefined ? updates.title : s.title,
          rehearsalTime: updates.rehearsalTime !== undefined ? updates.rehearsalTime : s.rehearsalTime,
          notes: updates.notes !== undefined ? updates.notes : s.notes,
          registrationDeadline: updates.registrationDeadline !== undefined ? updates.registrationDeadline : s.registrationDeadline,
          slots: updatedSlots,
        };
      }).sort((a, b) => a.date.localeCompare(b.date))
    );

    apiUpdateServiceConfig(serviceId, updates);
    return { success: true };
  };

  const adminAssignSlot = (serviceId: string, slotKey: SlotKey, musicianId: string) => {
    const musician = musicians.find(m => m.id === musicianId);
    if (!musician) return;

    setServices(prev =>
      prev.map(s => {
        if (s.id !== serviceId) return s;

        const updatedSlots = { ...s.slots };
        // Clean any other slot where this musician was on this date
        (Object.keys(updatedSlots) as SlotKey[]).forEach(k => {
          if (updatedSlots[k].musicianId === musicianId) {
            updatedSlots[k] = {
              ...updatedSlots[k],
              musicianId: null,
              musicianName: undefined,
              assignedAt: undefined,
            };
          }
        });

        updatedSlots[slotKey] = {
          ...updatedSlots[slotKey],
          musicianId: musician.id,
          musicianName: musician.fullName,
          assignedAt: new Date().toISOString(),
        };

        apiAdminAssignSlot(serviceId, slotKey, musicianId, updatedSlots);

        return { ...s, slots: updatedSlots };
      })
    );
  };

  const adminClearSlot = (serviceId: string, slotKey: SlotKey) => {
    setServices(prev =>
      prev.map(s => {
        if (s.id !== serviceId) return s;

        const updatedSlots = {
          ...s.slots,
          [slotKey]: {
            ...s.slots[slotKey],
            musicianId: null,
            musicianName: undefined,
            assignedAt: undefined,
          },
        };

        apiAdminClearSlot(serviceId, slotKey, updatedSlots);

        return {
          ...s,
          slots: updatedSlots,
        };
      })
    );
  };

  const updateServiceSongs = async (
    serviceId: string,
    songs: SongItem[],
    isPublished: boolean
  ): Promise<{ success: boolean; message?: string }> => {
    const service = services.find(s => s.id === serviceId);
    if (!service) {
      return { success: false, message: 'Servicio no encontrado.' };
    }

    // Validación de permisos estricta: Administrador o Voz Director asignado en esta fecha
    const isDirectorAssigned = Boolean(
      musicianUser && service.slots?.voz_director?.musicianId === musicianUser.id
    );

    if (!isAdminAuthenticated && !isDirectorAssigned) {
      return {
        success: false,
        message: 'Solo el Administrador o el Director de Alabanza asignado pueden gestionar las canciones de este culto.',
      };
    }

    setServices(prev =>
      prev.map(s => {
        if (s.id !== serviceId) return s;
        return {
          ...s,
          songs,
          isSongsPublished: isPublished,
        };
      })
    );

    try {
      await apiUpdateServiceSongs(serviceId, songs, isPublished);
    } catch (err) {
      console.warn('Error al persistir canciones en Turso:', err);
    }

    return { success: true };
  };

  const resetAllData = () => {
    setMusicians(INITIAL_MUSICIANS);
    setServices(generateInitialServices());
    setMusicianUser(null);
    setIsAdminAuthenticated(false);
    localStorage.clear();
  };

  const exportDatabaseJSON = () => {
    const payload = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      musicians,
      services,
      adminPin,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importDatabaseJSON = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.musicians) && Array.isArray(data.services)) {
        setMusicians(data.musicians);
        setServices(data.services);
        if (data.adminPin) setAdminPin(data.adminPin);
        return { success: true };
      }
      return { success: false, message: 'El formato del archivo JSON no es válido.' };
    } catch (e: any) {
      return { success: false, message: 'Error al parsear el archivo JSON: ' + e.message };
    }
  };

  return (
    <AppContext.Provider
      value={{
        musicians,
        services,
        adminPin,
        musicianUser,
        isAdminAuthenticated,
        loginMusician,
        logoutMusician,
        loginAdmin,
        logoutAdmin,
        claimSlot,
        releaseSlot,
        registerMusician,
        updateMusician,
        deleteMusician,
        updateMusicianPin,
        createService,
        generateSundays,
        duplicateService,
        generateRecurringServices,
        deleteService,
        toggleServiceOpen,
        updateServiceDetails,
        updateServiceConfig,
        adminAssignSlot,
        adminClearSlot,
        updateServiceSongs,
        resetAllData,
        exportDatabaseJSON,
        importDatabaseJSON,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de un AppProvider');
  }
  return context;
};
