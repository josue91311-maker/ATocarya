import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AudioTransposerPlayer } from './AudioTransposerPlayer';
import { BankSong } from '../types';
import { 
  Search, 
  Music, 
  Mic, 
  FileText, 
  Youtube, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Play, 
  ChevronLeft,
  Heart,
  MoreHorizontal,
  MoreVertical,
  SlidersHorizontal,
  Check
} from 'lucide-react';

// Colección curada de imágenes temáticas de adoración y culto cristiano
const WORSHIP_COVERS = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80', // Adoración manos alzadas
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=500&q=80', // Luces de concierto / adoración
  'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=500&q=80', // Guitarra acústica en culto
  'https://images.unsplash.com/photo-1520523839898-507127cd5311?auto=format&fit=crop&w=500&q=80', // Teclado / piano de alabanza
  'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&w=500&q=80', // Batería acústica
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=500&q=80', // Siluetas y escenario
  'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=500&q=80', // Atardecer adoración
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=500&q=80'  // Ambiente musical
];

// Generador determinista de cover para cada tema
const getSongCover = (songId: string, index: number = 0): string => {
  let hash = 0;
  for (let i = 0; i < songId.length; i++) {
    hash = (hash << 5) - hash + songId.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash + index) % WORSHIP_COVERS.length;
  return WORSHIP_COVERS[idx];
};

