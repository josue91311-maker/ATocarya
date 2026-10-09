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
  AlertCircle, 
  CalendarDays, 
  MapPin, 
  Bell, 
  LogOut,
  Menu
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
        weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1).replace('.', ''),
        dayNum: d.getDate(),
        monthName: monthName.toUpperCase().replace('.', ''),
        full: d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
      };
    } catch {
      return { weekday: 'Fecha', dayNum: 0, monthName: '', full: dateStr };
    }
  };

  // 1. Filtrar servicios futuros
  const upcomingServices = services
    .filter(s => !isServicePast(s.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 2. Mis servicios asignados
  const myAssignedServices = upcomingServices.filter(service => {
    const slots = Object.values(service.slots || {}) as SlotConfig[];
    return slots.some(slot => slot && slot.musicianId === musicianUser.id);
  });

  // 3. Servicios abiertos donde NO estoy asignado aún
  const availableServices = upcomingServices.filter(service => {
    const slots = Object.values(service.slots || {}) as SlotConfig[];
    const alreadyAssigned = slots.some(slot => slot && slot.musicianId === musicianUser.id);
    if (alreadyAssigned) return false;
    if (isServiceExpired(service)) return false;
    if (service.isOpen === false) return false;
    const hasVacant = slots.some(slot => slot && slot.enabled !== false && !slot.musicianId);
    return hasVacant;
  });

  const assignedCount = myAssignedServices.length;

  // Detección estricta de culto HOY en horario oficial de Perú (UTC-5 / America/Lima)
  const getPeruTodayStr = (): string => {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(new Date());
    } catch {
      const d = new Date();
      const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
      const peruDate = new Date(utc - (5 * 3600000));
      return peruDate.toISOString().split('T')[0];
    }
  };

  const peruTodayStr = getPeruTodayStr();
  const cultosToday = myAssignedServices.filter(s => s.date === peruTodayStr);
  const hasCultoToday = cultosToday.length > 0;

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

  return (
    <div className="-mx-4 -mt-6 sm:mx-0 sm:mt-0 pb-24 animate-in fade-in select-none bg-[#F7F4EF]">
      
      {/* ========================================================================= */}
      {/* 1. HERO HEADER EDITORIAL VERDE PETRÓLEO (#315F6D)                         */}
      {/* ========================================================================= */}
      <div className="relative bg-[#315F6D] text-white pt-4 pb-8 px-4 sm:px-6 overflow-hidden">
        {/* Círculo Mostaza y Arte lineal de Guitarra */}
        <div className="absolute right-2 top-8 w-44 h-44 pointer-events-none select-none">
          <div className="absolute right-0 top-3 w-32 h-32 rounded-full bg-[#E8B844]/35 blur-xs" />
          <img 
            src="/assets/music/guitar-line.svg" 
            alt="" 
            className="w-full h-full object-contain opacity-35 filter invert relative z-1" 
          />
        </div>

        <div className="relative z-10 space-y-4 max-w-lg mx-auto">
          {/* Barra Superior del Hero: Menu + Logo con letras blancas + Campana de hoy + Avatar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onGoToFullCalendar}
                className="p-1 text-white/80 hover:text-white"
                title="Menú"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Logo lightText size="sm" showText />
            </div>

            <div className="flex items-center gap-2.5">
              {/* Notificación Campana: Solo activa si tiene culto el día de HOY (Hora Perú) */}
              <div 
                className={`relative p-2 rounded-xl border transition-all ${
                  hasCultoToday 
                    ? 'bg-[#C96B65] border-[#C96B65] text-white' 
                    : 'bg-white/10 border-white/15 text-white/80'
                }`}
                title={hasCultoToday ? `¡Hoy tienes ${cultosToday.length} culto(s) programado(s)!` : 'Sin cultos para hoy (Hora Perú)'}
              >
                <Bell className={`w-4 h-4 ${hasCultoToday ? 'text-white animate-pulse' : 'text-white'}`} />
                {hasCultoToday && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-[#C96B65] text-[9px] font-black flex items-center justify-center shadow-xs animate-bounce">
                    {cultosToday.length}
                  </span>
                )}
              </div>

              {/* Avatar inicial en círculo mostaza editorial */}
              <div 
                className="w-8 h-8 rounded-full bg-[#E8B844] text-[#26313B] font-black text-sm flex items-center justify-center shadow-sm border border-white/30"
                title={`${musicianUser.fullName} (${musicianUser.primaryInstrument})`}
              >
                {userInitial}
              </div>

              {/* Botón rápido salir sesión */}
              <button
                type="button"
                onClick={logoutMusician}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Saludo Principal en DM Serif Display */}
          <div className="pt-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-white tracking-tight leading-tight">
              ¡Hola, {firstName}!
            </h1>
            <p className="text-xs sm:text-sm text-white/80 mt-0.5">
              Aquí tienes un resumen de tus próximos cultos.
            </p>
          </div>

          {/* 2 Tarjetas Estadísticas Reales en Crema Suave */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* Card 1: Asignados (Fondo Crema-Coral #F7EAE5) */}
            <div className="bg-[#F7EAE5] text-[#202C37] rounded-2xl p-3.5 shadow-card flex flex-col justify-between min-h-[88px] border border-[#EEF0F1]">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-[#C96B65] text-white flex items-center justify-center shadow-xs">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-1.5">
                <span className="text-2xl sm:text-3xl font-black font-display leading-none block tabular-nums text-[#202C37]">
                  {assignedCount}
                </span>
                <span className="text-[10px] font-bold text-[#64717C] uppercase tracking-wider block mt-1">
                  CULTOS ASIGNADOS
                </span>
              </div>
            </div>

            {/* Card 2: Total Cultos en Calendario (Fondo Crema-Mostaza #FFF1CB) */}
            <div className="bg-[#FFF1CB] text-[#202C37] rounded-2xl p-3.5 shadow-card flex flex-col justify-between min-h-[88px] border border-[#EEF0F1]">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-[#BD8C29] text-white flex items-center justify-center shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-1.5">
                <span className="text-2xl sm:text-3xl font-black font-display leading-none block tabular-nums text-[#202C37]">
                  {upcomingServices.length}
                </span>
                <span className="text-[10px] font-bold text-[#64717C] uppercase tracking-wider block mt-1">
                  CULTOS PROGRAMADOS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONTENEDOR CURVO CON HOJA EDITORIAL (FONDO #FAF9F6)                     */}
      {/* ========================================================================= */}
      <div className="bg-[#FAF9F6] rounded-t-[32px] -mt-5 pt-5 pb-6 px-4 sm:px-6 shadow-card relative z-10 space-y-5 max-w-lg mx-auto min-h-screen">
        
        {/* Notificación flotante de feedback */}
        {feedbackMsg && (
          <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md animate-in slide-in-from-top duration-200 ${
            feedbackMsg.type === 'success' 
              ? 'bg-[#315F6D] text-white shadow-xs' 
              : 'bg-[#C96B65] text-white shadow-xs'
          }`}>
            {feedbackMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN: MIS PRÓXIMOS CULTOS                                              */}
        {/* ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-display text-[#202C37] tracking-tight">
                Mis Próximos Cultos
              </h2>
              <span className="w-5 h-5 rounded-full bg-[#F7EAE5] text-[#C96B65] text-xs font-bold flex items-center justify-center tabular-nums">
                {myAssignedServices.length}
              </span>
            </div>

            {onGoToFullCalendar && (
              <button
                type="button"
                onClick={onGoToFullCalendar}
                className="text-xs font-semibold text-[#64717C] hover:text-[#315F6D] flex items-center gap-0.5 cursor-pointer"
              >
                <span>Ver calendario completo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lista de Tarjetas de Cultos Asignados */}
          {myAssignedServices.length === 0 ? (
            <div className="bg-white border border-[#E5E8EA] rounded-3xl p-6 text-center space-y-2">
              <Calendar className="w-9 h-9 text-[#89939C] mx-auto" />
              <h3 className="text-sm font-bold text-[#202C37]">
                No tienes cultos asignados actualmente
              </h3>
              <p className="text-xs text-[#64717C] max-w-xs mx-auto">
                Revisa los cultos abiertos abajo para postularte con tu instrumento o voz.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {myAssignedServices.map(service => {
                const dateInfo = formatServiceDate(service.date);
                const slots = Object.values(service.slots || {}) as SlotConfig[];
                const mySlot = slots.find(s => s && s.musicianId === musicianUser.id);
                const songsCount = service.songs?.length || 0;
                const hasSongs = Boolean(service.songs && songsCount > 0);
                const isPublished = Boolean(service.isSongsPublished && hasSongs);

                const isVozDirector = Boolean(
                  musicianUser && (
                    musicianUser.primaryInstrument === 'Voz Director' ||
                    service.slots?.voz_director?.musicianId === musicianUser.id
                  )
                );

                const confirmedSlots = slots.filter(s => s && s.enabled !== false && s.musicianName);

                return (
                  <div 
                    key={service.id}
                    className="bg-white border border-[#E5E8EA] hover:border-[#315F6D]/40 rounded-[20px] p-4 sm:p-5 shadow-card space-y-3.5 transition-all"
                  >
                    {/* 1. Fila Superior: Hoja de Fecha + Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Calendario Sheet Badge */}
                        <div className="w-13 h-14 rounded-xl bg-white shadow-xs border border-[#E5E8EA] flex flex-col items-center overflow-hidden shrink-0">
                          <div className="w-full bg-[#C96B65] text-white text-[9px] uppercase font-black py-0.5 text-center tracking-wider leading-none">
                            {dateInfo.monthName}
                          </div>
                          <div className="flex-1 flex flex-col items-center justify-center py-0.5">
                            <span className="text-xl font-black font-display leading-none tabular-nums text-[#202C37]">
                              {dateInfo.dayNum}
                            </span>
                            <span className="text-[8px] uppercase font-bold text-[#64717C] leading-none mt-0.5">
                              {dateInfo.weekday.slice(0, 3)}
                            </span>
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF1CB] text-[#87621D]">
                              ASIGNADO
                            </span>
                            <span className="text-[11px] font-semibold text-[#64717C] tabular-nums">
                              {service.time} · {dateInfo.weekday} {dateInfo.dayNum} {dateInfo.monthName}
                            </span>
                          </div>
                          <h3 className="font-bold text-base text-[#202C37] leading-snug mt-1 truncate">
                            {service.title}
                          </h3>
                        </div>
                      </div>

                      {mySlot && (
                        <div className="shrink-0">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#315F6D] text-white text-xs font-bold shadow-xs">
                            <InstrumentIcon instrument={mySlot.key} className="w-3.5 h-3.5 text-white" />
                            <span>{mySlot.label}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 2. Horarios de ensayo y ubicación */}
                    <div className="flex items-center gap-3 text-xs text-[#64717C] flex-wrap">
                      {service.rehearsalTime && (
                        <span className="flex items-center gap-1 font-semibold text-[#C96B65]">
                          <Clock className="w-3.5 h-3.5 text-[#C96B65]" />
                          <span>Ensayo: <strong>{service.rehearsalTime}</strong></span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[#64717C]">
                        <MapPin className="w-3.5 h-3.5 text-[#64717C]" />
                        <span>Auditorio Principal</span>
                      </span>
                    </div>

                    {/* 3. Fila de Canciones */}
                    <div className="pt-2 border-t border-[#EEF0F1]">
                      <button
                        type="button"
                        onClick={() => {
                          if (isPublished) {
                            window.location.hash = `#/repertorio/${service.id}`;
                          } else if ((isAdminAuthenticated || isVozDirector) && onOpenSetlist) {
                            onOpenSetlist(service);
                          } else {
                            onSelectService(service);
                          }
                        }}
                        className="w-full flex items-center justify-between py-1 text-xs font-semibold text-[#202C37] hover:text-[#315F6D] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Music className={`w-4 h-4 ${hasSongs ? 'text-[#315F6D]' : 'text-[#89939C]'}`} />
                          <span>
                            {hasSongs ? `Canciones (${songsCount})` : 'Canciones en preparación'}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#89939C]" />
                      </button>
                    </div>

                    {/* 4. Fila: Ver Equipo Asignado con Avatares */}
                    <div className="pt-1.5 border-t border-[#EEF0F1]">
                      <button
                        type="button"
                        onClick={() => onSelectService(service)}
                        className="w-full flex items-center justify-between py-1 text-xs font-semibold text-[#202C37] hover:text-[#315F6D] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#64717C]" />
                          <span>Ver equipo asignado</span>
                        </div>
                        <div className="flex items-center -space-x-1.5">
                          {confirmedSlots.slice(0, 3).map((slot, idx) => (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded-full bg-[#FAF9F6] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#202C37] shadow-2xs"
                              title={slot.musicianName}
                            >
                              {slot.musicianName ? slot.musicianName.charAt(0).toUpperCase() : '?'}
                            </div>
                          ))}
                          {confirmedSlots.length > 3 && (
                            <span className="w-6 h-6 rounded-full bg-[#E5E8EA] border-2 border-white text-[9px] font-bold text-[#64717C] flex items-center justify-center shadow-2xs">
                              +{confirmedSlots.length - 3}
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-[#89939C] ml-1.5" />
                        </div>
                      </button>
                    </div>

                    {/* 5. BOTÓN PRINCIPAL DE ACCIÓN: VER CANCIONES O GESTIONAR */}
                    <div className="pt-2 border-t border-[#EEF0F1] space-y-2">
                      {/* BOTÓN ESTRELLA: GESTIONAR CANCIONES (SOLO VOZ DIRECTOR O ADMIN) */}
                      {(isAdminAuthenticated || isVozDirector) && onOpenSetlist && (
                        <button
                          type="button"
                          onClick={() => onOpenSetlist(service)}
                          className="w-full py-3 px-4 bg-[#C96B65] hover:bg-[#B95752] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                        >
                          <Music className="w-4 h-4 text-white" />
                          <span>Gestionar Canciones {isAdminAuthenticated ? '(Admin)' : '(Voz Director)'}</span>
                        </button>
                      )}

                      {/* Botón de Canciones para Músicos (Sin abrir nueva pestaña) */}
                      {isPublished ? (
                        <a
                          href={`/#/repertorio/${service.id}`}
                          className="w-full py-3 px-4 bg-[#315F6D] hover:bg-[#234A57] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                        >
                          <Music className="w-4 h-4 text-white" />
                          <span>Ver Canciones & Acordes ({songsCount})</span>
                        </a>
                      ) : hasSongs ? (
                        <a
                          href={`/#/repertorio/${service.id}`}
                          className="w-full py-2.5 px-4 bg-[#F7F4EF] hover:bg-[#E5E8EA] text-[#202C37] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Music className="w-4 h-4 text-[#64717C]" />
                          <span>Ver Canciones ({songsCount} en borrador)</span>
                        </a>
                      ) : !isVozDirector ? (
                        <div className="py-2.5 px-3 bg-[#FAF9F6] border border-[#E5E8EA] rounded-xl text-center text-xs text-[#89939C]">
                          Canciones en preparación por el equipo de alabanza
                        </div>
                      ) : null}

                      {/* Enlace discreto para liberar puesto */}
                      {mySlot && (
                        <div className="text-right pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleRelease(service.id, mySlot.key)}
                            className="text-[11px] text-[#89939C] hover:text-[#C96B65] font-semibold transition-colors cursor-pointer"
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
          <section className="space-y-3 pt-3 border-t border-[#EEF0F1]">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#BD8C29]" />
                <h2 className="text-sm font-bold font-display uppercase tracking-wider text-[#202C37]">
                  Cultos Abiertos para Postularte ({availableServices.length})
                </h2>
              </div>
              <span className="text-[10px] font-bold text-[#87621D] bg-[#FFF1CB] px-2 py-0.5 rounded-full">
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
                    className="bg-white border border-[#E5E8EA] hover:border-[#315F6D]/40 rounded-[20px] p-4 sm:p-5 shadow-card space-y-3 transition-all"
                  >
                    {/* 1. Badges superiores */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D9E9EB] text-[#315F6D]">
                        ○ VACANTES LIBRES ({vacantSlots.length})
                      </span>
                      <span className="text-[11px] font-semibold text-[#64717C] tabular-nums">
                        {service.time} · {dateInfo.weekday} {dateInfo.dayNum} {dateInfo.monthName}
                      </span>
                    </div>

                    {/* 2. Título a todo el ancho */}
                    <div>
                      <h3 className="font-bold text-base text-[#202C37] leading-snug">
                        {service.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-[#64717C] mt-1 flex-wrap">
                        {service.rehearsalTime && (
                          <span className="flex items-center gap-1 font-semibold text-[#C96B65]">
                            <Clock className="w-3 h-3 text-[#C96B65]" />
                            <span>Ensayo: <strong>{service.rehearsalTime}</strong></span>
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[#89939C]">
                          <MapPin className="w-3 h-3 text-[#89939C]" />
                          <span>Auditorio Principal</span>
                        </span>
                      </div>
                    </div>

                    {/* Acción de Postulación Rápida */}
                    {matchingSlot ? (
                      <div className="p-3 bg-[#D9E9EB]/50 border border-[#315F6D]/20 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#202C37] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#315F6D]" />
                            <span>Puesto sugerido para ti:</span>
                          </span>
                          <span className="text-[11px] font-bold text-[#315F6D]">
                            {matchingSlot.label}
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={Boolean(isClaiming)}
                          onClick={() => handleQuickClaim(service.id, matchingSlot.key)}
                          className="w-full py-2.5 px-4 bg-[#315F6D] hover:bg-[#234A57] active:scale-[0.98] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>✓ Postularme como {matchingSlot.label}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-[#64717C] italic px-1">
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
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#FAF9F6] hover:bg-[#D9E9EB] text-[#202C37] hover:text-[#315F6D] border border-[#E5E8EA] hover:border-[#315F6D]/40 transition-all active:scale-95 cursor-pointer"
                              title={`Toca para postularte como ${slot.label}`}
                            >
                              <InstrumentIcon instrument={slot.key} className="w-3.5 h-3.5 text-[#64717C]" />
                              <span>+ {slot.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ver Detalles */}
                    <div className="pt-2 border-t border-[#EEF0F1] flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => onSelectService(service)}
                        className="text-[#64717C] hover:text-[#315F6D] font-bold flex items-center gap-1 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-[#89939C]" />
                        <span>Ver detalles completos</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {service.isSongsPublished && service.songs && service.songs.length > 0 && (
                        <a
                          href={`/#/repertorio/${service.id}`}
                          className="text-[#315F6D] font-bold flex items-center gap-1 hover:underline"
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
              className="w-full py-3 px-4 bg-white hover:bg-[#F7F4EF] text-[#202C37] border border-[#E5E8EA] rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <CalendarDays className="w-4 h-4 text-[#64717C]" />
              <span>Ver Modo Calendario Mensual Completo</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
