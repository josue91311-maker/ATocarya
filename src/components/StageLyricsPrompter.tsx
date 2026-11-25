import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  RotateCcw,
  Play,
  Pause,
  Type,
  Sparkles
} from 'lucide-react';
import { ChordProLine } from '../utils/chordTransposer';

interface StanzaBlock {
  id: number;
  label: string;
  lines: string[];
  chordProLines?: ChordProLine[];
}

interface StageLyricsPrompterProps {
  lyrics: string;
  songTitle?: string;
  isChordPro?: boolean;
  chordProMode?: 'with-chords' | 'lyrics-only';
  parsedChordPro?: ChordProLine[] | null;
}

const SECTION_HEADER_REGEX = /^(\[.*\]|\{.*\}|(?:intro|verso|estrofa|pre[-\s]?coro|coro|puente|bridge|interludio|final|outro|tag|espont[aá]neo|instrumental)(?:\s*\d+)?\s*:?)$/i;

const cleanHeaderLabel = (raw: string, fallbackIndex: number): string => {
  const cleaned = raw.replace(/^[\[\{]+|[\]\}:]+$/g, '').trim();
  if (!cleaned) return `Parte ${fallbackIndex}`;
  return cleaned.length > 18 ? cleaned.slice(0, 18) + '…' : cleaned;
};

