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

// Caché global en memoria de AudioBuffer por URL para evitar re-descargas
const audioBufferCache = new Map<string, AudioBuffer>();

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

  // Determinar la tonalidad original de la pista de audio grabada
  const audioOriginalKey = originalKey?.trim() || (!targetKey ? baseKey?.trim() : undefined) || baseKey?.trim() || 'A';
  // Determinar la tonalidad oficial requerida para el culto
  const worshipTargetKey = targetKey?.trim() || (!originalKey ? baseKey?.trim() : undefined) || audioOriginalKey;

  // Distancia en semitonos entre el audio grabado y el tono requerido para el culto (ej: B -> Bb = -1 st)
  const worshipDelta = (audioOriginalKey && worshipTargetKey)
    ? calculateSemitoneDistance(audioOriginalKey, worshipTargetKey)
    : 0;

  // Parámetros musicales - Inicializado por defecto con el tono oficial del culto (worshipDelta)
  const [semitones, setSemitones] = useState<number>(worshipDelta);
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
  const semitonesRef = useRef(worshipDelta);
  const tempoRef = useRef(1.0);

  // Mantener refs sincronizadas para callbacks
  isPlayingRef.current = isPlaying;
  semitonesRef.current = semitones;
  tempoRef.current = playbackSpeed;

  // Sincronizar automáticamente el tono al tono oficial por defecto cuando cambie de alabanza o configuración de culto
  useEffect(() => {
    setSemitones(worshipDelta);
    semitonesRef.current = worshipDelta;
    if (pitchShifterRef.current) {
      pitchShifterRef.current.pitchSemitones = worshipDelta;
    }
  }, [songTitle, audioUrl, worshipDelta]);

  // Obtener o inicializar AudioContext (independiente de volumen para evitar recargas)
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const gain = ctx.createGain();
      gain.gain.value = 1.0;
      gain.connect(ctx.destination);
      audioContextRef.current = ctx;
      gainNodeRef.current = gain;
    }
    return { ctx: audioContextRef.current, gain: gainNodeRef.current! };
  }, []);

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

    const loadAudioFile = async () => {
      try {
        const { ctx, gain } = getAudioContext();
        
        // Configurar ganancia inicial con el volumen actual
        const currentGain = isMuted ? 0 : volume;
        gain.gain.setValueAtTime(currentGain, ctx.currentTime);

        let decodedBuffer = audioBufferCache.get(audioUrl);
        if (!decodedBuffer) {
          setIsLoading(true);
          const streamUrl = getStreamUrl(audioUrl);
          setLoadProgress('Descargando pista...');

          let response: Response;
          try {
            response = await fetch(streamUrl);
          } catch {
            response = await fetch(audioUrl);
          }

          if (!response.ok) {
            throw new Error(`Error al conectar con la pista (${response.statusText})`);
          }

          const arrayBuffer = await response.arrayBuffer();
          if (isCancelled) return;

          setLoadProgress('Procesando motor WSOLA...');
          decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
          if (isCancelled) return;
          audioBufferCache.set(audioUrl, decodedBuffer);
        }

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

  // -7 a +7 semitonos organizados en 2 filas limpias para perfecta adaptabilidad en móvil y PC
  const lowerSemitonesList = [-7, -6, -5, -4, -3, -2, -1];
  const higherAndOrigSemitonesList = [0, 1, 2, 3, 4, 5, 6, 7];

  // Renderizador de botón individual de semitono
  const renderSemitoneButton = (st: number) => {
    const isSelected = semitones === st;
    const isWorshipTarget = st === worshipDelta;
    const cleanKey = audioOriginalKey ? audioOriginalKey.replace(/[^A-Ga-g#b]/g, '') : '';
    const noteAtSt = cleanKey ? transposeChord(cleanKey, st) : '';
    const label = st === 0 ? 'orig (0)' : st > 0 ? `+${st}` : `${st}`;

    return (
      <button
        key={st}
        type="button"
        onClick={() => handleSemitoneChange(st)}
        className={`relative py-1.5 sm:py-2 px-0.5 text-center rounded-xl transition-all flex flex-col items-center justify-center min-h-[46px] sm:min-h-[50px] cursor-pointer ${
          isSelected
            ? 'bg-[#1E74FD] text-white shadow-sm font-bold ring-2 ring-[#1E74FD]/40 scale-[1.02] z-10'
            : isWorshipTarget
            ? 'bg-blue-50/80 hover:bg-blue-100 text-[#1E74FD] border-2 border-[#1E74FD]/60 font-bold'
            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 font-semibold'
        }`}
        title={`Transportar ${st === 0 ? 'tono original' : `${st > 0 ? `+${st}` : st} semitonos`} (${noteAtSt})${isWorshipTarget ? ' - Tono oficial del culto' : ''}`}
      >
        {isWorshipTarget && (
          <span
            className={`absolute -top-1.5 -right-1 px-1 py-0.2 rounded text-[7px] sm:text-[8px] font-black uppercase tracking-tighter shadow-2xs ${
              isSelected ? 'bg-amber-400 text-slate-950 font-black' : 'bg-[#1E74FD] text-white'
            }`}
          >
            Culto
          </span>
        )}
        <span className="text-xs sm:text-sm font-black leading-tight">
          {noteAtSt || (st === 0 ? 'Orig' : st)}
        </span>
        <span
          className={`text-[9px] sm:text-[10px] leading-tight mt-0.5 font-medium ${
            isSelected ? 'text-blue-100' : isWorshipTarget ? 'text-[#1E74FD] font-bold' : 'text-slate-400'
          }`}
        >
          {label}
        </span>
      </button>
    );
  };

  // Componente: Tarjeta del Transpositor
  const transpositorCard = (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between h-full">
      {/* 1. Header del Transpositor */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#1E74FD]" />
          <h3 className="text-xs sm:text-xs md:text-sm font-bold tracking-tight text-[#0B132B] uppercase">
            Transpositor de Afinación (WSOLA Alta Fidelidad)
          </h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FF7E22]/10 text-[#FF7E22] border border-[#FF7E22]/20">
          Pista: {audioOriginalKey} (Original)
        </span>
      </div>

      {/* 2. Banner Grande: Tonalidad que se va a tocar en el Culto */}
      <div className={`p-3.5 sm:p-4 rounded-2xl my-3 border transition-all ${
        worshipDelta !== 0
          ? 'bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/30 border-[#1E74FD]/40 shadow-xs'
          : 'bg-slate-50 border-slate-200/90'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${worshipDelta !== 0 ? 'bg-[#1E74FD] animate-pulse' : 'bg-emerald-500'}`} />
              <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider ${worshipDelta !== 0 ? 'text-[#1E74FD]' : 'text-slate-600'}`}>
                {worshipDelta !== 0 ? 'Tono Requerido para el Culto' : 'Tono Oficial del Culto'}
              </span>
            </div>
            
            {worshipDelta !== 0 ? (
              <p className="text-xs text-slate-700 mt-1 font-medium leading-snug">
                Pista grabada en <strong className="text-slate-900 font-bold">{audioOriginalKey}</strong> ➔ Transportada{' '}
                <span className="font-bold text-[#1E74FD]">
                  {formatSemitoneShiftDescription(worshipDelta)}
                </span>
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">
                Se cantará en la misma tonalidad original de la pista ({audioOriginalKey})
              </p>
            )}

            {/* Aviso si el usuario alteró el transportador a otro tono */}
            {semitones !== worshipDelta && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md font-bold">
                  Escuchando en {currentKeyDisplay}
                </span>
                <button
                  type="button"
                  onClick={() => handleSemitoneChange(worshipDelta)}
                  className="text-[11px] font-bold text-[#1E74FD] hover:underline cursor-pointer"
                >
                  ↩ Restablecer a tono del culto ({worshipTargetKey})
                </button>
              </div>
            )}
          </div>

          {/* GRAN VISUALIZACIÓN DE LA TONALIDAD A TOCAR */}
          <div className="text-center shrink-0 bg-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl border-2 border-[#1E74FD]/30 shadow-xs">
            <span className="text-2xl sm:text-4xl font-black text-[#1E74FD] tracking-tight block leading-none">
              {worshipTargetKey}
            </span>
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 tracking-wider block mt-1">
              Tono a Tocar
            </span>
          </div>
        </div>
      </div>

      {/* 3. Botones de Semitonos (-7 a +7) en dos filas */}
      <div className="py-1 space-y-2.5">
        {isLoading ? (
          <div className="py-6 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-[#1E74FD]/20 border-t-[#1E74FD] rounded-full animate-spin mx-auto mb-2" />
            {loadProgress}
          </div>
        ) : (
          <>
            {/* Fila 1: Bajar Tono (-7 a -1) */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1 px-0.5">
                <span className="flex items-center gap-1">
                  <span>↓ Bajar Tono</span>
                  <span className="text-[10px] text-slate-400 font-medium">(-7 a -1 semitonos)</span>
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {lowerSemitonesList.map((st) => renderSemitoneButton(st))}
              </div>
            </div>

            {/* Fila 2: Original & Subir Tono (0 a +7) */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1 px-0.5">
                <span className="flex items-center gap-1">
                  <span>↑ Original & Subir Tono</span>
                  <span className="text-[10px] text-slate-400 font-medium">(0 a +7 semitonos)</span>
                </span>
              </div>
              <div className="grid grid-cols-8 gap-1 sm:gap-1.5">
                {higherAndOrigSemitonesList.map((st) => renderSemitoneButton(st))}
              </div>
            </div>
          </>
        )}

        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 pt-1 font-normal">
          <span>El motor WSOLA mantiene el tempo sin distorsión.</span>
          <span className="text-slate-500 font-semibold">Rango: -7 a +7 st</span>
        </div>
      </div>

      {/* 4. Velocidad de Reproducción */}
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
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#1E74FD]/10 text-[#1E74FD]">
                TONO CULTO: {worshipTargetKey}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FF7E22]/10 text-[#FF7E22]">
                SONANDO EN: {currentKeyDisplay}
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
