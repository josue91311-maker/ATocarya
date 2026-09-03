import { SlotKey, SlotConfig, PrimaryInstrument } from '../types';

/**
 * Encuentra el mejor puesto vacante para un músico según su instrumento principal.
 * Maneja inteligentemente sinónimos y categorías:
 * - 'Voz Coro' -> busca 'voz_coro_1', 'voz_coro_2', 'voz_coro_3', 'voz_coro_4', 'voz_director'
 * - 'Voz Director' -> busca 'voz_director', 'voz_coro_1', ...
 * - 'Piano' -> busca 'piano_1', 'piano_2'
 * - 'Guitarra Eléctrica' -> busca 'guitarra_1', 'guitarra_2', 'guitarra_acustica'
 * - 'Guitarra Acústica' -> busca 'guitarra_acustica', 'guitarra_1', 'guitarra_2'
 * - 'Batería' -> busca 'bateria'
 * - 'Bajo' -> busca 'bajo'
 * - 'Sonido' -> busca 'sonido'
 */
export const getBestMatchingSlot = (
  slots: Record<SlotKey, SlotConfig> | undefined,
  primaryInstrument: PrimaryInstrument | string
): SlotConfig | null => {
  if (!slots || !primaryInstrument) return null;

  const norm = primaryInstrument.toLowerCase().trim();
  const preferredKeys: SlotKey[] = [];

  if (norm.includes('director')) {
    preferredKeys.push('voz_director', 'voz_coro_1', 'voz_coro_2', 'voz_coro_3', 'voz_coro_4');
  } else if (norm.includes('coro') || norm.includes('voz') || norm.includes('vocal')) {
    preferredKeys.push('voz_coro_1', 'voz_coro_2', 'voz_coro_3', 'voz_coro_4', 'voz_director');
  } else if (norm.includes('piano') || norm.includes('tecl')) {
    preferredKeys.push('piano_1', 'piano_2');
  } else if (norm.includes('acúst') || norm.includes('acust')) {
    preferredKeys.push('guitarra_acustica', 'guitarra_1', 'guitarra_2');
  } else if (norm.includes('eléc') || norm.includes('elec') || norm.includes('guit')) {
    preferredKeys.push('guitarra_1', 'guitarra_2', 'guitarra_acustica');
  } else if (norm.includes('bater') || norm.includes('drum')) {
    preferredKeys.push('bateria');
  } else if (norm.includes('bajo') || norm.includes('bass')) {
    preferredKeys.push('bajo');
  } else if (norm.includes('sonid') || norm.includes('audio') || norm.includes('stream')) {
    preferredKeys.push('sonido');
  }

  // 1. Buscar en las posiciones preferidas que estén habilitadas y libres
  for (const key of preferredKeys) {
    const slot = slots[key];
    if (slot && slot.enabled !== false && !slot.musicianId) {
      return slot;
    }
  }

  // 2. Búsqueda por coincidencia de texto en label o categoría
  const allVacant = (Object.values(slots) as SlotConfig[]).filter(
    s => s && s.enabled !== false && !s.musicianId
  );

  return (
    allVacant.find(
      s =>
        s.label.toLowerCase().includes(norm) ||
        norm.includes(s.label.toLowerCase()) ||
        norm.includes(s.category.toLowerCase())
    ) || null
  );
};
