import React, { useState } from 'react';
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
  Info
} from 'lucide-react';
import { extractYouTubeId, getYouTubeEmbedUrl, getYouTubeThumbnailUrl, getExternalMusicToolLinks } from '../utils/youtubeUtils';

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
  const { musicianUser, isAdminAuthenticated, updateServiceSongs, songBank, saveBankSong } = useApp();

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

  if (!isOpen) return null;

  // Verificación estricta de permisos: Admin o Voz Director asignado en esta fecha
  const isDirector = Boolean(
    musicianUser && service.slots?.voz_director?.musicianId === musicianUser.id
  );
  const canEdit = isAdminAuthenticated || isDirector;

  if (!canEdit) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full text-center shadow-xl border border-slate-200">
          <Lock className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">Acceso Restringido</h3>
          <p className="text-xs text-slate-500 mt-2">
            Solo el <strong>Administrador</strong> o el músico asignado como <strong>Voz Director</strong> para este culto pueden editar el repertorio de canciones.
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

  const handleStartEdit = (song: SongItem) => {
    const bankMatch = songBank.find(
      b => b.id === song.id || b.title.trim().toLowerCase() === song.title.trim().toLowerCase()
    );
    setEditingSongId(song.id);
    setSelectedBankSongId(bankMatch?.id || null);
    setNewTitle(song.title);
    setNewUrl(song.youtubeUrl || bankMatch?.youtubeUrl || '');
    setNewAudioUrl(song.audioUrl || bankMatch?.audioUrl || '');
    setNewKey(song.key || bankMatch?.defaultKey || 'G');
    setNewOriginalKey(song.originalKey || bankMatch?.originalKey || '');
    setNewBpm(song.bpm ? String(song.bpm) : (bankMatch?.bpm ? String(bankMatch.bpm) : ''));
    setNewNotes(song.notes || bankMatch?.notes || '');
    setNewChordChart(song.chordChart || bankMatch?.chordChart || '');
    setNewLyrics(song.lyrics || bankMatch?.lyrics || '');
    setNewChordsUrl(song.chordsUrl || bankMatch?.chordsUrl || '');
    setSaveToBankChecked(true);
    setErrorMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingSongId(null);
    setSelectedBankSongId(null);
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

  const handleSelectFromBank = (bankSong: BankSong) => {
    setSelectedBankSongId(bankSong.id);
    setNewTitle(bankSong.title);
    if (bankSong.youtubeUrl) setNewUrl(bankSong.youtubeUrl);
    if (bankSong.audioUrl) setNewAudioUrl(bankSong.audioUrl);
    if (bankSong.defaultKey) setNewKey(bankSong.defaultKey);
    if (bankSong.originalKey) setNewOriginalKey(bankSong.originalKey);
    if (bankSong.bpm) setNewBpm(String(bankSong.bpm));
    if (bankSong.notes) setNewNotes(bankSong.notes);
    if (bankSong.chordChart) setNewChordChart(bankSong.chordChart);
    if (bankSong.lyrics) setNewLyrics(bankSong.lyrics);
    if (bankSong.chordsUrl) setNewChordsUrl(bankSong.chordsUrl);
    // Al cargar del banco NO debe auto-guardar nuevamente en el banco
    setSaveToBankChecked(false);
    setShowBankSuggestions(false);
  };

  const handleAddOrUpdateSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setErrorMsg('Por favor ingresa el título de la canción.');
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

    // Si el usuario explícitamente marcó guardar o actualizar en el banco central:
    if (saveToBankChecked) {
      saveBankSong({
        id: selectedBankSongId || undefined,
        title: songData.title,
        defaultKey: songData.key,
        originalKey: songData.originalKey,
        bpm: songData.bpm,
        youtubeUrl: songData.youtubeUrl,
        audioUrl: songData.audioUrl,
        chordsUrl: songData.chordsUrl,
        chordChart: songData.chordChart || '',
        lyrics: songData.lyrics || '',
        notes: songData.notes,
      }).catch(err => console.warn('Error al sincronizar con banco de canciones:', err));
    }

    // Resetear formulario
    setSelectedBankSongId(null);
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
              <div className="space-y-2">
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

          {/* Formulario Agregar / Editar Canción */}
          <form 
            onSubmit={handleAddOrUpdateSong} 
            className={`p-4 sm:p-5 border rounded-2xl space-y-3 transition-colors ${
              editingSongId 
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-300/50' 
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                {editingSongId ? (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span className="text-amber-900">Modificar Canción Seleccionada</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Agregar Nueva Canción</span>
                  </>
                )}
              </h4>
              {editingSongId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-md hover:bg-amber-100 transition-colors"
                >
                  ✕ Cancelar Edición
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Nombre de la Canción *
                  </label>
                  {songBank.length > 0 && (
                    <span className="text-[10px] text-emerald-700 font-bold">
                      💡 {songBank.length} en tu Banco
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="ej. La Bendición, Way Maker, etc."
                  value={newTitle}
                  onFocus={() => setShowBankSuggestions(true)}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    setShowBankSuggestions(true);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
                />

                {/* Desplegable de Autocompletado desde el Banco de Canciones */}
                {showBankSuggestions && newTitle.trim().length > 0 && (
                  (() => {
                    const matches = songBank.filter(b => 
                      b.title.toLowerCase().includes(newTitle.trim().toLowerCase())
                    ).slice(0, 5);

                    if (matches.length === 0) return null;

                    return (
                      <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1 divide-y divide-slate-100">
                        <div className="px-3 py-1 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                          <span>Canciones en el Banco</span>
                          <button
                            type="button"
                            onClick={() => setShowBankSuggestions(false)}
                            className="text-slate-400 hover:text-slate-600 font-normal text-xs"
                          >
                            ✕
                          </button>
                        </div>
                        {matches.map(item => (
                          <div
                            key={item.id}
                            onClick={() => handleSelectFromBank(item)}
                            className="px-3 py-2 hover:bg-emerald-50 cursor-pointer transition-colors flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {item.title}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                {item.defaultKey && <span className="font-semibold text-emerald-800">Tono: {item.defaultKey}</span>}
                                {item.artist && <span>· {item.artist}</span>}
                                {item.audioUrl && <span>· 🎧 Audio</span>}
                                {item.chordsUrl && <span>· 📄 PDF</span>}
                                {item.chordChart && <span>· 🎸 Cifrado</span>}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex-shrink-0">
                              Cargar Datos
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Enlace de YouTube (URL)
                </label>
                <input
                  type="url"
                  placeholder="https://youtu.be/... o https://youtube.com/watch?v=..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Audio / Pista MP3 (Drive)</span>
                  <span className="text-[10px] text-emerald-600 font-normal">Con afinador</span>
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

            {/* Checkbox guardar en el banco */}
            <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <input
                type="checkbox"
                id="saveToBank"
                checked={saveToBankChecked}
                onChange={(e) => setSaveToBankChecked(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="saveToBank" className="text-xs text-slate-700 cursor-pointer select-none">
                <span className="font-bold text-slate-900 block">Guardar o actualizar cambios en el Banco Central de Canciones</span>
                <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                  (Opcional / Desmarcado por defecto): Al seleccionar canciones del banco para armar el culto, no se duplicarán en el banco. Marca esta casilla solo si deseas sobreescribir la canción maestra con nuevos datos.
                </span>
              </label>
            </div>

            {/* Tonalidad con botones rápidos */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Tonalidad a tocar en este culto: <strong>{newKey || 'Sin tono'}</strong>
              </label>
              <div className="flex flex-wrap gap-1 mb-2">
                {COMMON_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setNewKey(k)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                      newKey === k
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Otro tono (ej. Sol menor)"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Tono original (opcional)"
                  value={newOriginalKey}
                  onChange={(e) => setNewOriginalKey(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Notas opcionales */}
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

                  {/* Barra de botones rápidos para escribir compases y notas de paso */}
                  <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-100 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 mr-1">Insertar:</span>
                    
                    {/* Secciones */}
                    <button
                      type="button"
                      onClick={() => setNewChordChart(prev => prev + (prev ? '\n\n' : '') + '[INTRO]\n| ')}
                      className="px-2 py-0.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[11px] font-bold text-slate-700"
                    >
                      [INTRO]
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewChordChart(prev => prev + (prev ? '\n\n' : '') + '[VERSO]\n| ')}
                      className="px-2 py-0.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[11px] font-bold text-slate-700"
                    >
                      [VERSO]
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewChordChart(prev => prev + (prev ? '\n\n' : '') + '[CORO]\n|: ')}
                      className="px-2 py-0.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[11px] font-bold text-slate-700"
                    >
                      [CORO]
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewChordChart(prev => prev + (prev ? '\n\n' : '') + '[PUENTE]\n| ')}
                      className="px-2 py-0.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[11px] font-bold text-slate-700"
                    >
                      [PUENTE]
                    </button>

                    <span className="text-slate-300">|</span>

                    {/* Barras de compás */}
                    <button
                      type="button"
                      onClick={() => setNewChordChart(prev => prev + ' | ')}
                      className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] font-black font-mono"
                      title="Barra de compás"
                    >
                      |
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewChordChart(prev => prev + '|: ')}
                      className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] font-black font-mono"
                      title="Inicio de repetición"
                    >
                      |:
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewChordChart(prev => prev + ' :| (x2)')}
                      className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] font-black font-mono"
                      title="Fin de repetición"
                    >
                      :| (x2)
                    </button>

                    <span className="text-slate-300">|</span>

                    {/* NOTAS DE PASO Y CORTES */}
                    <button
                      type="button"
                      onClick={() => setNewChordChart(prev => prev + ' (D#dim paso) ')}
                      className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-[11px] font-black"
                      title="Insertar Nota de Paso entre paréntesis"
                    >
                      + (Nota de Paso)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewChordChart(prev => prev + ' -> [CORTE] ')}
                      className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded text-[11px] font-black"
                    >
                      ✂️ CORTE
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewChordChart(prev => prev + ' -> [STOP] ')}
                      className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded text-[11px] font-black"
                    >
                      🛑 STOP
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    placeholder={`Ejemplo:\n[INTRO]\n|: G | Em7 | C2 | D4 :| (x2)\n\n[VERSO 1]\n| G | Em7 | C2 | (D#dim paso) | Em7 | -> CORTE en 4to tiempo\n\n[CORO]\n|: G | D/F# | Em7 | C2 :|`}
                    value={newChordChart}
                    onChange={(e) => setNewChordChart(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-500">
                    💡 <strong>Tip para Músicos:</strong> Las notas entre paréntesis como <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-800 font-bold">(D#dim)</code> se reconocen automáticamente como <strong>notas de paso</strong> y se trasladan solas si cambias de tono.
                  </p>
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
