/**
 * Utilidades de Teoría Musical y Transposición para Cifrado Armónico
 */

// Escalas cromáticas con sostenidos y bemoles
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
 * Transpone una nota raíz individual por N semitonos
 */
export const transposeRootNote = (note: string, semitones: number, preferFlats = false): string => {
  const upper = note.toUpperCase();
  const index = NOTE_ALIASES[upper];
  if (index === undefined) return note;

  const normalizedSemitones = ((semitones % 12) + 12) % 12;
  const targetIndex = (index + normalizedSemitones) % 12;

  const scale = preferFlats ? CHROMATIC_FLAT : CHROMATIC_SHARP;
  return scale[targetIndex];
};

/**
 * Transpone un acorde completo (incluyendo bajo invertido /Bass)
 * Ej: "D/F#" + 2 semitonos => "E/G#"
 * Ej: "Em7" + 1 semitono => "Fm7"
 */
export const transposeChord = (chord: string, semitones: number, preferFlats = false): string => {
  if (semitones === 0) return chord;

  // Si tiene bajo invertido (ej. D/F# o C2/E)
  if (chord.includes('/')) {
    const [mainChord, bass] = chord.split('/');
    const transposedMain = transposeChord(mainChord, semitones, preferFlats);
    const transposedBass = transposeRootNote(bass, semitones, preferFlats);
    return `${transposedMain}/${transposedBass}`;
  }

  // Extraer la nota raíz (ej. "C#", "Bb", "G")
  const rootMatch = chord.match(/^([A-G](?:#|b)?)(.*)$/i);
  if (!rootMatch) return chord;

  const [, root, extension] = rootMatch;
  const transposedRoot = transposeRootNote(root, semitones, preferFlats);
  return `${transposedRoot}${extension}`;
};

/**
 * Verifica si un token es un acorde válido
 */
export const isChordToken = (token: string): boolean => {
  const clean = token.replace(/[.,:;()\[\]]/g, '').trim();
  if (!clean) return false;
  return CHORD_REGEX.test(clean);
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
        // Puede contener palabras como "(G#dim paso)"
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
 * Representación estructurada de una línea de compás para renderizar gráficos
 */
export interface MeasureCell {
  chords: string[]; // Acordes dentro de este compás (ej: ["G", "Em7"])
  passingChords: string[]; // Notas de paso en este compás
  annotations: string[]; // Anotaciones (ej. "Corte", "Stop", "2da vuelta")
  isRepeatStart?: boolean; // |:
  isRepeatEnd?: boolean; // :|
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
        secTitle = secTitle.replace(TIME_SIG_REGEX, '').trim();
      } else if (sigInNotes) {
        secTimeSig = sigInNotes[1];
        secNotes = secNotes?.replace(TIME_SIG_REGEX, '').replace(/[()]/g, '').trim() || undefined;
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
      // Separar por barras de compás
      const rawSegments = trimmed.split('|');

      rawSegments.forEach((segment, idx) => {
        const segTrim = segment.trim();
        if (!segTrim && (idx === 0 || idx === rawSegments.length - 1)) {
          // Ignorar inicio o fin vacío debido al split de "| G | C |"
          return;
        }

        const isRepeatStart = segTrim.startsWith(':') || trimmed.includes('|:');
        const isRepeatEnd = segTrim.endsWith(':') || trimmed.includes(':|');

        const cleanTokens = segTrim.replace(/^:/, '').replace(/:$/, '').trim().split(/\s+/);
        const chords: string[] = [];
        const passingChords: string[] = [];
        const annotations: string[] = [];

        cleanTokens.forEach(tok => {
          if (!tok) return;
          if (tok.startsWith('(') && tok.endsWith(')')) {
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
