import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceDate, SlotConfig } from '../types';
import { ServiceCard } from './ServiceCard';
import { 
  Search, 
  Calendar as CalendarIcon, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  LayoutList, 
  LayoutGrid,
  Clock,
  ChevronRight,
  Check,
  AlertCircle,
  Filter
} from 'lucide-react';
import { InstrumentIcon } from './InstrumentIcon';
import { 
  isServicePast, 
  isServiceExpired, 
  getMonthKey, 
  getMonthLabel 
} from '../utils/dateUtils';

interface Props {
  onSelectService: (service: ServiceDate) => void;
}

export const CalendarView: React.FC<Props> = ({ onSelectService }) => {
  const { services, musicianUser, claimSlot } = useApp();
  const [filterType, setFilterType] = useState<'all' | 'available' | 'mine'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 1. Filtrar fechas que NO hayan pasado aún (solo cultos vigentes)
  const activeUpcomingServices = services.filter(service => !isServicePast(service.date));

  // 2. Extraer lista dinámica de meses disponibles en las fechas vigentes
  const availableMonths = Array.from(
    new Set(activeUpcomingServices.map(s => getMonthKey(s.date)))
  ).filter(Boolean).sort();

  // Métricas computadas sobre fechas vigentes
  const totalServices = activeUpcomingServices.length;
  const myServicesCount = musicianUser
    ? activeUpcomingServices.filter(s => Object.values(s.slots).some(slot => slot.musicianId === musicianUser.id)).length
    : 0;
  
  const totalVacancies = activeUpcomingServices.reduce((acc, s) => {
    if (isServiceExpired(s)) return acc;
    const vacantInService = (Object.values(s.slots) as SlotConfig[])
      .filter(slot => slot.enabled !== false && slot.musicianId === null).length;
    return acc + vacantInService;
  }, 0);

  // 3. Aplicar filtros combinados: Búsqueda + Tipo + Filtro por Mes
  const filteredServices = activeUpcomingServices.filter(service => {
    // Filtro por Mes
    if (selectedMonth !== 'all') {
      if (getMonthKey(service.date) !== selectedMonth) return false;
    }

    // Filtro por Búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTitle = service.title.toLowerCase().includes(term);
      const matchDate = service.date.includes(term);
      const matchMusician = Object.values(service.slots).some(
        s => s.musicianName?.toLowerCase().includes(term) || s.label.toLowerCase().includes(term)
      );
      if (!matchTitle && !matchDate && !matchMusician) return false;
    }

    // Filtro por Tipo
    if (filterType === 'available') {
      const isExpired = isServiceExpired(service);
      const hasAvailable = (Object.values(service.slots) as SlotConfig[])
        .some(s => s.enabled !== false && s.musicianId === null);
      if (!hasAvailable || isExpired) return false;
    }

    if (filterType === 'mine' && musicianUser) {
      const isMine = Object.values(service.slots).some(s => s.musicianId === musicianUser.id);
      if (!isMine) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* 1. TOP METRICS STRIP (SaaS Quick Glance) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Próximos Cultos
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-display text-slate-900 tabular-nums">
              {totalServices}
            </span>
            <span className="text-xs text-slate-500">fechas vigentes</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Mis Puestos
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-display text-emerald-700 tabular-nums">
              {myServicesCount}
            </span>
            <span className="text-xs text-slate-500">confirmados</span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Vacantes Abiertas
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-display text-emerald-800 tabular-nums">
              {totalVacancies}
            </span>
            <span className="text-xs text-slate-500">cupos disponibles</span>
          </div>
        </div>
      </div>

      {/* 2. HEADER & TOOLBAR WITH MONTH FILTER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900">
              Fechas y Servicios de Alabanza
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Solo se muestran cultos vigentes. Usa el <strong>filtro por mes</strong> o el botón de <strong>Check rápido</strong>.
            </p>
          </div>

          {/* View mode toggle */}
          <div className="hidden sm:flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              title="Vista Cuadrícula"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="Vista Lista SaaS"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Controls Toolbar: Month filter, Search, Segmented status filter */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            
            {/* FILTRO POR MES (SELECT / PILL) */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 min-w-[180px]">
              <CalendarIcon className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none w-full cursor-pointer"
              >
                <option value="all">📅 Todos los meses</option>
                {availableMonths.map((mKey) => (
                  <option key={mKey} value={mKey}>
                    {getMonthLabel(mKey)}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar fecha o instrumento..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 overflow-x-auto self-start lg:self-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({activeUpcomingServices.length})
            </button>

            <button
              onClick={() => setFilterType('available')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                filterType === 'available'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Con Vacantes
            </button>

            {musicianUser && (
              <button
                onClick={() => setFilterType('mine')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  filterType === 'mine'
                    ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mis Cultos ({myServicesCount})
              </button>
            )}
          </div>

        </div>
      </div>

      {/* 3. CONTENT AREA */}
      {filteredServices.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-2xs">
          <CalendarIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-900">No se encontraron fechas de servicio vigentes</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {selectedMonth !== 'all' 
              ? `No hay cultos programados para ${getMonthLabel(selectedMonth)}. Prueba seleccionando "Todos los meses".`
              : 'Las fechas pasadas ya no se muestran en el calendario. El administrador programará las próximas fechas pronto.'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        /* VISTA LISTA SAAS (LINEAR STYLE) */
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredServices.map((service) => {
              const [year, month, day] = service.date.split('-');
              const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
              const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'short' });
              const monthName = dateObj.toLocaleDateString('es-ES', { month: 'short' });
              const dayNum = dateObj.getDate();

              const isExpired = isServiceExpired(service);

              const slotsList = (Object.values(service.slots) as SlotConfig[]).filter(s => s.enabled !== false);
              const totalSlots = slotsList.length;
              const occupiedCount = slotsList.filter(s => s.musicianId !== null).length;
              const vacantCount = totalSlots - occupiedCount;

              const myAssignedSlot = musicianUser
                ? slotsList.find(s => s.musicianId === musicianUser.id)
                : null;

              const matchPrimarySlot = musicianUser && !myAssignedSlot
                ? slotsList.find(s => 
                    s.musicianId === null && 
                    (s.label.toLowerCase().includes(musicianUser.primaryInstrument.toLowerCase()) || 
                     musicianUser.primaryInstrument.toLowerCase().includes(s.label.toLowerCase()) ||
                     musicianUser.primaryInstrument.toLowerCase().includes(s.category.toLowerCase()))
                  )
                : null;

              return (
                <div
                  key={service.id}
                  onClick={() => onSelectService(service)}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                >
                  {/* Left: Date & Title */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col items-center justify-center flex-shrink-0 text-slate-800 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 leading-none">
                        {monthName}
                      </span>
                      <span className="text-lg font-bold font-display leading-tight tabular-nums text-slate-900">
                        {dayNum}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate font-display">
                          {service.title}
                        </h4>
                        {myAssignedSlot ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <Check className="w-2.5 h-2.5 stroke-[3]" /> {myAssignedSlot.label}
                          </span>
                        ) : isExpired ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Inscripciones cerradas
                          </span>
                        ) : vacantCount === 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Completo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {vacantCount} vacantes
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {service.time}
                        </span>
                        {service.rehearsalTime && <span>· Ensayo: {service.rehearsalTime}</span>}
                        <span className="hidden sm:inline">· {dayName}</span>
                        {service.registrationDeadline && (
                          <span className="text-[11px] text-amber-700 hidden md:inline">
                            · Cierra: {service.registrationDeadline}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Center: Instrument Chips */}
                  <div className="hidden lg:flex items-center gap-1.5 flex-wrap max-w-md">
                    {slotsList.slice(0, 6).map(slot => (
                      <span
                        key={slot.key}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border ${
                          slot.musicianId === musicianUser?.id
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                            : slot.musicianId !== null
                            ? 'bg-slate-50 text-slate-700 border-slate-200/70 font-medium'
                            : 'bg-white text-slate-400 border-slate-200 border-dashed'
                        }`}
                      >
                        <InstrumentIcon instrument={slot.key} className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[60px]">
                          {slot.musicianId !== null ? slot.musicianName?.split(' ')[0] : slot.label.split(' ')[0]}
                        </span>
                      </span>
                    ))}
                    {slotsList.length > 6 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        +{slotsList.length - 6} más
                      </span>
                    )}
                  </div>

                  {/* Right: Quick Action Button */}
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {isExpired ? (
                      <span className="px-3 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-semibold">
                        Inscripciones Expiradas
                      </span>
                    ) : matchPrimarySlot && !myAssignedSlot ? (
                      <button
                        onClick={() => claimSlot(service.id, matchPrimarySlot.key)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Poner mi Check ({matchPrimarySlot.label.split(' ')[0]})</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectService(service)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <span>Ver Puestos</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VISTA CUADRÍCULA MODERNA */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServices.map(service => (
            <ServiceCard
              key={service.id}
              service={service}
              onSelect={onSelectService}
            />
          ))}
        </div>
      )}

    </div>
  );
};
