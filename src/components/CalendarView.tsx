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
  ChevronLeft,
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
  const [viewMode, setViewMode] = useState<'month' | 'grid' | 'list'>('month');

  // Interactive Month Calendar Navigation State
  const today = new Date();
  // Initialize calendar month based on earliest active service or current month
  const activeUpcomingServices = services.filter(service => !isServicePast(service.date));
  const defaultYear = activeUpcomingServices.length > 0
    ? Number(activeUpcomingServices[0].date.split('-')[0])
    : today.getFullYear();
  const defaultMonth = activeUpcomingServices.length > 0
    ? Number(activeUpcomingServices[0].date.split('-')[1]) - 1
    : today.getMonth();

  const [calYear, setCalYear] = useState<number>(defaultYear);
  const [calMonth, setCalMonth] = useState<number>(defaultMonth);

  // Available months for filter
  const availableMonths = Array.from(
    new Set(activeUpcomingServices.map(s => getMonthKey(s.date)))
  ).filter(Boolean).sort();

  // Metrics
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

  // Filtered services
  const filteredServices = activeUpcomingServices.filter(service => {
    if (selectedMonth !== 'all') {
      if (getMonthKey(service.date) !== selectedMonth) return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTitle = service.title.toLowerCase().includes(term);
      const matchDate = service.date.includes(term);
      const matchMusician = Object.values(service.slots).some(
        s => s.musicianName?.toLowerCase().includes(term) || s.label.toLowerCase().includes(term)
      );
      if (!matchTitle && !matchDate && !matchMusician) return false;
    }

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

  // Calendar Grid Calculation
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay(); // 0 = Dom, 1 = Lun...
  const daysInCalMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calMonthDateObj = new Date(calYear, calMonth, 1);
  const calMonthTitle = calMonthDateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalYear(prev => prev - 1);
      setCalMonth(11);
    } else {
      setCalMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalYear(prev => prev + 1);
      setCalMonth(0);
    } else {
      setCalMonth(prev => prev + 1);
    }
  };

  const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* 1. TOP METRICS STRIP (Planning Center Quick Glance) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Próximos Cultos
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black font-display text-slate-900 tabular-nums">
              {totalServices}
            </span>
            <span className="text-xs text-slate-500">fechas vigentes</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Mis Puestos
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black font-display text-emerald-700 tabular-nums">
              {myServicesCount}
            </span>
            <span className="text-xs text-slate-500">confirmados</span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Vacantes Abiertas
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black font-display text-emerald-800 tabular-nums">
              {totalVacancies}
            </span>
            <span className="text-xs text-slate-500">cupos disponibles</span>
          </div>
        </div>
      </div>

      {/* 2. HEADER & CONTROLS TOOLBAR */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-600" />
              <span>Cronograma & Fechas de Culto</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Consulta las fechas en el <strong>Calendario Mensual</strong> o en <strong>Tarjetas</strong> y pon tu check en tu instrumento.
            </p>
          </div>

          {/* View Mode Toggle: Monthly Calendar / Cards / List */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80 self-start sm:self-auto shadow-2xs">
            <button
              onClick={() => setViewMode('month')}
              title="Calendario Mensual Interactivo"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'month' 
                  ? 'bg-white text-emerald-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mes</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Vista Tarjetas"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white text-emerald-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tarjetas</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="Vista Lista"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'list' 
                  ? 'bg-white text-emerald-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lista</span>
            </button>
          </div>
        </div>

        {/* Controls Toolbar: Month filter, Search, Segmented status filter */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            
            {/* Filter by Month */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-w-[180px]">
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
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
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all"
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
                  ? 'bg-white text-emerald-950 shadow-2xs font-bold'
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

      {/* 3. VISUAL MONTHLY CALENDAR GRID (Planning Center Style) */}
      {viewMode === 'month' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          
          {/* Calendar Month Header with Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 capitalize">
                  {calMonthTitle}
                </h3>
                <p className="text-xs text-slate-500">
                  Haz clic en cualquier fecha destacada para ver detalles o anotarte
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                title="Mes anterior"
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setCalYear(today.getFullYear());
                  setCalMonth(today.getMonth());
                }}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors hidden sm:block"
              >
                Hoy
              </button>
              <button
                onClick={handleNextMonth}
                title="Mes siguiente"
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Header Days of Week */}
            {dayHeaders.map((dh, idx) => (
              <div 
                key={dh} 
                className={`py-2 text-center text-xs font-black uppercase tracking-wider ${
                  idx === 0 || idx === 6 ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                {dh}
              </div>
            ))}

            {/* Empty Offset Days at start of month */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[72px] sm:min-h-[96px] p-2 rounded-2xl bg-slate-50/40 border border-transparent" />
            ))}

            {/* Calendar Days */}
            {Array.from({ length: daysInCalMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayServices = services.filter(s => s.date === dateStr);
              const hasService = dayServices.length > 0;
              const isToday = dateStr === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

              if (!hasService) {
                return (
                  <div 
                    key={dateStr}
                    className={`min-h-[72px] sm:min-h-[96px] p-2 rounded-2xl border transition-colors flex flex-col justify-between ${
                      isToday 
                        ? 'border-emerald-300 bg-emerald-50/20' 
                        : 'border-slate-100 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isToday ? 'text-emerald-700 font-black' : 'text-slate-400'}`}>
                        {dayNum}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider hidden sm:inline">
                          Hoy
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              // Days with Service
              const firstService = dayServices[0];
              const isExpired = isServiceExpired(firstService);
              const isMyService = musicianUser && Object.values(firstService.slots).some(s => s.musicianId === musicianUser.id);
              const slotsList = (Object.values(firstService.slots) as SlotConfig[]).filter(s => s.enabled !== false);
              const vacantCount = slotsList.filter(s => s.musicianId === null).length;

              return (
                <div 
                  key={dateStr}
                  onClick={() => onSelectService(firstService)}
                  className={`min-h-[72px] sm:min-h-[96px] p-2 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between shadow-2xs hover:scale-[1.02] hover:shadow-pc ${
                    isMyService
                      ? 'border-emerald-500 bg-emerald-50/80'
                      : isExpired
                      ? 'border-slate-300 bg-slate-50/80'
                      : 'border-emerald-400 bg-emerald-50/30 hover:border-emerald-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900 tabular-nums">
                      {dayNum}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded">
                      {firstService.time}
                    </span>
                  </div>

                  <div className="mt-1 space-y-1">
                    <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">
                      {firstService.title}
                    </p>
                    {isMyService ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                        <Check className="w-2.5 h-2.5 stroke-[3]" /> Confirmado
                      </span>
                    ) : isExpired ? (
                      <span className="text-[10px] font-bold text-rose-700 block">
                        Cerrado
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 block">
                        {vacantCount} vacante{vacantCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. CONTENT AREA: CARDS OR LIST */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 font-display">
            {viewMode === 'month' ? 'Lista de Cultos del Mes' : 'Fechas Disponibles'}
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Mostrando <strong>{filteredServices.length}</strong> fecha(s)
          </span>
        </div>

        {filteredServices.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-12 text-center shadow-2xs">
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
          <div className="bg-white border border-slate-200/90 rounded-3xl shadow-2xs overflow-hidden divide-y divide-slate-100">
            {filteredServices.map((service) => {
              const [y, m, d] = service.date.split('-');
              const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
              const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
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

              return (
                <div
                  key={service.id}
                  onClick={() => onSelectService(service)}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                >
                  {/* Left: Date & Title */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-13 h-14 rounded-2xl border border-emerald-300 bg-white flex flex-col items-center overflow-hidden flex-shrink-0 shadow-2xs">
                      <span className="w-full bg-emerald-600 text-white text-[9px] uppercase font-bold text-center py-0.2 tracking-wider">
                        {monthName}
                      </span>
                      <span className="text-xl font-black font-display leading-tight tabular-nums text-slate-900 py-0.5">
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
                        <span className="flex items-center gap-1 font-bold text-slate-700">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          {service.time}
                        </span>
                        {service.rehearsalTime && <span>· Ensayo: <strong>{service.rehearsalTime}</strong></span>}
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

                  {/* Right: Action */}
                  <div className="flex items-center gap-3 self-end md:self-auto flex-shrink-0">
                    <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Ver servicio <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* VISTA TARJETAS (GRID) */
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

    </div>
  );
};
