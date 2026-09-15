import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PitchShifter } from 'soundtouchjs';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  Sparkles, 
  AlertCircle, 
  Gauge,
  ChevronDown,
  ChevronUp,
  Radio
} from 'lucide-react';
import { transposeChord } from '../utils/chordTransposer';

interface Props {
  audioUrl: string;
  songTitle: string;
  baseKey?: string;
}

// Convertir URL de Google Drive a Stream proxy o directa
const getStreamUrl = (url: string): string => {
  const trimmed = url.trim();
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    return `/api/audio-proxy?url=${encodeURIComponent(trimmed)}`;
  }
  return trimmed;
};

// Formato mm:ss
const formatTime = (secs: number): string => {
  if (isNaN(secs) || secs < 0) return '00:00';
  const mins = Math.floor(secs / 60);
  const remainder = Math.floor(secs % 60);
  return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
};

export const AudioTransposerPlayer: React.FC<Props> = ({ audioUrl, songTitle, baseKey }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState<string>('Cargando pista...');
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Parámetros musicales
  const [semitones, setSemitones] = useState<number>(0); // -3 a +3 semitonos
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0); // 0.8x a 1.2x
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);

  // Web Audio & SoundTouch Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const pitchShifterRef = useRef<PitchShifter | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const isPlayingRef = useRef(false);
  const semitonesRef = useRef(0);
  const tempoRef = useRef(1.0);

  // Mantener refs sincronizadas para callbacks
  isPlayingRef.current = isPlaying;
  semitonesRef.current = semitones;
  tempoRef.current = playbackSpeed;

  // Obtener o inicializar AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const gain = ctx.createGain();
      gain.gain.value = isMuted ? 0 : volume;
      gain.connect(ctx.destination);
      audioContextRef.current = ctx;
      gainNodeRef.current = gain;
    }
    return { ctx: audioContextRef.current, gain: gainNodeRef.current! };
  }, [isMuted, volume]);

  // Manejador de fin de canción
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (pitchShifterRef.current) {
      try {
        pitchShifterRef.current.percentagePlayed = 0;
        pitchShifterRef.current.disconnect();
      } catch {}
    }
  }, []);

  // Carga y decodificación de audio
  useEffect(() => {
    let isCancelled = false;

    // Detener reproducción previa
    if (pitchShifterRef.current) {
      try {
        pitchShifterRef.current.disconnect();
      } catch {}
      pitchShifterRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setError(null);
    setLoadProgress('Conectando con la pista...');

    const loadAudioFile = async () => {
      try {
        const { ctx } = getAudioContext();
        const streamUrl = getStreamUrl(audioUrl);
        setLoadProgress('Descargando pista...');

        let response: Response;
        try {
          response = await fetch(streamUrl);
        } catch {
          // Fallback a URL directa si proxy no está disponible
          response = await fetch(audioUrl);
        }

        if (!response.ok) {
          throw new Error(`Error al conectar con la pista (${response.statusText})`);
        }

        const arrayBuffer = await response.arrayBuffer();
        if (isCancelled) return;

        setLoadProgress('Procesando motor WSOLA (sin cortes de batería)...');
        const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
        if (isCancelled) return;

        audioBufferRef.current = decodedBuffer;
        setDuration(decodedBuffer.duration);

        // Crear instancia de SoundTouch PitchShifter (WSOLA)
        // bufferSize 4096 ofrece el equilibrio perfecto entre latencia y fidelidad rítmica
        const shifter = new PitchShifter(ctx, decodedBuffer, 4096, handleEnded);
        shifter.pitchSemitones = semitonesRef.current;
        shifter.tempo = tempoRef.current;

        // Escuchar evento de progreso de tiempo
        shifter.on('play', (detail) => {
          if (!isCancelled) {
            setCurrentTime(detail.timePlayed);
          }
        });

        pitchShifterRef.current = shifter;
        setIsLoading(false);
      } catch (err: any) {
        if (isCancelled) return;
        console.warn('Error al decodificar audio para SoundTouch:', err);
        setError('No se pudo decodificar el archivo de audio. Puedes escucharlo abriendo el enlace directo de Google Drive.');
        setIsLoading(false);
      }
    };

    loadAudioFile();

    return () => {
      isCancelled = true;
      if (pitchShifterRef.current) {
        try {
          pitchShifterRef.current.disconnect();
        } catch {}
        pitchShifterRef.current = null;
      }
    };
  }, [audioUrl, getAudioContext, handleEnded]);

  // Actualizar volumen y mute
  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      const targetGain = isMuted ? 0 : volume;
      gainNodeRef.current.gain.setValueAtTime(targetGain, audioContextRef.current.currentTime);
    }
  }, [volume, isMuted]);

  // Control Play / Pause
  const handleTogglePlay = async () => {
    if (!pitchShifterRef.current || !gainNodeRef.current) return;

    try {
      const { ctx, gain } = getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      if (isPlaying) {
        // Pausar: desconectar el nodo de SoundTouch detiene la extracción de muestras sin perder la posición
        pitchShifterRef.current.disconnect();
        setIsPlaying(false);
      } else {
        // Reproducir: conectar el nodo de SoundTouch a gainNode para reanudar el flujo WSOLA
        pitchShifterRef.current.pitchSemitones = semitones;
        pitchShifterRef.current.tempo = playbackSpeed;
        pitchShifterRef.current.connect(gain);
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Error al alternar reproducción:', err);
    }
  };

  // Salto de posición (Seek)
  const handleSeek = (newTime: number) => {
    if (!pitchShifterRef.current || duration <= 0) return;
    const safeTime = Math.max(0, Math.min(duration, newTime));
    const percentage = safeTime / duration;
    
    pitchShifterRef.current.percentagePlayed = percentage;
    setCurrentTime(safeTime);
  };

  // Salto rápido en segundos (-5s / +5s)
  const handleSkip = (deltaSeconds: number) => {
    handleSeek(currentTime + deltaSeconds);
  };

  // Reiniciar a 0:00
  const handleReset = () => {
    handleSeek(0);
  };

  // Cambio de Tono en Semitonos (Pitch Shift WSOLA - sin desfase en batería)
  const handleSemitoneChange = (st: number) => {
    setSemitones(st);
    if (pitchShifterRef.current) {
      // SoundTouch ajusta en tiempo real el ratio de pitch preservando el tiempo y los transitorios de percusión
      pitchShifterRef.current.pitchSemitones = st;
    }
  };

  // Cambio de Velocidad (Tempo)
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (pitchShifterRef.current) {
      pitchShifterRef.current.tempo = speed;
    }
  };

  // Tono resultante calculado
  const currentKeyDisplay = (() => {
    if (!baseKey) {
      if (semitones === 0) return 'Tono Original';
      return semitones > 0 ? `+${semitones} semitonos` : `${semitones} semitonos`;
    }
    const cleanKey = baseKey.replace(/[^A-Ga-g#b]/g, '');
    const transposed = transposeChord(cleanKey, semitones);
    if (semitones === 0) return `${baseKey} (Original)`;
    return `${transposed} (${semitones > 0 ? `+${semitones}` : semitones} st)`;
  })();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 text-white shadow-2xl overflow-hidden relative transition-all">
      {/* Glow de fondo */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cabecera del reproductor con botón de colapsar para celulares */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/30">
            <Radio className={`w-5 h-5 ${isPlaying ? 'animate-pulse text-emerald-100' : ''}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Pista & Tono en Vivo
              </span>
              <span className="text-xs font-bold text-teal-300">
                {currentKeyDisplay}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white tracking-wide truncate max-w-[200px] sm:max-w-md mt-0.5">
              {songTitle}
            </h4>
          </div>
        </div>

        {/* Acciones de Cabecera: Abrir Drive y Botón Minimizar */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={audioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium items-center gap-1.5 transition-colors border border-slate-700/50"
            title="Abrir archivo en Google Drive"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Drive</span>
          </a>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-700"
            title={isCollapsed ? 'Expandir reproductor' : 'Minimizar reproductor'}
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline text-[11px]">Expandir</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline text-[11px]">Minimizar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Estado de Carga */}
      {isLoading && (
        <div className="py-6 flex flex-col items-center justify-center text-center">
          <div className="w-7 h-7 border-3 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mb-2.5" />
          <p className="text-xs text-slate-200 font-medium">{loadProgress}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Optimizando sincronización rítmica SoundTouch...</p>
        </div>
      )}

      {/* Estado de Error */}
      {error && !isLoading && (
        <div className="py-5 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-7 h-7 text-amber-400 mb-2" />
          <p className="text-xs text-amber-200 font-medium max-w-sm">{error}</p>
          <div className="mt-3">
            <a
              href={audioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir directo en Google Drive</span>
            </a>
          </div>
        </div>
      )}

      {/* REPRODUCTOR LISTO */}
      {!isLoading && !error && (
        <div className="space-y-4 pt-3">
          {/* MODO COLAPSADO (Minimalista para ver letras/acordes con el reproductor activo) */}
          {isCollapsed ? (
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-md shadow-emerald-500/20 active:scale-95 transition-transform"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>
                <div className="text-xs">
                  <div className="font-mono text-slate-300">
                    <span className="text-emerald-400 font-bold">{formatTime(currentTime)}</span>
                    <span className="text-slate-500"> / {formatTime(duration)}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    Tono: <strong className="text-emerald-400">{currentKeyDisplay}</strong>
                  </div>
                </div>
              </div>

              {/* Botón rápido para volver al tono original si está transpuesto */}
              {semitones !== 0 && (
                <button
                  type="button"
                  onClick={() => handleSemitoneChange(0)}
                  className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
                >
                  Reset Tono
                </button>
              )}
            </div>
          ) : (
            /* MODO EXPANDIDO (Controles completos) */
            <>
              {/* Barra de Progreso y Tiempo */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
                  <span className="font-bold text-emerald-400">{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div className="relative w-full h-2.5 bg-slate-800 rounded-full overflow-hidden cursor-pointer group">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={(e) => handleSeek(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-75 relative"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Controles Principales: Skip, Play/Pause, Reset, Mute */}
              <div className="flex items-center justify-between gap-3">
                {/* Salto -5s / +5s */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSkip(-5)}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors"
                    title="Retroceder 5 segundos"
                  >
                    -5s
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSkip(5)}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors"
                    title="Adelantar 5 segundos"
                  >
                    +5s
                  </button>
                </div>

                {/* Play / Pause Central */}
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-1" />
                  )}
                </button>

                {/* Reset & Volumen */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
                    title="Reiniciar desde el inicio"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
                    title={isMuted ? 'Activar audio' : 'Silenciar'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Panel de Transposición de Tono (Semitonos con algoritmo WSOLA sin trabas) */}
              <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Transpositor de Tono (WSOLA Alta Fidelidad)
                  </span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50">
                    {currentKeyDisplay}
                  </span>
                </div>

                {/* Botones de Semitonos */}
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {[-3, -2, -1, 0, 1, 2, 3].map((st) => {
                    const isSelected = semitones === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleSemitoneChange(st)}
                        className={`py-2 text-xs font-bold rounded-xl transition-all ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-300 font-extrabold'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {st === 0 ? 'Orig' : st > 0 ? `+${st}` : st}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-center">
                  El motor WSOLA mantiene la batería y percusión firmes y sincronizadas al bajar o subir de tono.
                </p>
              </div>

              {/* Selector de Velocidad */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5" />
                  Velocidad:
                </span>
                <div className="flex items-center gap-1">
                  {[0.8, 0.9, 1.0, 1.1].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => handleSpeedChange(spd)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                        playbackSpeed === spd
                          ? 'bg-teal-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
