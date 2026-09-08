import { Note, Chord, Interval } from '@tonaljs/tonal';

/**
 * Utilidades de Teoría Musical y Transposición para Cifrado Armónico
 * Potenciado con @tonaljs/tonal y soporte estándar ChordPro
 */

// Escalas cromáticas con sostenidos y bemoles (usadas como fallback o referencia)
const CHROMATIC_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHROMATIC_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const NOTE_ALIASES: Record<string, number> = {
  'B#': 0, 'C': 0,
  'C#': 1, 'DB': 1,
  'D': 2,
  'D#': 3, 'EB': 3,
  'E': 4, 'FB': 4,
  'E#': 5, 'F': 5,
  'F#': 6, 'GB': 6,
  'G': 7,
  'G#': 8, 'AB': 8,
  'A': 9,
  'A#': 10, 'BB': 10,
  'B': 11, 'CB': 11,
};

// Expresión regular para detectar un acorde individual (soporta alteraciones, bajos invertidos /Bass)
// Ejemplos: G, Em7, C#m7b5, F#m, D/F#, Bbmaj7, A(add9), G#dim7
export const CHORD_REGEX = /^[A-G](?:#|b)?(?:m|maj|min|aug|dim|sus|add|\d|\+|-)*(\/[A-G](?:#|b)?)?$/i;

/**
 * Transpone una nota raíz individual por N semitonos utilizando teoría musical de Tonal.js
 */
export const transposeRootNote = (note: string, semitones: number, preferFlats = false): string => {
  if (!note || semitones === 0) return note;

  try {
    const interval = Interval.fromSemitones(semitones);
    if (interval) {
      const transposed = Note.transpose(note, interval);
      let simplified = Note.simplify(transposed);
      if (!simplified) simplified = transposed;

      if (preferFlats && simplified.includes('#')) {
        const enh = Note.enharmonic(simplified);
        if (enh.includes('b')) simplified = enh;
      } else if (!preferFlats && simplified.includes('b')) {
        const enh = Note.enharmonic(simplified);
        if (enh.includes('#')) simplified = enh;
      }

      if (simplified) return simplified;
    }
  } catch {
    // Continuar a fallback
  }

  // Fallback seguro a escala cromática
  const upper = note.toUpperCase();
  const index = NOTE_ALIASES[upper];
  if (index === undefined) return note;

  const normalizedSemitones = ((semitones % 12) + 12) % 12;
  const targetIndex = (index + normalizedSemitones) % 12;

  const scale = preferFlats ? CHROMATIC_FLAT : CHROMATIC_SHARP;
  return scale[targetIndex];
};

/**
 * Transpone un acorde completo (incluyendo bajo invertido /Bass y extensiones complejas)
 * Ej: "D/F#" + 2 semitonos => "E/G#"
 * Ej: "Em7" + 1 semitono => "Fm7"
 */
export const transposeChord = (chord: string, semitones: number, preferFlats = false): string => {
  if (!chord || semitones === 0) return chord;

  // Si tiene bajo invertido (ej. D/F# o C2/E)
  if (chord.includes('/')) {
    const [mainChord, bass] = chord.split('/');
    const transposedMain = transposeChord(mainChord, semitones, preferFlats);
    const transposedBass = transposeRootNote(bass, semitones, preferFlats);
    return `${transposedMain}/${transposedBass}`;
  }

  // Tokenizar raíz y modificador armónico con Tonal
  try {
    const [root, modifier] = Chord.tokenize(chord);
    if (root) {
      const transposedRoot = transposeRootNote(root, semitones, preferFlats);
      return `${transposedRoot}${modifier || ''}`;
    }
  } catch {
    // Continuar a fallback
  }

  // Fallback con Regex
  const rootMatch = chord.match(/^([A-G](?:#|b)?)(.*)$/i);
  if (!rootMatch) return chord;

  const [, root, extension] = rootMatch;
  const transposedRoot = transposeRootNote(root, semitones, preferFlats);
  return `${transposedRoot}${extension}`;
};

/**
 * Detalles de un acorde para el músico (notas que lo componen, intervalos y bajo)
 */
export interface ChordDetails {
  symbol: string;
  name: string;
  notes: string[];
  bass?: string;
  quality?: string;
}

/**
 * Obtiene el desglose armónico de un acorde para visualización en tooltip o panel
 */
export const getChordDetails = (chordStr: string): ChordDetails | null => {
  if (!chordStr) return null;
  const clean = chordStr.replace(/[.,:;()\[\]]/g, '').trim();
  if (!clean) return null;

  try {
    let mainChord = clean;
    let bassNote: string | undefined = undefined;

    if (clean.includes('/')) {
      const parts = clean.split('/');
      mainChord = parts[0];
      bassNote = parts[1];
    }

    const info = Chord.get(mainChord);
    if (!info || info.empty) {
      const [root] = Chord.tokenize(mainChord);
      if (root) {
        return {
          symbol: clean,
          name: clean,
          notes: bassNote ? [`${bassNote} (Bajo)`, root] : [root],
          bass: bassNote,
        };
      }
      return null;
    }

    let notes = [...info.notes];
    if (bassNote && !notes.includes(bassNote)) {
      notes = [`${bassNote} (Bajo)`, ...notes];
    }

    return {
      symbol: clean,
      name: info.name || clean,
      notes,
      bass: bassNote,
      quality: info.quality,
    };
  } catch {
    return null;
  }
};

/**
 * Verifica si un token es un acorde válido
 */
export const isChordToken = (token: string): boolean => {
  const clean = token.replace(/[.,:;()\[\]]/g, '').trim();
  if (!clean) return false;
  if (CHORD_REGEX.test(clean)) return true;
  try {
    const [root] = Chord.tokenize(clean);
    return Boolean(root && root.length > 0 && ['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(root[0].toUpperCase()));
  } catch {
    return false;
  }
};

/**
 * Transpone un bloque completo de cifrado de compases
 * Mantiene intactas las barras |, repeticiones |: :|, comentarios, notas de paso ( ) y cortes.
 */
export const transposeChordChartText = (text: string, semitones: number, preferFlats = false): string => {
  if (!text || semitones === 0) return text;

  // Procesamos línea por línea
  const lines = text.split('\n');
  const transposedLines = lines.map(line => {
    // Si es un encabezado de sección como [VERSO 1] o [CORO], dejarlo intacto
    if (/^\s*\[.*\]\s*$/.test(line)) {
      return line;
    }

    // Dividimos por espacios manteniendo los delimitadores
    return line.replace(/\(([^)]+)\)|([A-G](?:#|b)?(?:m|maj|min|aug|dim|sus|add|\d|\+|-)*(?:\/[A-G](?:#|b)?)?)/g, (match, passingGroup, normalChord) => {
      // Si era una nota de paso entre paréntesis: (D#dim) o (D/F# paso)
      if (passingGroup !== undefined) {
        const parts = passingGroup.split(' ');
        const transposedParts = parts.map((part: string) => {
          if (isChordToken(part)) {
            return transposeChord(part, semitones, preferFlats);
          }
          return part;
        });
        return `(${transposedParts.join(' ')})`;
      }

      // Si es un acorde normal
      if (normalChord !== undefined && isChordToken(normalChord)) {
        return transposeChord(normalChord, semitones, preferFlats);
      }

      return match;
    });
  });

  return transposedLines.join('\n');
};

/**
 * Soporte ChordPro estándar
 */
export interface ChordProSegment {
  chord?: string;
  text: string;
}

export interface ChordProLine {
  type: 'directive' | 'section' | 'lyric' | 'empty';
  directiveKey?: string;
  directiveValue?: string;
  sectionTitle?: string;
  segments?: ChordProSegment[];
  rawText: string;
}

/**
 * Comprueba si un texto tiene sintaxis ChordPro:
 * - Directivas tipo {title: ...}, {key: ...}
 * - O acordes entre corchetes intercalados con letra: "Cuan [G]grande es [D/F#]Él"
 */
export const hasChordProNotation = (text: string): boolean => {
  if (!text) return false;
  if (/\{[a-zA-Z_-]+:[^}]*\}/.test(text)) return true;
  // Letra con acordes entre corchetes ej: [G] o [D/F#] seguido o precedido de texto de letra
  return /\[[A-G](?:#|b)?[^\]]*\][a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(text) ||
         /[a-zA-ZáéíóúÁÉÍÓÚñÑ]\s*\[[A-G](?:#|b)?[^\]]*\]/.test(text);
};

/**
 * Transpone el texto en formato ChordPro
 */
export const transposeChordProText = (text: string, semitones: number, preferFlats = false): string => {
  if (!text || semitones === 0) return text;

  // Reemplaza directivas {key: X}
  let result = text.replace(/\{(?:key|tono):\s*([A-G](?:#|b)?m?)\}/gi, (_match, keyVal) => {
    return `{key: ${transposeChord(keyVal, semitones, preferFlats)}}`;
  });

  // Reemplaza acordes entre corchetes [C], [D/F#], etc.
  result = result.replace(/\[([A-G](?:#|b)?(?:m|maj|min|aug|dim|sus|add|\d|\+|-)*(?:\/[A-G](?:#|b)?)?)\]/g, (match, chordToken) => {
    if (isChordToken(chordToken)) {
      return `[${transposeChord(chordToken, semitones, preferFlats)}]`;
    }
    return match;
  });

  return result;
};

/**
 * Parsea un texto ChordPro en líneas estructuradas con segmentos (acorde encima de letra)
 */
export const parseChordPro = (text: string, semitones = 0, preferFlats = false): ChordProLine[] => {
  if (!text) return [];

  const transposedText = semitones !== 0 ? transposeChordProText(text, semitones, preferFlats) : text;
  const lines = transposedText.split('\n');

  return lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) {
      return { type: 'empty', rawText: line };
    }

    // Directiva {directive: value}
    const directiveMatch = trimmed.match(/^\{([a-zA-Z_-]+)(?::\s*([^}]*))?\}$/);
    if (directiveMatch) {
      return {
        type: 'directive',
        directiveKey: directiveMatch[1].toLowerCase(),
        directiveValue: directiveMatch[2] ? directiveMatch[2].trim() : '',
        rawText: line,
      };
    }

    // Encabezado de sección [VERSO 1], [CORO], [INTRO], etc.
    const sectionMatch = trimmed.match(/^\[([A-Z0-9\s/]+)\]$/i);
    if (sectionMatch && !isChordToken(sectionMatch[1])) {
      return {
        type: 'section',
        sectionTitle: sectionMatch[1].trim(),
        rawText: line,
      };
    }

    // Línea de letra con acordes intercalados: dividir por tokens [Acorde]
    const segments: ChordProSegment[] = [];
    const regex = /\[([^\]]+)\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      const matchIndex = match.index;
      const textBefore = line.slice(lastIndex, matchIndex);
      const chordCandidate = match[1].trim();

      if (segments.length === 0 && textBefore.length > 0) {
        segments.push({ text: textBefore });
      } else if (segments.length > 0 && textBefore.length > 0) {
        segments[segments.length - 1].text += textBefore;
      }

      if (isChordToken(chordCandidate)) {
        segments.push({ chord: chordCandidate, text: '' });
      } else {
        const fallbackText = `[${match[1]}]`;
        if (segments.length > 0) {
          segments[segments.length - 1].text += fallbackText;
        } else {
          segments.push({ text: fallbackText });
        }
      }

      lastIndex = regex.lastIndex;
    }

    const remainingText = line.slice(lastIndex);
    if (remainingText) {
      if (segments.length > 0) {
        segments[segments.length - 1].text += remainingText;
      } else {
        segments.push({ text: remainingText });
      }
    }

    return {
      type: 'lyric',
      segments,
      rawText: line,
    };
  });
};

/**
 * Representación estructurada de una línea de compás para renderizar gráficos
 */
export interface MeasureCell {
  chords: string[]; // Acordes dentro de este compás (ej: ["G", "Em7"])
  passingChords: string[]; // Notas de paso en este compás
  annotations: string[]; // Anotaciones (ej. "Corte", "Stop", "2da vuelta")
  isRepeatStart?: boolean; // |:
  isRepeatEnd?: boolean; // :|
  repeatCount?: string; // ej. "x2", "(x2)", "x4"
  rawText?: string;
}

export interface SectionBlock {
  title: string; // ej. "INTRO", "VERSO 1", "CORO"
  measures: MeasureCell[][]; // Filas de compases
  notes?: string;
  timeSignature?: string; // ej. "4/4", "3/4", "6/8", "12/8"
}

/**
 * Parsea un texto de cifrado por compases en bloques de secciones estructuradas
 */
export const parseChordChart = (rawText: string): SectionBlock[] => {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split('\n');
  const sections: SectionBlock[] = [];
  let currentSection: SectionBlock = { title: 'ESTRUCTURA', measures: [] };
  let globalTimeSignature: string | undefined = undefined;

  const TIME_SIG_REGEX = /\b(4\/4|3\/4|6\/8|12\/8|2\/4|9\/8)\b/;

  lines.forEach(line => {
    let trimmed = line.trim();
    if (!trimmed) return;

    // Detectar métrica global si está en una línea suelta ej. [4/4] o 4/4 o Compás: 4/4
    const standaloneSig = trimmed.match(/^\[?(4\/4|3\/4|6\/8|12\/8|2\/4)\]?$/);
    if (standaloneSig) {
      globalTimeSignature = standaloneSig[1];
      if (!currentSection.timeSignature) {
        currentSection.timeSignature = globalTimeSignature;
      }
      return;
    }

    // Detectar encabezado de sección: [INTRO], [VERSO 1], [CORO], [PUENTE], etc.
    const sectionMatch = trimmed.match(/^\[([^\]]+)\](.*)$/);
    if (sectionMatch) {
      if (currentSection.measures.length > 0 || currentSection.title !== 'ESTRUCTURA') {
        sections.push(currentSection);
      }
      
      let secTitle = sectionMatch[1].trim();
      let secNotes = sectionMatch[2] ? sectionMatch[2].trim() : undefined;
      let secTimeSig = globalTimeSignature;

      // Buscar si la sección incluye la métrica: ej. [INTRO] [4/4] o [CORO] (6/8)
      const sigInTitle = secTitle.match(TIME_SIG_REGEX);
      const sigInNotes = secNotes ? secNotes.match(TIME_SIG_REGEX) : null;
      if (sigInTitle) {
        secTimeSig = sigInTitle[1];
        secTitle = secTitle.replace(TIME_SIG_REGEX, '').replace(/[()[\]]/g, '').trim();
      } else if (sigInNotes) {
        secTimeSig = sigInNotes[1];
        secNotes = secNotes?.replace(TIME_SIG_REGEX, '').replace(/[()[\]]/g, '').trim() || undefined;
      }

      currentSection = {
        title: secTitle || 'SECCIÓN',
        measures: [],
        notes: secNotes,
        timeSignature: secTimeSig,
      };
      return;
    }

    // Si la línea contiene barras de compás '|'
    if (trimmed.includes('|')) {
      const rowMeasures: MeasureCell[] = [];

      // Detectar si la línea termina con repetición tipo :| (x2) o :| x2 o :| ×2
      let lineRepeatCount: string | undefined = undefined;
      const endRepeatMatch = trimmed.match(/:\|\s*(\(?\s*[xX×]\s*\d+\s*\)?|\(?\s*\d+\s*veces?\s*\)?)\s*$/);
      if (endRepeatMatch) {
        lineRepeatCount = endRepeatMatch[1].trim();
        // Quitar el sufijo de repetición después de :| para no generar un segmento huérfano
        trimmed = trimmed.replace(endRepeatMatch[0], ':|');
      }

      // Separar por barras de compás
      const rawSegments = trimmed.split('|');

      rawSegments.forEach((segment, idx) => {
        const segTrim = segment.trim();
        if (!segTrim && (idx === 0 || idx === rawSegments.length - 1)) {
          // Ignorar inicio o fin vacío debido al split de "| G | C |"
          return;
        }

        // Si este segmento es puramente un indicador de repetición huérfano como (x2) o x2 o ×2
        if (/^(\(?\s*[xX×]\s*\d+\s*\)?|\(?\s*\d+\s*veces?\s*\)?)$/.test(segTrim)) {
          if (rowMeasures.length > 0) {
            const last = rowMeasures[rowMeasures.length - 1];
            last.isRepeatEnd = true;
            last.repeatCount = segTrim;
          }
          return;
        }

        const isRepeatStart = segTrim.startsWith(':');
        const isRepeatEnd = segTrim.endsWith(':');

        const cleanTokens = segTrim.replace(/^:/, '').replace(/:$/, '').trim().split(/\s+/);
        const chords: string[] = [];
        const passingChords: string[] = [];
        const annotations: string[] = [];

        cleanTokens.forEach(tok => {
          if (!tok) return;
          if (tok.startsWith('(') && tok.endsWith(')')) {
            // Si es un conteo de repetición (x2), no es nota de paso
            if (/^\(\s*[xX×]\s*\d+\s*\)$/.test(tok)) {
              annotations.push(tok);
              return;
            }
            // Nota de paso: (D#dim)
            const noteContent = tok.slice(1, -1).trim();
            passingChords.push(noteContent);
          } else if (isChordToken(tok)) {
            chords.push(tok);
          } else if (tok !== ':' && tok !== '|' && tok !== '|:' && tok !== ':|') {
            annotations.push(tok);
          }
        });

        if (chords.length > 0 || passingChords.length > 0 || annotations.length > 0) {
          rowMeasures.push({
            chords,
            passingChords,
            annotations,
            isRepeatStart,
            isRepeatEnd,
            rawText: segTrim,
          });
        }
      });

      // Si la línea tenía un lineRepeatCount al final, asignarlo al último compás con isRepeatEnd
      if (lineRepeatCount && rowMeasures.length > 0) {
        const lastRepeatMeasure = [...rowMeasures].reverse().find(m => m.isRepeatEnd) || rowMeasures[rowMeasures.length - 1];
        lastRepeatMeasure.isRepeatEnd = true;
        lastRepeatMeasure.repeatCount = lineRepeatCount;
      }

      if (rowMeasures.length > 0) {
        currentSection.measures.push(rowMeasures);
      }
    } else {
      // Línea de notas descriptivas o dinámicas
      if (currentSection.measures.length > 0) {
        // Si ya hay compases, creamos un compás ancho de anotación
        currentSection.measures.push([{
          chords: [],
          passingChords: [],
          annotations: [trimmed],
          rawText: trimmed,
        }]);
      } else {
        currentSection.notes = (currentSection.notes ? currentSection.notes + ' ' : '') + trimmed;
      }
    }
  });

  if (currentSection.measures.length > 0 || currentSection.title !== 'ESTRUCTURA') {
    sections.push(currentSection);
  }

  return sections;
};
