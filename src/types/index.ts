export type PrimaryInstrument = 
  | 'Bajo'
  | 'Guitarra Eléctrica'
  | 'Guitarra Acústica'
  | 'Batería'
  | 'Voz Director'
  | 'Voz Coro'
  | 'Piano'
  | 'Sonido';

export type SlotKey = 
  | 'piano_1'
  | 'piano_2'
  | 'guitarra_1'
  | 'guitarra_2'
  | 'guitarra_acustica'
  | 'voz_director'
  | 'voz_coro_1'
  | 'voz_coro_2'
  | 'voz_coro_3'
  | 'voz_coro_4'
  | 'bateria'
  | 'bajo'
  | 'sonido';

export interface Musician {
  id: string;
  fullName: string;
  age: number;
  pin: string; // 4 digits
  primaryInstrument: PrimaryInstrument;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface SlotConfig {
  key: SlotKey;
  label: string;
  category: 'Teclados' | 'Guitarras' | 'Voces' | 'Ritmo' | 'Técnica';
  icon: string;
  musicianId: string | null; // Id of assigned musician or null
  musicianName?: string;
  assignedAt?: string;
  enabled?: boolean; // Whether this instrument is active for this specific date
}

export interface SongItem {
  id: string;
  title: string;
  youtubeUrl?: string;
  audioUrl?: string; // URL de audio / MP3 / Google Drive / pista
  key?: string; // Tonalidad oficial para el culto (ej: "Sol (G)", "Re (D)", "Mi menor (Em)")
  originalKey?: string; // Tonalidad original del tema
  bpm?: number;
  notes?: string; // Dinámica, estructura o acordes clave
  chordChart?: string; // Cifrado armónico de compases, cortes y notas de paso
  lyrics?: string; // Letra de la canción
  chordsUrl?: string; // URL externa de cifrado o partitura (Drive, PDF, LaCuerda, etc.)
}

export interface BankSong {
  id: string;
  title: string;
  artist?: string;
  defaultKey?: string;
  originalKey?: string;
  bpm?: number;
  youtubeUrl?: string;
  audioUrl?: string; // URL de audio / MP3 / Google Drive / pista
  chordsUrl?: string; // URL de PDF o partitura
  chordChart?: string;
  lyrics?: string;
  notes?: string;
  createdAt: string;
}

export interface ServiceDate {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "09:00"
  title: string; // e.g. "Servicio Dominical Principal"
  rehearsalTime?: string; // e.g. "08:15"
  notes?: string; // e.g. "Canciones: Grande y Fuerte, Cuan Grande es Dios..."
  isOpen: boolean; // Admin can toggle if registrations are open
  registrationDeadline?: string; // YYYY-MM-DD - Fecha de expiración de inscripciones
  slots: Record<SlotKey, SlotConfig>;
  songs?: SongItem[]; // Repertorio oficial de canciones
  isSongsPublished?: boolean; // Solo publicado es visible en el link oficial
  createdAt: string;
}

export interface AdminUser {
  isAdmin: true;
  name: string;
}

export type CurrentUser = (Musician & { isAdmin?: false }) | AdminUser | null;
