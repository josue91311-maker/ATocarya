import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceDate, SongItem, SlotConfig } from '../types';
import { 
  Music, 
  Play, 
  ExternalLink, 
  Share2, 
  Calendar, 
  Clock, 
  Users, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Check,
  Sliders,
  FileText,
  FileCheck,
  Headphones
} from 'lucide-react';
import { Logo } from './Logo';
import { AudioTransposerPlayer } from './AudioTransposerPlayer';
import { 
  extractYouTubeId, 
  getYouTubeEmbedUrl, 
  getYouTubeThumbnailUrl, 
  getExternalMusicToolLinks 
} from '../utils/youtubeUtils';
import { 
  transposeChordChartText, 
  transposeChord, 
  parseChordChart 
} from '../utils/chordTransposer';

interface Props {
  serviceId: string;
  onGoToPortal?: () => void;
}

export const PublicSetlistView: React.FC<Props> = ({ serviceId, onGoToPortal }) => {
  const { services } = useApp();
  const service = services.find(s => s.id === serviceId) || null;

  const [activeSongIndex, setActiveSongIndex] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'chords' | 'lyrics' | 'pdf' | 'audio'>('chords');
  const [transposeDelta, setTransposeDelta] = useState<number>(0);

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc]">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-slate-200">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Culto no encontrado</h2>
          <p className="text-xs text-slate-500 mt-1">
            El enlace al repertorio no es válido o la fecha fue reprogramada.
          </p>
          {onGoToPortal && (
            <button
              onClick={onGoToPortal}
              className="mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors"
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

  const directorName = service.slots?.voz_director?.musicianName;
  const activeVideoUrl = activeSong ? getYouTubeEmbedUrl(activeSong.youtubeUrl) : null;
  const toolLinks = activeSong ? getExternalMusicToolLinks(activeSong.title, activeSong.key) : null;

  const hasChords = Boolean(activeSong?.chordChart && activeSong.chordChart.trim());
  const hasLyrics = Boolean(activeSong?.lyrics && activeSong.lyrics.trim());
  const hasAudio = Boolean(activeSong?.audioUrl && activeSong.audioUrl.trim());

  // Cifrado transpuesto dinámico
  const rawChordChart = activeSong?.chordChart || '';
  const transposedChartText = transposeDelta !== 0 
    ? transposeChordChartText(rawChordChart, transposeDelta)
    : rawChordChart;
  const parsedSections = parseChordChart(transposedChartText);

  // Tono transpuesto mostrado
  const displayedKey = activeSong?.key && transposeDelta !== 0
    ? transposeChord(activeSong.key.split(' ')[0], transposeDelta)
    : activeSong?.key;

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

    // 1. Director al comienzo
    if (directorName) {
      lines.push(`🎤 *Director de Alabanza:* ${directorName}`);
    }
    lines.push('──────────────────────────────');

    // 2. Músicos confirmados (sin vacantes)
    const confirmedSlots = (Object.values(service.slots || {}) as SlotConfig[])
      .filter(slot => slot.enabled !== false && Boolean(slot.musicianId));

    if (confirmedSlots.length > 0) {
      lines.push('*Equipo Confirmado:*');
      confirmedSlots.forEach(slot => {
        lines.push(`• ${slot.label}: ✅ *${slot.musicianName}*`);
      });
      lines.push('──────────────────────────────');
    }

    // 3. Canciones con tono y URL
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

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
      
      {/* Header Superior Limpio */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" subtitle="Repertorio Oficial" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Copiar enlace"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span className="hidden sm:inline">{copiedLink ? '¡Copiado!' : 'Copiar Link'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-600/20"
              title="Compartir por WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-20 space-y-6">

        {/* Tarjeta de Cabecera del Culto */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {isPublished ? '✓ Repertorio Oficial' : 'En Preparación'}
                </span>
                <span className="text-xs font-bold text-slate-500 capitalize">
                  {fullDateStr}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black font-display text-slate-900">
                {service.title}
              </h1>
              <div className="flex items-center gap-3 text-xs text-slate-600 pt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Culto: <strong>{service.time}</strong>
                </span>
                {service.rehearsalTime && (
                  <span>· Ensayo: <strong>{service.rehearsalTime}</strong></span>
                )}
                {directorName && (
                  <span className="text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                    🎤 Director: {directorName}
                  </span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right flex-shrink-0">
              <span className="text-2xl sm:text-3xl font-black font-display text-emerald-800 tabular-nums">
                {songs.length}
              </span>
              <span className="text-xs text-slate-500 block font-medium">
                alabanzas programadas
              </span>
            </div>
          </div>
        </div>

        {/* Si el repertorio NO está publicado */}
        {!isPublished ? (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-10 sm:p-14 text-center shadow-2xs space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
              <Music className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Repertorio en Preparación</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              El Director de Alabanza o Administrador aún está seleccionando las alabanzas y tonalidades oficiales para este culto.
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold">
              Guarda este enlace o vuelve a consultarlo pronto para ensayar los videos.
            </p>
          </div>
        ) : (
          /* Si está publicado: Reproductor + Lista */
          <div className="space-y-6">

            {/* Reproductor Embebido de la Alabanza Activa */}
            {activeSong && (
              <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm">
                
                {/* Contenedor del Video */}
                {activeVideoUrl ? (
                  <div className="aspect-video w-full bg-slate-950">
                    <iframe
                      src={activeVideoUrl}
                      title={activeSong.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 border-b border-slate-200">
                    <Music className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">Sin video de referencia adjunto</p>
                    <p className="text-[11px] text-slate-500">Esta alabanza no incluye enlace de YouTube.</p>
                  </div>
                )}

                {/* Datos de la Alabanza Activa */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                          #{activeSongIndex + 1}
                        </span>
                        <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900">
                          {activeSong.title}
                        </h2>
                      </div>
                      {activeSong.notes && (
                        <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          💬 <strong>Nota del Director:</strong> {activeSong.notes}
                        </p>
                      )}
                    </div>

                    {/* Badge de Tonalidad Grande y Controles de Transposición */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-start sm:self-auto flex-shrink-0">
                      
                      {/* Control de Transposición en Vivo (+1 / -1 Semitonos) */}
                      {hasChords && (
                        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 border border-slate-200 rounded-2xl">
                          <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5">
                            Tono:
                          </span>
                          <button
                            type="button"
                            onClick={() => setTransposeDelta(prev => prev - 1)}
                            className="w-7 h-7 rounded-xl bg-white hover:bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center border border-slate-200 shadow-2xs active:scale-95 transition-all"
                            title="Bajar 1 semitono (-1)"
                          >
                            -1
                          </button>

                          <button
                            type="button"
                            onClick={() => setTransposeDelta(0)}
                            className={`px-2.5 h-7 rounded-xl font-mono text-xs font-bold flex items-center justify-center border transition-all ${
                              transposeDelta !== 0
                                ? 'bg-amber-100 text-amber-900 border-amber-300 font-black'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                            title="Restablecer al tono oficial original"
                          >
                            {displayedKey || (transposeDelta > 0 ? `+${transposeDelta}` : transposeDelta === 0 ? '0' : `${transposeDelta}`)}
                          </button>

                          <button
                            type="button"
                            onClick={() => setTransposeDelta(prev => prev + 1)}
                            className="w-7 h-7 rounded-xl bg-white hover:bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center border border-slate-200 shadow-2xs active:scale-95 transition-all"
                            title="Subir 1 semitono (+1)"
                          >
                            +1
                          </button>
                        </div>
                      )}

                      {/* Badge Tono Oficial */}
                      {activeSong.key && (
                        <div className="px-4 py-2 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center shadow-2xs">
                          <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                            Tono Oficial
                          </span>
                          <span className="text-lg font-black font-display text-emerald-950">
                            {displayedKey || activeSong.key}
                          </span>
                        </div>
                      )}

                      {activeSong.originalKey && (
                        <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                            Original
                          </span>
                          <span className="text-sm font-bold text-slate-700">
                            {activeSong.originalKey}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selector de Pestañas: Cifrado & Compases / Audio & Pista / Letra / Partitura Externa */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl max-w-lg flex-wrap">
                      {hasChords && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('chords')}
                          className={`flex-1 min-w-[120px] py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            activeTab === 'chords'
                              ? 'bg-white text-emerald-950 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Music className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Cifrado & Compases</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setActiveTab('audio')}
                        className={`flex-1 min-w-[120px] py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          activeTab === 'audio'
                            ? 'bg-white text-emerald-950 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Headphones className="w-3.5 h-3.5 text-teal-600" />
                        <span>🎧 Pista & Tono</span>
                      </button>

                      {hasLyrics && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('lyrics')}
                          className={`flex-1 min-w-[90px] py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            activeTab === 'lyrics'
                              ? 'bg-white text-emerald-950 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>Letra</span>
                        </button>
                      )}

                      {activeSong.chordsUrl && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('pdf')}
                          className={`flex-1 min-w-[90px] py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            activeTab === 'pdf'
                              ? 'bg-white text-emerald-950 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Visor PDF</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* CONTENIDO 1: VISOR DE CIFRADO ARMÓNICO Y COMPASES CON TRANSPOSE */}
                  {activeTab === 'chords' && hasChords && (
                    <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-2xl shadow-inner space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                            Estructura de Compases & Acordes
                          </span>
                          {transposeDelta !== 0 && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              Transpuesto ({transposeDelta > 0 ? `+${transposeDelta}` : transposeDelta} semitonos)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 mr-1.5 align-middle"></span>
                          <span>(Nota de Paso)</span>
                        </div>
                      </div>

                      {/* Renderizado de Bloques por Sección y Grilla de Compases */}
                      <div className="space-y-4">
                        {parsedSections.map((sec, secIdx) => (
                          <div key={secIdx} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 rounded-lg text-xs font-black uppercase tracking-wider">
                                {sec.title}
                              </span>
                              {sec.notes && (
                                <span className="text-xs text-slate-400 italic">
                                  {sec.notes}
                                </span>
                              )}
                            </div>

                            {/* Filas de Compases */}
                            <div className="space-y-2">
                              {sec.measures.map((row, rowIdx) => (
                                <div 
                                  key={rowIdx}
                                  className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                                >
                                  {row.map((measure, mIdx) => (
                                    <div 
                                      key={mIdx}
                                      className={`p-2.5 rounded-xl border relative transition-all ${
                                        measure.isRepeatStart || measure.isRepeatEnd
                                          ? 'border-emerald-500/80 bg-slate-800/90'
                                          : 'border-slate-800 bg-slate-800/50 hover:border-slate-700'
                                      }`}
                                    >
                                      {/* Marcador de Repetición */}
                                      {measure.isRepeatStart && (
                                        <span className="absolute left-1.5 top-1.5 text-xs font-black text-emerald-400 font-mono">
                                          |:
                                        </span>
                                      )}
                                      {measure.isRepeatEnd && (
                                        <span className="absolute right-1.5 top-1.5 text-xs font-black text-emerald-400 font-mono">
                                          :|
                                        </span>
                                      )}

                                      {/* Acordes Principales */}
                                      <div className="flex flex-wrap items-baseline gap-2 justify-center py-1">
                                        {measure.chords.map((chord, cIdx) => (
                                          <span 
                                            key={cIdx} 
                                            className="text-base sm:text-lg font-black font-mono text-emerald-300 tracking-wide"
                                          >
                                            {chord}
                                          </span>
                                        ))}

                                        {/* Notas de Paso resaltadas en Ámbar */}
                                        {measure.passingChords.map((pch, pIdx) => (
                                          <span 
                                            key={pIdx} 
                                            className="text-xs font-black font-mono px-1.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-md"
                                            title="Nota de Paso"
                                          >
                                            ({pch})
                                          </span>
                                        ))}
                                      </div>

                                      {/* Anotaciones / Cortes */}
                                      {measure.annotations.length > 0 && (
                                        <div className="text-center mt-1">
                                          {measure.annotations.map((ann, aIdx) => (
                                            <span 
                                              key={aIdx}
                                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded inline-block ${
                                                ann.toLowerCase().includes('corte') || ann.toLowerCase().includes('stop')
                                                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                                                  : 'text-slate-400'
                                              }`}
                                            >
                                              {ann}
                                            </span>
                                          ))}
                                        </div>
                                      )}
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

                  {/* CONTENIDO 2: LETRA */}
                  {activeTab === 'lyrics' && hasLyrics && (
                    <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>Letra de la Canción</span>
                      </h4>
                      <div className="whitespace-pre-wrap text-sm text-slate-800 leading-relaxed font-sans">
                        {activeSong.lyrics}
                      </div>
                    </div>
                  )}

                  {/* CONTENIDO 3: VISOR INTEGRADO DE PDF / PARTITURA */}
                  {activeTab === 'pdf' && activeSong.chordsUrl && (
                    <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between text-white border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                            Visor de Cifrado / Partitura (PDF)
                          </span>
                        </div>
                        <a
                          href={activeSong.chordsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <span>Abrir en Pestaña Completa</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Contenedor Iframe con Fallback Automático */}
                      <div className="w-full h-[550px] sm:h-[650px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative">
                        <iframe
                          src={
                            activeSong.chordsUrl.includes('drive.google.com')
                              ? activeSong.chordsUrl.replace('/view', '/preview')
                              : activeSong.chordsUrl.endsWith('.pdf')
                              ? `https://docs.google.com/viewer?url=${encodeURIComponent(activeSong.chordsUrl)}&embedded=true`
                              : activeSong.chordsUrl
                          }
                          title="Visor de PDF"
                          className="w-full h-full border-0 bg-white"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    </div>
                  )}

                  {/* CONTENIDO 4: REPRODUCTOR DE PISTA DE AUDIO CON TRANSPOSICIÓN EN VIVO */}
                  {activeTab === 'audio' && (
                    activeSong.audioUrl ? (
                      <AudioTransposerPlayer
                        audioUrl={activeSong.audioUrl}
                        songTitle={activeSong.title}
                        baseKey={activeSong.key}
                      />
                    ) : (
                      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center text-white space-y-3 shadow-xl">
                        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto">
                          <Headphones className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-white">
                          Pista de Audio con Transpositor Musical (Pitch Shift)
                        </h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                          Esta alabanza aún no tiene configurado un archivo de audio MP3 o enlace de Google Drive.
                        </p>
                        <div className="p-3.5 bg-slate-800/80 rounded-2xl max-w-md mx-auto text-left text-[11px] text-slate-300 space-y-1.5 border border-slate-700/60">
                          <p className="font-bold text-teal-400">💡 ¿Cómo activarlo para los músicos?</p>
                          <p>1. Ingresa al panel de <strong>Cultos</strong> o al <strong>Banco de Canciones</strong>.</p>
                          <p>2. Haz clic en <strong>Editar</strong> en esta alabanza.</p>
                          <p>3. Pega el enlace de Google Drive en el campo <strong>"Audio / Pista MP3 (Drive)"</strong> y guarda los cambios.</p>
                        </div>
                      </div>
                    )
                  )}

                  {/* Botones de Herramientas Musicales (Sin Moises) */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    {activeSong.youtubeUrl && (
                      <a
                        href={activeSong.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir en YouTube</span>
                      </a>
                    )}

                    {activeSong.chordsUrl && (
                      <a
                        href={activeSong.chordsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Partitura / Cifrado Oficial</span>
                      </a>
                    )}

                    {toolLinks && (
                      <>
                        <a
                          href={toolLinks.transposeExtension}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                          title="Extensión de Chrome para cambiar el tono de YouTube en vivo"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Extensión Transpose</span>
                        </a>

                        <a
                          href={toolLinks.laCuerdaSearch}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                        >
                          Ver en LaCuerda
                        </a>
                      </>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* Playlist / Lista Completa de Alabanzas */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Lista de Alabanzas del Culto ({songs.length})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {songs.map((song, index) => {
                  const isActive = index === activeSongIndex;
                  const thumb = getYouTubeThumbnailUrl(song.youtubeUrl);

                  return (
                    <div
                      key={song.id}
                      onClick={() => {
                        setActiveSongIndex(index);
                        setTransposeDelta(0);
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-sm scale-[1.01]'
                          : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-2xs'
                      }`}
                    >
                      {/* Thumbnail or Icon */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 relative flex items-center justify-center">
                        {thumb ? (
                          <img src={thumb} alt={song.title} className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-6 h-6 text-slate-400" />
                        )}
                        <div className={`absolute inset-0 flex items-center justify-center ${isActive ? 'bg-emerald-600/40' : 'bg-black/20'}`}>
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400">
                            #{index + 1}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 truncate leading-tight">
                            {song.title}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {song.key && (
                            <span className="text-[10px] font-black px-2 py-0.2 bg-emerald-100 text-emerald-900 rounded-md">
                              {song.key}
                            </span>
                          )}
                          {song.originalKey && (
                            <span className="text-[10px] text-slate-400">
                              orig: {song.originalKey}
                            </span>
                          )}
                          {song.bpm && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {song.bpm} bpm
                            </span>
                          )}
                          {song.audioUrl && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-teal-50 text-teal-800 rounded border border-teal-200">
                              🎧 Pista
                            </span>
                          )}
                          {song.chordChart && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded border border-slate-200">
                              🎸 Cifrado
                            </span>
                          )}
                          {song.lyrics && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded border border-blue-200">
                              🎤 Letra
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-300'}`} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Integrantes Confirmados en este Culto */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Equipo de Músicos Asignados
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {Object.values(service.slots || {})
                  .filter(s => s && s.enabled !== false && s.musicianId)
                  .map(slot => (
                    <div 
                      key={slot.key}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="font-semibold text-slate-800">{slot.musicianName}</span>
                      <span className="text-[10px] text-slate-500">({slot.label})</span>
                    </div>
                  ))}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/90 py-6 px-4 text-center bg-white">
        <p className="text-xs text-slate-500">
          AtocarYa · Coordinador de Músicos & Alabanza
        </p>
        {onGoToPortal && (
          <button
            onClick={onGoToPortal}
            className="mt-2 text-[11px] text-emerald-700 hover:text-emerald-800 font-bold"
          >
            ← Acceder al Portal de Músicos
          </button>
        )}
      </footer>

    </div>
  );
};
