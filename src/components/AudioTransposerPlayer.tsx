import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
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
  Gauge 
} from 'lucide-react';
import { transposeChord } from '../utils/chordTransposer';

interface Props {
  audioUrl: string;
  songTitle: string;
  baseKey?: string;
}

// Cálculo óptimo de tamaño de ventana de correlación acústica:
// - Para frecuencias graves (bajar tono, delta < 0), se requiere una ventana más amplia (0.20s - 0.24s) para no picar las ondas del bajo y bombo, eliminando el sonido metálico y robótico.
// - Para frecuencias agudas (subir tono, delta > 0), una ventana de 0.15s - 0.18s preserva transitorios limpios.
const getOptimalWindowSize = (delta: number): number => {
  if (delta < 0) {
    return Math.min(0.24, 0.18 + Math.abs(delta) * 0.02);
  }
  if (delta > 0) {
    return Math.max(0.14, 0.18 - delta * 0.015);
  }
  return 0.18;
};

// Calibración acústica exacta de pitch shifting (corrige el defecto interno de Tone.js en intervalos negativos)
// Aplica la fórmula física real del modulador Doppler (Miller Puckette):
// - Semitono negativo (-1, -2, -3): ratio = 2^(st/12), f = (1 - ratio) / W
// - Semitono positivo (+1, +2, +3): ratio = 2^(st/12), f = (ratio - 1) / W
const setCalibratedPitch = (pitchShift: Tone.PitchShift, st: number, windowSize: number) => {
  const ps = pitchShift as any;
  if (!ps) return;

  if (st === 0) {
    pitchShift.pitch = 0;
    return;
  }

  const ratio = Math.pow(2, st / 12);
  const w = windowSize || 0.18;

  if (st < 0) {
    if (ps._lfoA && ps._lfoB) {
      ps._lfoA.min = 0;
      ps._lfoA.max = w;
      ps._lfoB.min = 0;
      ps._lfoB.max = w;
    }
    const exactFreq = (1 - ratio) / w;
    if (ps._frequency) {
      ps._frequency.value = exactFreq;
    }
    ps._pitch = st;
  } else {
    if (ps._lfoA && ps._lfoB) {
      ps._lfoA.min = w;
      ps._lfoA.max = 0;
      ps._lfoB.min = w;
      ps._lfoB.max = 0;
    }
    const exactFreq = (ratio - 1) / w;
    if (ps._frequency) {
      ps._frequency.value = exactFreq;
    }
    ps._pitch = st;
  }
};

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

  // Tone.js refs
  const toneBufferRef = useRef<Tone.ToneAudioBuffer | null>(null);
  const playerRef = useRef<Tone.Player | null>(null);
  const pitchShiftRef = useRef<Tone.PitchShift | null>(null);
  const volumeNodeRef = useRef<Tone.Volume | null>(null);
  
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
    if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
      return `/api/audio-proxy?url=${encodeURIComponent(trimmed)}`;
    }
    return trimmed;
  };

  // Cargar y decodificar audio en ToneAudioBuffer
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

        setLoadProgress('Configurando motor de transposición...');

        // Asegurar contexto de audio Tone.js
        const rawBuffer = await Tone.getContext().rawContext.decodeAudioData(arrayBuffer);
        if (isCancelled) return;

        const tBuffer = new Tone.ToneAudioBuffer(rawBuffer);
        toneBufferRef.current = tBuffer;
        setDuration(tBuffer.duration);
        setIsLoading(false);
      } catch (err: any) {
        if (isCancelled) return;
        console.warn('Error al decodificar audio:', err);
        setError('No se pudo decodificar el archivo directamente. Puedes abrir el enlace original.');
        setIsLoading(false);
      }
    };

    loadAudio();

    return () => {
      isCancelled = true;
      stopAudio();
    };
  }, [audioUrl]);

  // Actualizar volumen / mute
  useEffect(() => {
    if (volumeNodeRef.current) {
      if (isMuted) {
        volumeNodeRef.current.mute = true;
      } else {
        volumeNodeRef.current.mute = false;
        // Escala logarítmica / decibeles: 0 es silencio total (-Infinity), 1 es 0 dB
        volumeNodeRef.current.volume.value = volume <= 0 ? -100 : Tone.gainToDb(volume);
      }
    }
  }, [volume, isMuted]);

  // Iniciar reproducción desde un punto específico
  const playFrom = async (offset: number) => {
    if (!toneBufferRef.current || !toneBufferRef.current.loaded) return;

    try {
      // Iniciar el contexto de audio si estaba suspendido (política del navegador)
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
      }

      // Limpiar nodo anterior si existía
      if (playerRef.current) {
        try {
          playerRef.current.stop();
          playerRef.current.dispose();
        } catch {}
        playerRef.current = null;
      }

      // Construir o reusar la cadena de efectos Tone:
      // Player -> PitchShift (alta fidelidad acústica calibrada) -> Volume -> Destination
      const wSize = getOptimalWindowSize(semitones);
      if (!pitchShiftRef.current) {
        pitchShiftRef.current = new Tone.PitchShift({
          pitch: semitones,
          windowSize: wSize,
          delayTime: 0,
          feedback: 0
        });
      } else {
        pitchShiftRef.current.windowSize = wSize;
      }
      setCalibratedPitch(pitchShiftRef.current, semitones, wSize);

      if (!volumeNodeRef.current) {
        volumeNodeRef.current = new Tone.Volume(volume <= 0 ? -100 : Tone.gainToDb(volume));
        volumeNodeRef.current.mute = isMuted;
      }

      // Conectar: PitchShift -> Volume -> Destination
      pitchShiftRef.current.disconnect();
      pitchShiftRef.current.connect(volumeNodeRef.current);
      volumeNodeRef.current.toDestination();

      // Crear nuevo Player con el buffer cargado
      const player = new Tone.Player(toneBufferRef.current);
      player.playbackRate = playbackSpeed;

      // BYPASS TOTAL si el tono es 0 (Original):
      // Conectar directamente Player -> Volume evitando cualquier artefacto de fase o modulación granular
      if (semitones === 0) {
        player.connect(volumeNodeRef.current);
      } else {
        player.connect(pitchShiftRef.current);
      }

      const safeOffset = Math.max(0, Math.min(offset, toneBufferRef.current.duration));
      player.start(0, safeOffset);
      playerRef.current = player;

      playStartTimeRef.current = Tone.now();
      pausedAtRef.current = safeOffset;
      setIsPlaying(true);

      player.onstop = () => {
        // Solo marcar pausado si realmente terminó la duración
        if (currentTime >= (toneBufferRef.current?.duration || 0) - 0.5) {
          setIsPlaying(false);
          pausedAtRef.current = 0;
          setCurrentTime(0);
        }
      };
    } catch (err) {
      console.error('Error al iniciar Tone.Player:', err);
    }
  };

  const stopAudio = () => {
    if (playerRef.current) {
      try {
        playerRef.current.stop();
        playerRef.current.dispose();
      } catch {}
      playerRef.current = null;
    }
    setIsPlaying(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      // Pausar y registrar segundo actual
      const elapsed = (Tone.now() - playStartTimeRef.current) * playbackSpeed;
      pausedAtRef.current = Math.min(duration, pausedAtRef.current + elapsed);
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

  // Cambio de Tono en Semitonos (Pitch Shift sin alterar la velocidad)
  const handleSemitoneChange = (delta: number) => {
    setSemitones(delta);
    if (pitchShiftRef.current && volumeNodeRef.current) {
      const wSize = getOptimalWindowSize(delta);
      pitchShiftRef.current.windowSize = wSize;
      setCalibratedPitch(pitchShiftRef.current, delta, wSize);

      // Si el reproductor está activo, conmutar la ruta de señal en caliente
      if (playerRef.current) {
        playerRef.current.disconnect();
        if (delta === 0) {
          // Retorno a Original: Bypass directo a Volume (audio 100% puro original sin procesamiento)
          playerRef.current.connect(volumeNodeRef.current);
        } else {
          // Con transposición activa: enrutar a través de PitchShift de alta fidelidad calibrado
          playerRef.current.connect(pitchShiftRef.current);
        }
      }
    }
  };

  // Cambio de velocidad de reproducción (Tempo independiente)
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (playerRef.current) {
      // Ajustar posición base para que el cálculo de tiempo transcurrido sea exacto
      const elapsed = (Tone.now() - playStartTimeRef.current) * playbackSpeed;
      pausedAtRef.current = Math.min(duration, pausedAtRef.current + elapsed);
      playStartTimeRef.current = Tone.now();
      playerRef.current.playbackRate = speed;
    }
  };

  // Loop de animación para actualizar tiempo de progreso
  useEffect(() => {
    if (!isPlaying) return;

    const updateProgress = () => {
      if (isPlaying) {
        // Nota: la duración y el progreso avanzan según la velocidad de reproducción,
        // completamente INDEPENDIENTES de la transposición de tono (PitchShift).
        const elapsed = (Tone.now() - playStartTimeRef.current) * playbackSpeed;
        const current = Math.min(duration, pausedAtRef.current + elapsed);
        setCurrentTime(current);

        if (current >= duration && duration > 0) {
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
  }, [isPlaying, playbackSpeed, duration]);

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
