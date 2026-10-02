import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceDate, SlotConfig, SlotKey } from '../types';
import { isServicePast, isServiceExpired } from '../utils/dateUtils';
import { getBestMatchingSlot } from '../utils/instrumentMatcher';
import { InstrumentIcon } from './InstrumentIcon';
import { Logo } from './Logo';
import { 
  Calendar, 
  Clock, 
  Music, 
  Check, 
  Sparkles, 
  Users, 
  ChevronRight, 
  ExternalLink,
  AlertCircle,
  CalendarDays,
  MapPin,
  Bell,
  Sun,
  FileText,
  LogOut
} from 'lucide-react';

interface Props {
  onSelectService: (service: ServiceDate) => void;
  onOpenSetlist?: (service: ServiceDate) => void;
  onGoToFullCalendar?: () => void;
}

export const MusicianMobileHome: React.FC<Props> = ({ 
  onSelectService, 
  onOpenSetlist,
  onGoToFullCalendar 
}) => {
  const { musicianUser, services, claimSlot, releaseSlot, isAdminAuthenticated, logoutMusician } = useApp();
  const [claimingSlotKey, setClaimingSlotKey] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  if (!musicianUser) return null;

  // Primer nombre para saludo amigable
  const firstName = musicianUser.fullName.split(' ')[0] || 'Músico';
  const userInitial = musicianUser.fullName.charAt(0).toUpperCase();

  // Formateador amigable de fechas en español
  const formatServiceDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const d = new Date(Number(year), Number(month) - 1, Number(day));
      const weekday = d.toLocaleDateString('es-ES', { weekday: 'short' });
      const monthName = d.toLocaleDateString('es-ES', { month: 'short' });
      return {
        weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
        dayNum: d.getDate(),
        monthName: monthName.toUpperCase().replace('.', ''),
        full: d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
      };
    } catch {
      return { weekday: 'Fecha', dayNum: 0, monthName: '', full: dateStr };
    }
  };

  // Generador de la tira de 7 días de la semana actual (Lunes a Domingo)
  const getDaysOfWeek = () => {
    const now = new Date();
    const currentDayOfWeek = (now.getDay() + 6) % 7; // 0 = Lunes, 6 = Domingo
    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDayOfWeek);

    const days = [];
    const dayNames = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const isToday = d.toDateString() === now.toDateString();
      days.push({
        dateStr,
        dayName: dayNames[i],
        dayNum: d.getDate(),
        isToday
      });
    }
    return days;
  };

  const weekDays = getDaysOfWeek();

  // 1. Filtrar servicios futuros
  const upcomingServices = services
    .filter(s => !isServicePast(s.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 2. Mis servicios asignados (donde ya tengo puesto asignado)
  const myAssignedServices = upcomingServices.filter(service => {
    const slots = Object.values(service.slots || {}) as SlotConfig[];
    return slots.some(slot => slot && slot.musicianId === musicianUser.id);
  });

  // 3. Servicios abiertos donde NO estoy asignado aún (para postularme)
  const availableServices = upcomingServices.filter(service => {
    const slots = Object.values(service.slots || {}) as SlotConfig[];
    const alreadyAssigned = slots.some(slot => slot && slot.musicianId === musicianUser.id);
    if (alreadyAssigned) return false;
    if (isServiceExpired(service)) return false;
    if (service.isOpen === false) return false;
    // Que tenga al menos 1 puesto libre
    const hasVacant = slots.some(slot => slot && slot.enabled !== false && !slot.musicianId);
    return hasVacant;
  });

  // Estadísticas para las 3 tarjetas del Hero
  const assignedCount = myAssignedServices.length;
  // Por confirmar: cultos próximos donde está asignado (o 1 si tiene cultos)
  const porConfirmarCount = myAssignedServices.length > 0 ? 1 : 0;
  // Pendientes: cultos vacantes disponibles
  const pendientesCount = availableServices.length;

  const handleQuickClaim = (serviceId: string, slotKey: SlotKey) => {
    setClaimingSlotKey(`${serviceId}_${slotKey}`);
    const res = claimSlot(serviceId, slotKey);
    if (res.success) {
      setFeedbackMsg({ text: '¡Te has postulado con éxito!', type: 'success' });
    } else {
      setFeedbackMsg({ text: res.message || 'No se pudo postular.', type: 'error' });
    }
    setTimeout(() => {
      setClaimingSlotKey(null);
      setFeedbackMsg(null);
    }, 3000);
  };

  const handleRelease = (serviceId: string, slotKey: SlotKey) => {
    if (window.confirm('¿Seguro que deseas liberar tu puesto para este culto?')) {
      const res = releaseSlot(serviceId, slotKey);
      if (res.success) {
        setFeedbackMsg({ text: 'Puesto liberado correctamente.', type: 'success' });
      } else {
        setFeedbackMsg({ text: res.message || 'Error al liberar puesto.', type: 'error' });
      }
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  // Filtrado opcional por día de la semana tocado en la tira
  const displayedAssignedServices = selectedDateFilter
    ? myAssignedServices.filter(s => s.date === selectedDateFilter)
    : myAssignedServices;

  return (
    <div className="-mx-4 -mt-6 sm:mx-0 sm:mt-0 pb-24 animate-in fade-in select-none">
      
      {/* ========================================================================= */}
      {/* 1. HERO HEADER OSCURO ESTILO CONCIERTO (CON LOGO, SALUDO Y 3 STAT CARDS) */}
      {/* ========================================================================= */}
      <div 
        className="relative bg-[#0B132B] text-white pt-5 pb-9 px-4 sm:px-6 overflow-hidden shadow-xl"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(11, 19, 43, 0.88), rgba(11, 19, 43, 0.98)), url("/app-bg.jpg")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top'
        }}
      >
        {/* Luces de ambiente sutiles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#1E74FD]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-48 h-48 bg-[#FF7E22]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-lg mx-auto">
          {/* Barra Superior del Hero: Logo + Campana + Avatar Inicial */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Logo size="sm" showText={true} />
              <div className="border-l border-white/20 pl-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block leading-tight">
                  Portal de Músicos
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Notificación Campana con Badge */}
              <div className="relative p-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors border border-white/10">
                <Bell className="w-4 h-4 text-white" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                  {assignedCount || 1}
                </span>
              </div>

              {/* Avatar inicial con color azul eléctrico */}
              <div 
                className="w-8 h-8 rounded-full bg-[#1E74FD] text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-500/30 border border-white/30"
                title={`${musicianUser.fullName} (${musicianUser.primaryInstrument})`}
              >
                {userInitial}
              </div>

              {/* Botón rápido salir sesión */}
              <button
                type="button"
                onClick={logoutMusician}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Saludo Principal */}
          <div className="pt-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              ¡Hola, {firstName}!
            </h1>
            <p className="text-xs sm:text-sm text-blue-200/90 mt-0.5">
              Aquí tienes un resumen de tus próximos cultos.
            </p>
          </div>

          {/* 3 Tarjetas Estadísticas Estilo App */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
            {/* Card 1: Asignados (Azul Eléctrico) */}
            <div className="bg-[#1E74FD] text-white rounded-2xl p-3 shadow-md shadow-blue-500/25 flex flex-col justify-between min-h-[78px] border border-blue-400/30">
              <Calendar className="w-4 h-4 text-blue-100" />
              <div>
                <span className="text-2xl font-black leading-none block">
                  {assignedCount}
                </span>
                <span className="text-[10px] font-bold text-blue-100 uppercase tracking-tight block mt-0.5">
                  Asignados
                </span>
              </div>
            </div>

            {/* Card 2: Por Confirmar (Ámbar / Naranja) */}
            <div className="bg-[#FF7E22] text-white rounded-2xl p-3 shadow-md shadow-amber-500/25 flex flex-col justify-between min-h-[78px] border border-amber-400/30">
              <Sun className="w-4 h-4 text-amber-100" />
              <div>
                <span className="text-2xl font-black leading-none block">
                  {porConfirmarCount}
                </span>
                <span className="text-[10px] font-bold text-amber-100 uppercase tracking-tight block mt-0.5">
                  Por confirmar
                </span>
              </div>
            </div>

            {/* Card 3: Pendientes / Vacantes (Glassmorphism Oscuro) */}
            <div className="bg-white/10 backdrop-blur-md text-white rounded-2xl p-3 shadow-md border border-white/15 flex flex-col justify-between min-h-[78px]">
              <FileText className="w-4 h-4 text-slate-300" />
              <div>
                <span className="text-2xl font-black leading-none block">
                  {pendientesCount}
                </span>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight block mt-0.5">
                  Pendientes
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONTENEDOR BLANCO CON ESQUINAS REDONDEADAS SUPERIORES (HOJA PRINCIPAL) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-t-[32px] -mt-5 pt-5 pb-6 px-4 sm:px-6 shadow-xl relative z-10 space-y-5 max-w-lg mx-auto min-h-screen">
        
        {/* Notificación flotante de feedback */}
        {feedbackMsg && (
          <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md animate-in slide-in-from-top duration-200 ${
            feedbackMsg.type === 'success' 
              ? 'bg-emerald-600 text-white shadow-emerald-600/30' 
              : 'bg-rose-600 text-white shadow-rose-600/30'
          }`}>
            {feedbackMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Tira Horizontal de 7 Días de la Semana */}
        <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-100 overflow-x-auto">
          {weekDays.map((day) => {
            const isSelected = selectedDateFilter === day.dateStr || (!selectedDateFilter && day.isToday);
            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => {
                  if (selectedDateFilter === day.dateStr) {
                    setSelectedDateFilter(null);
                  } else {
                    setSelectedDateFilter(day.dateStr);
                  }
                }}
                className={`flex flex-col items-center justify-center py-2 px-1.5 min-w-[42px] rounded-2xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1E74FD] text-white shadow-md shadow-blue-500/25 scale-[1.05]'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className={`text-[10px] font-black uppercase tracking-tight ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                  {day.dayName}
                </span>
                <span className={`text-sm font-black tabular-nums mt-0.5 ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                  {day.dayNum}
                </span>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN: MIS CULTOS DE HOY / PRÓXIMOS CULTOS                              */}
        {/* ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Mis cultos de hoy
              </h2>
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#1E74FD] text-xs font-black flex items-center justify-center tabular-nums">
                {myAssignedServices.length}
              </span>
            </div>

            {onGoToFullCalendar && (
              <button
                type="button"
                onClick={onGoToFullCalendar}
                className="text-xs font-bold text-[#1E74FD] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Ver calendario</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lista de Tarjetas de Cultos Asignados */}
          {displayedAssignedServices.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-6 text-center space-y-2">
              <Calendar className="w-9 h-9 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">
                {selectedDateFilter ? 'No tienes cultos asignados en este día' : 'No tienes cultos asignados actualmente'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Revisa los cultos abiertos abajo para postularte con tu instrumento o voz.
              </p>
              {selectedDateFilter && (
                <button
                  type="button"
                  onClick={() => setSelectedDateFilter(null)}
                  className="text-xs font-bold text-[#1E74FD] hover:underline pt-1 block mx-auto"
                >
                  Ver todos los cultos asignados
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              {displayedAssignedServices.map(service => {
                const dateInfo = formatServiceDate(service.date);
                const slots = Object.values(service.slots || {}) as SlotConfig[];
                const mySlot = slots.find(s => s && s.musicianId === musicianUser.id);
                const songsCount = service.songs?.length || 0;
                const hasSongs = Boolean(service.songs && songsCount > 0);
                const isPublished = Boolean(service.isSongsPublished && hasSongs);

                // Detectar si el usuario tiene rol de Voz Director para este culto o como instrumento primario
                const isVozDirector = Boolean(
                  musicianUser && (
                    musicianUser.primaryInstrument === 'Voz Director' ||
                    service.slots?.voz_director?.musicianId === musicianUser.id
                  )
                );

                // Compañeros confirmados en el equipo
                const confirmedSlots = slots.filter(s => s && s.enabled !== false && s.musicianName);

                return (
                  <div 
                    key={service.id}
                    className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5 transition-all"
                  >
                    {/* 1. Fila de Badges: Estado de Asignado y Chip de Rol/Instrumento */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                          ✓ ASIGNADO
                        </span>
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md tabular-nums">
                          {service.time} · {dateInfo.weekday} {dateInfo.dayNum} {dateInfo.monthName}
                        </span>
                      </div>

                      {mySlot && (
                        <button
                          type="button"
                          onClick={() => onSelectService(service)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E74FD] text-white text-xs font-black shadow-xs hover:bg-[#155de0] transition-colors shrink-0 cursor-pointer"
                          title="Toca para ver detalles"
                        >
                          <InstrumentIcon instrument={mySlot.key} className="w-3.5 h-3.5 text-white" />
                          <span>{mySlot.label}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* 2. Título del Culto a TODO el ancho (sin truncamiento) */}
                    <div>
                      <h3 className="font-black text-base sm:text-lg text-slate-900 leading-snug">
                        {service.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        {service.rehearsalTime && (
                          <span className="flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Ensayo: <strong>{service.rehearsalTime}</strong></span>
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>Auditorio Principal</span>
                        </span>
                      </div>
                    </div>

                    {/* 3. Fila de Canciones */}
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          if (isPublished) {
                            window.open(`/#/repertorio/${service.id}`, '_blank');
                          } else if ((isAdminAuthenticated || isVozDirector) && onOpenSetlist) {
                            onOpenSetlist(service);
                          } else {
                            onSelectService(service);
                          }
                        }}
                        className="w-full flex items-center justify-between py-1 text-xs font-bold text-slate-700 hover:text-[#1E74FD] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Music className={`w-4 h-4 ${hasSongs ? 'text-[#1E74FD]' : 'text-slate-400'}`} />
                          <span>
                            {hasSongs ? `Canciones (${songsCount})` : 'Canciones en preparación'}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>

                    {/* 4. Fila: Ver Equipo Asignado con Avatares */}
                    <div className="pt-1.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => onSelectService(service)}
                        className="w-full flex items-center justify-between py-1 text-xs font-bold text-slate-700 hover:text-[#1E74FD] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-500" />
                          <span>Ver equipo asignado</span>
                        </div>
                        <div className="flex items-center -space-x-1.5">
                          {confirmedSlots.slice(0, 3).map((slot, idx) => (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-700 shadow-2xs"
                              title={slot.musicianName}
                            >
                              {slot.musicianName ? slot.musicianName.charAt(0).toUpperCase() : '?'}
                            </div>
                          ))}
                          {confirmedSlots.length > 3 && (
                            <span className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white text-[9px] font-black text-slate-600 flex items-center justify-center shadow-2xs">
                              +{confirmedSlots.length - 3}
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-slate-400 ml-1.5" />
                        </div>
                      </button>
                    </div>

                    {/* ========================================================= */}
                    {/* 5. BOTONES DE ACCIÓN: GESTIONAR CANCIONES O VER REPERTORIO */}
                    {/* ========================================================= */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      {/* BOTÓN ESTRELLA: GESTIONAR CANCIONES (SOLO VOZ DIRECTOR O ADMIN) */}
                      {(isAdminAuthenticated || isVozDirector) && onOpenSetlist && (
                        <button
                          type="button"
                          onClick={() => onOpenSetlist(service)}
                          className="w-full py-3 px-4 bg-gradient-to-r from-[#FF7E22] to-amber-600 hover:from-[#e56d15] hover:to-amber-700 active:scale-[0.98] text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-amber-600/25 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-amber-100" />
                          <Music className="w-4 h-4 text-amber-100" />
                          <span>Gestionar Canciones {isAdminAuthenticated ? '(Admin)' : '(Voz Director)'}</span>
                        </button>
                      )}

                      {/* Botón de Canciones para Músicos (Sin botón redundante de Confirmar Asistencia) */}
                      {isPublished ? (
                        <a
                          href={`/#/repertorio/${service.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3 px-4 bg-[#1E74FD] hover:bg-[#155de0] active:scale-[0.98] text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-blue-100" />
                          <span>🎵 Ver Canciones & Acordes ({songsCount})</span>
                          <ExternalLink className="w-3.5 h-3.5 text-blue-200 ml-auto" />
                        </a>
                      ) : hasSongs ? (
                        <a
                          href={`/#/repertorio/${service.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Music className="w-4 h-4 text-slate-600" />
                          <span>Ver Canciones ({songsCount} en borrador)</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 ml-auto" />
                        </a>
                      ) : !isVozDirector ? (
                        <div className="py-2.5 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-center text-xs text-slate-500">
                          Canciones en preparación por el equipo de alabanza
                        </div>
                      ) : null}

                      {/* Enlace discreto para liberar puesto */}
                      {mySlot && (
                        <div className="text-right pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleRelease(service.id, mySlot.key)}
                            className="text-[11px] text-slate-400 hover:text-rose-600 font-bold transition-colors cursor-pointer"
                          >
                            Liberar mi puesto en este culto
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* SECCIÓN: CULTOS ABIERTOS PARA POSTULARTE (DONDE HAY VACANTES)             */}
        {/* ========================================================================= */}
        {availableServices.length > 0 && (
          <section className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Cultos Abiertos para Postularte ({availableServices.length})
                </h2>
              </div>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Vacantes
              </span>
            </div>

            <div className="space-y-3">
              {availableServices.map(service => {
                const dateInfo = formatServiceDate(service.date);
                const slots = (Object.values(service.slots || {}) as SlotConfig[])
                  .filter(s => s && s.enabled !== false);
                const vacantSlots = slots.filter(s => !s.musicianId);
                const matchingSlot = getBestMatchingSlot(service.slots, musicianUser.primaryInstrument);
                const isClaiming = claimingSlotKey?.startsWith(service.id);

                return (
                  <div 
                    key={service.id}
                    className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3 transition-all"
                  >
                    {/* 1. Badges superiores */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                        ○ VACANTES LIBRES ({vacantSlots.length})
                      </span>
                      <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md tabular-nums">
                        {service.time} · {dateInfo.weekday} {dateInfo.dayNum} {dateInfo.monthName}
                      </span>
                    </div>

                    {/* 2. Título a todo el ancho */}
                    <div>
                      <h3 className="font-black text-base sm:text-lg text-slate-900 leading-snug">
                        {service.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        {service.rehearsalTime && (
                          <span className="flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Ensayo: <strong>{service.rehearsalTime}</strong></span>
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>Auditorio Principal</span>
                        </span>
                      </div>
                    </div>

                    {/* Acción de Postulación Rápida */}
                    {matchingSlot ? (
                      <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Puesto sugerido para ti:</span>
                          </span>
                          <span className="text-[11px] font-black text-emerald-800">
                            {matchingSlot.label}
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={Boolean(isClaiming)}
                          onClick={() => handleQuickClaim(service.id, matchingSlot.key)}
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/30 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>✓ Postularme como {matchingSlot.label}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 italic px-1">
                        Tu puesto principal ({musicianUser.primaryInstrument}) ya está cubierto, pero puedes postularte a otros puestos disponibles:
                      </div>
                    )}

                    {/* Chips de otros puestos vacantes */}
                    {vacantSlots.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex flex-wrap gap-1.5">
                          {vacantSlots.map(slot => (
                            <button
                              key={slot.key}
                              type="button"
                              onClick={() => handleQuickClaim(service.id, slot.key)}
                              disabled={Boolean(isClaiming)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 transition-all active:scale-95 cursor-pointer"
                              title={`Toca para postularte como ${slot.label}`}
                            >
                              <InstrumentIcon instrument={slot.key} className="w-3.5 h-3.5 text-slate-500" />
                              <span>+ {slot.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ver Detalles */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => onSelectService(service)}
                        className="text-slate-600 hover:text-[#1E74FD] font-bold flex items-center gap-1 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Ver detalles completos</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {service.isSongsPublished && service.songs && service.songs.length > 0 && (
                        <a
                          href={`/#/repertorio/${service.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1E74FD] font-bold flex items-center gap-1 hover:underline"
                        >
                          <Music className="w-3.5 h-3.5" />
                          <span>Ver Repertorio ({service.songs.length})</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Botón inferior: Calendario Completo */}
        {onGoToFullCalendar && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onGoToFullCalendar}
              className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <CalendarDays className="w-4 h-4 text-slate-500" />
              <span>Ver Modo Calendario Mensual Completo</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
