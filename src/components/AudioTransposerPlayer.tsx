import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PitchShifter } from 'soundtouchjs';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw,
  Volume2, 
  VolumeX, 
  ExternalLink, 
  AlertCircle, 
  Activity,
  Music,
  Gauge
} from 'lucide-react';
import { 
  transposeChord, 
  calculateSemitoneDistance, 
  formatSemitoneShiftDescription 
} from '../utils/chordTransposer';

interface Props {
  audioUrl?: string;
  songTitle: string;
  originalKey?: string; // Tonalidad original en la que está grabado el audio/pista (ej. "A", "B")
  targetKey?: string;   // Tonalidad oficial requerida para el culto (ej. "A", "Bb")
  baseKey?: string;     // Retrocompatibilidad si solo se pasa un tono
  thumbnailUrl?: string; // Miniatura del tema
  videoSlot?: React.ReactNode; // Elemento de video para colocar a la izquierda en desktop (o arriba en mobile)
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
  if (isNaN(secs) || secs < 0) return '0:00';
  const mins = Math.floor(secs / 60);
  const remainder = Math.floor(secs % 60);
  return `${mins}:${remainder.toString().padStart(2, '0')}`;
};

export const AudioTransposerPlayer: React.FC<Props> = ({ 
  audioUrl, 
  songTitle, 
  originalKey, 
  targetKey, 
  baseKey,
  thumbnailUrl,
  videoSlot
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState<string>('Cargando pista...');
  const [error, setError] = useState<string | null>(null);

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

  // Determinar la tonalidad original de la pista de audio grabada
  const audioOriginalKey = originalKey?.trim() || (!targetKey ? baseKey?.trim() : undefined) || baseKey?.trim() || 'A';
  // Determinar la tonalidad oficial requerida para el culto
  const worshipTargetKey = targetKey?.trim() || (!originalKey ? baseKey?.trim() : undefined) || audioOriginalKey;

  // Distancia en semitonos entre el audio grabado y el tono requerido para el culto (ej: B -> Bb = -1 st)
  const worshipDelta = (audioOriginalKey && worshipTargetKey)
    ? calculateSemitoneDistance(audioOriginalKey, worshipTargetKey)
    : 0;

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
    setError(null);

    if (!audioUrl || !audioUrl.trim()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
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

        setLoadProgress('Procesando motor WSOLA...');
        const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
        if (isCancelled) return;

        audioBufferRef.current = decodedBuffer;
        setDuration(decodedBuffer.duration);

        // Crear instancia de SoundTouch PitchShifter (WSOLA)
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
        setError('No se pudo cargar la pista. Abre el enlace directo en Google Drive.');
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
        pitchShifterRef.current.disconnect();
        setIsPlaying(false);
      } else {
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

  // Cambio de Tono en Semitonos (Pitch Shift WSOLA)
  const handleSemitoneChange = (st: number) => {
    setSemitones(st);
    if (pitchShifterRef.current) {
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
    if (!audioOriginalKey) {
      return semitones === 0 ? 'Original' : `${semitones > 0 ? `+${semitones}` : semitones} st`;
    }
    const cleanKey = audioOriginalKey.replace(/[^A-Ga-g#b]/g, '');
    const transposed = transposeChord(cleanKey, semitones);
    return semitones === 0 ? `${audioOriginalKey} (Original)` : `${transposed} (${semitones > 0 ? `+${semitones}` : semitones} st)`;
  })();

  // 7 semitones range: -3, -2, -1, 0, 1, 2, 3
  const semitonesList = [-3, -2, -1, 0, 1, 2, 3];

  // Componente: Tarjeta del Transpositor
  const transpositorCard = (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between h-full">
      {/* Header del Transpositor */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#1E74FD]" />
          <h3 className="text-xs sm:text-xs md:text-sm font-bold tracking-tight text-[#0B132B] uppercase">
            Transpositor de Afinación (WSOLA Alta Fidelidad)
          </h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FF7E22]/10 text-[#FF7E22] border border-[#FF7E22]/20">
          {audioOriginalKey} (Original)
        </span>
      </div>

      {/* Botones de Semitonos (-3 a +3) */}
      <div className="py-3">
        {isLoading ? (
          <div className="py-6 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-[#1E74FD]/20 border-t-[#1E74FD] rounded-full animate-spin mx-auto mb-2" />
            {loadProgress}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {semitonesList.map((st) => {
              const isSelected = semitones === st;
              const cleanKey = audioOriginalKey.replace(/[^A-Ga-g#b]/g, '');
              const noteAtSt = cleanKey ? transposeChord(cleanKey, st) : '';
              const label = st === 0 ? 'orig (0)' : st > 0 ? `+${st} st` : `${st} st`;

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleSemitoneChange(st)}
                  className={`py-2 px-1 text-center rounded-xl transition-all flex flex-col items-center justify-center min-h-[52px] ${
                    isSelected
                      ? 'bg-[#1E74FD] text-white shadow-sm font-bold ring-2 ring-[#1E74FD]/30 scale-[1.02]'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 font-semibold'
                  }`}
                  title={`Transportar ${label}`}
                >
                  <span className="text-xs sm:text-sm font-bold leading-tight">
                    {noteAtSt || (st === 0 ? 'Orig' : st)}
                  </span>
                  <span className={`text-[9px] sm:text-[10px] leading-tight mt-0.5 font-medium ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <p className="text-[11px] text-slate-400 text-center mt-3 font-normal">
          El motor WSOLA mantiene el ritmo y percusión perfectos al bajar o subir semitonos sin distorsión.
        </p>
      </div>

      {/* Velocidad de Reproducción */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
        <span className="text-xs font-semibold text-slate-600">
          Velocidad de reproducción
        </span>
        <div className="flex items-center gap-1.5">
          {[0.8, 0.9, 1.0, 1.1].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => handleSpeedChange(spd)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                playbackSpeed === spd
                  ? 'bg-[#1E74FD] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Componente: Barra / Tarjeta del Reproductor de Audio
  const audioPlayerCard = (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
      {/* Encabezado del tema */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 flex-shrink-0 relative flex items-center justify-center">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt={songTitle} className="w-full h-full object-cover" />
            ) : (
              <Music className="w-5 h-5 text-slate-300" />
            )}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <Play className="w-3.5 h-3.5 text-white fill-white" />
            </div>
          </div>

          <div className="min-w-0">
            <h4 className="text-sm sm:text-base font-bold text-[#0B132B] truncate leading-tight">
              {songTitle}
            </h4>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#1E74FD]/10 text-[#1E74FD]">
                PISTA & TONO OFICIAL
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FF7E22]/10 text-[#FF7E22]">
                {currentKeyDisplay}
              </span>
            </div>
          </div>
        </div>

        {audioUrl && (
          <a
            href={audioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex px-2.5 py-1.5 text-slate-400 hover:text-slate-700 text-xs font-semibold items-center gap-1 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            title="Abrir pista original en Google Drive"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Drive</span>
          </a>
        )}
      </div>

      {/* Scrubber / Barra de Progreso */}
      <div className="flex items-center gap-3 pt-1">
        <span className="text-xs font-medium text-slate-400 tabular-nums w-10 text-right">
          {formatTime(currentTime)}
        </span>
        <div className="flex-1 relative flex items-center group">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            disabled={!audioUrl || duration === 0}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E74FD] focus:outline-none disabled:opacity-50"
          />
        </div>
        <span className="text-xs font-medium text-slate-400 tabular-nums w-10">
          {formatTime(duration)}
        </span>
      </div>

      {/* Controles de Reproducción: -5s, Play/Pause, +5s, Volumen */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Espaciador izquierdo para centrar controles */}
        <div className="w-20 hidden sm:block" />

        {/* Botones Centrales */}
        <div className="flex items-center gap-3 mx-auto">
          <button
            type="button"
            onClick={() => handleSkip(-5)}
            disabled={!audioUrl || duration === 0}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Retroceder 5 segundos"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>-5s</span>
          </button>

          <button
            type="button"
            onClick={handleTogglePlay}
            disabled={!audioUrl || isLoading}
            className="w-12 h-12 rounded-full bg-[#1E74FD] hover:bg-[#155de0] text-white flex items-center justify-center shadow-md shadow-[#1E74FD]/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSkip(5)}
            disabled={!audioUrl || duration === 0}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Adelantar 5 segundos"
          >
            <span>+5s</span>
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Control de Volumen a la derecha */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="text-slate-400 hover:text-slate-600 p-1"
            title={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-[#FF7E22]" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(Number(e.target.value));
              setIsMuted(false);
            }}
            className="w-14 sm:w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E74FD]"
          />
        </div>
      </div>

      {/* Mensaje de error si falla */}
      {error && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Si se proporciona videoSlot, se coloca en 2 columnas en desktop y apilado en móvil */}
      {videoSlot ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
          <div className="w-full flex flex-col justify-center">
            {videoSlot}
          </div>
          <div className="w-full">
            {transpositorCard}
          </div>
        </div>
      ) : (
        <div className="w-full">
          {transpositorCard}
        </div>
      )}

      {/* Barra de audio a todo el ancho */}
      <div className="w-full">
        {audioPlayerCard}
      </div>
    </div>
  );
};