export const SongBankPlayer: React.FC = () => {
  const { songBank } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'player'>('list');
  const [filterTab, setFilterTab] = useState<'all' | 'favorites' | 'recent' | 'az'>('all');
  const [showLyrics, setShowLyrics] = useState(false);
  const [showChords, setShowChords] = useState(false);
  const [menuSongId, setMenuSongId] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  // Favoritas guardadas en localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('atocarya_favorite_songs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (songId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(songId)
        ? prev.filter(id => id !== songId)
        : [...prev, songId];
      try {
        localStorage.setItem('atocarya_favorite_songs', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Solo canciones con audioUrl
  const audioSongs = useMemo(() => {
    return songBank.filter((song) => song.audioUrl && song.audioUrl.trim() !== '');
  }, [songBank]);

  // Filtrar y ordenar según búsqueda y tab activo
  const filteredSongs = useMemo(() => {
    let result = [...audioSongs];

    // Filtro por término de búsqueda
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (song) =>
          song.title.toLowerCase().includes(lowerSearch) ||
          (song.artist && song.artist.toLowerCase().includes(lowerSearch))
      );
    }

    // Píldoras de filtro
    if (filterTab === 'favorites') {
      result = result.filter((song) => favorites.includes(song.id));
    } else if (filterTab === 'recent') {
      result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (filterTab === 'az') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [audioSongs, searchTerm, filterTab, favorites]);

  // Auto-seleccionar la primera canción si no hay ninguna seleccionada
  useEffect(() => {
    if (!selectedSongId && filteredSongs.length > 0) {
      setSelectedSongId(filteredSongs[0].id);
    }
  }, [filteredSongs, selectedSongId]);

  const selectedSong = useMemo(() => {
    return audioSongs.find((s) => s.id === selectedSongId) || null;
  }, [audioSongs, selectedSongId]);

  // Resetear secciones expandibles al cambiar de canción
  useEffect(() => {
    setShowLyrics(false);
    setShowChords(false);
  }, [selectedSongId]);

  const handleSelectSong = (song: BankSong) => {
    setSelectedSongId(song.id);
    setMobileView('player');
    setMenuSongId(null);
  };

  const handleCopy = (text: string, label: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedNotice(label);
    setMenuSongId(null);
    setTimeout(() => setCopiedNotice(null), 2500);
  };

  if (audioSongs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white border border-[#E5E8EA] rounded-2xl shadow-card text-center my-6">
        <AlertCircle className="w-12 h-12 text-[#89939C] mb-4" />
        <h3 className="text-xl font-bold text-[#202C37] mb-2 font-display">Sin Pistas Disponibles</h3>
        <p className="text-[#64717C] max-w-md text-sm">
          No hay pistas de audio cargadas en el banco de canciones. Pida al administrador que agregue URLs de Google Drive a las canciones.
        </p>
      </div>
    );
  }

  const selectedSongIndex = audioSongs.findIndex(s => s.id === selectedSongId);
  const currentCoverUrl = selectedSong ? getSongCover(selectedSong.id, selectedSongIndex >= 0 ? selectedSongIndex : 0) : '';

  // =========================================================================
  // SUB-VISTA: DETALLE DEL REPRODUCTOR (MÓVIL Y DESKTOP)
  // =========================================================================
  const renderPlayerContent = (isMobileView: boolean) => {
    if (!selectedSong) {
      return (
        <div className="bg-white border border-[#E5E8EA] rounded-2xl shadow-card p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
          <Music className="w-12 h-12 text-[#89939C] mb-4" />
          <p className="text-[#64717C]">Selecciona una canción de la lista para reproducir.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Header Hero con Portada Curvada (Especial para la vista móvil o cabecera editorial) */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-md">
          <div className="h-48 sm:h-56 w-full relative">
            <img
              src={currentCoverUrl}
              alt={selectedSong.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />

            {/* Barra superior flotante de acciones sobre la imagen */}
            <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
              {isMobileView ? (
                <button
                  type="button"
                  onClick={() => setMobileView('list')}
                  className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-colors shadow-sm cursor-pointer"
                  title="Volver a la lista"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => toggleFavorite(selectedSong.id, e)}
                  className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-colors shadow-sm cursor-pointer ${
                    favorites.includes(selectedSong.id)
                      ? 'bg-[#C96B65] text-white'
                      : 'bg-black/40 text-white hover:bg-black/60'
                  }`}
                  title="Marcar como favorita"
                >
                  <Heart className={`w-4 h-4 ${favorites.includes(selectedSong.id) ? 'fill-current' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuSongId(menuSongId === selectedSong.id ? null : selectedSong.id);
                  }}
                  className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-colors shadow-sm cursor-pointer"
                  title="Más opciones"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Curva decorativa tipo ola en la parte inferior para fusionar con la tarjeta */}
            <div className="absolute -bottom-1 left-0 right-0 overflow-hidden leading-none z-10 pointer-events-none">
              <svg
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
                className="relative block w-full h-8 text-[#FAF9F6] fill-current"
              >
                <path d="M0,0 C150,80 350,-30 500,40 C650,110 900,10 1200,45 L1200,120 L0,120 Z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Título de la Canción y Artista */}
        <div className="bg-white border border-[#E5E8EA] rounded-2xl p-4 sm:p-5 shadow-card space-y-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl sm:text-2xl font-black text-[#202C37] font-display leading-tight">
              {selectedSong.title}
            </h1>
            <p className="text-sm font-semibold text-[#64717C]">
              {selectedSong.artist || 'Artista no especificado'}
            </p>
          </div>

          {/* Botones de acción rápida: Ver en YouTube y Ver Cifrado */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {selectedSong.youtubeUrl && (
              <a
                href={selectedSong.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#F7E3DF] text-[#C96B65] hover:bg-[#F2D4CE] rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <Youtube className="w-4 h-4 text-[#C96B65]" />
                <span>Ver en YouTube</span>
              </a>
            )}
            {selectedSong.chordsUrl && (
              <a
                href={selectedSong.chordsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#D9E9EB] text-[#315F6D] hover:bg-[#C9DFE3] rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <FileText className="w-4 h-4 text-[#315F6D]" />
                <span>Ver Cifrado/PDF</span>
              </a>
            )}
          </div>
        </div>

        {/* Notificación de enlace copiado */}
        {copiedNotice && (
          <div className="bg-[#315F6D] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center justify-between shadow-card animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#E8B844]" />
              <span>{copiedNotice} copiado al portapapeles</span>
            </div>
          </div>
        )}

        {/* Menú flotante de opciones si está activo */}
        {menuSongId === selectedSong.id && (
          <div className="bg-white border border-[#E5E8EA] rounded-2xl p-2 shadow-card space-y-1 animate-in fade-in">
            <button
              onClick={(e) => toggleFavorite(selectedSong.id, e)}
              className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-[#FAF9F6] text-[#202C37] flex items-center gap-2"
            >
              <Heart className={`w-4 h-4 ${favorites.includes(selectedSong.id) ? 'text-[#C96B65] fill-[#C96B65]' : 'text-slate-400'}`} />
              <span>{favorites.includes(selectedSong.id) ? 'Quitar de Favoritas' : 'Marcar como Favorita'}</span>
            </button>
            {selectedSong.youtubeUrl && (
              <button
                onClick={(e) => handleCopy(selectedSong.youtubeUrl!, 'Enlace de YouTube', e)}
                className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-[#FAF9F6] text-[#202C37] flex items-center gap-2"
              >
                <Youtube className="w-4 h-4 text-[#C96B65]" />
                <span>Copiar enlace de YouTube</span>
              </button>
            )}
            {selectedSong.chordsUrl && (
              <button
                onClick={(e) => handleCopy(selectedSong.chordsUrl!, 'Enlace de Cifrado', e)}
                className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-[#FAF9F6] text-[#202C37] flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-[#315F6D]" />
                <span>Copiar enlace de Cifrado</span>
              </button>
            )}
          </div>
        )}

        {/* Componente del Transpositor de Audio WSOLA */}
        <div className="bg-[#FAF9F6] p-1 sm:p-2 rounded-2xl border border-[#E5E8EA]">
          <AudioTransposerPlayer
            audioUrl={selectedSong.audioUrl!}
            songTitle={selectedSong.title}
            originalKey={selectedSong.originalKey}
            targetKey={selectedSong.defaultKey}
            baseKey={selectedSong.originalKey || selectedSong.defaultKey}
            thumbnailUrl={currentCoverUrl}
          />
        </div>

        {/* Secciones colapsables de Letra y Acordes */}
        <div className="space-y-3">
          {selectedSong.lyrics && (
            <div className="border border-[#E5E8EA] bg-white rounded-2xl overflow-hidden shadow-card">
              <button
                onClick={() => setShowLyrics(!showLyrics)}
                className="w-full flex items-center justify-between p-4 bg-[#FAF9F6] hover:bg-[#F1F5F5] transition-colors"
              >
                <div className="flex items-center gap-2 text-[#202C37] font-bold text-sm">
                  <Mic className="w-4 h-4 text-[#315F6D]" />
                  <span>Letra de la Canción</span>
                </div>
                {showLyrics ? (
                  <ChevronUp className="w-4 h-4 text-[#89939C]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#89939C]" />
                )}
              </button>
              {showLyrics && (
                <div className="p-4 bg-white border-t border-[#E5E8EA]">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-[#202C37] max-h-[350px] overflow-y-auto custom-scrollbar leading-relaxed">
                    {selectedSong.lyrics}
                  </pre>
                </div>
              )}
            </div>
          )}

          {selectedSong.chordChart && (
            <div className="border border-[#E5E8EA] bg-white rounded-2xl overflow-hidden shadow-card">
              <button
                onClick={() => setShowChords(!showChords)}
                className="w-full flex items-center justify-between p-4 bg-[#FAF9F6] hover:bg-[#F1F5F5] transition-colors"
              >
                <div className="flex items-center gap-2 text-[#202C37] font-bold text-sm">
                  <FileText className="w-4 h-4 text-[#315F6D]" />
                  <span>Acordes / Secuencia</span>
                </div>
                {showChords ? (
                  <ChevronUp className="w-4 h-4 text-[#89939C]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#89939C]" />
                )}
              </button>
              {showChords && (
                <div className="p-4 bg-white border-t border-[#E5E8EA]">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-[#202C37] max-h-[350px] overflow-y-auto custom-scrollbar bg-[#FAF9F6] p-4 rounded-xl">
                    {selectedSong.chordChart}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // =========================================================================
  // SUB-VISTA: LISTA DE CANCIONES (TARJETAS EDITORIALES)
  // =========================================================================
  const renderSongList = () => {
    return (
      <div className="space-y-4">
        {/* Banner Editorial Musical */}
        <div className="relative rounded-3xl overflow-hidden shadow-card p-5 text-white bg-[#14242D] min-h-[140px] flex flex-col justify-end">
          <img
            src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80"
            alt="Worship"
            className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#14242D] via-[#14242D]/80 to-transparent" />

          <div className="relative z-10 flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#D9E9EB]/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#D9E9EB] shrink-0">
              <Music className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white font-display leading-tight">
                Banco de Pistas de Audio
              </h1>
              <p className="text-xs text-white/80 mt-1 leading-snug">
                Escucha y practica las pistas del banco de canciones con transpositor de tono integrado.
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtro */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar canción o artista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E8EA] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#315F6D]/30 focus:border-[#315F6D] shadow-card placeholder:text-slate-400 text-[#202C37]"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setFilterTab(prev => prev === 'az' ? 'all' : 'az');
            }}
            className="w-11 h-11 rounded-2xl bg-white border border-[#E5E8EA] flex items-center justify-center text-[#46516F] hover:text-[#315F6D] shadow-card transition-colors shrink-0 cursor-pointer"
            title="Ordenar alfabéticamente"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Píldoras de Filtro (Todas, Favoritas, Recientes, A-Z) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filterTab === 'all'
                ? 'bg-[#315F6D] text-white shadow-xs'
                : 'bg-white text-[#46516F] border border-[#E5E8EA] hover:bg-slate-50'
            }`}
          >
            Todas ({audioSongs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('favorites')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filterTab === 'favorites'
                ? 'bg-[#315F6D] text-white shadow-xs'
                : 'bg-white text-[#46516F] border border-[#E5E8EA] hover:bg-slate-50'
            }`}
          >
            Favoritas ({favorites.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('recent')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filterTab === 'recent'
                ? 'bg-[#315F6D] text-white shadow-xs'
                : 'bg-white text-[#46516F] border border-[#E5E8EA] hover:bg-slate-50'
            }`}
          >
            Recientes
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('az')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filterTab === 'az'
                ? 'bg-[#315F6D] text-white shadow-xs'
                : 'bg-white text-[#46516F] border border-[#E5E8EA] hover:bg-slate-50'
            }`}
          >
            A-Z
          </button>
        </div>

        {/* Lista Vertical de Tarjetas Musicales */}
        <div className="space-y-2.5">
          {filteredSongs.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#E5E8EA] rounded-2xl shadow-card text-[#89939C]">
              <Music className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">
                {filterTab === 'favorites'
                  ? 'No tienes canciones marcadas como favoritas aún.'
                  : 'No se encontraron canciones que coincidan con tu búsqueda.'}
              </p>
            </div>
          ) : (
            filteredSongs.map((song, idx) => {
              const isSelected = song.id === selectedSongId;
              const coverUrl = getSongCover(song.id, idx);
              const isFav = favorites.includes(song.id);

              return (
                <div
                  key={song.id}
                  onClick={() => handleSelectSong(song)}
                  className={`bg-white rounded-2xl border transition-all p-3 flex items-center gap-3 cursor-pointer shadow-card active:scale-[0.99] group ${
                    isSelected
                      ? 'bg-[#E4F0F0]/50 border-[#315F6D] shadow-md ring-1 ring-[#315F6D]/20'
                      : 'border-[#E5E8EA] hover:border-[#315F6D]/40 hover:bg-[#FAF9F6]'
                  }`}
                >
                  {/* Portada cuadrada con botón de reproducción circular */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-xs">
                    <img
                      src={coverUrl}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-white/95 shadow-md flex items-center justify-center text-[#315F6D]">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Datos del tema */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm truncate font-display leading-snug ${
                      isSelected ? 'text-[#315F6D]' : 'text-[#202C37]'
                    }`}>
                      {song.title}
                    </h3>
                    <p className="text-xs text-[#64717C] truncate mt-0.5 font-medium">
                      {song.artist || 'Artista no especificado'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {(song.defaultKey || song.originalKey) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#D9E9EB] text-[#315F6D]">
                          Tono: {song.defaultKey || song.originalKey}
                        </span>
                      )}
                      {song.bpm && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FFF1CB] text-[#BD8C29]">
                          {song.bpm} BPM
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones de la canción (Favorita y Opciones) */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isFav && (
                      <Heart className="w-4 h-4 text-[#C96B65] fill-[#C96B65]" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuSongId(menuSongId === song.id ? null : song.id);
                      }}
                      className="p-2 text-slate-400 hover:text-[#202C37] rounded-xl hover:bg-slate-100 transition-colors"
                      title="Opciones"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-24 max-w-7xl mx-auto">
      {/* 
        EN PANTALLAS MÓVILES (< md):
        Flujo de 2 vistas tipo Spotify:
        - Si mobileView === 'list' -> Muestra la lista de canciones completa (Foto 2)
        - Si mobileView === 'player' -> Muestra el reproductor completo a pantalla completa (Foto 3)
      */}
      <div className="block md:hidden">
        {mobileView === 'list' ? (
          renderSongList()
        ) : (
          renderPlayerContent(true)
        )}
      </div>

      {/* 
        EN PANTALLAS GRANDES / ESCRITORIO (>= md):
        Mantiene el layout de dos columnas lado a lado intacto:
        - Columna izquierda (40%): Lista de pistas con buscador y miniaturas
        - Columna derecha (60%): Reproductor completo y transpositor WSOLA
      */}
      <div className="hidden md:flex gap-6 items-start">
        <div className="w-[42%] shrink-0">
          {renderSongList()}
        </div>
        <div className="flex-1 min-w-0">
          {renderPlayerContent(false)}
        </div>
      </div>
    </div>
  );
};
