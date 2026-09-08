import React, { useRef, useState } from 'react';
import { 
  Music, 
  HelpCircle, 
  Sparkles, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Scissors, 
  Octagon, 
  Repeat,
  BookOpen
} from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export const ChordChartEditor: React.FC<Props> = ({
  value,
  onChange,
  placeholder = '[INTRO] [4/4]\n|: G | Em7 | C2 | D4 :| (x2)\n\n[VERSO 1]\n| G | Em7 | C2 | (D#dim paso) | Em7 |\n\n[CORO]\n|: G | D/F# | Em7 | C2 :|',
  rows = 7,
  className = '',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Inserta texto en la posición actual del cursor dentro del textarea
  const insertText = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange((value ? value + ' ' : '') + textToInsert);
      return;
    }

    const startPos = textarea.selectionStart ?? value.length;
    const endPos = textarea.selectionEnd ?? value.length;

    const before = value.substring(0, startPos);
    const after = value.substring(endPos);

    const newValue = before + textToInsert + after;
    onChange(newValue);

    // Reposicionar el cursor inmediatamente después del texto insertado
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = startPos + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      
      {/* Barra de Herramientas y Comandos Rápidos */}
      <div className="bg-slate-100/90 border border-slate-200 rounded-2xl p-2.5 space-y-2">
        
        {/* Fila 1: Métricas de Compás (Time Signatures) y Secciones */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1 mr-0.5">
            <Clock className="w-3 h-3 text-indigo-600" />
            Métrica:
          </span>

          {['[4/4]', '[3/4]', '[6/8]', '[12/8]', '[2/4]'].map((ts) => (
            <button
              key={ts}
              type="button"
              onClick={() => insertText(`${ts} `)}
              className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/80 rounded-md text-[11px] font-black tracking-wide transition-colors"
              title={`Compás de ${ts.slice(1, -1)}`}
            >
              {ts}
            </button>
          ))}

          <span className="text-slate-300 mx-0.5">|</span>

          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mr-0.5">
            Sección:
          </span>

          {['[INTRO]', '[VERSO]', '[PRE-CORO]', '[CORO]', '[PUENTE]', '[FINAL]'].map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => insertText(`${value && !value.endsWith('\n') ? '\n\n' : ''}${sec}\n| `)}
              className="px-2 py-0.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-md text-[11px] font-bold transition-colors shadow-2xs"
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Fila 2: Barras de Compás, Repeticiones y Cortes */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-200/70">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mr-0.5">
            Compás:
          </span>

          {/* Barra normal */}
          <button
            type="button"
            onClick={() => insertText(' | ')}
            className="px-2.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-md text-[11px] font-black font-mono transition-colors"
            title="Barra de compás |"
          >
            | Barra
          </button>

          {/* Repeticiones */}
          <button
            type="button"
            onClick={() => insertText('|: ')}
            className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-md text-[11px] font-black font-mono transition-colors"
            title="Inicio de repetición |:"
          >
            |:
          </button>

          <button
            type="button"
            onClick={() => insertText(' :| (x2)')}
            className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-md text-[11px] font-black font-mono transition-colors"
            title="Fin de repetición x2"
          >
            :| (x2)
          </button>

          <button
            type="button"
            onClick={() => insertText(' (x4)')}
            className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-md text-[10px] font-bold transition-colors"
          >
            x4
          </button>

          <span className="text-slate-300 mx-0.5">|</span>

          {/* Cortes y Notas de Paso */}
          <button
            type="button"
            onClick={() => insertText(' (D#dim paso) ')}
            className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[11px] font-black transition-colors"
            title="Insertar Nota de Paso entre paréntesis (se transporta automáticamente)"
          >
            + (Nota de Paso)
          </button>

          <button
            type="button"
            onClick={() => insertText(' -> [CORTE] ')}
            className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-md text-[11px] font-black flex items-center gap-1 transition-colors"
            title="Corte rítmico"
          >
            <Scissors className="w-3 h-3" />
            <span>CORTE</span>
          </button>

          <button
            type="button"
            onClick={() => insertText(' -> [STOP] ')}
            className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-md text-[11px] font-black flex items-center gap-1 transition-colors"
            title="Stop musical"
          >
            <Octagon className="w-3 h-3" />
            <span>STOP</span>
          </button>
        </div>

        {/* Fila 3: Notas con Bajo (Inversiones / Slash Chords) y Tiempos */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-200/70">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mr-0.5">
            🎸 Notas con Bajo:
          </span>

          {['D/F#', 'C/E', 'G/B', 'A/C#', 'Am/G', 'F/A'].map((slashChord) => (
            <button
              key={slashChord}
              type="button"
              onClick={() => insertText(`${slashChord} `)}
              className="px-2 py-0.5 bg-amber-50/80 hover:bg-amber-100 text-amber-950 border border-amber-300/80 rounded-md text-[11px] font-black font-mono transition-colors"
              title={`Acorde con bajo ${slashChord}`}
            >
              {slashChord}
            </button>
          ))}

          {/* Botones de bajos para pegar a cualquier acorde */}
          {['/F#', '/B', '/E', '/G', '/A', '/C#'].map((bass) => (
            <button
              key={bass}
              type="button"
              onClick={() => insertText(`${bass} `)}
              className="px-1.5 py-0.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-[10px] font-bold font-mono transition-colors"
              title={`Añadir bajo ${bass}`}
            >
              {bass}
            </button>
          ))}

          <span className="text-slate-300 mx-0.5">|</span>

          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mr-0.5">
            Tiempos:
          </span>

          {['(4t)', '(2t c/u)', '(1t c/u)'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => insertText(`${t} `)}
              className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-md text-[10px] font-black transition-colors"
            >
              {t}
            </button>
          ))}
        </div>

      </div>

      {/* Textarea Principal de Cifrado */}
      <textarea
        ref={textareaRef}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 leading-relaxed transition-all shadow-inner"
      />

      {/* Botón y Panel Desplegable: Guía de Compases, Tiempos y Notas con Bajo */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-1.5 text-emerald-800">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>¿Cómo funcionan los compases, tiempos y notas con bajo? (Ver guía)</span>
          </span>
          {showGuide ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showGuide && (
          <div className="p-3.5 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-600 space-y-3 animate-in fade-in duration-150">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* Bloque 1: Compás 4/4 y Distribución de Tiempos */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                <h5 className="font-black text-slate-900 text-[11px] uppercase tracking-wide flex items-center gap-1.5 text-indigo-700">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Compás 4/4 (Tiempos)</span>
                </h5>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Cada compás está delimitado por barras <code className="bg-slate-100 px-1 py-0.5 rounded font-bold">|</code>:
                </p>
                <ul className="text-[11px] space-y-1">
                  <li>• <code className="text-emerald-700 font-black font-mono">| G |</code>: 1 acorde = <strong>4 tiempos completos</strong>.</li>
                  <li>• <code className="text-emerald-700 font-black font-mono">| G D |</code>: 2 acordes = <strong>2 tiempos cada uno</strong> (blancas).</li>
                  <li>• <code className="text-emerald-700 font-black font-mono">| G D Em C |</code>: 4 acordes = <strong>1 tiempo cada uno</strong> (negras).</li>
                </ul>
              </div>

              {/* Bloque 2: Notas con Bajo (Inversiones) */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                <h5 className="font-black text-slate-900 text-[11px] uppercase tracking-wide flex items-center gap-1.5 text-amber-700">
                  <Music className="w-3.5 h-3.5" />
                  <span>Notas con Bajo (/Bass)</span>
                </h5>
                <p className="text-[11px] text-slate-600 leading-normal">
                  El acorde a la izquierda es para la armonía y a la derecha es la nota que toca el <strong>bajista</strong>:
                </p>
                <ul className="text-[11px] space-y-1">
                  <li>• <code className="text-amber-800 font-black font-mono">D/F#</code>: Re mayor con bajo en Fa#.</li>
                  <li>• <code className="text-amber-800 font-black font-mono">G/B</code>: Sol mayor con bajo en Si.</li>
                  <li>• <code className="text-amber-800 font-black font-mono">C/E</code>: Do mayor con bajo en Mi.</li>
                </ul>
                <p className="text-[10px] text-emerald-700 font-semibold">
                  ✓ Se transportan solas si los músicos suben o bajan tono.
                </p>
              </div>

              {/* Bloque 3: Métricas 3/4 y 6/8 */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                <h5 className="font-black text-slate-900 text-[11px] uppercase tracking-wide flex items-center gap-1.5 text-emerald-700">
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Métricas 3/4 y 6/8</span>
                </h5>
                <ul className="text-[11px] space-y-1 text-slate-600">
                  <li>• <strong>[3/4]</strong>: Ritmo ternario (3 tiempos por compás). <code className="font-mono font-bold">| G |</code> = 3 tiempos.</li>
                  <li>• <strong>[6/8]</strong>: Baladas lentas de adoración. Se siente en 2 pulsos ternarios.</li>
                  <li>• <strong>Notas de paso</strong>: <code className="bg-amber-100/80 px-1 py-0.5 rounded font-bold text-amber-900">(D#dim)</code> entre paréntesis.</li>
                </ul>
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
};
