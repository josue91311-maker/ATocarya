import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceDate, SongItem } from '../types';
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
  const { musicianUser, isAdminAuthenticated, updateServiceSongs } = useApp();

  const [songs, setSongs] = useState<SongItem[]>(() => service.songs || []);
  const [isPublished, setIsPublished] = useState<boolean>(() => Boolean(service.isSongsPublished));
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activePreviewSongId, setActivePreviewSongId] = useState<string | null>(null);

  // Estado de edición de canción existente
  const [editingSongId, setEditingSongId] = useState<string | null>(null);

  // Formulario nueva/edición canción
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newKey, setNewKey] = useState('G');
  const [newOriginalKey, setNewOriginalKey] = useState('');
  const [newBpm, setNewBpm] = useState<string>('');
  const [newNotes, setNewNotes] = useState('');
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
    setEditingSongId(song.id);
    setNewTitle(song.title);
    setNewUrl(song.youtubeUrl || '');
    setNewKey(song.key || 'G');
    setNewOriginalKey(song.originalKey || '');
    setNewBpm(song.bpm ? String(song.bpm) : '');
    setNewNotes(song.notes || '');
    setErrorMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingSongId(null);
    setNewTitle('');
    setNewUrl('');
    setNewKey('G');
    setNewOriginalKey('');
    setNewBpm('');
    setNewNotes('');
    setErrorMsg(null);
  };

  const handleAddOrUpdateSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setErrorMsg('Por favor ingresa el título de la canción.');
      return;
    }

    if (editingSongId) {
      // Actualizar canción existente
      setSongs(prev => prev.map(s => {
        if (s.id !== editingSongId) return s;
        return {
          ...s,
          title: newTitle.trim(),
          youtubeUrl: newUrl.trim() || undefined,
          key: newKey.trim() || undefined,
          originalKey: newOriginalKey.trim() || undefined,
          bpm: newBpm ? Number(newBpm) : undefined,
          notes: newNotes.trim() || undefined,
        };
      }));
      setEditingSongId(null);
    } else {
      // Agregar nueva canción
      const song: SongItem = {
        id: `song_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        title: newTitle.trim(),
        youtubeUrl: newUrl.trim() || undefined,
        key: newKey.trim() || undefined,
        originalKey: newOriginalKey.trim() || undefined,
        bpm: newBpm ? Number(newBpm) : undefined,
        notes: newNotes.trim() || undefined,
      };
      setSongs(prev => [...prev, song]);
    }

    setNewTitle('');
    setNewUrl('');
    setNewKey('G');
    setNewOriginalKey('');
    setNewBpm('');
    setNewNotes('');
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nombre de la Canción *
                </label>
                <input
                  type="text"
                  placeholder="ej. La Bendición, Way Maker, etc."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
                />
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
                Notas / Dinámica de Ensayo (opcional)
              </label>
              <input
                type="text"
                placeholder="ej. Entrada con piano solo, Coro 2 explota con batería"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
              />
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
