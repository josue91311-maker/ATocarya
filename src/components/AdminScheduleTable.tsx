import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SlotKey, SlotConfig, ServiceDate } from '../types';
import { 
  Plus, 
  Share2, 
  Download, 
  Calendar, 
  Trash2, 
  Eye, 
  EyeOff, 
  Edit3,
  Camera,
  Sliders,
  Copy,
  Sparkles,
  Music,
  Users,
  Search,
  CheckCircle2,
  ChevronRight,
  BarChart2,
  Music2,
  Check
} from 'lucide-react';

import { ConfirmModal, ConfirmDialogOptions } from './ConfirmModal';
import { AdminDuplicateModal } from './AdminDuplicateModal';
import { AdminQuickBatchModal } from './AdminQuickBatchModal';
import { InstrumentIcon } from './InstrumentIcon';
import { getMonthKey, getMonthLabel, isServicePast, isServiceExpired } from '../utils/dateUtils';

interface Props {
  onOpenService: (serviceId: string) => void;
  onOpenCreateModal: () => void;
  onOpenShareModal: () => void;
  onGoToVisualBoard?: () => void;
  onEditService?: (service: ServiceDate) => void;
  onOpenSetlist?: (service: ServiceDate) => void;
}

interface ColumnConfig {
  key: SlotKey;
  label: string;
  iconKey: string;
  colorClass: string;
  bgClass: string;
  badgeBg: string;
}

