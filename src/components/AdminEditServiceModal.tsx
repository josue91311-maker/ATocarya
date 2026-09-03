import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceDate, SlotKey } from '../types';
import { 
  X, 
  Clock, 
  Check, 
  Sliders, 
  AlertCircle
} from 'lucide-react';
import { InstrumentIcon } from './InstrumentIcon';

interface Props {
  service: ServiceDate | null;
  isOpen: boolean;
  onClose: () => void;
}

const ALL_SLOTS_DEF: { key: SlotKey; label: string; category: string }[] = [
  { key: 'voz_director', label: 'Voz Director', category: 'Voces' },
  { key: 'voz_coro_1', label: 'Voz Coro 1', category: 'Voces' },
  { key: 'voz_coro_2', label: 'Voz Coro 2', category: 'Voces' },
  { key: 'voz_coro_3', label: 'Voz Coro 3', category: 'Voces' },
  { key: 'voz_coro_4', label: 'Voz Coro 4', category: 'Voces' },
  { key: 'piano_1', label: 'Piano 1', category: 'Teclados' },
  { key: 'piano_2', label: 'Piano 2', category: 'Teclados' },
  { key: 'guitarra_1', label: 'Guitarra Eléc. 1', category: 'Guitarras' },
  { key: 'guitarra_2', label: 'Guitarra Eléc. 2', category: 'Guitarras' },
  { key: 'guitarra_acustica', label: 'Guitarra Acústica', category: 'Guitarras' },
  { key: 'bateria', label: 'Batería', category: 'Ritmo' },
  { key: 'bajo', label: 'Bajo', category: 'Ritmo' },
  { key: 'sonido', label: 'Sonido & Audio', category: 'Técnica' },
];

const SLOT_LABEL_MAP = ALL_SLOTS_DEF.reduce((acc, item) => {
  acc[item.key] = item.label;
  return acc;
}, {} as Record<SlotKey, string>);

