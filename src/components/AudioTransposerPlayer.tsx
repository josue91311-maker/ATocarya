import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  Music, 
  Sparkles,
  AlertCircle,
  Clock,
  Gauge
} from 'lucide-react';
import { transposeChord } from '../utils/chordTransposer';

interface Props {
  audioUrl: string;
  songTitle: string;
  baseKey?: string;
}

export const AudioTransposerPlayer: React.FC<Props> = ({ audioUrl, songTitle, baseKey }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState<string>('Cargando pista...');
  const [error, setError] = useState<string | null>(null);

  // Controles de audio
  const [semitones, setSemitones] = useState<number>(0); // -3 a +3 semitonos
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0); // 0.8x a 1.2x
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);

  // Web Audio API refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const playStartTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Formato mm:ss
  const formatTime = (secs: number): string => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Convertir URL de Google Drive a Stream
  const getStreamUrl = (url: string): string => {
    const trimmed = url.trim();
    // Si es Google Drive, usar el proxy para evitar restricciones CORS
    if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
      return `/api/audio-proxy?url=${encodeURIComponent(trimmed)}`;
    }
    return trimmed;
  };

  // Cargar y decodificar audio en AudioBuffer
  useEffect(() => {
    let isCancelled = false;
    stopAudio();
    pausedAtRef.current = 0;
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setError(null);
    setLoadProgress('Conectando con la pista...');

    const loadAudio = async () => {
      try {
        const streamUrl = getStreamUrl(audioUrl);
        setLoadProgress('Descargando audio...');

        let response: Response;
        try {
          response = await fetch(streamUrl);
        } catch {
          // Si falla a través del proxy en desarrollo local, intentar directo
          response = await fetch(audioUrl);
        }

        if (!response.ok) {
          throw new Error(`No se pudo cargar el archivo (${response.statusText})`);
        }

        const arrayBuffer = await response.arrayBuffer();
        if (isCancelled) return;

        setLoadProgress('Decodificando frecuencias musicales...');
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContextClass();
        }
        const ctx = audioContextRef.current;

        // Decodificar el archivo de audio
        const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
        if (isCancelled) return;

        audioBufferRef.current = decodedBuffer;
        setDuration(decodedBuffer.duration);
        setIsLoading(false);
      } catch (err: any) {
        if (isCancelled) return;
        console.warn('Error al decodificar audio Web Audio API:', err);
        setError('No se pudo decodificar el archivo directamente. Puedes abrir el enlace original.');
        setIsLoading(false);
      }
    };

    loadAudio();

    return () => {
      isCancelled = true;
      stopAudio();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [audioUrl]);

  // Actualizar Gain de volumen
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Iniciar reproducción desde una posición específica
  const playFrom = (offset: number) => {
    if (!audioBufferRef.current) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContextClass();
    }
    const ctx = audioContextRef.current;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Detener nodo anterior si existía
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {}
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBufferRef.current;

    // Aplicar transposición (detune: 100 cents = 1 semitono)
    source.detune.value = semitones * 100;
    source.playbackRate.value = playbackSpeed;

    // Conectar ganancia (volumen)
    const gainNode = ctx.createGain();
    gainNode.gain.value = isMuted ? 0 : volume;
    gainNodeRef.current = gainNode;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    const safeOffset = Math.max(0, Math.min(offset, audioBufferRef.current.duration));
    source.start(0, safeOffset);
    sourceNodeRef.current = source;

    playStartTimeRef.current = ctx.currentTime;
    pausedAtRef.current = safeOffset;
    setIsPlaying(true);

    source.onended = () => {
      // Si llegó al final natural
      if (currentTime >= (audioBufferRef.current?.duration || 0) - 0.5) {
        setIsPlaying(false);
        pausedAtRef.current = 0;
        setCurrentTime(0);
      }
    };
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {}
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      // Pausar
      if (audioContextRef.current) {
        const elapsed = (audioContextRef.current.currentTime - playStartTimeRef.current) * playbackSpeed * Math.pow(2, semitones / 12);
        pausedAtRef.current = Math.min(duration, pausedAtRef.current + elapsed);
      }
      stopAudio();
    } else {
      // Reanudar
      playFrom(pausedAtRef.current);
    }
  };

  const handleSeek = (newTime: number) => {
    pausedAtRef.current = newTime;
    setCurrentTime(newTime);
    if (isPlaying) {
      playFrom(newTime);
    }
  };

  const handleSkip = (seconds: number) => {
    const nextTime = Math.max(0, Math.min(duration, currentTime + seconds));
    handleSeek(nextTime);
  };

  // Cambio de Tono en Semitonos en Vivo
  const handleSemitoneChange = (delta: number) => {
    const newSemitones = delta;
    setSemitones(newSemitones);

    if (sourceNodeRef.current && audioContextRef.current) {
      // Ajuste suave e inmediato en tiempo real
      sourceNodeRef.current.detune.setValueAtTime(newSemitones * 100, audioContextRef.current.currentTime);
    }
  };

  // Cambio de velocidad de reproducción
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (sourceNodeRef.current && audioContextRef.current) {
      sourceNodeRef.current.playbackRate.setValueAtTime(speed, audioContextRef.current.currentTime);
    }
  };

  // Loop de animación para actualizar tiempo
  useEffect(() => {
    if (!isPlaying) return;

    const updateProgress = () => {
      if (audioContextRef.current && isPlaying) {
        const elapsed = (audioContextRef.current.currentTime - playStartTimeRef.current) * playbackSpeed * Math.pow(2, semitones / 12);
        const current = Math.min(duration, pausedAtRef.current + elapsed);
        setCurrentTime(current);

        if (current >= duration) {
          setIsPlaying(false);
          pausedAtRef.current = 0;
          setCurrentTime(0);
          return;
        }
      }
      animFrameRef.current = requestAnimationFrame(updateProgress);
    };

    animFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, semitones, duration]);

  // Cálculo del Tono Resultante
  const currentKeyDisplay = (() => {
    if (!baseKey) {
      if (semitones === 0) return 'Tono Original';
      return semitones > 0 ? `+${semitones} semitono${semitones > 1 ? 's' : ''}` : `${semitones} semitono${semitones < -1 ? 's' : ''}`;
    }
    const cleanKey = baseKey.replace(/[^A-Ga-g#b]/g, '');
    const transposed = transposeChord(cleanKey, semitones);
    if (semitones === 0) return `${baseKey} (Original)`;
    return `${transposed} (${semitones > 0 ? `+${semitones}` : semitones} st)`;
  })();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-2xl overflow-hidden relative">
      {/* Glow de fondo */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-44 h-44 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/30">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide truncate max-w-xs sm:max-w-md">
              {songTitle}
            </h4>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Pista de Audio Oficial</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">{currentKeyDisplay}</span>
            </p>
          </div>
        </div>

        {/* Enlace original a Drive */}
        <a
          href={audioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700/50"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Abrir en Drive</span>
        </a>
      </div>

      {/* Estado de Carga o Error */}
      {isLoading && (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-300 font-medium">{loadProgress}</p>
          <p className="text-[11px] text-slate-500 mt-1">Preparando el motor de afinación musical...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="py-6 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
          <p className="text-xs text-amber-200 font-semibold">{error}</p>
          <div className="mt-4 flex gap-3">
            <a
              href={audioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Escuchar directo en Google Drive
            </a>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-5 pt-4">
          {/* Barra de Progreso y Tiempo */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1.5">
              <span>{formatTime(currentTime)}</span>
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

          {/* Controles Principales de Reproducción */}
          <div className="flex items-center justify-between gap-3">
            {/* Retroceder 5s */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSkip(-5)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors"
                title="Retroceder 5 segundos"
              >
                -5s
              </button>
              <button
                type="button"
                onClick={() => handleSkip(5)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors"
                title="Adelantar 5 segundos"
              >
                +5s
              </button>
            </div>

            {/* Play / Pause Principal */}
            <button
              type="button"
              onClick={handleTogglePlay}
              className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-1" />
              )}
            </button>

            {/* Botón Reiniciar y Volumen */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSeek(0)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
                title="Volver al inicio"
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

          {/* Panel de Transposición de Tono (Semitonos) */}
          <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Transpositor de Tono (Pitch Shift)
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
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-300'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {st === 0 ? 'Original' : st > 0 ? `+${st}` : st}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Ajusta el tono de la pista sin alterar el audio original para que los músicos puedan ensayar en su tonalidad.
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
        </div>
      )}
    </div>
  );
};
