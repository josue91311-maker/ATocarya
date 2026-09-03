import React from 'react';
import { useApp } from '../context/AppContext';
import { SlotKey, SlotConfig, ServiceDate } from '../types';
import { 
  Plus, 
  RefreshCw, 
  Share2, 
  Download, 
  Calendar, 
  Trash2, 
  Eye, 
  EyeOff, 
  Edit3,
  Layers,
  Camera,
  Sliders,
  Copy,
  Sparkles
} from 'lucide-react';

import { ConfirmModal, ConfirmDialogOptions } from './ConfirmModal';
import { AdminDuplicateModal } from './AdminDuplicateModal';
import { AdminQuickBatchModal } from './AdminQuickBatchModal';
import { getMonthKey, getMonthLabel, isServicePast, isServiceExpired } from '../utils/dateUtils';

interface Props {
  onOpenService: (serviceId: string) => void;
  onOpenCreateModal: () => void;
  onOpenShareModal: () => void;
  onGoToVisualBoard?: () => void;
  onEditService?: (service: ServiceDate) => void;
}

export const AdminScheduleTable: React.FC<Props> = ({
  onOpenService,
  onOpenCreateModal,
  onOpenShareModal,
  onGoToVisualBoard,
  onEditService,
}) => {
  const [confirmDialog, setConfirmDialog] = React.useState<ConfirmDialogOptions | null>(null);
  const [duplicatingService, setDuplicatingService] = React.useState<ServiceDate | null>(null);
  const [isQuickBatchOpen, setIsQuickBatchOpen] = React.useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = React.useState<string>('all');
  const [hidePast, setHidePast] = React.useState<boolean>(true);

  const { 
    services, 
    musicians, 
    generateSundays, 
    deleteService, 
    toggleServiceOpen, 
    exportDatabaseJSON 
  } = useApp();

  const availableMonths = Array.from(new Set(services.map(s => getMonthKey(s.date)))).filter(Boolean).sort();
  const filteredServices = services.filter(s => {
    if (hidePast && isServicePast(s.date)) return false;
    if (selectedMonth !== 'all' && getMonthKey(s.date) !== selectedMonth) return false;
    return true;
  });

  const SLOT_COLUMNS: { key: SlotKey; label: string }[] = [
    { key: 'piano_1', label: 'Piano 1' },
    { key: 'piano_2', label: 'Piano 2' },
    { key: 'guitarra_1', label: 'Guit. Eléc 1' },
    { key: 'guitarra_2', label: 'Guit. Eléc 2' },
    { key: 'guitarra_acustica', label: 'Guit. Acús' },
    { key: 'bateria', label: 'Batería' },
    { key: 'bajo', label: 'Bajo' },
    { key: 'voz_director', label: 'Voz Director' },
    { key: 'voz_coro_1', label: 'Coro 1' },
    { key: 'voz_coro_2', label: 'Coro 2' },
    { key: 'voz_coro_3', label: 'Coro 3' },
    { key: 'voz_coro_4', label: 'Coro 4' },
    { key: 'sonido', label: 'Sonido' },
  ];

  const handleExportJSON = () => {
    const json = exportDatabaseJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atocarya_cronograma_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold font-display text-slate-900">
              Matriz de Planes & Asignaciones
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            <strong className="text-slate-800 tabular-nums">{services.length}</strong> cultos programados · <strong className="text-slate-800 tabular-nums">{musicians.length}</strong> músicos en el equipo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onGoToVisualBoard && (
            <button
              onClick={onGoToVisualBoard}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-lg text-xs transition-colors shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              <span>Ver como Foto</span>
            </button>
          )}

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all shadow-sm shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Programar Culto</span>
          </button>

          <button
            onClick={() => setIsQuickBatchOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold rounded-lg text-xs transition-all shadow-2xs"
            title="Crear fechas para cualquier día de la semana (Lunes a Domingo), cantidad y hora"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>⚡ Creación Rápida</span>
          </button>

          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Month & Past Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-700">Filtro por Mes:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="all">📅 Todos los meses ({services.length})</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {getMonthLabel(m)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hidePast}
              onChange={(e) => setHidePast(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <span>Ocultar fechas que ya pasaron</span>
          </label>
          <span className="text-xs text-slate-300">|</span>
          <span className="text-xs font-bold text-slate-700 tabular-nums">
            {filteredServices.length} fecha(s) visible(s)
          </span>
        </div>
      </div>

      {/* Table container */}
      {filteredServices.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No hay servicios en el cronograma con los filtros actuales</p>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            {hidePast ? 'Las fechas pasadas están ocultas. Desmarca la casilla si deseas ver el historial.' : 'No se encontraron servicios para este mes.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={onOpenCreateModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              Programar Culto Individual
            </button>
            <button
              onClick={() => setIsQuickBatchOpen(true)}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚡ Creador Rápido en Lote</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 sticky left-0 bg-slate-50 z-10 border-r border-slate-200 whitespace-nowrap font-bold">
                    Fecha & Culto
                  </th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap font-bold">
                    Hora
                  </th>
                  {SLOT_COLUMNS.map((col) => (
                    <th key={col.key} className="py-3.5 px-2 text-center whitespace-nowrap font-bold text-slate-700">
                      {col.label}
                    </th>
                  ))}
                  <th className="py-3.5 px-3 text-center whitespace-nowrap font-bold">
                    Inscripción
                  </th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap font-bold">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.map((service) => {
                  const [year, month, day] = service.date.split('-');
                  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
                  const dateStr = dateObj.toLocaleDateString('es-ES', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  });
                  const isPast = isServicePast(service.date);
                  const isExpired = isServiceExpired(service);

                  return (
                    <tr 
                      key={service.id} 
                      className={`hover:bg-emerald-50/25 transition-colors cursor-pointer ${
                        isPast ? 'bg-slate-50/60 opacity-80' : ''
                      }`}
                      onClick={() => onOpenService(service.id)}
                    >
                      {/* Date */}
                      <td className="py-3 px-4 sticky left-0 bg-white z-10 border-r border-slate-200 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 capitalize font-display">
                            {dateStr}
                          </p>
                          {isPast && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-bold">
                              Pasado
                            </span>
                          )}
                          {isExpired && !isPast && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
                              Expirado
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate max-w-[140px] font-medium">
                          {service.title}
                        </p>
                        {service.registrationDeadline && (
                          <p className="text-[10px] text-amber-700 font-medium">
                            Límite: {service.registrationDeadline}
                          </p>
                        )}
                      </td>

                      {/* Time */}
                      <td className="py-3 px-3 text-center text-slate-700 font-bold text-xs whitespace-nowrap tabular-nums">
                        {service.time}
                      </td>

                      {/* Instrument Slots */}
                      {SLOT_COLUMNS.map((col) => {
                        const slot = service.slots?.[col.key];
                        const isEnabled = slot ? slot.enabled !== false : true;
                        const isOccupied = isEnabled && Boolean(slot?.musicianId);
                        const firstName = slot?.musicianName?.split(' ')[0] || '';

                        if (!isEnabled) {
                          return (
                            <td key={col.key} className="py-3 px-2 text-center whitespace-nowrap">
                              <span className="text-slate-300 font-mono text-[10px]" title="Instrumento no requerido en esta fecha">
                                —
                              </span>
                            </td>
                          );
                        }

                        return (
                          <td key={col.key} className="py-3 px-2 text-center whitespace-nowrap">
                            {isOccupied ? (
                              <div 
                                title={slot?.musicianName || 'Músico Asignado'}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/90 text-emerald-900 font-semibold text-[11px] max-w-[95px] truncate shadow-2xs"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                                <span className="truncate">{firstName || 'Asignado'}</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md border border-dashed border-slate-300 text-slate-400 text-[10px] font-medium hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50/50 transition-colors">
                                Vacante
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* State toggle */}
                      <td className="py-3 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleServiceOpen(service.id)}
                          className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                            service.isOpen
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {service.isOpen ? (
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-emerald-600" /> Abierto</span>
                          ) : (
                            <span className="flex items-center gap-1"><EyeOff className="w-3 h-3 text-slate-400" /> Cerrado</span>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setDuplicatingService(service)}
                            title="Duplicar esta fecha (cambiar fecha del evento y fecha límite)"
                            className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {onEditService && (
                            <button
                              onClick={() => onEditService(service)}
                              title="Editar fecha y configurar instrumentos"
                              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onOpenService(service.id)}
                            title="Ver / Asignar músicos"
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: '¿Eliminar fecha de servicio?',
                                message: `¿Estás seguro de que deseas eliminar la fecha del ${dateStr}? Se removerá del cronograma.`,
                                confirmText: 'Sí, eliminar fecha',
                                cancelText: 'Cancelar',
                                type: 'danger',
                                onConfirm: () => {
                                  setConfirmDialog(null);
                                  deleteService(service.id);
                                },
                                onCancel: () => setConfirmDialog(null),
                              });
                            }}
                            title="Eliminar fecha"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modern In-App Confirmation Dialog */}
      <ConfirmModal options={confirmDialog} />

      {/* Modal para Duplicar Fecha */}
      <AdminDuplicateModal 
        service={duplicatingService} 
        isOpen={!!duplicatingService} 
        onClose={() => setDuplicatingService(null)} 
      />

      {/* Modal para Creación Rápida en Lote */}
      <AdminQuickBatchModal 
        isOpen={isQuickBatchOpen} 
        onClose={() => setIsQuickBatchOpen(false)} 
      />
    </div>
  );
};
