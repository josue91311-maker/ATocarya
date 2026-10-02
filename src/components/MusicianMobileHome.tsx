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
    const hasVacant = slots.some(slot => slot && slot.enabled !== false && !slot.musicianId);
    return hasVacant;
  });

  // Estadísticas claras y directas
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
      return formatter.format(new Date()); // "YYYY-MM-DD"
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
    <div className="-mx-4 -mt-6 sm:mx-0 sm:mt-0 pb-24 animate-in fade-in select-none">
      
      {/* ========================================================================= */}
      {/* 1. HERO HEADER OSCURO ESTILO CONCIERTO (CON LOGO BLANCO Y SALUDO)         */}
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
          {/* Barra Superior del Hero: Logo con letras blancas + Campana de hoy + Avatar */}
          <div className="flex items-center justify-between">
            {/* Logo Oficial con LETRAS BLANCAS */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 relative flex items-center justify-center shrink-0 bg-white/10 rounded-xl p-1 border border-white/20 shadow-xs">
                <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
                  <circle cx="32" cy="32" r="23" stroke="#1E74FD" strokeWidth="6.5" strokeLinecap="round" strokeDasharray="115 35" strokeDashoffset="-12" />
                  <polygon points="47,15 52,20 48,24 43,19" fill="#FF7E22" />
                  <circle cx="24" cy="42" r="9.5" fill="#FFFFFF" />
                  <path d="M24 42 V26 L34 36 L55 15" stroke="#1E74FD" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-black text-lg tracking-tight leading-none font-display">
                  ATocarYa
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-200/90 leading-tight mt-0.5">
                  Portal de Músicos
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Notificación Campana: Solo activa si tiene culto el día de HOY (Hora Perú) */}
              <div 
                className={`relative p-2 rounded-xl border transition-all ${
                  hasCultoToday 
                    ? 'bg-rose-500/20 border-rose-400/50 text-white' 
                    : 'bg-white/10 border-white/10 text-white/70'
                }`}
                title={hasCultoToday ? `¡Hoy tienes ${cultosToday.length} culto(s) programado(s)!` : 'Sin cultos para hoy (Hora Perú)'}
              >
                <Bell className={`w-4 h-4 ${hasCultoToday ? 'text-rose-400 animate-pulse' : 'text-white/80'}`} />
                {hasCultoToday && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs animate-bounce">
                    {cultosToday.length}
                  </span>
                )}
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
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
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

          {/* 2 Tarjetas Estadísticas Reales (Sin la tarjeta confusa de 'Pendientes') */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Card 1: Asignados (Azul Eléctrico) */}
            <div className="bg-[#1E74FD] text-white rounded-2xl p-3.5 shadow-md shadow-blue-500/25 flex flex-col justify-between min-h-[82px] border border-blue-400/30">
              <div className="flex items-center justify-between">
                <Calendar className="w-5 h-5 text-blue-100" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100 bg-white/15 px-2 py-0.5 rounded-full">
                  Confirmados
                </span>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-black leading-none block tabular-nums">
                  {assignedCount}
                </span>
                <span className="text-[11px] font-bold text-blue-100 uppercase tracking-tight block mt-1">
                  Cultos Asignados
                </span>
              </div>
            </div>

            {/* Card 2: Total Cultos en Calendario (Naranja / Ámbar) */}
            <div className="bg-[#FF7E22] text-white rounded-2xl p-3.5 shadow-md shadow-amber-500/25 flex flex-col justify-between min-h-[82px] border border-amber-400/30">
              <div className="flex items-center justify-between">
                <Sparkles className="w-5 h-5 text-amber-100" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100 bg-white/15 px-2 py-0.5 rounded-full">
                  Calendario
                </span>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-black leading-none block tabular-nums">
                  {upcomingServices.length}
                </span>
                <span className="text-[11px] font-bold text-amber-100 uppercase tracking-tight block mt-1">
                  Cultos Programados
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

        {/* ========================================================================= */}
        {/* SECCIÓN: MIS PRÓXIMOS CULTOS                                              */}
        {/* ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Mis Próximos Cultos
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
                <span>Ver calendario completo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lista de Tarjetas de Cultos Asignados */}
          {myAssignedServices.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-6 text-center space-y-2">
              <Calendar className="w-9 h-9 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">
                No tienes cultos asignados actualmente
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
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
