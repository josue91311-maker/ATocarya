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
  Filter,
  Music
} from 'lucide-react';
import { InstrumentIcon } from './InstrumentIcon';
import { 
  isServicePast, 
  isServiceExpired, 
  getMonthKey, 
  getMonthLabel 
} from '../utils/dateUtils';
import { getBestMatchingSlot } from '../utils/instrumentMatcher';

interface Props {
  onSelectService: (service: ServiceDate) => void;
  onOpenSetlist?: (service: ServiceDate) => void;
}

export const CalendarView: React.FC<Props> = ({ onSelectService, onOpenSetlist }) => {
  const { services, musicianUser, isAdminAuthenticated, claimSlot } = useApp();
  const [filterType, setFilterType] = useState<'all' | 'available' | 'mine'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'month' | 'grid' | 'list'>('grid');

  // Interactive Month Calendar Navigation State
  const today = new Date();
  // Initialize calendar month based on earliest active service or current month (excluyendo cultos bloqueados para el músico)
  const activeUpcomingServices = services.filter(
    service => !isServicePast(service.date) && (!musicianUser || !service.blockedMusicianIds?.includes(musicianUser.id))
  );
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
    const vacantInService = (Object.values(s.slots || {}) as SlotConfig[])
      .filter(slot => slot && slot.enabled !== false && !slot.musicianId).length;
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
      const matchMusician = Object.values(service.slots || {}).some(
        s => s && (s.musicianName?.toLowerCase().includes(term) || s.label.toLowerCase().includes(term))
      );
      if (!matchTitle && !matchDate && !matchMusician) return false;
    }

    if (filterType === 'available') {
      const isExpired = isServiceExpired(service);
      const hasAvailable = (Object.values(service.slots || {}) as SlotConfig[])
        .some(s => s && s.enabled !== false && !s.musicianId);
      if (!hasAvailable || isExpired) return false;
    }

    if (filterType === 'mine' && musicianUser) {
      const isMine = Object.values(service.slots || {}).some(s => s && s.musicianId === musicianUser.id);
      if (!isMine) return false;
    }

    return true;
  });

  // Próximo culto más cercano y recomendación rápida de aplicación
  const nextService = activeUpcomingServices.length > 0 ? activeUpcomingServices[0] : null;
  const isNextExpired = nextService ? isServiceExpired(nextService) : true;
  const myAssignedSlotInNext = (nextService && musicianUser)
    ? (Object.values(nextService.slots || {}) as SlotConfig[]).find(s => s && s.musicianId === musicianUser.id)
    : null;
  const recommendedSlotInNext = (nextService && musicianUser && !myAssignedSlotInNext && !isNextExpired)
    ? getBestMatchingSlot(nextService.slots, musicianUser.primaryInstrument)
    : null;

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
      
      {/* 0. HERO EDITORIAL BANNER (Desktop & Portal) */}
      {musicianUser && (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#C96B65] via-[#BD8C29] to-[#315F6D] text-white p-6 sm:p-8 shadow-card">
          {/* Subtle line art of guitar on the right */}
          <div className="absolute -right-4 -top-6 bottom-0 w-72 sm:w-96 pointer-events-none select-none opacity-20 filter invert">
            <img 
              src="/assets/music/guitar-line.svg" 
              alt="" 
              className="w-full h-full object-cover object-right"
            />
          </div>

          <div className="relative z-10 max-w-xl">
            <span className="text-[10px] sm:text-[11px] font-extrabold tracking-widest uppercase text-white/80 block">
              FECHAS DE CULTO
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-white font-normal mt-1 leading-tight">
              Hola, {musicianUser.fullName.split(' ')[0]}
            </h1>
            <p className="text-xs sm:text-sm text-white/90 mt-1">
              Aquí tienes un resumen de tus próximos cultos.
            </p>
          </div>
        </div>
      )}

      {/* ⚡ TARJETÓN DE PRÓXIMO CULTO & RECOMENDACIÓN RÁPIDA 1-CLIC */}
      {nextService && musicianUser && !myAssignedSlotInNext && recommendedSlotInNext && (
        <div className="bg-[#D9E9EB]/60 border border-[#315F6D]/20 text-[#202C37] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#315F6D] text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
              <span className="text-[9px] uppercase font-bold tracking-wider leading-none">
                {new Date(nextService.date + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short' })}
              </span>
              <span className="text-xl font-black font-display leading-tight tabular-nums">
                {new Date(nextService.date + 'T00:00:00').getDate()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md bg-[#315F6D] text-white shadow-2xs">
                  ⚡ Sugerido para ti
                </span>
                <span className="text-xs font-bold text-[#64717C]">
                  {nextService.date} ({nextService.time})
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold font-display text-[#202C37] mt-0.5">
                {musicianUser.fullName}, toca tu instrumento ({musicianUser.primaryInstrument})
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => claimSlot(nextService.id, recommendedSlotInNext.key)}
              className="px-4 py-2.5 bg-[#315F6D] hover:bg-[#234A57] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Anotarme en {recommendedSlotInNext.label}</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. TOP METRICS STRIP EDITORIAL (3 Tarjetas) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-[#F7EAE5] border border-[#EEF0F1] rounded-[18px] p-4 sm:p-5 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#C96B65]/15 text-[#C96B65] flex items-center justify-center shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#64717C] uppercase tracking-wider">
              PRÓXIMOS CULTOS
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black font-display text-[#202C37] tabular-nums">
                {totalServices}
              </span>
              <span className="text-xs text-[#64717C]">fechas vigentes</span>
            </div>
          </div>
        </div>

        <div className="bg-[#D9E9EB] border border-[#EEF0F1] rounded-[18px] p-4 sm:p-5 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#315F6D]/15 text-[#315F6D] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#64717C] uppercase tracking-wider">
              MIS PUESTOS
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black font-display text-[#315F6D] tabular-nums">
                {myServicesCount}
              </span>
              <span className="text-xs text-[#64717C]">confirmados</span>
            </div>
          </div>
        </div>

        <div className="bg-[#FFF1CB] border border-[#EEF0F1] rounded-[18px] p-4 sm:p-5 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#BD8C29]/15 text-[#BD8C29] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#64717C] uppercase tracking-wider">
              VACANTES ABIERTAS
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black font-display text-[#87621D] tabular-nums">
                {totalVacancies}
              </span>
              <span className="text-xs text-[#64717C]">cupos disponibles</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. HEADER & CONTROLS TOOLBAR */}
      <div className="bg-white border border-[#E5E8EA] rounded-[18px] p-4 sm:p-5 shadow-card space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-display text-[#202C37] flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#315F6D]" />
              <span>Cronograma & Fechas de Culto</span>
            </h2>
            <p className="text-xs text-[#64717C] mt-0.5">
              Consulta las fechas en el <strong>Calendario Mensual</strong> o en <strong>Tarjetas</strong> y pon tu check en tu instrumento.
            </p>
          </div>

          {/* View Mode Toggle: Monthly Calendar / Cards / List */}
          <div className="flex items-center p-1 bg-[#F7F4EF] rounded-xl border border-[#E5E8EA] self-start sm:self-auto shadow-2xs">
            <button
              onClick={() => setViewMode('month')}
              title="Calendario Mensual Interactivo"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'month' 
                  ? 'bg-[#315F6D] text-white shadow-xs' 
                  : 'text-[#64717C] hover:text-[#202C37]'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Mes</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Vista Tarjetas"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid' 
                  ? 'bg-[#315F6D] text-white shadow-xs' 
                  : 'text-[#64717C] hover:text-[#202C37]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tarjetas</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="Vista Lista"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list' 
                  ? 'bg-[#315F6D] text-white shadow-xs' 
                  : 'text-[#64717C] hover:text-[#202C37]'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
          </div>
        </div>

        {/* Controls Toolbar: Month filter, Search, Segmented status filter */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-3 border-t border-[#EEF0F1]">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            
            {/* Filter by Month */}
            <div className="flex items-center gap-2 bg-[#FAF9F6] border border-[#E5E8EA] rounded-xl px-3 py-2 min-w-[180px]">
              <CalendarIcon className="w-3.5 h-3.5 text-[#315F6D] shrink-0" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#202C37] focus:outline-none w-full cursor-pointer"
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
                className="w-full pl-8 pr-3 py-2 bg-[#FAF9F6] border border-[#E5E8EA] rounded-xl text-xs text-[#202C37] placeholder-[#89939C] focus:bg-white focus:outline-none focus:border-[#315F6D] transition-all"
              />
              <Search className="w-3.5 h-3.5 text-[#89939C] absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center p-1 bg-[#F7F4EF] rounded-xl border border-[#E5E8EA] overflow-x-auto self-start lg:self-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-[#315F6D] text-white shadow-xs'
                  : 'text-[#64717C] hover:text-[#202C37]'
              }`}
            >
              Todos ({activeUpcomingServices.length})
            </button>

            <button
              onClick={() => setFilterType('available')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filterType === 'available'
                  ? 'bg-[#315F6D] text-white shadow-xs'
                  : 'text-[#64717C] hover:text-[#202C37]'
              }`}
            >
              Con Vacantes
            </button>

            {musicianUser && (
              <button
                onClick={() => setFilterType('mine')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  filterType === 'mine'
                    ? 'bg-[#315F6D] text-white shadow-xs'
                    : 'text-[#64717C] hover:text-[#202C37]'
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
              const isMyService = musicianUser && Object.values(firstService.slots || {}).some(s => s && s.musicianId === musicianUser.id);
              const slotsList = (Object.values(firstService.slots || {}) as SlotConfig[]).filter(s => s && s.enabled !== false);
              const vacantCount = slotsList.filter(s => !s.musicianId).length;

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

              const slotsList = (Object.values(service.slots || {}) as SlotConfig[]).filter(s => s && s.enabled !== false);
              const totalSlots = slotsList.length;
              const occupiedCount = slotsList.filter(s => Boolean(s.musicianId)).length;
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
                    <div className="w-14 h-14 min-w-[56px] rounded-2xl border border-emerald-300 bg-white flex flex-col items-center overflow-hidden shrink-0 shadow-2xs">
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
                            : Boolean(slot.musicianId)
                            ? 'bg-slate-50 text-slate-700 border-slate-200/70 font-medium'
                            : 'bg-white text-slate-400 border-slate-200 border-dashed'
                        }`}
                      >
                        <InstrumentIcon instrument={slot.key} className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[60px]">
                          {Boolean(slot.musicianId) ? slot.musicianName?.split(' ')[0] : slot.label.split(' ')[0]}
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
                onOpenSetlist={onOpenSetlist}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
