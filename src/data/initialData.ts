import { Musician, ServiceDate, SlotKey, SlotConfig } from '../types';

export const DEFAULT_SLOT_CONFIGS: Record<SlotKey, Omit<SlotConfig, 'musicianId' | 'musicianName' | 'assignedAt'>> = {
  piano_1: { key: 'piano_1', label: 'Piano 1', category: 'Teclados', icon: 'Piano' },
  piano_2: { key: 'piano_2', label: 'Piano 2', category: 'Teclados', icon: 'Piano' },
  guitarra_1: { key: 'guitarra_1', label: 'Guitarra 1 (Eléctrica)', category: 'Guitarras', icon: 'Guitar' },
  guitarra_2: { key: 'guitarra_2', label: 'Guitarra 2 (Eléctrica)', category: 'Guitarras', icon: 'Guitar' },
  guitarra_acustica: { key: 'guitarra_acustica', label: 'Guitarra Acústica', category: 'Guitarras', icon: 'Guitar' },
  voz_director: { key: 'voz_director', label: 'Voz Director', category: 'Voces', icon: 'Mic2' },
  voz_coro_1: { key: 'voz_coro_1', label: 'Voz Coro 1', category: 'Voces', icon: 'Mic' },
  voz_coro_2: { key: 'voz_coro_2', label: 'Voz Coro 2', category: 'Voces', icon: 'Mic' },
  voz_coro_3: { key: 'voz_coro_3', label: 'Voz Coro 3', category: 'Voces', icon: 'Mic' },
  voz_coro_4: { key: 'voz_coro_4', label: 'Voz Coro 4', category: 'Voces', icon: 'Mic' },
  bateria: { key: 'bateria', label: 'Batería', category: 'Ritmo', icon: 'Drum' },
  bajo: { key: 'bajo', label: 'Bajo', category: 'Ritmo', icon: 'Radio' },
  sonido: { key: 'sonido', label: 'Sonido & Streaming', category: 'Técnica', icon: 'Sliders' },
};

export const createEmptySlots = (): Record<SlotKey, SlotConfig> => {
  const slots = {} as Record<SlotKey, SlotConfig>;
  (Object.keys(DEFAULT_SLOT_CONFIGS) as SlotKey[]).forEach((key) => {
    slots[key] = {
      ...DEFAULT_SLOT_CONFIGS[key],
      musicianId: null,
      musicianName: undefined,
      assignedAt: undefined,
    };
  });
  return slots;
};

export const INITIAL_MUSICIANS: Musician[] = [
  {
    id: 'm1',
    fullName: 'David Morales',
    age: 26,
    pin: '1234',
    primaryInstrument: 'Voz Director',
    phone: '+51 987 654 321',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm2',
    fullName: 'Mateo Fernández',
    age: 23,
    pin: '2233',
    primaryInstrument: 'Batería',
    phone: '+51 912 345 678',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm3',
    fullName: 'Saraí Benítez',
    age: 21,
    pin: '4321',
    primaryInstrument: 'Piano',
    phone: '+51 945 678 123',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm4',
    fullName: 'Caleb Rodríguez',
    age: 28,
    pin: '7890',
    primaryInstrument: 'Bajo',
    phone: '+51 999 888 777',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm5',
    fullName: 'Priscila Mendoza',
    age: 24,
    pin: '1111',
    primaryInstrument: 'Voz Coro',
    phone: '+51 933 222 111',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm6',
    fullName: 'Lucas Ramírez',
    age: 25,
    pin: '5555',
    primaryInstrument: 'Guitarra Eléctrica',
    phone: '+51 966 555 444',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm7',
    fullName: 'Jonathan Silva',
    age: 27,
    pin: '9999',
    primaryInstrument: 'Sonido',
    phone: '+51 977 111 222',
    createdAt: new Date().toISOString(),
  }
];

// Helper to get upcoming Sundays
const getUpcomingSundays = (count = 4): string[] => {
  const dates: string[] = [];
  const d = new Date();
  // Move to next Sunday
  const day = d.getDay();
  const diff = (7 - day) % 7;
  d.setDate(d.getDate() + (diff === 0 ? 0 : diff));
  
  for (let i = 0; i < count; i++) {
    const nextDate = new Date(d);
    nextDate.setDate(d.getDate() + i * 7);
    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const dateNum = String(nextDate.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${dateNum}`);
  }
  return dates;
};

export const generateInitialServices = (): ServiceDate[] => {
  const sundays = getUpcomingSundays(4);
  
  return sundays.map((dateStr, idx) => {
    const slots = createEmptySlots();
    
    // Seed some realistic assignments on the first Sunday
    if (idx === 0) {
      slots.voz_director.musicianId = 'm1';
      slots.voz_director.musicianName = 'David Morales';
      slots.voz_director.assignedAt = new Date().toISOString();

      slots.bateria.musicianId = 'm2';
      slots.bateria.musicianName = 'Mateo Fernández';
      slots.bateria.assignedAt = new Date().toISOString();

      slots.piano_1.musicianId = 'm3';
      slots.piano_1.musicianName = 'Saraí Benítez';
      slots.piano_1.assignedAt = new Date().toISOString();

      slots.bajo.musicianId = 'm4';
      slots.bajo.musicianName = 'Caleb Rodríguez';
      slots.bajo.assignedAt = new Date().toISOString();
    }

    return {
      id: `service-${dateStr}`,
      date: dateStr,
      time: '09:30',
      rehearsalTime: '08:30',
      title: idx === 0 ? 'Servicio Dominical - Comunión' : 'Servicio Dominical de Alabanza y Adoración',
      notes: idx === 0 
        ? 'Repertorio: 1. Grande y Fuerte | 2. Cuan Grande es Dios | 3. En Tu Presencia. Vestimenta: Blanco / Negro.'
        : 'Revisar acordes del repertorio mensual en el grupo.',
      isOpen: true,
      slots,
      createdAt: new Date().toISOString(),
    };
  });
};