const SLOT_COLUMNS: ColumnConfig[] = [
  { key: 'piano_1', label: 'PIANO 1', iconKey: 'piano', colorClass: 'text-rose-600', bgClass: 'bg-rose-50 border-rose-200', badgeBg: 'bg-rose-50 border-rose-200 text-rose-900' },
  { key: 'piano_2', label: 'PIANO 2', iconKey: 'piano', colorClass: 'text-rose-600', bgClass: 'bg-rose-50 border-rose-200', badgeBg: 'bg-rose-50 border-rose-200 text-rose-900' },
  { key: 'guitarra_1', label: 'GUIT. ELÉC 1', iconKey: 'guitarra_1', colorClass: 'text-[#1E74FD]', bgClass: 'bg-blue-50 border-blue-200', badgeBg: 'bg-blue-50 border-blue-200 text-blue-900' },
  { key: 'guitarra_2', label: 'GUIT. ELÉC 2', iconKey: 'guitarra_2', colorClass: 'text-[#1E74FD]', bgClass: 'bg-blue-50 border-blue-200', badgeBg: 'bg-blue-50 border-blue-200 text-blue-900' },
  { key: 'guitarra_acustica', label: 'GUIT. ACÚS', iconKey: 'guitarra_acustica', colorClass: 'text-teal-600', bgClass: 'bg-teal-50 border-teal-200', badgeBg: 'bg-teal-50 border-teal-200 text-teal-900' },
  { key: 'bateria', label: 'BATERÍA', iconKey: 'bateria', colorClass: 'text-amber-600', bgClass: 'bg-amber-50 border-amber-200', badgeBg: 'bg-amber-50 border-amber-200 text-amber-900' },
  { key: 'bajo', label: 'BAJO', iconKey: 'bajo', colorClass: 'text-indigo-600', bgClass: 'bg-indigo-50 border-indigo-200', badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-900' },
  { key: 'voz_director', label: 'VOZ DIRECTOR', iconKey: 'voz_director', colorClass: 'text-purple-600', bgClass: 'bg-purple-50 border-purple-200', badgeBg: 'bg-purple-50 border-purple-200 text-purple-900' },
  { key: 'voz_coro_1', label: 'CORO 1', iconKey: 'voz_coro_1', colorClass: 'text-pink-600', bgClass: 'bg-pink-50 border-pink-200', badgeBg: 'bg-pink-50 border-pink-200 text-pink-900' },
  { key: 'voz_coro_2', label: 'CORO 2', iconKey: 'voz_coro_2', colorClass: 'text-pink-600', bgClass: 'bg-pink-50 border-pink-200', badgeBg: 'bg-pink-50 border-pink-200 text-pink-900' },
  { key: 'voz_coro_3', label: 'CORO 3', iconKey: 'voz_coro_3', colorClass: 'text-pink-600', bgClass: 'bg-pink-50 border-pink-200', badgeBg: 'bg-pink-50 border-pink-200 text-pink-900' },
  { key: 'voz_coro_4', label: 'CORO 4', iconKey: 'voz_coro_4', colorClass: 'text-pink-600', bgClass: 'bg-pink-50 border-pink-200', badgeBg: 'bg-pink-50 border-pink-200 text-pink-900' },
  { key: 'sonido', label: 'SONIDO', iconKey: 'sonido', colorClass: 'text-violet-600', bgClass: 'bg-violet-50 border-violet-200', badgeBg: 'bg-violet-50 border-violet-200 text-violet-900' },
];

export const AdminScheduleTable: React.FC<Props> = ({
  onOpenService,
  onOpenCreateModal,
  onOpenShareModal,
  onGoToVisualBoard,
  onEditService,
  onOpenSetlist,
}) => {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);
  const [duplicatingService, setDuplicatingService] = useState<ServiceDate | null>(null);
  const [isQuickBatchOpen, setIsQuickBatchOpen] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [hidePast, setHidePast] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { 
    services, 
    musicians, 
    deleteService, 
    toggleServiceOpen, 
    exportDatabaseJSON 
  } = useApp();

  const availableMonths = useMemo(() => {
    return Array.from(new Set(services.map(s => getMonthKey(s.date)))).filter(Boolean).sort();
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      if (hidePast && isServicePast(s.date)) return false;
      if (selectedMonth !== 'all' && getMonthKey(s.date) !== selectedMonth) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = s.title.toLowerCase().includes(term);
        const matchesDate = s.date.includes(term);
        const matchesMusician = Object.values(s.slots || {}).some(
          slot => slot.musicianName && slot.musicianName.toLowerCase().includes(term)
        );
        const matchesRole = Object.values(s.slots || {}).some(
          slot => slot.label && slot.label.toLowerCase().includes(term)
        );
        if (!matchesTitle && !matchesDate && !matchesMusician && !matchesRole) return false;
      }
      return true;
    });
  }, [services, hidePast, selectedMonth, searchTerm]);

  // Cálculos de KPIs estrictamente basados en cultos activos pendientes y huecos cubiertos
  const pendingServices = useMemo(() => {
    return services.filter(s => s && s.date && !isServicePast(s.date));
  }, [services]);

  const totalPendingSlots = useMemo(() => {
    return pendingServices.reduce((acc, s) => {
      return acc + Object.values(s.slots || {}).filter(slot => slot && slot.enabled !== false).length;
    }, 0);
  }, [pendingServices]);

  const coveredPendingSlots = useMemo(() => {
    return pendingServices.reduce((acc, s) => {
      return acc + Object.values(s.slots || {}).filter(slot => slot && slot.enabled !== false && Boolean(slot.musicianId)).length;
    }, 0);
  }, [pendingServices]);

  const vacantPendingSlots = totalPendingSlots - coveredPendingSlots;

  const pendingCoverage = totalPendingSlots > 0 
    ? Math.round((coveredPendingSlots / totalPendingSlots) * 100) 
    : 0;

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
    <div className="space-y-5 sm:space-y-6">
      
      {/* 1. Header Superior & Acciones Principales */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1E74FD] flex items-center justify-center border border-blue-100 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0B132B] tracking-tight">
              Matriz de Planes & Asignaciones
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              <strong className="text-slate-800 tabular-nums">{pendingServices.length}</strong> cultos activos pendientes · <strong className="text-slate-800 tabular-nums">{musicians.length}</strong> músicos en el equipo · <strong className="text-emerald-700 tabular-nums">{coveredPendingSlots}/{totalPendingSlots}</strong> huecos cubiertos ({pendingCoverage}%)
            </p>
          </div>
        </div>

        {/* Botones de acción en Desktop */}
        <div className="hidden sm:flex flex-wrap items-center gap-2">
          {onGoToVisualBoard && (
            <button
              onClick={onGoToVisualBoard}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs transition-colors shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              <span>Ver como Foto</span>
            </button>
          )}

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1E74FD] hover:bg-[#155de0] text-white font-bold rounded-xl text-xs transition-all shadow-sm shadow-blue-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Programar Culto</span>
          </button>

          <button
            onClick={() => setIsQuickBatchOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-blue-50 text-[#1E74FD] border border-blue-200 font-bold rounded-xl text-xs transition-all shadow-2xs"
            title="Crear fechas para cualquier día de la semana, cantidad y hora"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#1E74FD]" />
            <span>⚡ Creación Rápida</span>
          </button>

          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5 text-[#1E74FD]" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* 2. Tarjetas KPI de Resumen (4 métricas de Cultos Activos Pendientes) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Cultos Activos Pendientes */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-black text-[#0B132B] tabular-nums block leading-none">
              {pendingServices.length}
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-slate-600 block">
              Cultos activos pendientes
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">
              Fechas por realizarse
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1E74FD] flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Músicos en el Equipo */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-black text-[#0B132B] tabular-nums block leading-none">
              {musicians.length}
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-slate-600 block">
              Músicos en el equipo
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">
              Total registrados
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Huecos Cubiertos (Cultos Pendientes) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700 tabular-nums leading-none">
                {coveredPendingSlots}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-400 tabular-nums">
                / {totalPendingSlots}
              </span>
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-600 block">
              Huecos cubiertos (pendientes)
            </span>
            <span className="text-[10px] text-amber-700 block font-medium">
              {vacantPendingSlots} vacantes por cubrir
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Music2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Cobertura de Roles Pendientes */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-black text-[#0B132B] tabular-nums block leading-none">
              {pendingCoverage}%
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-slate-600 block">
              Cobertura roles pendientes
            </span>
            <span className="text-[10px] text-emerald-700 block font-medium">
              {coveredPendingSlots} asignaciones activas
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#FF7E22] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Acciones principales en Móvil (Botón destacado + 2x2 grid) */}
      <div className="sm:hidden space-y-2.5">
        <button
          onClick={onOpenCreateModal}
          className="w-full py-3 bg-[#1E74FD] hover:bg-[#155de0] text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Programar Culto</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          {onGoToVisualBoard && (
            <button
              onClick={onGoToVisualBoard}
              className="py-2.5 px-3 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              <span>Ver como Foto</span>
            </button>
          )}

          <button
            onClick={() => setIsQuickBatchOpen(true)}
            className="py-2.5 px-3 bg-white border border-blue-200 text-[#1E74FD] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#1E74FD]" />
            <span>Creación Rápida</span>
          </button>

          <button
            onClick={onOpenShareModal}
            className="py-2.5 px-3 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5 text-[#1E74FD]" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="py-2.5 px-3 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* 3. Barra de Filtros & Búsqueda */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Selector de Mes */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 shrink-0 hidden sm:inline">
              Filtro por Mes:
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E74FD] cursor-pointer w-full sm:w-auto"
            >
              <option value="all">📅 Todos los meses ({services.length})</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {getMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Barra de Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar fecha, músico o rol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E74FD]"
            />
          </div>
        </div>

        {/* Toggle Ocultar Pasados & Conteo */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hidePast}
              onChange={(e) => setHidePast(e.target.checked)}
              className="rounded text-[#1E74FD] focus:ring-[#1E74FD] w-4 h-4 cursor-pointer"
            />
            <span className="hidden sm:inline">Ocultar fechas que ya pasaron</span>
            <span className="sm:hidden">Ocultar pasados</span>
          </label>
          <span className="text-xs text-slate-300">|</span>
          <span className="text-xs font-bold text-slate-700 tabular-nums">
            {filteredServices.length} fecha(s)
          </span>
        </div>
      </div>

      {/* 4. Estado Vacío */}
      {filteredServices.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-10 text-center shadow-sm space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-[#0B132B]">
            No se encontraron cultos con los filtros actuales
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {hidePast 
              ? 'Las fechas pasadas están ocultas o no coinciden con la búsqueda. Puedes desactivar la casilla para ver el historial.' 
              : 'Intenta cambiar el mes o limpiar el término de búsqueda.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setHidePast(false);
                setSelectedMonth('all');
                setSearchTerm('');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Restablecer filtros
            </button>
            <button
              onClick={onOpenCreateModal}
              className="px-4 py-2 bg-[#1E74FD] hover:bg-[#155de0] text-white rounded-xl text-xs font-bold transition-colors"
            >
              + Programar Nuevo Culto
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 5. VISTA MÓVIL (< md): Tarjetas de Culto con Músicos Asignados (Sin fotos de usuario, badges limpios) */}
          <div className="md:hidden space-y-3">
            {filteredServices.map((service) => {
              const parts = (service.date || '').split('-');
              const year = parts[0] || '2026';
              const month = parts[1] || '01';
              const day = parts[2] || '01';
              const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
              const dateStr = dateObj.toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });
              const monthShort = dateObj.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').slice(0, 3);
              const isPast = isServicePast(service.date);
              const isExpired = isServiceExpired(service);
              
              const allEnabledSlots = (Object.values(service.slots || {}) as SlotConfig[])
                .filter(slot => slot && slot.enabled !== false);
              const confirmedSlots = allEnabledSlots
                .filter(slot => Boolean(slot.musicianId));
              const totalSlotsCount = allEnabledSlots.length;
              const confirmedCount = confirmedSlots.length;
              const hasSongs = service.songs && service.songs.length > 0;

              return (
                <div 
                  key={service.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:border-blue-300 transition-all space-y-3"
                >
                  <div 
                    onClick={() => onOpenService(service.id)}
                    className="flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Badge Calendario de la Fecha (Sin fotos) */}
                      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center shrink-0 text-[#1E74FD]">
                        <span className="text-[10px] font-bold uppercase tracking-wider leading-none text-[#FF7E22]">
                          {monthShort}
                        </span>
                        <span className="text-base font-black leading-tight tabular-nums text-[#0B132B]">
                          {day}
                        </span>
                      </div>

                      {/* Info del Culto */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-[#0B132B] text-sm capitalize">
                            {dateStr}
                          </h3>
                          {isPast ? (
                            <span className="text-[9px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                              Pasado
                            </span>
                          ) : isExpired ? (
                            <span className="text-[9px] px-2 py-0.2 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                              Expirado
                            </span>
                          ) : (
                            <span className="text-[9px] px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                              Activo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 truncate font-semibold mt-0.5">
                          {service.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>⏰ {service.time}</span>
                          {service.rehearsalTime && <span>· Ensayo: {service.rehearsalTime}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        confirmedCount === totalSlotsCount && totalSlotsCount > 0
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : confirmedCount > 0
                          ? 'bg-blue-50 text-[#1E74FD] border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {confirmedCount}/{totalSlotsCount} cupos
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 mt-1" />
                    </div>
                  </div>

                  {/* Fila de Músicos Asignados (Iniciales limpias, SIN fotos de usuario) */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1 flex-wrap min-w-0">
                      {confirmedSlots.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">
                          Sin músicos asignados aún
                        </span>
                      ) : (
                        <>
                          {confirmedSlots.slice(0, 6).map((slot, idx) => (
                            <span
                              key={idx}
                              title={`${slot.label}: ${slot.musicianName}`}
                              className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0 shadow-2xs"
                            >
                              {(slot.musicianName || '?').charAt(0).toUpperCase()}
                            </span>
                          ))}
                          {confirmedSlots.length > 6 && (
                            <span className="text-[10px] font-bold text-slate-500 ml-1">
                              +{confirmedSlots.length - 6} más
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Acciones directas móviles */}
                    <div className="flex items-center gap-1 shrink-0">
                      {hasSongs && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenSetlist && onOpenSetlist(service);
                          }}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-[#1E74FD] border border-blue-200 rounded-lg text-[10px] font-bold flex items-center gap-1"
                          title="Ver repertorio de canciones"
                        >
                          <Music className="w-3 h-3" />
                          <span>Canciones</span>
                        </button>
                      )}
                      {onEditService && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditService(service);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                          title="Editar Culto"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 6. VISTA ESCRITORIO (>= md): Matriz de Tabla Completa Estilizada */}
          <div className="hidden md:block bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 border-b border-slate-200/90 text-slate-600 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 sticky left-0 bg-slate-50 z-20 border-r border-slate-200 whitespace-nowrap font-bold">
                      FECHA & CULTO
                    </th>
                    <th className="py-3 px-3 text-center whitespace-nowrap font-bold">
                      HORA
                    </th>
                    {SLOT_COLUMNS.map((col) => (
                      <th key={col.key} className="py-3 px-2 text-center whitespace-nowrap font-bold">
                        <div className={`w-6 h-6 rounded-lg ${col.bgClass} flex items-center justify-center ${col.colorClass} mx-auto mb-1`}>
                          <InstrumentIcon instrument={col.iconKey} size={14} />
                        </div>
                        <span className="text-[9px] text-slate-600 block tracking-tight">
                          {col.label}
                        </span>
                      </th>
                    ))}
                    <th className="py-3 px-3 text-center whitespace-nowrap font-bold">
                      INSCRIPCIÓN
                    </th>
                    <th className="py-3 px-3 text-center whitespace-nowrap font-bold">
                      ACCIONES
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
                        className={`hover:bg-blue-50/30 transition-colors cursor-pointer ${
                          isPast ? 'bg-slate-50/40 opacity-80' : ''
                        }`}
                        onClick={() => onOpenService(service.id)}
                      >
                        {/* Celda Fecha & Culto */}
                        <td className="py-3 px-4 sticky left-0 bg-white z-10 border-r border-slate-200 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center shrink-0 text-[#1E74FD]">
                              <span className="text-[9px] font-bold uppercase tracking-wider leading-none text-[#FF7E22]">
                                {dateObj.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').slice(0, 3)}
                              </span>
                              <span className="text-sm font-black leading-tight tabular-nums text-[#0B132B]">
                                {day}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#0B132B] capitalize">
                                  {dateStr}
                                </span>
                                {isPast ? (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                                    Pasado
                                  </span>
                                ) : isExpired ? (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                                    Expirado
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate max-w-[140px] font-medium">
                                {service.title}
                              </p>
                              {service.registrationDeadline && (
                                <p className="text-[10px] text-amber-700 font-medium">
                                  Límite: {service.registrationDeadline}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Hora */}
                        <td className="py-3 px-3 text-center text-slate-700 font-bold text-xs whitespace-nowrap tabular-nums">
                          {service.time}
                        </td>

                        {/* Columnas de Instrumentos (Badges limpios con Iniciales, SIN fotos de usuario) */}
                        {SLOT_COLUMNS.map((col) => {
                          const slot = service.slots?.[col.key];
                          const isEnabled = slot ? slot.enabled !== false : true;
                          const isOccupied = isEnabled && Boolean(slot?.musicianId);
                          const firstName = slot?.musicianName?.split(' ')[0] || '';

                          if (!isEnabled) {
                            return (
                              <td key={col.key} className="py-3 px-2 text-center whitespace-nowrap">
                                <span className="text-slate-300 font-mono text-[10px]" title="No requerido">
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
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${col.badgeBg} border text-xs font-semibold max-w-[110px] truncate shadow-2xs`}
                                >
                                  <div className={`w-4 h-4 rounded-full ${col.colorClass.replace('text-', 'bg-')} text-white text-[9px] font-bold flex items-center justify-center shrink-0`}>
                                    {firstName.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="truncate">{firstName}</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenService(service.id);
                                  }}
                                  className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50/80 text-slate-400 text-[10px] font-medium hover:border-[#1E74FD] hover:text-[#1E74FD] hover:bg-blue-50/50 transition-colors"
                                >
                                  Vacante
                                </button>
                              )}
                            </td>
                          );
                        })}

                        {/* Inscripción (Abierto / Cerrado) */}
                        <td className="py-3 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleServiceOpen(service.id)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors ${
                              service.isOpen
                                ? 'bg-blue-50 text-[#1E74FD] border border-blue-200/80 hover:bg-blue-100'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {service.isOpen ? (
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3 text-[#1E74FD]" /> 
                                <span>Abierto</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <EyeOff className="w-3 h-3 text-slate-400" /> 
                                <span>Cerrado</span>
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            {onEditService && (
                              <button
                                onClick={() => onEditService(service)}
                                title="Editar fecha y configurar instrumentos"
                                className="p-1.5 text-slate-500 hover:text-[#1E74FD] hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => onOpenService(service.id)}
                              title="Ver / Asignar músicos"
                              className="p-1.5 text-slate-500 hover:text-[#1E74FD] hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {onOpenSetlist && (
                              <button
                                onClick={() => onOpenSetlist(service)}
                                title="Gestionar repertorio de canciones (Setlist)"
                                className={`p-1.5 rounded-lg transition-colors ${
                                  service.songs && service.songs.length > 0
                                    ? 'text-[#1E74FD] hover:text-[#155de0] bg-blue-50'
                                    : 'text-slate-400 hover:text-[#1E74FD] hover:bg-blue-50'
                                }`}
                              >
                                <Music className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => setDuplicatingService(service)}
                              title="Duplicar fecha"
                              className="p-1.5 text-slate-500 hover:text-[#1E74FD] hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
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
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        </>
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
