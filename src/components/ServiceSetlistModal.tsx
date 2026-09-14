import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceDate, SongItem, BankSong } from '../types';
import { 
  X, 
  Music, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Share2, 
  Copy, 
  Check, 
  Play, 
  Globe, 
  Lock, 
  Sparkles,
  ArrowUp,
  ArrowDown,
  Info,
  Search,
  Zap,
  Mic
} from 'lucide-react';
import { extractYouTubeId, getYouTubeEmbedUrl, getYouTubeThumbnailUrl, getExternalMusicToolLinks } from '../utils/youtubeUtils';
import { ChordChartEditor } from './ChordChartEditor';
import { 
  calculateSemitoneDistance, 
  formatSemitoneShiftDescription, 
  transposeChordChartText, 
  transposeChordProText, 
  hasChordProNotation 
} from '../utils/chordTransposer';


interface Props {
  service: ServiceDate;
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_KEYS = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
  'Am', 'Bm', 'C#m', 'Dm', 'Em', 'F#m', 'Gm'
];

export const ServiceSetlistModal: React.FC<Props> = ({ service, isOpen, onClose }) => {
  const { musicianUser, isAdminAuthenticated, updateServiceSongs, songBank, saveBankSong, services } = useApp();

  const [songs, setSongs] = useState<SongItem[]>(() => service.songs || []);
  const [isPublished, setIsPublished] = useState<boolean>(() => Boolean(service.isSongsPublished));
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activePreviewSongId, setActivePreviewSongId] = useState<string | null>(null);

  // Autocompletado del Banco de Canciones
  const [showBankSuggestions, setShowBankSuggestions] = useState(false);
  const [saveToBankChecked, setSaveToBankChecked] = useState(false);
  const [selectedBankSongId, setSelectedBankSongId] = useState<string | null>(null);

  // Estado de edición de canción existente
  const [editingSongId, setEditingSongId] = useState<string | null>(null);

  // Formulario nueva/edición canción
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newAudioUrl, setNewAudioUrl] = useState('');
  const [newKey, setNewKey] = useState('G');
  const [newOriginalKey, setNewOriginalKey] = useState('');
  const [newBpm, setNewBpm] = useState<string>('');
  const [newNotes, setNewNotes] = useState('');
  const [newChordChart, setNewChordChart] = useState('');
  const [newLyrics, setNewLyrics] = useState('');
  const [newChordsUrl, setNewChordsUrl] = useState('');
  const [activeFormTab, setActiveFormTab] = useState<'chords' | 'lyrics' | 'external'>('chords');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados para selección desde el Banco Central y transposición automática
  const [bankSearchFilter, setBankSearchFilter] = useState('');
  const [baseChordChart, setBaseChordChart] = useState('');
  const [baseLyrics, setBaseLyrics] = useState('');

  // Selector de modo rápido: 'bank' (del banco directo) | 'quick-new' (nueva canción rápida con 3 campos)
  const [addMode, setAddMode] = useState<'bank' | 'quick-new'>('bank');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickArtist, setQuickArtist] = useState('');
  const [quickUrl, setQuickUrl] = useState('');
  const [quickKey, setQuickKey] = useState('G');
  const [isQuickSaving, setIsQuickSaving] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Frecuencia / veces cantadas de cada canción en todos los cultos registrados
  const songUsageMap = useMemo(() => {
    const counts: Record<string, number> = {};
    (services || []).forEach(srv => {
      (srv.songs || []).forEach(s => {
        if (s.title) {
          const k = s.title.trim().toLowerCase();
          counts[k] = (counts[k] || 0) + 1;
        }
      });
    });
    return counts;
  }, [services]);

  if (!isOpen) return null;

  // Permisos: Si hay un músico en sesión, ÚNICAMENTE si dice Voz Director puede gestionar canciones
  const isVozDirector = Boolean(
    musicianUser && (
      musicianUser.primaryInstrument === 'Voz Director' ||
      service.slots?.voz_director?.musicianId === musicianUser.id
    )
  );
  const canEdit = musicianUser ? isVozDirector : isAdminAuthenticated;

  if (!canEdit) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full text-center shadow-xl border border-slate-200">
          <Lock className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">Acceso Restringido</h3>
          <p className="text-xs text-slate-500 mt-2">
            Solo el <strong>Administrador</strong> o el músico asignado como <strong>Voz Director</strong> en este culto pueden gestionar las canciones.
          </p>
          <button
            onClick={onClose}
            className="mt-5 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  // Generar URL oficial para los músicos sin contraseña
  const origin = window.location.origin || 'https://atocarya.vercel.app';
  const publicRepertoireUrl = `${origin}/#/repertorio/${service.id}`;

  const handleKeyChange = (targetKey: string) => {
    setNewKey(targetKey);
    const baseKey = newOriginalKey || 'G';
    const delta = calculateSemitoneDistance(baseKey, targetKey);

    if (baseChordChart) {
      const transposedChart = delta !== 0 
        ? transposeChordChartText(baseChordChart, delta) 
        : baseChordChart;
      setNewChordChart(transposedChart);
    }

    if (baseLyrics && hasChordProNotation(baseLyrics)) {
      const transposedL = delta !== 0 
        ? transposeChordProText(baseLyrics, delta) 
        : baseLyrics;
      setNewLyrics(transposedL);
    }
  };

  const handleStartEdit = (song: SongItem) => {
    const bankMatch = songBank.find(
      b => b.id === song.id || b.title.trim().toLowerCase() === song.title.trim().toLowerCase()
    );
    setEditingSongId(song.id);
    setSelectedBankSongId(bankMatch?.id || song.id);
    setNewTitle(song.title);
    setNewUrl(song.youtubeUrl || bankMatch?.youtubeUrl || '');
    setNewAudioUrl(song.audioUrl || bankMatch?.audioUrl || '');

    const baseChart = bankMatch?.chordChart || song.chordChart || '';
    const baseL = bankMatch?.lyrics || song.lyrics || '';
    setBaseChordChart(baseChart);
    setBaseLyrics(baseL);

    const baseKey = song.originalKey || bankMatch?.originalKey || bankMatch?.defaultKey || song.key || 'G';
    setNewOriginalKey(baseKey);
    setNewKey(song.key || baseKey);
    setNewBpm(song.bpm ? String(song.bpm) : (bankMatch?.bpm ? String(bankMatch.bpm) : ''));
    setNewNotes(song.notes || bankMatch?.notes || '');
    setNewChordChart(song.chordChart || baseChart);
    setNewLyrics(song.lyrics || baseL);
    setNewChordsUrl(song.chordsUrl || bankMatch?.chordsUrl || '');
    setSaveToBankChecked(false);
    setErrorMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingSongId(null);
    setSelectedBankSongId(null);
    setBaseChordChart('');
    setBaseLyrics('');
    setSaveToBankChecked(false);
    setNewTitle('');
    setNewUrl('');
    setNewAudioUrl('');
    setNewKey('G');
    setNewOriginalKey('');
    setNewBpm('');
    setNewNotes('');
    setNewChordChart('');
    setNewLyrics('');
    setNewChordsUrl('');
    setErrorMsg(null);
  };

  // 1. Agregar canción instantáneamente con 1 toque desde el banco sin pantallas intermedias
  const handleInstantAddFromBank = (bankSong: BankSong) => {
    const newSongItem: SongItem = {
      id: `song_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: bankSong.title,
      key: bankSong.defaultKey || bankSong.originalKey || 'G',
      originalKey: bankSong.originalKey || bankSong.defaultKey || 'G',
      youtubeUrl: bankSong.youtubeUrl,
      audioUrl: bankSong.audioUrl,
      bpm: bankSong.bpm,
      chordChart: bankSong.chordChart,
      lyrics: bankSong.lyrics,
      chordsUrl: bankSong.chordsUrl,
      notes: bankSong.notes,
    };
    setSongs(prev => [...prev, newSongItem]);
    setSuccessNotice(`✓ "${bankSong.title}" agregada al culto`);
    setTimeout(() => setSuccessNotice(null), 2500);
  };

  // 2. Agregar nueva canción rápida (solo 3 campos: nombre, autor, link de youtube) y guardarla en el banco
  const handleQuickCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) {
      setErrorMsg('Por favor ingresa el nombre de la canción.');
      return;
    }

    setIsQuickSaving(true);
    setErrorMsg(null);

    try {
      await saveBankSong({
        title: quickTitle.trim(),
        artist: quickArtist.trim() || undefined,
        youtubeUrl: quickUrl.trim() || undefined,
        defaultKey: quickKey || 'G',
        originalKey: quickKey || 'G',
      });

      const newSongItem: SongItem = {
        id: `song_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        title: quickTitle.trim(),
        key: quickKey || 'G',
        originalKey: quickKey || 'G',
        youtubeUrl: quickUrl.trim() || undefined,
      };

      setSongs(prev => [...prev, newSongItem]);
      setQuickTitle('');
      setQuickArtist('');
      setQuickUrl('');
      setQuickKey('G');
      setSuccessNotice(`✓ Canción guardada en el banco y agregada al culto`);
      setTimeout(() => setSuccessNotice(null), 2500);
    } catch (err) {
      setErrorMsg('Error al guardar la nueva canción.');
    } finally {
      setIsQuickSaving(false);
    }
  };

  const handleSelectFromBank = (bankSong: BankSong) => {
    setSelectedBankSongId(bankSong.id);
    setNewTitle(bankSong.title);
    setBaseChordChart(bankSong.chordChart || '');
    setBaseLyrics(bankSong.lyrics || '');
    const baseKey = bankSong.originalKey || bankSong.defaultKey || 'G';
    setNewOriginalKey(baseKey);
    setNewKey(baseKey);
    if (bankSong.youtubeUrl) setNewUrl(bankSong.youtubeUrl);
    if (bankSong.audioUrl) setNewAudioUrl(bankSong.audioUrl);
    if (bankSong.bpm) setNewBpm(String(bankSong.bpm));
    if (bankSong.notes) setNewNotes(bankSong.notes);
    if (bankSong.chordChart) setNewChordChart(bankSong.chordChart);
    if (bankSong.lyrics) setNewLyrics(bankSong.lyrics);
    if (bankSong.chordsUrl) setNewChordsUrl(bankSong.chordsUrl);
    setSaveToBankChecked(false);
    setShowBankSuggestions(false);
    setErrorMsg(null);
  };

  const handleAddOrUpdateSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || (!editingSongId && !selectedBankSongId)) {
      setErrorMsg('Debes seleccionar una canción del Banco Central de Canciones.');
      return;
    }

    const songData: SongItem = {
      id: editingSongId || `song_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: newTitle.trim(),
      youtubeUrl: newUrl.trim() || undefined,
      audioUrl: newAudioUrl.trim() || undefined,
      key: newKey.trim() || undefined,
      originalKey: newOriginalKey.trim() || undefined,
      bpm: newBpm ? Number(newBpm) : undefined,
      notes: newNotes.trim() || undefined,
      chordChart: newChordChart.trim() || undefined,
      lyrics: newLyrics.trim() || undefined,
      chordsUrl: newChordsUrl.trim() || undefined,
    };

    if (editingSongId) {
      // Actualizar canción existente en este culto
      setSongs(prev => prev.map(s => (s.id === editingSongId ? songData : s)));
      setEditingSongId(null);
    } else {
      // Agregar nueva canción al culto
      setSongs(prev => [...prev, songData]);
    }

    // Resetear formulario
    handleCancelEdit();
  };

  const handleRemoveSong = (id: string) => {
    setSongs(prev => prev.filter(s => s.id !== id));
    if (activePreviewSongId === id) setActivePreviewSongId(null);
    if (editingSongId === id) handleCancelEdit();
  };

  const handleMoveSong = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === songs.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const next = [...songs];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setSongs(next);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    const res = await updateServiceSongs(service.id, songs, isPublished);
    setIsSaving(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message || 'Error al guardar los cambios.');
    }
  };

  const handleCopyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(publicRepertoireUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      prompt('Copia este enlace oficial para compartir:', publicRepertoireUrl);
    }
  };

  const generateWhatsAppMessage = () => {
    const lines: string[] = [];
    lines.push('🎵 *REPERTORIO OFICIAL DE ALABANZA*');
    lines.push(`📅 *${service.title}* (${service.date} - ${service.time})`);
    if (service.rehearsalTime) {
      lines.push(`⏰ Ensayo: ${service.rehearsalTime}`);
    }

    // 1. Director al comienzo
    const director = service.slots?.voz_director?.musicianName;
    if (director) {
      lines.push(`🎤 *Director de Alabanza:* ${director}`);
    }
    lines.push('──────────────────────────────');

    // 2. Músicos confirmados (sin vacantes)
    const confirmedMusicians = (Object.values(service.slots || {}) as any[])
      .filter(slot => slot && slot.enabled !== false && Boolean(slot.musicianId));

    if (confirmedMusicians.length > 0) {
      lines.push('*Equipo Confirmado:*');
      confirmedMusicians.forEach(slot => {
        lines.push(`• ${slot.label}: ✅ *${slot.musicianName}*`);
      });
      lines.push('──────────────────────────────');
    }

    // 3. Canciones con tono y URL
    if (songs.length > 0) {
      lines.push('*Canciones & Tonalidades:*');
      songs.forEach((s, idx) => {
        const keyStr = s.key ? ` [Tono: *${s.key}*]` : '';
        lines.push(`${idx + 1}. *${s.title}*${keyStr}`);
        if (s.youtubeUrl) {
          lines.push(`   ▶️ ${s.youtubeUrl}`);
        }
        if (s.notes) {
          lines.push(`   💬 _${s.notes}_`);
        }
      });
    } else {
      lines.push('*(Canciones en preparación por el Director)*');
    }

    lines.push('──────────────────────────────');
    lines.push('👉 *Escuchar canciones, ver videos y notas aquí (sin clave):*');
    lines.push(publicRepertoireUrl);

    return lines.join('\n');
  };

  const handleShareWhatsApp = () => {
    const message = generateWhatsAppMessage();
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* Header Planning Center Style */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm shadow-emerald-600/30 flex-shrink-0">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Repertorio de Canciones (Setlist)
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  isPublished
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {isPublished ? '✓ Publicado Oficial' : 'Borrador'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-display text-slate-900">
                {service.title} · {service.date}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">

          {/* Switch de Publicación & Compartir */}
          <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <Globe className={`w-4 h-4 ${isPublished ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold text-slate-900">
                  Publicación para Músicos
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isPublished 
                  ? 'Actualmente publicado: cualquier músico con el enlace puede ver los videos y acordes.'
                  : 'En borrador: solo tú y el administrador pueden ver estas canciones.'}
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setIsPublished(!isPublished)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                  isPublished
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                {isPublished ? '✓ Publicado' : 'Publicar Ahora'}
              </button>

              <button
                type="button"
                onClick={handleCopyPublicLink}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Copiar link oficial sin contraseña"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedLink ? '¡Copiado!' : 'Copiar Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Enviar por WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Lista de Canciones Agregadas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Canciones del Culto ({songs.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                Puedes cambiar el orden con las flechas
              </span>
            </div>

            {songs.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <Music className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Aún no hay canciones en este culto</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Agrega abajo la primera canción con su URL de YouTube y su tonalidad oficial.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {songs.map((song, index) => {
                  const videoId = extractYouTubeId(song.youtubeUrl);
                  const embedUrl = getYouTubeEmbedUrl(song.youtubeUrl);
                  const isPreviewing = activePreviewSongId === song.id;

                  return (
                    <div 
                      key={song.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-all shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Número */}
                          <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-black flex-shrink-0">
                            #{index + 1}
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 leading-tight truncate">
                              {song.title}
                            </h4>
                            
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {song.key && (
                                <span className="text-[11px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md">
                                  Tono: {song.key}
                                </span>
                              )}
                              {song.originalKey && (
                                <span className="text-[10px] text-slate-500">
                                  (Original: {song.originalKey})
                                </span>
                              )}
                              {(() => {
                                const times = songUsageMap[song.title.trim().toLowerCase()] || 0;
                                return (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                    times === 0 
                                      ? 'bg-slate-100 text-slate-600' 
                                      : times >= 4 
                                      ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  }`}>
                                    🎤 {times === 0 ? '0 veces (Nueva)' : `Cantada ${times} ${times === 1 ? 'vez' : 'veces'}`}
                                  </span>
                                );
                              })()}
                              {song.key && song.originalKey && song.key !== song.originalKey && (() => {
                                const diff = calculateSemitoneDistance(song.originalKey, song.key);
                                if (diff === 0) return null;
                                return (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                    diff < 0 
                                      ? 'bg-amber-50 text-amber-800 border-amber-200' 
                                      : 'bg-teal-50 text-teal-800 border-teal-200'
                                  }`}>
                                    {diff < 0 ? `⬇️ ${Math.abs(diff)} semitono${Math.abs(diff) > 1 ? 's' : ''} abajo` : `⬆️ +${diff} semitono${diff > 1 ? 's' : ''} arriba`}
                                  </span>
                                );
                              })()}
                              {song.bpm && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {song.bpm} BPM
                                </span>
                              )}
                              {song.audioUrl && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded">
                                  🎧 Pista
                                </span>
                              )}
                            </div>

                            {song.notes && (
                              <p className="text-[11px] text-slate-600 mt-1 italic line-clamp-2">
                                💬 {song.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(song)}
                            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                              editingSongId === song.id
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title="Editar canción (cambiar tono, link o título)"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span className="hidden sm:inline">Editar</span>
                          </button>

                          {embedUrl && (
                            <button
                              type="button"
                              onClick={() => setActivePreviewSongId(isPreviewing ? null : song.id)}
                              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                                isPreviewing 
                                  ? 'bg-emerald-600 text-white' 
                                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                              title={isPreviewing ? 'Cerrar reproductor' : 'Reproducir video aquí'}
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{isPreviewing ? 'Ocultar' : 'Ver Video'}</span>
                            </button>
                          )}

                          {song.youtubeUrl && (
                            <a
                              href={song.youtubeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Abrir en YouTube"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => handleMoveSong(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded transition-colors"
                            title="Mover arriba"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMoveSong(index, 'down')}
                            disabled={index === songs.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded transition-colors"
                            title="Mover abajo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveSong(song.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Eliminar canción"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Video Embebido en Vivo */}
                      {isPreviewing && embedUrl && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video max-h-[300px] w-full">
                          <iframe
                            src={embedUrl}
                            title={song.title}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notificación de éxito flotante */}
          {successNotice && (
            <div className="p-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* MODO ADICIÓN RÁPIDA O EDICIÓN DE TONO */}
          {!editingSongId ? (
            <div className="p-4 sm:p-5 border border-slate-200 bg-slate-50/90 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Agregar Canciones al Culto</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Selecciona del banco en 1 toque o agrega una canción nueva en 3 campos
                  </p>
                </div>

                {/* Tabs de modos: Banco vs Nueva rápida */}
                <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setAddMode('bank')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      addMode === 'bank' 
                        ? 'bg-white text-emerald-950 shadow-2xs font-black' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Banco ({songBank.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddMode('quick-new')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      addMode === 'quick-new' 
                        ? 'bg-white text-emerald-950 shadow-2xs font-black' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>⚡ Nueva Rápida</span>
                  </button>
                </div>
              </div>

              {/* MODO 1: BANCO DE CANCIONES (1 TOQUE Y SE AGREGA AUTOMÁTICAMENTE) */}
              {addMode === 'bank' && (
                <div className="space-y-2 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                  {/* Buscador */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Filtrar en el banco por título o autor..."
                      value={bankSearchFilter}
                      onChange={(e) => setBankSearchFilter(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {songBank.length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-amber-300 rounded-xl bg-amber-50/60 text-xs text-amber-900">
                      <p className="font-bold">⚠️ El Banco Central está vacío</p>
                      <button
                        type="button"
                        onClick={() => setAddMode('quick-new')}
                        className="mt-2 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                      >
                        + Agregar la primera canción rápida
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-56 sm:max-h-64 overflow-y-auto space-y-1 divide-y divide-slate-100 pr-1">
                      {songBank
                        .filter(b => {
                          if (!bankSearchFilter.trim()) return true;
                          const term = bankSearchFilter.toLowerCase();
                          return b.title.toLowerCase().includes(term) || (b.artist && b.artist.toLowerCase().includes(term));
                        })
                        .map(item => {
                          const times = songUsageMap[item.title.trim().toLowerCase()] || 0;
                          const isAlreadyInService = songs.some(s => s.title.trim().toLowerCase() === item.title.trim().toLowerCase());

                          return (
                            <div
                              key={item.id}
                              className="pt-1.5 first:pt-0 flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50/50 transition-all gap-2"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h5 className="text-xs font-bold text-slate-900 truncate">
                                    {item.title}
                                  </h5>
                                  {item.defaultKey && (
                                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                                      {item.defaultKey}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5 truncate">
                                  {item.artist && <span>{item.artist}</span>}
                                  {item.bpm && <span>· {item.bpm} BPM</span>}
                                  {item.audioUrl && <span className="text-teal-700">· 🎧 Audio</span>}
                                </div>
                              </div>

                              {/* EN UN COSTADO: VECES CANTADAS + BOTÓN AGREGAR INMEDIATO */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  times === 0 
                                    ? 'bg-slate-100 text-slate-600' 
                                    : times >= 4 
                                    ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}>
                                  🎤 {times === 0 ? '0 veces' : `Cantada ${times} ${times === 1 ? 'vez' : 'veces'}`}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleInstantAddFromBank(item)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 shadow-2xs ${
                                    isAlreadyInService
                                      ? 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                                  }`}
                                  title="Agregar de inmediato a este culto"
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>{isAlreadyInService ? 'Agregar +' : 'Agregar'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* MODO 2: NUEVA CANCIÓN RÁPIDA (SOLO 3 CAMPOS: NOMBRE, AUTOR Y LINK YOUTUBE) */}
              {addMode === 'quick-new' && (
                <form onSubmit={handleQuickCreateAndAdd} className="space-y-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Creación Rápida (Se guardará en el Banco y se añadirá al Culto)
                    </span>
                    <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-bold">
                      3 campos rápidos
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      1. Nombre de la Canción *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ej. La Bendición, Hay Libertad, Cuan Grande..."
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">
                        2. Autor o Banda (opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="ej. Elevation Worship, Miel San Marcos..."
                        value={quickArtist}
                        onChange={(e) => setQuickArtist(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">
                        3. Enlace de YouTube (URL opcional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://youtu.be/... o https://youtube.com/..."
                        value={quickUrl}
                        onChange={(e) => setQuickUrl(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tonalidad sugerida: <strong>{quickKey}</strong>
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {COMMON_KEYS.slice(0, 12).map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setQuickKey(k)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                            quickKey === k 
                              ? 'bg-emerald-600 text-white shadow-2xs' 
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isQuickSaving}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/30 transition-all disabled:opacity-50"
                  >
                    {isQuickSaving ? (
                      <span>Guardando en el banco...</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>✓ Guardar en Banco y Agregar al Culto</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* MODO EDICIÓN: MODIFICAR TONALIDAD Y DATOS DE LA CANCIÓN DEL CULTO */
            <div className="p-4 sm:p-5 border border-amber-300 ring-2 ring-amber-300/50 bg-amber-50/70 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Modificar Tonalidad y Datos: <strong>{newTitle}</strong></span>
                </h4>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white border border-amber-200 shadow-2xs transition-colors"
                >
                  ✕ Cancelar
                </button>
              </div>

              <form onSubmit={handleAddOrUpdateSong} className="space-y-4">

                {/* PASO 2: TONALIDAD A CANTAR Y TRANSPOSICIÓN AUTOMÁTICA (REQUISITO 4) */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-900">
                      2. Tonalidad en que se va a cantar en este culto: <strong className="text-emerald-700 text-sm font-black">{newKey || 'Sin tono'}</strong>
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Original: <strong>{newOriginalKey || 'G'}</strong>
                    </span>
                  </div>

                  {/* Botones rápidos de notas */}
                  <div className="flex flex-wrap gap-1">
                    {COMMON_KEYS.map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => handleKeyChange(k)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                          newKey === k
                            ? 'bg-emerald-600 text-white shadow-xs scale-105 ring-2 ring-emerald-400/40'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 font-medium block mb-1">
                        Escribir otro tono a cantar:
                      </span>
                      <input
                        type="text"
                        placeholder="ej. Sol menor (Gm)"
                        value={newKey}
                        onChange={(e) => handleKeyChange(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-medium block mb-1">
                        Tono Original del tema:
                      </span>
                      <input
                        type="text"
                        placeholder="Tono original de la pista o tema"
                        value={newOriginalKey}
                        onChange={(e) => {
                          setNewOriginalKey(e.target.value);
                          const delta = calculateSemitoneDistance(e.target.value, newKey);
                          if (baseChordChart) {
                            setNewChordChart(delta !== 0 ? transposeChordChartText(baseChordChart, delta) : baseChordChart);
                          }
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* INDICADOR EN TIEMPO REAL DE TRANSPOSICIÓN Y BAJADA/SUBIDA DE TONO */}
                  {(() => {
                    const delta = calculateSemitoneDistance(newOriginalKey || 'G', newKey || 'G');
                    if (delta === 0) {
                      return (
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>
                            <strong>Tono Original:</strong> Se cantará en la misma tonalidad original (<strong>{newOriginalKey || newKey}</strong>).
                          </span>
                        </div>
                      );
                    }

                    const isLower = delta < 0;
                    return (
                      <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 shadow-2xs ${
                        isLower 
                          ? 'bg-amber-50/90 border-amber-300 text-amber-950' 
                          : 'bg-teal-50/90 border-teal-300 text-teal-950'
                      }`}>
                        <Sparkles className={`w-4 h-4 mt-0.5 flex-shrink-0 animate-pulse ${
                          isLower ? 'text-amber-600' : 'text-teal-600'
                        }`} />
                        <div className="space-y-0.5">
                          <p className="font-black text-xs">
                            {isLower ? '⬇️ ' : '⬆️ '}
                            Transposición automática: {formatSemitoneShiftDescription(delta)}
                          </p>
                          <p className="text-[11px] opacity-90 leading-relaxed">
                            Al seleccionar <strong>{newKey}</strong> (original: {newOriginalKey}), el sistema ha ajustado automáticamente todos los acordes del cifrado a la nueva tonalidad para los músicos.
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Enlaces y Notas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Video de YouTube de Referencia (URL)
                    </label>
                    <input
                      type="url"
                      placeholder="https://youtu.be/... o https://youtube.com/..."
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Audio / Pista MP3 (Drive)</span>
                      <span className="text-[10px] text-emerald-600 font-normal">Afinador integrado</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/file/d/... o .mp3"
                      value={newAudioUrl}
                      onChange={(e) => setNewAudioUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Notas de ensayo */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Notas Breves / Dinámica de Ensayo (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Entrada con piano solo, Coro 2 explota con batería"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

            {/* SECCIÓN ESPECIALIZADA: CIFRADO ARMÓNICO, LETRA Y URL EXTERNA */}
            <div className="pt-3 border-t border-slate-200/80">
              {/* Selector de pestañas del editor */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl mb-3">
                <button
                  type="button"
                  onClick={() => setActiveFormTab('chords')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeFormTab === 'chords'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🎸 Cifrado & Compases</span>
                  {newChordChart.trim() && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFormTab('lyrics')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeFormTab === 'lyrics'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🎤 Letra de la Canción</span>
                  {newLyrics.trim() && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFormTab('external')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeFormTab === 'external'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>📄 URL Cifrado / PDF</span>
                  {newChordsUrl.trim() && <span className="w-2 h-2 rounded-full bg-indigo-500"></span>}
                </button>
              </div>

              {/* PESTAÑA 1: CIFRADO ARMÓNICO Y COMPASES */}
              {activeFormTab === 'chords' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-800">
                      Cifrado por Compases, Cortes y Repeticiones (Map Chart)
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Usa barras <strong>|</strong> para separar compases
                    </span>
                  </div>

                  <ChordChartEditor
                    value={newChordChart}
                    onChange={setNewChordChart}
                    rows={6}
                  />
                </div>
              )}

              {/* PESTAÑA 2: LETRA */}
              {activeFormTab === 'lyrics' && (
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-800">
                    Letra Completa de la Canción
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Pega aquí la letra de la canción (versos, coro, puente)..."
                    value={newLyrics}
                    onChange={(e) => setNewLyrics(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                  />
                </div>
              )}

              {/* PESTAÑA 3: URL EXTERNA DE CIFRADO O PDF */}
              {activeFormTab === 'external' && (
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-800">
                    Enlace Externo a Cifrado / Partitura (PDF, Google Drive, LaCuerda, etc.)
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/... o https://lacuerda.net/..."
                    value={newChordsUrl}
                    onChange={(e) => setNewChordsUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Los músicos tendrán un botón directo para abrir este archivo o partitura con un solo toque.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {editingSongId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-1/3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className={`py-2.5 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm ${
                  editingSongId
                    ? 'w-2/3 bg-amber-600 hover:bg-amber-700'
                    : 'w-full bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {editingSongId ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Guardar Cambios de Canción</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir Canción a la Lista</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyPublicLink}
            className="text-xs text-slate-600 hover:text-emerald-700 font-bold flex items-center gap-1.5 transition-colors"
          >
            <Globe className="w-4 h-4 text-slate-400" />
            <span>Link Oficial: {publicRepertoireUrl.slice(0, 35)}...</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-sm shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Guardar Repertorio</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
