import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BankSong } from '../types';
import { 
  Music, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  FileText, 
  ExternalLink, 
  Check, 
  X,
  FileCheck,
  Sparkles
} from 'lucide-react';

const COMMON_KEYS = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
  'Am', 'Bm', 'C#m', 'Dm', 'Em', 'F#m', 'Gm'
];

export const SongBankManager: React.FC = () => {
  const { songBank, saveBankSong, deleteBankSong } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterKey, setFilterKey] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [defaultKey, setDefaultKey] = useState('G');
  const [originalKey, setOriginalKey] = useState('');
  const [bpm, setBpm] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [chordsUrl, setChordsUrl] = useState('');
  const [chordChart, setChordChart] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'chords' | 'lyrics' | 'external'>('chords');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setArtist('');
    setDefaultKey('G');
    setOriginalKey('');
    setBpm('');
    setYoutubeUrl('');
    setAudioUrl('');
    setChordsUrl('');
    setChordChart('');
    setLyrics('');
    setNotes('');
    setIsFormOpen(false);
    setStatusMsg(null);
    setIsSaving(false);
  };

  const handleEdit = (song: BankSong) => {
    setEditingId(song.id);
    setTitle(song.title);
    setArtist(song.artist || '');
    setDefaultKey(song.defaultKey || 'G');
    setOriginalKey(song.originalKey || '');
    setBpm(song.bpm ? String(song.bpm) : '');
    setYoutubeUrl(song.youtubeUrl || '');
    setAudioUrl(song.audioUrl || '');
    setChordsUrl(song.chordsUrl || '');
    setChordChart(song.chordChart || '');
    setLyrics(song.lyrics || '');
    setNotes(song.notes || '');
    setIsFormOpen(true);
    setStatusMsg(null);
    setIsSaving(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setStatusMsg('El título de la canción es obligatorio.');
      return;
    }

    setIsSaving(true);
    setStatusMsg(null);

    try {
      const res = await saveBankSong({
        id: editingId || undefined,
        title: title.trim(),
        artist: artist.trim(),
        defaultKey: defaultKey.trim(),
        originalKey: originalKey.trim(),
        bpm: bpm ? Number(bpm) : undefined,
        youtubeUrl: youtubeUrl.trim(),
        audioUrl: audioUrl.trim(),
        chordsUrl: chordsUrl.trim(),
        chordChart: chordChart.trim(),
        lyrics: lyrics.trim(),
        notes: notes.trim(),
      });

      if (res.success) {
        resetForm();
      } else {
        setStatusMsg(res.message || 'Error al guardar canción.');
      }
    } catch (err: any) {
      setStatusMsg(err.message || 'Error al guardar en el servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, songTitle: string) => {
    if (window.confirm(`¿Deseas eliminar "${songTitle}" del banco central de canciones?`)) {
      await deleteBankSong(id);
    }
  };

  // Filtrado de canciones
  const filtered = songBank.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.artist && s.artist.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchKey = filterKey === 'all' || s.defaultKey === filterKey;
    return matchSearch && matchKey;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
              Repertorio Maestro
            </span>
            <span className="text-xs text-slate-500 font-bold tabular-nums">
              {songBank.length} canciones en la biblioteca
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 flex items-center gap-2">
            <Music className="w-6 h-6 text-emerald-600" />
            <span>Banco Central de Canciones</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Guarda canciones con sus tonalidades, cifrados de compases, enlaces de PDF/Drive y letras. Al programar cualquier culto, se autocompletarán solas.
          </p>
        </div>

        <button
          onClick={() => {
            if (isFormOpen) {
              resetForm();
            } else {
              setIsFormOpen(true);
            }
          }}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm shadow-emerald-600/20 self-end sm:self-auto"
        >
          {isFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{isFormOpen ? 'Cerrar Formulario' : 'Nueva Canción'}</span>
        </button>
      </div>

      {/* Formulario Crear / Editar Canción del Banco */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white border border-emerald-200 rounded-3xl p-5 sm:p-6 shadow-md space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>{editingId ? 'Editar Canción en el Banco' : 'Registrar Nueva Canción en el Banco'}</span>
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              ✕ Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nombre de la Canción *
              </label>
              <input
                type="text"
                placeholder="ej. La Bendición, Cuan Grande es Dios..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Artista / Autor (opcional)
              </label>
              <input
                type="text"
                placeholder="ej. Elevation Worship, Miel San Marcos"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Tonos y BPM */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Tonalidad Habitual: <strong>{defaultKey || 'Sin tono'}</strong>
            </label>
            <div className="flex flex-wrap gap-1 mb-2">
              {COMMON_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setDefaultKey(k)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                    defaultKey === k
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Otro tono (ej. Sol menor)"
                value={defaultKey}
                onChange={(e) => setDefaultKey(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="Tono original (opcional)"
                value={originalKey}
                onChange={(e) => setOriginalKey(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
              <input
                type="number"
                placeholder="BPM (tempo)"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* URLs YouTube, Audio MP3 y PDF */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Enlace de YouTube (URL de referencia)
              </label>
              <input
                type="url"
                placeholder="https://youtu.be/... o https://youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Audio / Pista MP3 (Google Drive)</span>
                <span className="text-[10px] text-emerald-600 font-normal">Con afinador</span>
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/file/d/... o .mp3"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                URL de Partitura / Cifrado (PDF / Drive)
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/... o https://lacuerda.net/..."
                value={chordsUrl}
                onChange={(e) => setChordsUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Pestañas de Cifrado y Letra */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl mb-2 max-w-sm">
              <button
                type="button"
                onClick={() => setActiveTab('chords')}
                className={`flex-1 py-1 px-3 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'chords' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-600'
                }`}
              >
                🎸 Cifrado & Compases
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('lyrics')}
                className={`flex-1 py-1 px-3 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'lyrics' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-600'
                }`}
              >
                🎤 Letra
              </button>
            </div>

            {activeTab === 'chords' ? (
              <div>
                <textarea
                  rows={5}
                  placeholder="[INTRO]&#10;|: G | Em7 | C2 | D :|&#10;&#10;[VERSO]&#10;| G | Em7 | C2 | (D#dim paso) | Em7 |"
                  value={chordChart}
                  onChange={(e) => setChordChart(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            ) : (
              <div>
                <textarea
                  rows={5}
                  placeholder="Pega aquí la letra de la canción..."
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Notas generales o dinámica
            </label>
            <input
              type="text"
              placeholder="ej. Entrada piano suave, finalizar en fade out"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {statusMsg && (
            <p className="text-xs text-rose-600 font-bold">{statusMsg}</p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isSaving ? 'Guardando...' : (editingId ? 'Guardar Cambios' : 'Registrar en Banco')}</span>
            </button>
          </div>
        </form>
      )}

      {/* Buscador y Filtros */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título o artista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <span className="text-xs text-slate-500 font-bold">Tono:</span>
          <select
            value={filterKey}
            onChange={(e) => setFilterKey(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todos los tonos</option>
            {COMMON_KEYS.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <span className="text-xs text-slate-400">|</span>
          <span className="text-xs font-bold text-slate-700 tabular-nums">
            {filtered.length} canciones
          </span>
        </div>
      </div>

      {/* Lista de Canciones en Tarjetas */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
          <Music className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {searchTerm ? 'No se encontraron coincidencias' : 'Aún no tienes canciones en el banco'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Registra tus canciones frecuentes aquí con su tonalidad y partituras para autocompletarlas automáticamente cuando programes los cultos.
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
          >
            + Registrar Primera Canción
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((song) => (
            <div
              key={song.id}
              className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 leading-tight truncate">
                      {song.title}
                    </h4>
                    {song.artist && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {song.artist}
                      </p>
                    )}
                  </div>
                  {song.defaultKey && (
                    <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-black flex-shrink-0">
                      {song.defaultKey}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  {song.bpm && (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                      {song.bpm} BPM
                    </span>
                  )}
                  {song.audioUrl && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md flex items-center gap-1">
                      🎧 Audio
                    </span>
                  )}
                  {song.chordsUrl && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md flex items-center gap-1">
                      <FileCheck className="w-3 h-3" />
                      <span>PDF</span>
                    </span>
                  )}
                  {song.chordChart && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                      🎸 Compases
                    </span>
                  )}
                  {song.lyrics && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                      🎤 Letra
                    </span>
                  )}
                  {song.youtubeUrl && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-700 rounded-md">
                      ▶️ YouTube
                    </span>
                  )}
                </div>

                {song.notes && (
                  <p className="text-[11px] text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg italic line-clamp-2">
                    {song.notes}
                  </p>
                )}
              </div>

              {/* Botones de acción */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  {song.audioUrl && (
                    <a
                      href={song.audioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:text-emerald-900 text-[11px] font-bold flex items-center gap-1"
                      title="Abrir pista de audio"
                    >
                      <span>🎧 Audio</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {song.chordsUrl && (
                    <a
                      href={song.chordsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold flex items-center gap-1"
                      title="Abrir PDF o enlace externo"
                    >
                      <span>Ver PDF</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {song.youtubeUrl && (
                    <a
                      href={song.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 hover:text-red-800 text-[11px] font-bold flex items-center gap-1"
                      title="Abrir en YouTube"
                    >
                      <span>Video</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(song)}
                    className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Editar canción del banco"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(song.id, song.title)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Eliminar del banco"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
