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
  PlayCircle
} from 'lucide-react';

export const SongBankPlayer: React.FC = () => {
  const { songBank } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showChords, setShowChords] = useState(false);

  // Solo canciones con audioUrl
  const audioSongs = useMemo(() => {
    return songBank.filter((song) => song.audioUrl && song.audioUrl.trim() !== '');
  }, [songBank]);

  // Filtrar por término de búsqueda
  const filteredSongs = useMemo(() => {
    if (!searchTerm.trim()) return audioSongs;
    const lowerSearch = searchTerm.toLowerCase();
    return audioSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(lowerSearch) ||
        (song.artist && song.artist.toLowerCase().includes(lowerSearch))
    );
  }, [audioSongs, searchTerm]);

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

  if (audioSongs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mb-4" />
        <h3 className="text-xl font-bold text-[#202C37] mb-2 font-display">Sin Pistas Disponibles</h3>
        <p className="text-slate-600 max-w-md text-sm">
          No hay pistas de audio cargadas en el banco de canciones. Pida al administrador que agregue URLs de Google Drive a las canciones.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="bg-white border border-[#E5E8EA] rounded-2xl shadow-card p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#D9E9EB] flex items-center justify-center text-[#315F6D]">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#202C37] font-display">
              🎧 Banco de Pistas de Audio
            </h1>
            <p className="text-sm text-[#64717C]">
              Escucha y practica las pistas del banco de canciones con transpositor de tono integrado.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Left Sidebar - Song List */}
        <div className="w-full sm:w-[40%] flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar canción o artista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 bg-white border border-[#E5E8EA] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#315F6D]/30 focus:border-[#315F6D] text-sm transition-colors shadow-card"
            />
          </div>

          {/* List */}
          <div className="bg-white border border-[#E5E8EA] rounded-2xl shadow-card overflow-hidden flex-1">
            <div className="p-3 bg-[#FAF9F6] border-b border-[#E5E8EA]">
              <h2 className="text-xs font-semibold text-[#64717C] uppercase tracking-wider font-display">
                Pistas Disponibles ({filteredSongs.length})
              </h2>
            </div>
            <div className="max-h-[40vh] sm:max-h-[60vh] overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {filteredSongs.length === 0 ? (
                <div className="p-4 text-center text-sm text-[#89939C]">
                  No se encontraron canciones que coincidan con tu búsqueda.
                </div>
              ) : (
                filteredSongs.map((song) => {
                  const isActive = song.id === selectedSongId;
                  return (
                    <button
                      key={song.id}
                      onClick={() => setSelectedSongId(song.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 ${
                        isActive
                          ? 'bg-[#E4F0F0] border-l-4 border-l-[#315F6D]'
                          : 'hover:bg-[#FAF9F6] border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className={`mt-1 ${isActive ? 'text-[#315F6D]' : 'text-[#89939C]'}`}>
                        {isActive ? <PlayCircle className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold truncate ${isActive ? 'text-[#315F6D]' : 'text-[#202C37]'}`}>
                          {song.title}
                        </h3>
                        {song.artist && (
                          <p className="text-xs text-[#64717C] truncate">{song.artist}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(song.defaultKey || song.originalKey) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9E9EB] text-[#315F6D]">
                              Tono: {song.defaultKey || song.originalKey}
                            </span>
                          )}
                          {song.bpm && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFF1CB] text-[#BD8C29]">
                              {song.bpm} BPM
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Area - Player & Details */}
        <div className="w-full sm:w-[60%]">
          {selectedSong ? (
            <div className="bg-white border border-[#E5E8EA] rounded-2xl shadow-card p-4 sm:p-6 flex flex-col gap-6">
              {/* Song Info Header */}
              <div className="flex flex-col gap-2 border-b border-[#E5E8EA] pb-4">
                <h2 className="text-2xl font-bold text-[#202C37] font-display leading-tight">
                  {selectedSong.title}
                </h2>
                {selectedSong.artist && (
                  <p className="text-[#64717C] font-medium">{selectedSong.artist}</p>
                )}
                
                {/* External Links */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSong.youtubeUrl && (
                    <a
                      href={selectedSong.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F7E3DF] text-[#C96B65] hover:bg-[#F2D4CE] rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Youtube className="w-4 h-4" />
                      Ver en YouTube
                    </a>
                  )}
                  {selectedSong.chordsUrl && (
                    <a
                      href={selectedSong.chordsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D9E9EB] text-[#315F6D] hover:bg-[#C9DFE3] rounded-lg text-xs font-semibold transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Ver Cifrado/PDF
                    </a>
                  )}
                </div>
              </div>

              {/* The Audio Player */}
              <div className="bg-[#FAF9F6] p-1 sm:p-2 rounded-2xl border border-[#E5E8EA]">
                <AudioTransposerPlayer
                  audioUrl={selectedSong.audioUrl!}
                  songTitle={selectedSong.title}
                  originalKey={selectedSong.originalKey}
                  targetKey={selectedSong.defaultKey}
                  baseKey={selectedSong.originalKey || selectedSong.defaultKey}
                />
              </div>

              {/* Collapsible Sections for Lyrics and Chords */}
              <div className="space-y-3">
                {selectedSong.lyrics && (
                  <div className="border border-[#E5E8EA] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setShowLyrics(!showLyrics)}
                      className="w-full flex items-center justify-between p-4 bg-[#FAF9F6] hover:bg-[#F1F5F5] transition-colors"
                    >
                      <div className="flex items-center gap-2 text-[#202C37] font-semibold">
                        <Mic className="w-5 h-5 text-[#315F6D]" />
                        Letra
                      </div>
                      {showLyrics ? (
                        <ChevronUp className="w-5 h-5 text-[#89939C]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#89939C]" />
                      )}
                    </button>
                    {showLyrics && (
                      <div className="p-4 bg-white border-t border-[#E5E8EA]">
                        <pre className="whitespace-pre-wrap font-sans text-sm text-[#202C37] max-h-[400px] overflow-y-auto custom-scrollbar">
                          {selectedSong.lyrics}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {selectedSong.chordChart && (
                  <div className="border border-[#E5E8EA] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setShowChords(!showChords)}
                      className="w-full flex items-center justify-between p-4 bg-[#FAF9F6] hover:bg-[#F1F5F5] transition-colors"
                    >
                      <div className="flex items-center gap-2 text-[#202C37] font-semibold">
                        <FileText className="w-5 h-5 text-[#315F6D]" />
                        Acordes / Secuencia
                      </div>
                      {showChords ? (
                        <ChevronUp className="w-5 h-5 text-[#89939C]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#89939C]" />
                      )}
                    </button>
                    {showChords && (
                      <div className="p-4 bg-white border-t border-[#E5E8EA]">
                        <pre className="whitespace-pre-wrap font-mono text-sm text-[#202C37] max-h-[400px] overflow-y-auto custom-scrollbar bg-[#FAF9F6] p-4 rounded-lg">
                          {selectedSong.chordChart}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E5E8EA] rounded-2xl shadow-card p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <Music className="w-12 h-12 text-[#89939C] mb-4" />
              <p className="text-[#64717C]">Selecciona una canción de la lista para reproducir.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