export const AdminEditServiceModal: React.FC<Props> = ({ service, isOpen, onClose }) => {
  const { updateServiceConfig } = useApp();

  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:30');
  const [rehearsalTime, setRehearsalTime] = useState('08:30');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [enabledSlots, setEnabledSlots] = useState<Record<SlotKey, boolean>>(() => {
    const initial: Record<SlotKey, boolean> = {} as any;
    ALL_SLOTS_DEF.forEach(s => { initial[s.key] = true; });
    return initial;
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize fields when modal opens with service
  useEffect(() => {
    if (service) {
      setDate(service.date || '');
      setTime(service.time || '09:30');
      setRehearsalTime(service.rehearsalTime || '08:30');
      setTitle(service.title || '');
      setNotes(service.notes || '');
      setRegistrationDeadline(service.registrationDeadline || '');

      const initialEnabled: Record<SlotKey, boolean> = {} as any;
      ALL_SLOTS_DEF.forEach(item => {
        const slotInService = service.slots?.[item.key];
        initialEnabled[item.key] = slotInService ? slotInService.enabled !== false : true;
      });
      setEnabledSlots(initialEnabled);
    }
  }, [service, isOpen]);

  if (!isOpen || !service) return null;

  const handleToggleSlot = (key: SlotKey) => {
    setEnabledSlots(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Presets
  const applyPresetAll = () => {
    const allOn: Record<SlotKey, boolean> = {} as any;
    ALL_SLOTS_DEF.forEach(s => { allOn[s.key] = true; });
    setEnabledSlots(allOn);
  };

  const applyPresetAcoustic = () => {
    const acoustic: Record<SlotKey, boolean> = {
      piano_1: true,
      piano_2: false,
      guitarra_1: false,
      guitarra_2: false,
      guitarra_acustica: true,
      bateria: false,
      bajo: true,
      voz_director: true,
      voz_coro_1: true,
      voz_coro_2: true,
      voz_coro_3: false,
      voz_coro_4: false,
      sonido: true,
    };
    setEnabledSlots(acoustic);
  };

  const applyPresetBasic = () => {
    const basic: Record<SlotKey, boolean> = {
      piano_1: true,
      piano_2: false,
      guitarra_1: true,
      guitarra_2: false,
      guitarra_acustica: false,
      bateria: true,
      bajo: true,
      voz_director: true,
      voz_coro_1: true,
      voz_coro_2: false,
      voz_coro_3: false,
      voz_coro_4: false,
      sonido: true,
    };
    setEnabledSlots(basic);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const activeCount = Object.values(enabledSlots).filter(Boolean).length;
    if (activeCount === 0) {
      setError('Debes habilitar al menos 1 instrumento o puesto vocal para este servicio.');
      return;
    }

    const res = updateServiceConfig(service.id, {
      date,
      time,
      title,
      rehearsalTime,
      notes,
      enabledSlots,
      registrationDeadline,
    });

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 900);
    } else {
      setError(res.message || 'Error al actualizar el servicio.');
    }
  };

  const categories: Array<{ name: string; keys: SlotKey[] }> = [
    { name: 'Voces', keys: ['voz_director', 'voz_coro_1', 'voz_coro_2', 'voz_coro_3', 'voz_coro_4'] },
    { name: 'Teclados', keys: ['piano_1', 'piano_2'] },
    { name: 'Guitarras', keys: ['guitarra_1', 'guitarra_2', 'guitarra_acustica'] },
    { name: 'Ritmo', keys: ['bateria', 'bajo'] },
    { name: 'Técnica', keys: ['sonido'] },
  ];

  const activeCount = Object.values(enabledSlots).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header - Planning Center Style */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Editar Fecha & Configurar Instrumentos
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Configura los datos del culto y qué puestos estarán habilitados.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>¡Culto e instrumentos actualizados correctamente!</span>
            </div>
          )}

          {/* Date & Title Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fecha del Culto *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hora de Inicio *
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hora de Ensayo Previo
              </label>
              <input
                type="time"
                value={rehearsalTime}
                onChange={(e) => setRehearsalTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Título o Motivo del Culto
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Culto Dominical de Alabanza"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* FECHA LÍMITE DE EXPIRACIÓN */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Fecha Límite de Inscripción (Expiración)</span>
              </label>
              <span className="text-[10px] text-amber-700 font-semibold">
                Opcional
              </span>
            </div>
            <p className="text-[11px] text-amber-800">
              Pasada esta fecha, la opción de elegir instrumento se bloqueará y saldrá como <strong>Expirado</strong> para los músicos.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="date"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (date) {
                      const d = new Date(date + 'T00:00:00');
                      d.setDate(d.getDate() - 1);
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, '0');
                      const dayStr = String(d.getDate()).padStart(2, '0');
                      setRegistrationDeadline(`${y}-${m}-${dayStr}`);
                    }
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100/60 border border-amber-200 rounded-lg text-[10px] font-bold text-amber-900 whitespace-nowrap shadow-2xs"
                >
                  1 día antes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (date) setRegistrationDeadline(date);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100/60 border border-amber-200 rounded-lg text-[10px] font-bold text-amber-900 whitespace-nowrap shadow-2xs"
                >
                  Mismo día
                </button>
                <button
                  type="button"
                  onClick={() => setRegistrationDeadline('')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-amber-200 rounded-lg text-[10px] text-slate-600 whitespace-nowrap shadow-2xs"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          {/* DYNAMIC INSTRUMENT CONFIGURATION SECTION */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 font-display">
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Instrumentos Requeridos ese Día</span>
                  <span className="ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {activeCount} de 13 activos
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Desmarca los instrumentos que no se necesitarán en esta fecha.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={applyPresetAll}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors"
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={applyPresetAcoustic}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold transition-colors"
                >
                  Acústico
                </button>
                <button
                  type="button"
                  onClick={applyPresetBasic}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors"
                >
                  Básico
                </button>
              </div>
            </div>

            {/* Categorized Toggles Grid */}
            <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              {categories.map((cat) => (
                <div key={cat.name} className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    {cat.name}
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {cat.keys.map((key) => {
                      const slotLabel = service.slots?.[key]?.label || SLOT_LABEL_MAP[key] || key;
                      const isEnabled = enabledSlots[key] !== false;

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleToggleSlot(key)}
                          className={`p-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all ${
                            isEnabled
                              ? 'bg-white border-emerald-300 text-slate-900 shadow-2xs'
                              : 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <InstrumentIcon instrument={key} className={`w-4 h-4 flex-shrink-0 ${isEnabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className="text-xs font-semibold truncate">
                              {slotLabel}
                            </span>
                          </div>

                          <div className={`w-4 h-4 rounded-md flex items-center justify-center border text-white transition-colors ${
                            isEnabled ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-slate-300'
                          }`}>
                            {isEnabled && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notas, Repertorio de Canciones (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Canciones: 1. Tu Fidelidad, 2. Bueno es Alabar. Vestimenta: Formal."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 resize-none font-medium"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm shadow-emerald-600/20"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
