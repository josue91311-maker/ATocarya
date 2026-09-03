import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Calendar, Clock, X, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { getTodayDateString } from '../utils/dateUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const WEEKDAYS = [
  { value: 0, label: 'Domingo', short: 'Dom', defaultTitle: 'Servicio Dominical de Alabanza', defaultTime: '09:30', defaultRehearsal: '08:30' },
  { value: 1, label: 'Lunes', short: 'Lun', defaultTitle: 'Reunión de Oración y Alabanza', defaultTime: '19:30', defaultRehearsal: '18:30' },
  { value: 2, label: 'Martes', short: 'Mar', defaultTitle: 'Culto de Adoración', defaultTime: '19:30', defaultRehearsal: '18:30' },
  { value: 3, label: 'Miércoles', short: 'Mié', defaultTitle: 'Culto de Oración y Estudio', defaultTime: '19:30', defaultRehearsal: '18:30' },
  { value: 4, label: 'Jueves', short: 'Jue', defaultTitle: 'Noche de Alabanza', defaultTime: '19:30', defaultRehearsal: '18:30' },
  { value: 5, label: 'Viernes', short: 'Vie', defaultTitle: 'Culto de Jóvenes y Alabanza', defaultTime: '20:00', defaultRehearsal: '19:00' },
  { value: 6, label: 'Sábado', short: 'Sáb', defaultTitle: 'Servicio Especial de Alabanza', defaultTime: '18:00', defaultRehearsal: '17:00' },
];

export const AdminQuickBatchModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { generateRecurringServices } = useApp();

  const [selectedWeekday, setSelectedWeekday] = useState<number>(0); // 0 = Domingo
  const [count, setCount] = useState<number>(4);
  const [time, setTime] = useState<string>('09:30');
  const [rehearsalTime, setRehearsalTime] = useState<string>('08:30');
  const [title, setTitle] = useState<string>('Servicio Dominical de Alabanza');
  const [startDate, setStartDate] = useState<string>(getTodayDateString());
  const [error, setError] = useState<string>('');

  // Cuando cambia el día de la semana, sugerir título y hora acordes
  const handleSelectWeekday = (dayVal: number) => {
    setSelectedWeekday(dayVal);
    const dayConfig = WEEKDAYS.find(w => w.value === dayVal);
    if (dayConfig) {
      setTitle(dayConfig.defaultTitle);
      setTime(dayConfig.defaultTime);
      setRehearsalTime(dayConfig.defaultRehearsal);
    }
  };

  // Calcular las fechas exactas que se generarán para la vista previa
  const previewDates = useMemo(() => {
    if (!startDate || count <= 0) return [];

    const [y, m, d] = startDate.split('-').map(Number);
    const base = new Date(y, m - 1, d);
    const currentDay = base.getDay();
    let daysDiff = (selectedWeekday - currentDay + 7) % 7;

    const first = new Date(base);
    first.setDate(base.getDate() + daysDiff);

    const list: string[] = [];
    for (let i = 0; i < count; i++) {
      const occurrence = new Date(first);
      occurrence.setDate(first.getDate() + i * 7);

      const formatted = occurrence.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      list.push(formatted);
    }
    return list;
  }, [selectedWeekday, count, startDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (count <= 0 || count > 24) {
      setError('Por favor selecciona entre 1 y 24 eventos.');
      return;
    }

    const res = generateRecurringServices({
      weekday: selectedWeekday,
      count,
      time,
      rehearsalTime,
      title,
      startDate,
    });

    if (!res.success) {
      setError(res.message || 'No se pudieron generar los eventos.');
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl border border-slate-200/90 shadow-xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-display">
                Generador Rápido de Cultos
              </h3>
              <p className="text-xs text-slate-500">
                Crea múltiples fechas automáticamente para cualquier día de la semana
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content with scroll */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="batch-form" onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Día de la semana (los 7 días) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                1. Elige el Día de la Semana:
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {WEEKDAYS.map((w) => {
                  const isSelected = selectedWeekday === w.value;
                  return (
                    <button
                      key={w.value}
                      type="button"
                      onClick={() => handleSelectWeekday(w.value)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center border ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block text-[10px] opacity-75 uppercase">{w.short}</span>
                      <span className="text-xs">{w.label.slice(0, 3)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Cantidad de eventos & Fecha inicio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  2. Cantidad de Eventos:
                </label>
                <div className="flex items-center gap-1.5">
                  {[2, 4, 8, 12].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCount(num)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        count === num
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  A partir de la fecha:
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
                />
              </div>
            </div>

            {/* 3. Horarios: Culto & Ensayo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Hora del Culto *</span>
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Hora de Ensayo</span>
                </label>
                <input
                  type="time"
                  value={rehearsalTime}
                  onChange={(e) => setRehearsalTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
                />
              </div>
            </div>

            {/* 4. Título del Evento */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Título del Evento:
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Culto de Oración y Alabanza"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* 5. Vista Previa de las Fechas a Generar */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Fechas que se programarán ({previewDates.length}):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {previewDates.map((dStr, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-800 capitalize shadow-2xs"
                  >
                    <Check className="w-3 h-3 text-emerald-600" />
                    {dStr}
                  </span>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="batch-form"
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generar {count} Eventos</span>
          </button>
        </div>
      </div>
    </div>
  );
};
