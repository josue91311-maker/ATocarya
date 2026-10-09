import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceDate, SongItem, SlotConfig } from '../types';
import { 
  Music, 
  Play, 
  ExternalLink, 
  Share2, 
  Clock, 
  Users, 
  AlertCircle, 
  Copy, 
  Check, 
  Sliders, 
  FileText, 
  FileCheck, 
  Headphones, 
  Link as LinkIcon,
  MoreVertical,
  ChevronDown,
  Menu,
  Sparkles,
  X,
  ArrowLeft
} from 'lucide-react';
import { Logo } from './Logo';
import { AudioTransposerPlayer } from './AudioTransposerPlayer';
import { 
  getYouTubeEmbedUrl, 
  getYouTubeThumbnailUrl, 
  getExternalMusicToolLinks 
} from '../utils/youtubeUtils';
import { 
  transposeChordChartText, 
  transposeChord, 
  parseChordChart,
  getChordDetails,
  hasChordProNotation,
  parseChordPro
} from '../utils/chordTransposer';

interface Props {
  serviceId: string;
  onGoToPortal?: () => void;
}

export const PublicSetlistView: React.FC<Props> = ({ serviceId, onGoToPortal }) => {
  const { services, songBank, musicianUser } = useApp();
  const service = services.find(s => s.id === serviceId) || null;

  const [activeSongIndex, setActiveSongIndex] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'pdf' | 'chords'>('lyrics');
  const [mobileOpenAccordion, setMobileOpenAccordion] = useState<'lyrics' | 'pdf' | 'chords' | null>('lyrics');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [transposeDelta, setTransposeDelta] = useState<number>(0);
  const [inspectedChord, setInspectedChord] = useState<string | null>(null);
  const [chordProMode, setChordProMode] = useState<'with-chords' | 'lyrics-only'>('with-chords');
  const [showChordNotesAlways, setShowChordNotesAlways] = useState<boolean>(false);

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7F4EF]">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-card border border-[#E5E8EA]">
          <AlertCircle className="w-12 h-12 text-[#89939C] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#202C37] font-display">Culto no encontrado</h2>
          <p className="text-xs text-[#64717C] mt-1">
            El enlace al repertorio no es válido o la fecha fue reprogramada.
          </p>
          {onGoToPortal && (
            <button
              onClick={onGoToPortal}
              className="mt-5 px-5 py-2.5 bg-[#315F6D] hover:bg-[#264F5D] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              Ir al Portal Principal
            </button>
          )}
        </div>
      </div>
    );
  }

  // Validación de usuario bloqueado para este culto
  if (musicianUser && (service.blockedMusicianIds || []).includes(musicianUser.id)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7F4EF]">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-card border border-[#E5E8EA]">
          <AlertCircle className="w-12 h-12 text-[#C96B65] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#202C37] font-display">Acceso Restringido</h2>
          <p className="text-xs text-[#64717C] mt-2">
            No tienes permiso para ver el repertorio ni las canciones publicadas de este culto.
          </p>
          {onGoToPortal && (
            <button
              onClick={onGoToPortal}
              className="mt-5 px-5 py-2.5 bg-[#315F6D] hover:bg-[#264F5D] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              Ir al Portal Principal
            </button>
          )}
        </div>
      </div>
    );
  }

  const [year, month, day] = service.date.split('-');
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
  const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
  const monthName = dateObj.toLocaleDateString('es-ES', { month: 'long' });
  const fullDateStr = `${dayName}, ${day} de ${monthName} de ${year}`;

  const songs = service.songs || [];
  const isPublished = Boolean(service.isSongsPublished && songs.length > 0);
  const activeSong: SongItem | undefined = songs[activeSongIndex] || songs[0];

  // Buscar coincidencia en el Banco de Canciones
  const bankMatch = activeSong 
    ? songBank.find(b => b.title.trim().toLowerCase() === activeSong.title.trim().toLowerCase()) 
    : undefined;

  const effectiveAudioUrl = activeSong?.audioUrl || bankMatch?.audioUrl;
  const effectiveOriginalKey = activeSong?.originalKey || bankMatch?.originalKey;
  const effectiveTargetKey = activeSong?.key || bankMatch?.defaultKey;
  const effectiveChordsUrl = activeSong?.chordsUrl || bankMatch?.chordsUrl;
  const effectiveChordChart = (activeSong?.chordChart && activeSong.chordChart.trim()) 
    ? activeSong.chordChart 
    : (bankMatch?.chordChart && bankMatch.chordChart.trim()) 
    ? bankMatch.chordChart 
    : undefined;
  const effectiveLyrics = (activeSong?.lyrics && activeSong.lyrics.trim()) 
    ? activeSong.lyrics 
    : (bankMatch?.lyrics && bankMatch.lyrics.trim()) 
    ? bankMatch.lyrics 
    : undefined;

  const directorName = service.slots?.voz_director?.musicianName;
  const activeVideoUrl = activeSong ? getYouTubeEmbedUrl(activeSong.youtubeUrl || bankMatch?.youtubeUrl) : null;
  const toolLinks = activeSong ? getExternalMusicToolLinks(activeSong.title, activeSong.key) : null;

  const hasChords = Boolean(effectiveChordChart && effectiveChordChart.trim());
  const hasLyrics = Boolean(effectiveLyrics && effectiveLyrics.trim());
  const hasPdf = Boolean(effectiveChordsUrl && effectiveChordsUrl.trim());

  // Limpiar acorde inspeccionado al cambiar de alabanza
  useEffect(() => {
    setInspectedChord(null);
  }, [activeSongIndex]);

  // Cifrado transpuesto dinámico
  const rawChordChart = effectiveChordChart || '';
  const transposedChartText = transposeDelta !== 0 
    ? transposeChordChartText(rawChordChart, transposeDelta)
    : rawChordChart;
  const parsedSections = parseChordChart(transposedChartText);

  // Desglose armónico inteligente del acorde seleccionado (Tonal.js)
  const inspectedChordDetails = useMemo(() => {
    if (!inspectedChord) return null;
    return getChordDetails(inspectedChord);
  }, [inspectedChord]);

  // Detección y parseo de formato ChordPro
  const isChordPro = useMemo(() => {
    return hasChordProNotation(effectiveLyrics || '');
  }, [effectiveLyrics]);

  const parsedChordPro = useMemo(() => {
    if (!isChordPro || !effectiveLyrics) return null;
    return parseChordPro(effectiveLyrics, transposeDelta);
  }, [isChordPro, effectiveLyrics, transposeDelta]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      prompt('Copia este enlace para compartir:', window.location.href);
    }
  };

  const handleShareWhatsApp = () => {
    const lines: string[] = [];
    lines.push('🎵 *REPERTORIO OFICIAL DE ALABANZA*');
    lines.push(`📅 *${service.title}* (${fullDateStr})`);
    lines.push(`⏰ Culto: ${service.time} ${service.rehearsalTime ? `· Ensayo: ${service.rehearsalTime}` : ''}`);

    if (directorName) {
      lines.push(`🎤 *Director de Alabanza:* ${directorName}`);
    }
    lines.push('──────────────────────────────');

    const confirmedSlots = (Object.values(service.slots || {}) as SlotConfig[])
      .filter(slot => slot.enabled !== false && Boolean(slot.musicianId));

    if (confirmedSlots.length > 0) {
      lines.push('*Equipo Confirmado:*');
      confirmedSlots.forEach(slot => {
        lines.push(`• ${slot.label}: ✅ *${slot.musicianName}*`);
      });
      lines.push('──────────────────────────────');
    }

    if (songs.length > 0) {
      lines.push('🎵 *Canciones & Tonalidades:*');
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
      lines.push('──────────────────────────────');
    }

    lines.push('👉 *Escuchar canciones, ver videos y acordes aquí:*');
    lines.push(window.location.href);

    const msg = lines.join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Video Slot para pasar a AudioTransposerPlayer
  const videoElement = (
    <div className="aspect-video w-full bg-slate-950 rounded-2xl overflow-hidden shadow-sm relative group">
      {activeVideoUrl ? (
        <iframe
          src={activeVideoUrl}
          title={activeSong?.title || 'Video de referencia'}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-900">
          <Music className="w-10 h-10 mb-2 text-slate-600" />
          <p className="text-xs font-bold text-slate-300">Sin video de referencia</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Esta canción no cuenta con enlace de YouTube.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-slate-900 flex flex-col selection:bg-[#315F6D]/20">
      
      {/* 1. Header Superior Moderno */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5E8EA] shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          
          {/* Logo y Botón Volver */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                if (onGoToPortal) {
                  onGoToPortal();
                } else if (window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.hash = '#/';
                }
              }}
              className="p-1.5 sm:px-3 sm:py-1.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Volver</span>
            </button>
            <Logo size="sm" showText={true} />
          </div>

          {/* Badge Central Desktop */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#D9E9EB]/60 text-[#315F6D] border border-[#315F6D]/20 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#E8B844] animate-pulse"></span>
            <span>REPERTORIO OFICIAL</span>
          </div>

          {/* Acciones Derecha */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="hidden sm:flex px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold items-center gap-1.5 transition-colors shadow-2xs"
              title="Copiar enlace del repertorio"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedLink ? '¡Copiado!' : 'Copiar Link'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-1.5 bg-[#315F6D] hover:bg-[#264F5D] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Compartir por WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="sm:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              title="Copiar enlace"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Menú desplegable móvil */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2 shadow-lg animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pb-2 border-b border-slate-100">
              <span>{service.title}</span>
              <span className="text-[#315F6D] font-bold">Oficial</span>
            </div>
            <button
              onClick={() => {
                handleCopyLink();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2"
            >
              <Copy className="w-4 h-4 text-slate-500" />
              <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar enlace directo'}</span>
            </button>
            {onGoToPortal && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGoToPortal();
                }}
                className="w-full text-left py-2 px-3 text-xs font-bold text-[#315F6D] hover:bg-[#FAF9F6] rounded-xl flex items-center gap-2"
              >
                <span>Acceder al Portal de Músicos</span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 pb-20 space-y-5 sm:space-y-6">

        {/* 2. Hero Banner del Culto (Diseño Petróleo Editorial) */}
        <div className="relative rounded-3xl overflow-hidden bg-[#315F6D] text-white p-5 sm:p-7 shadow-card border border-[#234A57]">
          {/* Fondo sutil de concierto */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity pointer-events-none"
            style={{ backgroundImage: 'url("/app-bg.jpg")' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#234A57] via-[#315F6D]/95 to-[#315F6D]/80 pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-[#FFF1CB] border border-white/30 font-display">
                  REPERTORIO OFICIAL
                </span>
                <span className="text-xs font-semibold text-slate-200 capitalize">
                  {fullDateStr}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
                {service.title}
              </h1>
              <div className="flex items-center gap-4 text-xs text-slate-200 pt-1 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#E8B844]" />
                  Culto: <strong className="text-white">{service.time}</strong>
                </span>
                {service.rehearsalTime && (
                  <span className="flex items-center gap-1.5">
                    <Headphones className="w-3.5 h-3.5 text-[#E8B844]" />
                    Ensayo: <strong className="text-white">{service.rehearsalTime}</strong>
                  </span>
                )}
                {directorName && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#E8B844]" />
                    Director: <strong className="text-white">{directorName}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Tarjeta flotante glassmorphism con contador */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 flex items-center gap-3 shrink-0 self-start sm:self-auto">
              <Music className="w-7 h-7 sm:w-8 sm:h-8 text-[#E8B844]" />
              <div>
                <span className="text-2xl sm:text-3xl font-black text-white leading-none block">
                  {songs.length}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-200 font-medium block">
                  alabanzas programadas
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Selector de Alabanzas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm sm:text-base font-bold text-[#202C37] flex items-center gap-2 font-display">
              <Music className="w-4 h-4 text-[#315F6D]" />
              <span>Repertorio ({songs.length} alabanzas)</span>
            </h2>
            <div className="text-xs text-slate-500 font-semibold px-3 py-1 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="hidden sm:inline">Orden personalizado ⌵</span>
              <span className="sm:hidden">Orden ⌵</span>
            </div>
          </div>

          {/* Grilla de Canciones: Horizontal en PC, Lista vertical en Móvil */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {songs.map((song, index) => {
              const isActive = index === activeSongIndex;
              const match = songBank.find(b => b.title.trim().toLowerCase() === song.title.trim().toLowerCase());
              const thumb = getYouTubeThumbnailUrl(song.youtubeUrl || match?.youtubeUrl);
              const songHasAudio = Boolean(song.audioUrl || match?.audioUrl);
              const songHasChords = Boolean(song.chordChart || song.chordsUrl || match?.chordChart || match?.chordsUrl);

              return (
                <button
                  key={song.id}
                  type="button"
                  onClick={() => {
                    setActiveSongIndex(index);
                    setTransposeDelta(0);
                  }}
                  className={`w-full p-3 sm:p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    isActive
                      ? 'bg-[#E4F0F0] border-2 border-[#315F6D] shadow-card ring-1 ring-[#315F6D]/30 scale-[1.01]'
                      : 'bg-white border-[#E5E8EA] hover:border-slate-300 hover:bg-[#FAF9F6]'
                  }`}
                >
                  {/* Thumbnail con icono play - Dimensiones fijas para móvil y PC */}
                  <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] sm:w-16 sm:h-16 sm:min-w-[64px] sm:min-h-[64px] sm:max-w-[64px] sm:max-h-[64px] rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0 relative flex items-center justify-center">
                    <img
                      src={thumb || '/app-bg.jpg'}
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute inset-0 flex items-center justify-center ${isActive ? 'bg-[#315F6D]/40' : 'bg-black/25'}`}>
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>

                  {/* Datos del tema */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                        isActive ? 'bg-[#315F6D] text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {index + 1}
                      </span>
                      <h3 className={`text-xs sm:text-sm font-bold truncate leading-tight ${
                        isActive ? 'text-[#202C37]' : 'text-[#202C37]'
                      }`}>
                        {song.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {song.key && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                          song.originalKey && song.key.trim().toLowerCase() !== song.originalKey.trim().toLowerCase()
                            ? 'bg-[#315F6D] text-white shadow-2xs'
                            : 'bg-[#D9E9EB] text-[#315F6D]'
                        }`}>
                          Tono: {song.key}
                        </span>
                      )}
                      {song.originalKey && (!song.key || song.key.trim().toLowerCase() !== song.originalKey.trim().toLowerCase()) && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          (orig: {song.originalKey})
                        </span>
                      )}
                      {songHasAudio && (
                        <span title="Pista disponible">
                          <Headphones className="w-3.5 h-3.5 text-slate-400" />
                        </span>
                      )}
                      {songHasChords && (
                        <span title="Cifrado / Acordes disponibles">
                          <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3 puntos */}
                  <div className="shrink-0 text-slate-400 p-1 hover:text-slate-600">
                    <MoreVertical className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Reproductor Embebido de Video + Transpositor WSOLA + Barra de Audio */}
        {activeSong && (
          <AudioTransposerPlayer
            audioUrl={effectiveAudioUrl}
            songTitle={activeSong.title}
            originalKey={effectiveOriginalKey}
            targetKey={effectiveTargetKey}
            baseKey={effectiveOriginalKey || effectiveTargetKey}
            thumbnailUrl={getYouTubeThumbnailUrl(activeSong.youtubeUrl || bankMatch?.youtubeUrl) || '/app-bg.jpg'}
            videoSlot={videoElement}
          />
        )}

        {/* 5. Documentos del tema: Letras, Cifrados y Partituras PDF */}
        <div className="space-y-3">
          
          {/* VISTA ESCRITORIO (Tabs horizontales) */}
          <div className="hidden sm:block space-y-4">
            <div className="flex items-center gap-2 p-1.5 bg-[#FAF9F6] border border-[#E5E8EA] rounded-2xl w-fit">
              {hasLyrics && (
                <button
                  type="button"
                  onClick={() => setActiveTab('lyrics')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    activeTab === 'lyrics'
                      ? 'bg-white text-[#315F6D] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Letra</span>
                </button>
              )}

              {hasPdf && (
                <button
                  type="button"
                  onClick={() => setActiveTab('pdf')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    activeTab === 'pdf'
                      ? 'bg-white text-[#315F6D] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Visor PDF</span>
                </button>
              )}

              {hasChords && (
                <button
                  type="button"
                  onClick={() => setActiveTab('chords')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    activeTab === 'chords'
                      ? 'bg-white text-[#315F6D] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Music className="w-4 h-4" />
                  <span>Cifrado & Compases</span>
                </button>
              )}
            </div>

            {/* Contenedor del documento activo */}
            <div className="bg-white border border-[#E5E8EA] rounded-2xl p-6 shadow-card">
              {activeTab === 'lyrics' && hasLyrics && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-[#202C37] uppercase tracking-wider font-display">
                      Letra Oficial
                    </h3>
                    {isChordPro && (
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setChordProMode('with-chords')}
                          className={`px-2.5 py-1 rounded-lg transition-all ${
                            chordProMode === 'with-chords'
                              ? 'bg-white text-[#315F6D] shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Con Acordes
                        </button>
                        <button
                          type="button"
                          onClick={() => setChordProMode('lyrics-only')}
                          className={`px-2.5 py-1 rounded-lg transition-all ${
                            chordProMode === 'lyrics-only'
                              ? 'bg-white text-[#315F6D] shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Solo Letra
                        </button>
                      </div>
                    )}
                  </div>

                  {isChordPro && parsedChordPro && chordProMode === 'with-chords' ? (
                    <div className="space-y-3 font-mono text-sm leading-relaxed overflow-x-auto pb-2">
                      {parsedChordPro.map((line, lIdx) => {
                        if (line.type === 'empty') return <div key={lIdx} className="h-2" />;
                        if (line.type === 'section') {
                          return (
                            <div key={lIdx} className="pt-2">
                              <span className="text-xs font-black uppercase tracking-wider text-[#315F6D] bg-[#D9E9EB]/60 border border-[#315F6D]/20 px-2.5 py-0.5 rounded-lg inline-block font-sans">
                                {line.sectionTitle}
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div key={lIdx} className="flex flex-wrap items-end leading-none py-1 gap-x-1 gap-y-2">
                            {line.segments?.map((seg, sIdx) => (
                              <span key={sIdx} className="inline-flex flex-col">
                                {seg.chord ? (
                                  <span className="text-xs font-black font-mono text-[#315F6D] select-none pb-0.5 tracking-tight">
                                    {seg.chord}
                                  </span>
                                ) : (
                                  <span className="text-xs invisible select-none pb-0.5">_</span>
                                )}
                                <span className="text-sm font-sans font-medium text-slate-800 whitespace-pre">
                                  {seg.text || ' '}
                                </span>
                              </span>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-sm text-slate-800 leading-relaxed font-sans">
                      {isChordPro && chordProMode === 'lyrics-only'
                        ? effectiveLyrics?.replace(/\[[A-G](?:#|b)?[^\]]*\]/g, '').replace(/\{[^}]*\}/g, '').trim()
                        : effectiveLyrics}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'pdf' && effectiveChordsUrl && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-[#202C37] uppercase tracking-wider font-display">
                      Partitura / Visor PDF
                    </h3>
                    <a
                      href={effectiveChordsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#315F6D] hover:bg-[#264F5D] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <span>Abrir Completo</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div className="w-full h-[550px] sm:h-[650px] rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                    <iframe
                      src={
                        effectiveChordsUrl.includes('drive.google.com')
                          ? effectiveChordsUrl.replace('/view', '/preview')
                          : effectiveChordsUrl.endsWith('.pdf')
                          ? `https://docs.google.com/viewer?url=${encodeURIComponent(effectiveChordsUrl)}&embedded=true`
                          : effectiveChordsUrl
                      }
                      title="Visor de PDF"
                      className="w-full h-full border-0 bg-white"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'chords' && hasChords && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-[#202C37] uppercase tracking-wider font-display">
                      Estructura de Compases & Acordes
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowChordNotesAlways(!showChordNotesAlways)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                          showChordNotesAlways
                            ? 'bg-[#E4F0F0] text-[#315F6D] border-[#315F6D]/30 shadow-xs'
                            : 'bg-[#FAF9F6] text-slate-600 border-[#E5E8EA] hover:text-slate-900'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#315F6D]" />
                        <span>{showChordNotesAlways ? 'Ocultar Notas' : 'Ver Notas de Acordes'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Renderizado de Compases */}
                  <div className="space-y-4">
                    {parsedSections.map((sec, secIdx) => (
                      <div key={secIdx} className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 bg-[#D9E9EB]/60 text-[#315F6D] border border-[#315F6D]/20 rounded-lg text-xs font-bold uppercase tracking-wider">
                            {sec.title}
                          </span>
                          {sec.timeSignature && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-mono font-bold">
                              ⏱️ {sec.timeSignature}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          {sec.measures.map((row, rowIdx) => (
                            <div key={rowIdx} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {row.map((measure, mIdx) => (
                                <div 
                                  key={mIdx}
                                  className="p-3 rounded-xl border border-slate-200 bg-[#FAF9F6] text-center space-y-1"
                                >
                                  <div className="flex flex-wrap items-baseline gap-2 justify-center py-1">
                                    {measure.chords.map((chord, cIdx) => (
                                      <span key={cIdx} className="text-base sm:text-lg font-black font-mono text-[#202C37]">
                                        {chord}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* VISTA MÓVIL (Acordeón colapsable exactamente como en el screenshot) */}
          <div className="sm:hidden space-y-2.5">
            {/* Accordion 1: Letra */}
            {hasLyrics && (
              <div className="bg-white border border-[#E5E8EA] rounded-2xl overflow-hidden shadow-card">
                <button
                  type="button"
                  onClick={() => setMobileOpenAccordion(mobileOpenAccordion === 'lyrics' ? null : 'lyrics')}
                  className="w-full p-4 flex items-center justify-between font-bold text-xs text-[#202C37]"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#315F6D]" />
                    <span>Letra</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${mobileOpenAccordion === 'lyrics' ? 'rotate-180' : ''}`} />
                </button>
                {mobileOpenAccordion === 'lyrics' && (
                  <div className="p-4 pt-0 border-t border-slate-100">
                    <div className="whitespace-pre-wrap text-xs text-slate-700 leading-relaxed font-sans pt-3">
                      {isChordPro
                        ? effectiveLyrics?.replace(/\[[A-G](?:#|b)?[^\]]*\]/g, '').replace(/\{[^}]*\}/g, '').trim()
                        : effectiveLyrics}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Accordion 2: Visor PDF */}
            {hasPdf && (
              <div className="bg-white border border-[#E5E8EA] rounded-2xl overflow-hidden shadow-card">
                <button
                  type="button"
                  onClick={() => setMobileOpenAccordion(mobileOpenAccordion === 'pdf' ? null : 'pdf')}
                  className="w-full p-4 flex items-center justify-between font-bold text-xs text-[#202C37]"
                >
                  <span className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#315F6D]" />
                    <span>Visor PDF</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${mobileOpenAccordion === 'pdf' ? 'rotate-180' : ''}`} />
                </button>
                {mobileOpenAccordion === 'pdf' && effectiveChordsUrl && (
                  <div className="p-4 pt-0 border-t border-slate-100 space-y-2">
                    <div className="pt-3 flex justify-end">
                      <a
                        href={effectiveChordsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-[#315F6D] text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-sm"
                      >
                        <span>Abrir PDF Externo</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="w-full h-[400px] rounded-xl overflow-hidden bg-slate-900">
                      <iframe
                        src={
                          effectiveChordsUrl.includes('drive.google.com')
                            ? effectiveChordsUrl.replace('/view', '/preview')
                            : effectiveChordsUrl.endsWith('.pdf')
                            ? `https://docs.google.com/viewer?url=${encodeURIComponent(effectiveChordsUrl)}&embedded=true`
                            : effectiveChordsUrl
                        }
                        title="Visor de PDF Móvil"
                        className="w-full h-full border-0 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Accordion 3: Cifrado & Compases */}
            {hasChords && (
              <div className="bg-white border border-[#E5E8EA] rounded-2xl overflow-hidden shadow-card">
                <button
                  type="button"
                  onClick={() => setMobileOpenAccordion(mobileOpenAccordion === 'chords' ? null : 'chords')}
                  className="w-full p-4 flex items-center justify-between font-bold text-xs text-[#202C37]"
                >
                  <span className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-[#315F6D]" />
                    <span>Cifrado & Compases</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${mobileOpenAccordion === 'chords' ? 'rotate-180' : ''}`} />
                </button>
                {mobileOpenAccordion === 'chords' && (
                  <div className="p-4 pt-0 border-t border-slate-100 space-y-3 pt-3">
                    {parsedSections.map((sec, secIdx) => (
                      <div key={secIdx} className="space-y-1.5">
                        <span className="px-2 py-0.5 bg-[#D9E9EB]/60 text-[#315F6D] border border-[#315F6D]/20 rounded text-[10px] font-bold uppercase">
                          {sec.title}
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {sec.measures.map((row) =>
                            row.map((measure, mIdx) => (
                              <div key={mIdx} className="p-2 rounded-lg border border-[#E5E8EA] bg-[#FAF9F6] text-center font-mono font-bold text-xs text-[#202C37]">
                                {measure.chords.join(' - ') || '—'}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 6. Equipo Asignado */}
        <div className="bg-white border border-[#E5E8EA] rounded-2xl p-4 sm:p-5 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-[#315F6D]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#202C37] font-display">
              Equipo de Músicos Asignados
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.values(service.slots || {})
              .filter(s => s && s.enabled !== false && s.musicianId)
              .map(slot => (
                <div 
                  key={slot.key}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF9F6] border border-[#E5E8EA] text-xs flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-[#315F6D]"></span>
                  <span className="font-semibold text-[#202C37]">{slot.musicianName}</span>
                  <span className="text-[10px] text-[#64717C]">({slot.label})</span>
                </div>
              ))}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#E5E8EA] py-6 px-4 text-center bg-white">
        <p className="text-xs text-[#64717C]">
          AtocarYa · Coordinador de Músicos & Alabanza
        </p>
        {onGoToPortal && (
          <button
            onClick={onGoToPortal}
            className="mt-2 text-[11px] text-[#315F6D] hover:underline font-bold"
          >
            ← Acceder al Portal de Músicos
          </button>
        )}
      </footer>

    </div>
  );
};
