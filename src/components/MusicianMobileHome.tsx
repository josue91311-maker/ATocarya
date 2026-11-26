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
  X
} from 'lucide-react';
import { MusicianProfileModal } from './MusicianProfileModal';

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
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
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

  // 1. Filtrar servicios futuros (excluyendo aquellos donde el músico esté bloqueado por el administrador)
  const upcomingServices = services
    .filter(s => !isServicePast(s.date) && !(s.blockedMusicianIds || []).includes(musicianUser.id))
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
    <div className="-mx-4 -mt-6 sm:mx-0 sm:mt-0 pb-28 animate-in fade-in select-none bg-[#F8F4EA]">
      
      {/* ========================================================================= */}
      {/* 1. HERO HEADER MODERNO EN AZUL IGLESIA (#2E4056) CON ONDAS ORGÁNICAS      */}
      {/* ========================================================================= */}
      <div className="relative bg-gradient-to-br from-[#2E4056] via-[#27384C] to-[#1F2D3D] text-[#F8F4EA] pt-4 pb-11 px-4 sm:px-6 overflow-hidden">
        {/* Formas flotantes orgánicas en Arena Cálida y Salvia Apagado */}
        <div className="absolute -right-10 -top-8 w-52 h-52 rounded-full bg-[#DCBD9E]/20 blur-2xl pointer-events-none animate-float-slow" />
        <div className="absolute -left-12 bottom-0 w-44 h-44 rounded-full bg-[#8E9B84]/25 blur-2xl pointer-events-none" />
        <div className="absolute right-2 top-8 w-40 h-40 pointer-events-none opacity-15 filter invert">
          <img src="/assets/music/guitar-line.svg" alt="" className="w-full h-full object-contain" />
        </div>

        <div className="relative z-10 space-y-5 max-w-lg mx-auto">
          {/* Barra Superior del Hero */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Logo lightText size="sm" showText />
            </div>

            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setShowNotificationsModal(true)}
                className={`relative p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  hasCultoToday 
                    ? 'bg-[#DCBD9E] border-[#DCBD9E] text-[#302C24] shadow-glow-yellow' 
                    : 'bg-white/10 border-white/15 text-[#F8F4EA] hover:bg-white/20'
                }`}
                title={hasCultoToday ? `Hoy tienes ${cultosToday.length} culto(s) programado(s)` : 'Sin cultos para hoy (Hora Perú)'}
              >
                <Bell className={`w-4 h-4 ${hasCultoToday ? 'animate-pulse' : ''}`} />
                {hasCultoToday && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#A84C3A] text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                    {cultosToday.length}
                  </span>
                )}
              </button>

              <button 
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="w-9 h-9 rounded-2xl bg-[#DCBD9E] hover:bg-[#E7CEB4] text-[#302C24] font-black text-sm flex items-center justify-center shadow-xs border border-white/25 cursor-pointer"
                title={`Ver perfil de ${musicianUser.fullName}`}
              >
                {userInitial}
              </button>

              <button
                type="button"
                onClick={logoutMusician}
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-[#A84C3A] border border-white/15 text-[#F8F4EA]/80 hover:text-white transition-colors cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Saludo Principal */}
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-display font-bold uppercase tracking-[0.18em] text-[#DCBD9E]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8E9B84]" />
              {musicianUser.primaryInstrument}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F8F4EA] tracking-tight leading-tight mt-2">
              ¡Hola, {firstName}!
            </h1>
            <p className="text-xs text-[#F8F4EA]/80 mt-0.5">
              Resumen de tu programación de cultos y canciones.
            </p>

            {onGoToFullCalendar && (
              <div className="mt-3.5">
                <button
                  type="button"
                  onClick={onGoToFullCalendar}
                  className="stage-pill-btn cursor-pointer"
                >
                  <span>Explorar calendario completo</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* 2 Cuadros Bento Asimétricos en Arena Cálida y Salvia Apagado */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-[#F5EBE0] text-[#302C24] rounded-[22px] p-4 shadow-md flex flex-col justify-between min-h-[92px] border border-white/60 transition-transform duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-[#2E4056] text-[#F8F4EA] flex items-center justify-center shadow-xs">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-display font-bold uppercase tracking-widest text-[#7D5A38] bg-white/60 px-2 py-0.5 rounded-full">
                  Mis fechas
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black font-display leading-none block tabular-nums text-[#302C24]">
                  {assignedCount}
                </span>
                <span className="text-[10px] font-display font-bold text-[#635C51] uppercase tracking-wider block mt-1">
                  Cultos Asignados
                </span>
              </div>
            </div>

            <div className="bg-[#EBF0E7] text-[#302C24] rounded-[22px] p-4 shadow-md flex flex-col justify-between min-h-[92px] border border-white/60 transition-transform duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-[#637358] text-white flex items-center justify-center shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-display font-bold uppercase tracking-widest text-[#637358] bg-white/60 px-2 py-0.5 rounded-full">
                  Agenda
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black font-display leading-none block tabular-nums text-[#302C24]">
                  {upcomingServices.length}
                </span>
                <span className="text-[10px] font-display font-bold text-[#635C51] uppercase tracking-wider block mt-1">
                  Programados
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. HOJA CURVA EN CREMA FONDO (#F8F4EA)                                     */}
      {/* ========================================================================= */}
      <div className="bg-[#F8F4EA] rounded-t-[30px] -mt-5 pt-6 pb-6 px-4 sm:px-6 relative z-10 space-y-6 max-w-lg mx-auto min-h-screen">
        
        {feedbackMsg && (
          <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-card animate-card-reveal ${
            feedbackMsg.type === 'success' 
              ? 'bg-[#2E4056] text-[#F8F4EA]' 
              : 'bg-[#A84C3A] text-white'
          }`}>
            {feedbackMsg.type === 'success' ? <Check className="w-4 h-4 text-[#DCBD9E]" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* SECCIÓN: MIS PRÓXIMOS CULTOS */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between px-0.5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold font-display uppercase tracking-[0.14em] text-[#302C24]">
                  Mis Próximos Cultos
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#2E4056] text-[#F8F4EA] text-[10px] font-black tabular-nums">
                  {myAssignedServices.length}
                </span>
              </div>
              <div className="w-10 h-1 bg-gradient-to-r from-[#2E4056] to-[#8E9B84] mt-1 rounded-full" />
            </div>

            {onGoToFullCalendar && (
              <button
                type="button"
                onClick={onGoToFullCalendar}
                className="text-[11px] font-display font-bold uppercase tracking-wider text-[#2E4056] hover:text-[#637358] flex items-center gap-0.5 cursor-pointer"
              >
                <span>Calendario</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lista de Tarjetas de Cultos Asignados */}
          {myAssignedServices.length === 0 ? (
            <div className="bento-card bg-[#FCFBF8] border-[#E5DEC9] rounded-3xl p-6 text-center space-y-2">
              <Calendar className="w-9 h-9 text-[#8D8579] mx-auto" />
              <h3 className="text-sm font-display font-bold text-[#302C24]">
                No tienes cultos asignados actualmente
              </h3>
              <p className="text-xs text-[#635C51] max-w-xs mx-auto">
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
                    className="bento-card bg-[#FCFBF8] border-[#E5DEC9] hover:border-[#2E4056]/35 rounded-2xl p-4 sm:p-5 space-y-3.5"
                  >
                    {/* 1. Fila Superior: Hoja de Fecha + Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Calendario Sheet Badge */}
                        <div className="w-13 h-14 rounded-xl bg-white shadow-xs border border-[#E5DEC9] flex flex-col items-center overflow-hidden shrink-0">
                          <div className="w-full bg-[#2E4056] text-[#F8F4EA] text-[9px] uppercase font-display font-black py-0.5 text-center tracking-wider leading-none">
                            {dateInfo.monthName}
                          </div>
                          <div className="flex-1 flex flex-col items-center justify-center py-0.5">
                            <span className="text-xl font-black font-display leading-none tabular-nums text-[#302C24]">
                              {dateInfo.dayNum}
                            </span>
                            <span className="text-[8px] uppercase font-bold text-[#635C51] leading-none mt-0.5">
                              {dateInfo.weekday.slice(0, 3)}
                            </span>
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-display font-bold bg-[#EBF0E7] text-[#4A5940] border border-[#8E9B84]/40">
                              ASIGNADO
                            </span>
                            <span className="text-[11px] font-semibold text-[#635C51] tabular-nums">
                              {service.time} · {dateInfo.weekday} {dateInfo.dayNum} {dateInfo.monthName}
                            </span>
                          </div>
                          <h3 className="font-display font-bold text-base text-[#302C24] leading-snug mt-1 truncate">
                            {service.title}
                          </h3>
                        </div>
                      </div>

                      {mySlot && (
                        <div className="shrink-0">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#2E4056] text-[#F8F4EA] text-xs font-display font-bold shadow-xs">
                            <InstrumentIcon instrument={mySlot.key} className="w-3.5 h-3.5 text-[#DCBD9E]" />
                            <span>{mySlot.label}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 2. Horarios de ensayo y ubicación */}
                    <div className="flex items-center gap-3 text-xs text-[#635C51] flex-wrap">
                      {service.rehearsalTime && (
                        <span className="flex items-center gap-1 font-semibold text-[#7D5A38]">
                          <Clock className="w-3.5 h-3.5 text-[#7D5A38]" />
                          <span>Ensayo: <strong>{service.rehearsalTime}</strong></span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[#635C51]">
                        <MapPin className="w-3.5 h-3.5 text-[#635C51]" />
                        <span>Auditorio Principal</span>
                      </span>
                    </div>

                    {/* 3. Fila de Canciones */}
                    <div className="pt-2 border-t border-[#E5DEC9]">
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
                        className="w-full flex items-center justify-between py-1 text-xs font-semibold text-[#302C24] hover:text-[#2E4056] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Music className={`w-4 h-4 ${hasSongs ? 'text-[#2E4056]' : 'text-[#8D8579]'}`} />
                          <span>
                            {hasSongs ? `Canciones (${songsCount})` : 'Canciones en preparación'}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#8D8579]" />
                      </button>
                    </div>

                    {/* 4. Fila: Ver Equipo Asignado con Avatares */}
                    <div className="pt-1.5 border-t border-[#E5DEC9]">
                      <button
                        type="button"
                        onClick={() => onSelectService(service)}
                        className="w-full flex items-center justify-between py-1 text-xs font-semibold text-[#302C24] hover:text-[#2E4056] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#635C51]" />
                          <span>Ver equipo asignado</span>
                        </div>
                        <div className="flex items-center -space-x-1.5">
                          {confirmedSlots.slice(0, 3).map((slot, idx) => (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded-full bg-[#F5EBE0] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#302C24] shadow-2xs"
                              title={slot.musicianName}
                            >
                              {slot.musicianName ? slot.musicianName.charAt(0).toUpperCase() : '?'}
                            </div>
                          ))}
                          {confirmedSlots.length > 3 && (
                            <span className="w-6 h-6 rounded-full bg-[#E7EDF3] border-2 border-white text-[9px] font-bold text-[#2E4056] flex items-center justify-center shadow-2xs">
                              +{confirmedSlots.length - 3}
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-[#8D8579] ml-1.5" />
                        </div>
                      </button>
                    </div>

                    {/* 5. BOTÓN PRINCIPAL DE ACCIÓN: VER CANCIONES O GESTIONAR */}
                    <div className="pt-2 border-t border-[#E5DEC9] space-y-2">
                      {/* BOTÓN ESTRELLA: GESTIONAR CANCIONES (SOLO VOZ DIRECTOR O ADMIN) */}
                      {(isAdminAuthenticated || isVozDirector) && onOpenSetlist && (
                        <button
                          type="button"
                          onClick={() => onOpenSetlist(service)}
                          className="btn-kinetic w-full py-3 px-4 bg-[#637358] hover:bg-[#4A5940] text-[#F8F4EA] rounded-xl text-xs font-display font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                        >
                          <Music className="w-4 h-4 text-[#EBF0E7]" />
                          <span>Gestionar Canciones {isAdminAuthenticated ? '(Admin)' : '(Voz Director)'}</span>
                        </button>
                      )}

                      {/* Botón de Canciones para Músicos (Sin abrir nueva pestaña) */}
                      {isPublished ? (
                        <a
                          href={`/#/repertorio/${service.id}`}
                          className="btn-kinetic w-full py-3 px-4 bg-[#2E4056] hover:bg-[#213042] text-[#F8F4EA] rounded-xl text-xs font-display font-bold flex items-center justify-center gap-2 shadow-glow cursor-pointer"
                        >
                          <Music className="w-4 h-4 text-[#DCBD9E]" />
                          <span>Ver Canciones & Acordes ({songsCount})</span>
                        </a>
                      ) : hasSongs ? (
                        <a
                          href={`/#/repertorio/${service.id}`}
                          className="btn-kinetic w-full py-2.5 px-4 bg-[#F5EBE0] hover:bg-[#DCBD9E]/50 text-[#302C24] rounded-xl text-xs font-display font-bold flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Music className="w-4 h-4 text-[#7D5A38]" />
                          <span>Ver Canciones ({songsCount} en borrador)</span>
                        </a>
                      ) : !isVozDirector ? (
                        <div className="py-2.5 px-3 bg-[#F8F4EA] border border-[#E5DEC9] rounded-xl text-center text-xs text-[#8D8579]">
                          Canciones en preparación por el equipo de alabanza
                        </div>
                      ) : null}

                      {/* Enlace discreto para liberar puesto */}
                      {mySlot && (
                        <div className="text-right pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleRelease(service.id, mySlot.key)}
                            className="text-[11px] text-[#8D8579] hover:text-rose-700 font-semibold transition-colors cursor-pointer"
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
          <section className="space-y-3 pt-3 border-t border-[#E5DEC9]">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#7D5A38]" />
                <h2 className="text-sm font-extrabold font-display uppercase tracking-wider text-[#302C24]">
                  Cultos Abiertos ({availableServices.length})
                </h2>
              </div>
              <span className="text-[10px] font-display font-bold text-[#7D5A38] bg-[#F5EBE0] border border-[#DCBD9E] px-2.5 py-0.5 rounded-full">
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
                    className="bento-card bg-[#FCFBF8] border-[#E5DEC9] hover:border-[#2E4056]/35 rounded-2xl p-4 sm:p-5 space-y-3"
                  >
                    {/* 1. Badges superiores */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-display font-bold bg-[#E7EDF3] text-[#2E4056]">
                        ○ VACANTES LIBRES ({vacantSlots.length})
                      </span>
                      <span className="text-[11px] font-semibold text-[#635C51] tabular-nums">
                        {service.time} · {dateInfo.weekday} {dateInfo.dayNum} {dateInfo.monthName}
                      </span>
                    </div>

                    {/* 2. Título a todo el ancho */}
                    <div>
                      <h3 className="font-display font-bold text-base text-[#302C24] leading-snug">
                        {service.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-[#635C51] mt-1 flex-wrap">
                        {service.rehearsalTime && (
                          <span className="flex items-center gap-1 font-semibold text-[#7D5A38]">
                            <Clock className="w-3 h-3 text-[#7D5A38]" />
                            <span>Ensayo: <strong>{service.rehearsalTime}</strong></span>
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[#8D8579]">
                          <MapPin className="w-3 h-3 text-[#8D8579]" />
                          <span>Auditorio Principal</span>
                        </span>
                      </div>
                    </div>

                    {/* Acción de Postulación Rápida */}
                    {matchingSlot ? (
                      <div className="p-3 bg-[#F5EBE0]/80 border border-[#DCBD9E] rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#302C24] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#7D5A38]" />
                            <span>Puesto sugerido para ti:</span>
                          </span>
                          <span className="text-[11px] font-display font-bold text-[#2E4056]">
                            {matchingSlot.label}
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={Boolean(isClaiming)}
                          onClick={() => handleQuickClaim(service.id, matchingSlot.key)}
                          className="btn-kinetic w-full py-2.5 px-4 bg-[#2E4056] hover:bg-[#213042] text-[#F8F4EA] rounded-xl text-xs font-display font-bold flex items-center justify-center gap-2 shadow-glow disabled:opacity-50 cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[3] text-[#DCBD9E]" />
                          <span>Postularme como {matchingSlot.label}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-[#635C51] italic px-1">
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
                              className="btn-kinetic inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-display font-bold bg-[#F8F4EA] hover:bg-[#E7EDF3] text-[#302C24] hover:text-[#2E4056] border border-[#E5DEC9] hover:border-[#2E4056]/35 cursor-pointer"
                              title={`Toca para postularte como ${slot.label}`}
                            >
                              <InstrumentIcon instrument={slot.key} className="w-3.5 h-3.5 text-[#635C51]" />
                              <span>+ {slot.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ver Detalles */}
                    <div className="pt-2 border-t border-[#E5DEC9] flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => onSelectService(service)}
                        className="text-[#635C51] hover:text-[#2E4056] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-[#8D8579]" />
                        <span>Ver detalles completos</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {service.isSongsPublished && service.songs && service.songs.length > 0 && (
                        <a
                          href={`/#/repertorio/${service.id}`}
                          className="text-[#2E4056] font-display font-bold flex items-center gap-1 hover:underline"
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
              className="btn-kinetic w-full py-3.5 px-4 bg-[#FCFBF8] hover:bg-[#F5EBE0] text-[#2E4056] border border-[#DCBD9E] rounded-2xl text-xs font-display font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <CalendarDays className="w-4 h-4 text-[#7D5A38]" />
              <span>Ver Modo Calendario Mensual Completo</span>
            </button>
          </div>
        )}

        {/* Modal de Notificaciones para Móvil */}
        {showNotificationsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-modal border border-[#E5E8EA] overflow-hidden animate-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="p-4 bg-[#315F6D] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#E8B844]" />
                  <h3 className="text-sm font-bold">Tus Notificaciones</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotificationsModal(false)}
                  className="p-1 text-white/70 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-4 py-2 bg-[#FAF9F6] border-b border-[#EEF0F1] flex items-center justify-between text-[11px] text-[#64717C]">
                <span className="font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#315F6D]" />
                  Hora Oficial Perú
                </span>
                <span className="font-bold text-[#315F6D]">{peruTodayStr}</span>
              </div>

              {/* Contenido */}
              <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#64717C] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#315F6D]" />
                  <span>Cultos de Hoy (Perú)</span>
                </p>

                {cultosToday.length > 0 ? (
                  <div className="space-y-2">
                    {cultosToday.map(service => {
                      const mySlot = Object.entries(service.slots || {}).find(([_, sl]) => (sl as any)?.musicianId === musicianUser.id);
                      return (
                        <div key={service.id} className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E8EA] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#202C37]">{service.title || 'Culto de Hoy'}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C96B65] text-white">¡Hoy!</span>
                          </div>
                          <p className="text-[11px] text-[#64717C] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#E8B844]" />
                            <span>Hora: {service.time || '19:30'}</span>
                          </p>
                          {mySlot && (
                            <div className="p-2 rounded-lg bg-[#F7E3DF] text-[11px] font-bold text-[#C96B65]">
                              Asignado como: {(mySlot[1] as any)?.label || mySlot[0]}
                            </div>
                          )}
                          {service.isSongsPublished && service.songs && service.songs.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowNotificationsModal(false);
                                if (onOpenSetlist) {
                                  onOpenSetlist(service);
                                } else {
                                  window.location.hash = `#/repertorio/${service.id}`;
                                }
                              }}
                              className="w-full py-2 bg-[#315F6D] hover:bg-[#234A57] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                            >
                              Ver Canciones del Culto
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-dashed border-[#E5E8EA] text-center">
                    <p className="text-xs text-[#64717C] font-semibold">
                      No tienes cultos programados para hoy en Perú.
                    </p>
                    <p className="text-[10px] text-[#89939C] mt-0.5">
                      ¡Estás libre el día de hoy!
                    </p>
                  </div>
                )}

                {myAssignedServices.length > 0 && (
                  <div className="pt-2 border-t border-[#EEF0F1]">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#64717C] mb-1">
                      Agenda Próxima
                    </p>
                    <p className="text-xs text-[#202C37]">
                      Tienes <span className="font-bold text-[#315F6D]">{myAssignedServices.length}</span> culto(s) confirmado(s) en total.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-[#FAF9F6] border-t border-[#EEF0F1] flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowNotificationsModal(false)}
                  className="px-4 py-1.5 bg-[#315F6D] hover:bg-[#234A57] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Perfil para Móvil */}
        <MusicianProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />

      </div>
    </div>
  );
};
