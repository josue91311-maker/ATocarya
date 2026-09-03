import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceDate, SlotConfig } from '../types';
import { Copy, Calendar, Clock, X, AlertCircle, Check, Users } from 'lucide-react';
import { getTodayDateString } from '../utils/dateUtils';

interface Props {
  service: ServiceDate | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDuplicateModal: React.FC<Props> = ({ service, isOpen, onClose }) => {
  const { duplicateService } = useApp();

  const [newDate, setNewDate] = useState('');
  const [newRegistrationDeadline, setNewRegistrationDeadline] = useState('');
  const [copyMusicians, setCopyMusicians] = useState(false);
  const [error, setError] = useState('');

  // Sugerir automáticamente la fecha para la semana siguiente cuando se abre el modal
  useEffect(() => {
    if (service && isOpen) {
      setError('');
      setCopyMusicians(false);

      // Calcular +7 días desde la fecha de origen
      const [y, m, d] = service.date.split('-').map(Number);
      const nextDate = new Date(y, m - 1, d);
      nextDate.setDate(nextDate.getDate() + 7);

      const nextDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
      setNewDate(nextDateStr);

      // Calcular fecha límite (1 día antes por defecto si la original tenía)
      if (service.registrationDeadline) {
        const deadlineDate = new Date(nextDate);
        deadlineDate.setDate(deadlineDate.getDate() - 1);
        setNewRegistrationDeadline(
          `${deadlineDate.getFullYear()}-${String(deadlineDate.getMonth() + 1).padStart(2, '0')}-${String(deadlineDate.getDate()).padStart(2, '0')}`
        );
      } else {
        setNewRegistrationDeadline('');
      }
    }
  }, [service, isOpen]);

  if (!isOpen || !service) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) {
      setError('Por favor selecciona la nueva fecha para el evento.');
      return;
    }

    const res = duplicateService(service.id, newDate, newRegistrationDeadline, copyMusicians);
    if (!res.success) {
      setError(res.message || 'No se pudo duplicar el servicio.');
      return;
    }

    onClose();
  };

  // Presets rápidos para la fecha del evento
  const applyDateOffset = (days: number) => {
    const [y, m, d] = service.date.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    target.setDate(target.getDate() + days);
    const dateStr = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
    setNewDate(dateStr);

    // Ajustar también deadline si existe
    if (newRegistrationDeadline) {
      const dead = new Date(target);
      dead.setDate(dead.getDate() - 1);
      setNewRegistrationDeadline(`${dead.getFullYear()}-${String(dead.getMonth() + 1).padStart(2, '0')}-${String(dead.getDate()).padStart(2, '0')}`);
    }
  };

  // Presets para la fecha límite
  const applyDeadlineOffset = (offsetDaysFromEvent: number) => {
    if (!newDate) return;
    const [y, m, d] = newDate.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    target.setDate(target.getDate() + offsetDaysFromEvent);
    setNewRegistrationDeadline(`${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`);
  };

  const enabledSlotsCount = (Object.values(service.slots) as SlotConfig[]).filter(s => s.enabled !== false).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl border border-slate-200/90 shadow-xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-display">
                Duplicar Fecha de Culto
              </h3>
              <p className="text-xs text-slate-500">
                Crea una nueva fecha copiando toda la configuración de instrumentos
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

        {/* Source info card */}
        <div className="px-6 pt-5">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 space-y-1">
            <div className="flex items-center justify-between font-semibold text-slate-800">
              <span className="truncate">{service.title}</span>
              <span className="text-emerald-800 text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold">
                {enabledSlotsCount} instrumentos activos
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-500 text-[11px]">
              <span>Origen: <strong>{service.date}</strong></span>
              <span>· Culto: <strong>{service.time}</strong></span>
              {service.rehearsalTime && <span>· Ensayo: <strong>{service.rehearsalTime}</strong></span>}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Nueva Fecha del Evento */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Nueva Fecha del Evento *</span>
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => applyDateOffset(7)}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  +7 días
                </button>
                <button
                  type="button"
                  onClick={() => applyDateOffset(14)}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  +14 días
                </button>
              </div>
            </div>
            <input
              type="date"
              required
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
            />
          </div>

          {/* 2. Nueva Fecha Límite de Inscripción */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Fecha Límite de Inscripción (Expiración)</span>
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => applyDeadlineOffset(-1)}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 font-semibold transition-colors"
                >
                  1 día antes
                </button>
                <button
                  type="button"
                  onClick={() => applyDeadlineOffset(0)}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 font-semibold transition-colors"
                >
                  Mismo día
                </button>
                {newRegistrationDeadline && (
                  <button
                    type="button"
                    onClick={() => setNewRegistrationDeadline('')}
                    className="px-1.5 py-0.5 text-slate-400 hover:text-slate-600"
                  >
                    Borrar
                  </button>
                )}
              </div>
            </div>
            <input
              type="date"
              value={newRegistrationDeadline}
              onChange={(e) => setNewRegistrationDeadline(e.target.value)}
              placeholder="Opcional: Sin fecha límite"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Si se asigna, los músicos ya no podrán anotarse pasada esta fecha.
            </p>
          </div>

          {/* 3. Opción de copiar asignaciones de músicos */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                checked={copyMusicians}
                onChange={(e) => setCopyMusicians(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-600" />
                  Copiar también los músicos ya asignados
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {copyMusicians
                    ? 'Los mismos músicos quedarán confirmados en la nueva fecha.'
                    : 'Recomendado: los puestos se crearán vacantes para que los músicos pongan su check.'}
                </p>
              </div>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all"
            >
              <Copy className="w-4 h-4" />
              <span>Confirmar y Duplicar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