export const StageLyricsPrompter: React.FC<StageLyricsPrompterProps> = ({
  lyrics,
  songTitle,
  isChordPro = false,
  chordProMode = 'lyrics-only',
  parsedChordPro = null,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [fontScale, setFontScale] = useState<0 | 1 | 2 | 3>(1); // 0=sm, 1=base, 2=lg, 3=xl
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(false);
  const [autoSeconds, setAutoSeconds] = useState<number>(10);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const blockRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Resetear al cambiar de canción
  useEffect(() => {
    setActiveIndex(0);
    setAutoAdvance(false);
  }, [lyrics, songTitle]);

  // Dividir inteligentemente la letra (o líneas ChordPro) en estrofas / partes cantables
  const stanzas = useMemo<StanzaBlock[]>(() => {
    if (isChordPro && chordProMode === 'with-chords' && parsedChordPro && parsedChordPro.length > 0) {
      const blocks: StanzaBlock[] = [];
      let currentLines: ChordProLine[] = [];
      let currentLabel = '';

      const flushBlock = () => {
        if (currentLines.length === 0) return;
        const id = blocks.length;
        blocks.push({
          id,
          label: currentLabel || `Parte ${id + 1}`,
          lines: [],
          chordProLines: currentLines,
        });
        currentLines = [];
        currentLabel = '';
      };

      for (const line of parsedChordPro) {
        if (line.type === 'empty') {
          flushBlock();
        } else if (line.type === 'section') {
          flushBlock();
          currentLabel = cleanHeaderLabel(line.sectionTitle || '', blocks.length + 1);
        } else {
          currentLines.push(line);
          if (currentLines.length >= 6) {
            flushBlock();
          }
        }
      }
      flushBlock();
      return blocks.length > 0
        ? blocks
        : [{ id: 0, label: 'Parte 1', lines: [], chordProLines: parsedChordPro }];
    }

    // Modo texto limpio de letra
    const cleanText = isChordPro
      ? lyrics.replace(/\[[A-G](?:#|b)?[^\]]*\]/g, '').replace(/\{[^}]*\}/g, '').trim()
      : lyrics.trim();

    if (!cleanText) return [];

    const rawParagraphs = cleanText.split(/\r?\n\s*\r?\n/);
    const blocks: StanzaBlock[] = [];

    for (const para of rawParagraphs) {
      const rawLines = para
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (rawLines.length === 0) continue;

      let label = '';
      let contentLines = rawLines;

      if (SECTION_HEADER_REGEX.test(rawLines[0]) && rawLines.length > 1) {
        label = cleanHeaderLabel(rawLines[0], blocks.length + 1);
        contentLines = rawLines.slice(1);
      }

      // Si un bloque es muy largo (> 6 líneas sin saltos), dividir en frases cómodas de 4 líneas
      if (contentLines.length > 6) {
        for (let i = 0; i < contentLines.length; i += 4) {
          const chunk = contentLines.slice(i, i + 4);
          const id = blocks.length;
          blocks.push({
            id,
            label: i === 0 && label ? label : `Parte ${id + 1}`,
            lines: chunk,
          });
        }
      } else {
        const id = blocks.length;
        blocks.push({
          id,
          label: label || `Parte ${id + 1}`,
          lines: contentLines,
        });
      }
    }

    return blocks;
  }, [lyrics, isChordPro, chordProMode, parsedChordPro]);

  const totalParts = stanzas.length;

  const scrollToPart = useCallback((idx: number) => {
    const el = blockRefs.current[idx];
    const container = containerRef.current;
    if (el && container) {
      const elTop = el.offsetTop;
      const elHeight = el.offsetHeight;
      const containerHeight = container.clientHeight;
      const targetScroll = Math.max(0, elTop - containerHeight / 2 + elHeight / 2);
      container.scrollTo({ top: targetScroll, behavior: 'smooth' });
    } else if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const goToPart = useCallback(
    (nextIdx: number) => {
      if (totalParts === 0) return;
      const clamped = Math.max(0, Math.min(totalParts - 1, nextIdx));
      setActiveIndex(clamped);
      requestAnimationFrame(() => scrollToPart(clamped));
    },
    [totalParts, scrollToPart]
  );

  // Auto-avance manos libres (teleprompter)
  useEffect(() => {
    if (!autoAdvance || totalParts <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        if (prev >= totalParts - 1) {
          setAutoAdvance(false);
          return prev;
        }
        const next = prev + 1;
        requestAnimationFrame(() => scrollToPart(next));
        return next;
      });
    }, autoSeconds * 1000);
    return () => clearInterval(timer);
  }, [autoAdvance, autoSeconds, totalParts, scrollToPart]);

  // Soporte de teclado (Flecha Arriba / Abajo) en modo pantalla completa
  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        goToPart(activeIndex + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goToPart(activeIndex - 1);
      } else if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen, activeIndex, goToPart]);

  const textSizeClasses = {
    0: 'text-sm leading-relaxed',
    1: 'text-base sm:text-lg leading-relaxed',
    2: 'text-lg sm:text-xl leading-relaxed',
    3: 'text-xl sm:text-2xl leading-snug',
  }[fontScale];

  if (stanzas.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-[#8E8E9A]">
        No hay letra registrada para esta canción.
      </div>
    );
  }

  const prompterContent = (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#0D0D10] text-white flex flex-col p-4 sm:p-6 animate-in fade-in duration-150'
          : 'space-y-3'
      }
    >
      {/* 1. Barra Superior de Herramientas de Canto (Zoom, Auto-Avance, Pantalla Completa) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#D8B28A]/15 border border-[#D8B28A]/35 text-[#D8B28A] text-[11px] font-display font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>Parte {activeIndex + 1} de {totalParts}</span>
          </span>
          {isFullscreen && songTitle && (
            <h3 className="text-sm sm:text-base font-display font-bold text-white truncate">
              {songTitle}
            </h3>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Control tamaño de letra */}
          <div className="inline-flex items-center bg-[#1F1F26] border border-white/10 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setFontScale((prev) => (prev > 0 ? ((prev - 1) as 0 | 1 | 2 | 3) : 0))}
              disabled={fontScale === 0}
              className="px-2 py-1 text-[11px] font-bold text-[#B4B4BE] hover:text-white disabled:opacity-35 cursor-pointer"
              title="Reducir tamaño de letra"
            >
              A-
            </button>
            <Type className="w-3 h-3 text-[#D8B28A] mx-0.5" />
            <button
              type="button"
              onClick={() => setFontScale((prev) => (prev < 3 ? ((prev + 1) as 0 | 1 | 2 | 3) : 3))}
              disabled={fontScale === 3}
              className="px-2 py-1 text-[11px] font-bold text-[#B4B4BE] hover:text-white disabled:opacity-35 cursor-pointer"
              title="Aumentar tamaño de letra"
            >
              A+
            </button>
          </div>

          {/* Botón Auto-Scroll manos libres */}
          {totalParts > 1 && (
            <div className="inline-flex items-center bg-[#1F1F26] border border-white/10 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setAutoAdvance((v) => !v)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  autoAdvance
                    ? 'bg-[#D8B28A] text-[#0D0D10]'
                    : 'text-[#B4B4BE] hover:text-white'
                }`}
                title="Avance automático manos libres"
              >
                {autoAdvance ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>Auto</span>
              </button>
              {autoAdvance && (
                <select
                  value={autoSeconds}
                  onChange={(e) => setAutoSeconds(Number(e.target.value))}
                  className="bg-transparent text-[10px] font-bold text-[#D8B28A] px-1.5 py-0.5 focus:outline-none cursor-pointer"
                  title="Segundos por estrofa"
                >
                  <option value={7}>7s</option>
                  <option value={10}>10s</option>
                  <option value={15}>15s</option>
                </select>
              )}
            </div>
          )}

          {/* Pantalla completa para cantar en atril */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
              isFullscreen
                ? 'bg-[#E11D48] text-white border-[#E11D48]'
                : 'bg-[#1F1F26] text-white border-white/10 hover:border-[#D8B28A]/50'
            }`}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Modo Escenario (Pantalla Completa)'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden xs:inline">{isFullscreen ? 'Salir' : 'Escenario'}</span>
          </button>
        </div>
      </div>

      {/* 2. Píldoras de Salto Rápido por Secciones (Verso, Coro, Puente...) */}
      {totalParts > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0">
          {stanzas.map((stanza, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={stanza.id}
                type="button"
                onClick={() => goToPart(idx)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-display font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#D8B28A] text-[#0D0D10] shadow-xs'
                    : 'bg-[#1F1F26] text-[#B4B4BE] hover:text-white border border-white/10'
                }`}
              >
                {idx + 1}. {stanza.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Contenedor de Estrofas con Foco Inteligente */}
      <div
        ref={containerRef}
        className={`relative overflow-y-auto space-y-3 pr-1 custom-scrollbar ${
          isFullscreen ? 'flex-1 py-4 max-w-3xl w-full mx-auto' : 'max-h-[380px] sm:max-h-[440px] py-1'
        }`}
      >
        {stanzas.map((stanza, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={stanza.id}
              ref={(el) => {
                blockRefs.current[idx] = el;
              }}
              onClick={() => goToPart(idx)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#1F1F27] border-[#D8B28A] border-l-4 shadow-card opacity-100'
                  : 'bg-[#131318]/70 border-white/5 opacity-45 hover:opacity-80'
              }`}
            >
              {/* Etiqueta de la parte */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[10px] font-display font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-[#D8B28A]/20 text-[#D8B28A]'
                      : 'bg-white/5 text-[#8E8E9A]'
                  }`}
                >
                  {stanza.label}
                </span>
                {isActive && (
                  <span className="text-[10px] font-bold text-[#D8B28A] uppercase tracking-wider">
                    Cantando ahora
                  </span>
                )}
              </div>

              {/* Contenido: ChordPro con acordes o Letra limpia */}
              {stanza.chordProLines ? (
                <div className="space-y-2.5 font-mono overflow-x-auto">
                  {stanza.chordProLines.map((line, lIdx) => (
                    <div key={lIdx} className="flex flex-wrap items-end leading-none py-1 gap-x-1 gap-y-2">
                      {line.segments?.map((seg, sIdx) => (
                        <span key={sIdx} className="inline-flex flex-col">
                          {seg.chord ? (
                            <span className="text-xs font-black font-mono text-[#D8B28A] select-none pb-1 tracking-tight">
                              {seg.chord}
                            </span>
                          ) : (
                            <span className="text-xs invisible select-none pb-1">_</span>
                          )}
                          <span className={`${textSizeClasses} font-sans font-semibold text-white whitespace-pre`}>
                            {seg.text || ' '}
                          </span>
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`${textSizeClasses} font-sans font-semibold text-white space-y-1`}>
                  {stanza.lines.map((line, lineIdx) => (
                    <p key={lineIdx}>{line}</p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Botonera Ergonómica Inferior: SUBIR PARTE / BAJAR PARTE */}
      {totalParts > 1 && (
        <div
          className={`pt-2.5 border-t border-white/10 flex items-center gap-2 shrink-0 ${
            isFullscreen ? 'max-w-3xl w-full mx-auto pb-2' : ''
          }`}
        >
          <button
            type="button"
            onClick={() => goToPart(0)}
            disabled={activeIndex === 0}
            className="p-3 rounded-xl bg-[#1F1F26] hover:bg-[#272730] text-[#B4B4BE] hover:text-white border border-white/10 disabled:opacity-35 transition-colors cursor-pointer"
            title="Volver al inicio de la letra"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => goToPart(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="flex-1 py-3 px-4 rounded-xl bg-[#1F1F26] hover:bg-[#272730] active:scale-[0.98] text-white border border-white/15 font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 disabled:opacity-35 transition-all cursor-pointer"
          >
            <ChevronUp className="w-4 h-4 text-[#D8B28A]" />
            <span>Subir Letra</span>
          </button>

          <button
            type="button"
            onClick={() => goToPart(activeIndex + 1)}
            disabled={activeIndex >= totalParts - 1}
            className="flex-[1.35] py-3 px-4 rounded-xl bg-[#D8B28A] hover:bg-[#E5C6A4] active:scale-[0.98] text-[#0D0D10] font-display font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-glow disabled:opacity-35 transition-all cursor-pointer"
          >
            <span>Bajar Parte</span>
            <ChevronDown className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  );

  return prompterContent;
};
