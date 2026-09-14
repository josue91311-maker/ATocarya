import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceDate, SlotConfig, SlotKey } from '../types';
import { isServicePast, isServiceExpired } from '../utils/dateUtils';
import { getBestMatchingSlot } from '../utils/instrumentMatcher';
import { InstrumentIcon } from './InstrumentIcon';
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
  CalendarDays
} from 'lucide-react';

interface Props {
  onSelectService: (service: ServiceDate) => void;
  onOpenSetlist?: (service: ServiceDate) => void;
  onGoToFullCalendar?: () => void;
}

export const MusicianMobileHome: React.FC<Props> = ({ 
  onSelectService, 
  onGoToFullCalendar 
}) => {
  const { musicianUser, services, claimSlot, releaseSlot } = useApp();
  const [claimingSlotKey, setClaimingSlotKey] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!musicianUser) return null;

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
        monthName: monthName.toUpperCase(),
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

  // 2. Mis servicios confirmados (donde ya tengo puesto asignado)
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
    <div className="space-y-6 pb-24 animate-in fade-in max-w-lg mx-auto">
      
      {/* 1. Header de Bienvenida & Perfil Rápido */}
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-3xl p-5 shadow-lg shadow-emerald-950/10 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white flex items-center justify-center font-display font-black text-xl shadow-inner">
              {musicianUser.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200/90 block">
                Portal del Músico
              </span>
              <h1 className="text-lg font-bold font-display text-white leading-tight">
                {musicianUser.fullName}
              </h1>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-xs font-bold text-white shadow-2xs">
              <InstrumentIcon instrument={musicianUser.primaryInstrument} className="w-3.5 h-3.5 text-emerald-200" />
              <span>{musicianUser.primaryInstrument}</span>
            </span>
          </div>
        </div>

        {/* Resumen de Asignaciones */}
        <div className="mt-4 pt-3.5 border-t border-white/15 flex items-center justify-between text-xs text-emerald-100">
          <div className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
            <span>
              Tienes <strong className="text-white font-bold">{myAssignedServices.length}</strong> culto(s) asignado(s)
            </span>
          </div>
          {onGoToFullCalendar && (
            <button
              onClick={onGoToFullCalendar}
              className="text-[11px] text-white/90 hover:text-white font-bold underline flex items-center gap-0.5"
            >
              Ver Calendario <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

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
      {/* SECCIÓN PRIORIDAD 1: MIS CULTOS ASIGNADOS (CON ENLACE DIRECTO A CANCIONES) */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Mis Próximos Cultos ({myAssignedServices.length})</span>
          </h2>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Confirmados
          </span>
        </div>

        {myAssignedServices.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 text-center shadow-2xs space-y-2">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              No tienes cultos asignados actualmente
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Revisa la sección de abajo para ver las fechas abiertas y postularte con tu instrumento.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myAssignedServices.map(service => {
              const dateInfo = formatServiceDate(service.date);
              const slots = Object.values(service.slots || {}) as SlotConfig[];
              const mySlot = slots.find(s => s && s.musicianId === musicianUser.id);
              const songsCount = service.songs?.length || 0;
              const hasSongs = Boolean(service.songs && songsCount > 0);
              const isPublished = Boolean(service.isSongsPublished && hasSongs);

              return (
                <div 
                  key={service.id}
                  className="bg-white border-2 border-emerald-200/90 hover:border-emerald-400 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3 transition-all"
                >
                  {/* Encabezado del culto */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Cuadro de calendario visual */}
                      <div className="w-13 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center flex-shrink-0 text-emerald-950 shadow-2xs">
                        <span className="text-[9px] uppercase font-black text-emerald-700 leading-none">
                          {dateInfo.monthName}
                        </span>
                        <span className="text-xl font-black font-display leading-tight tabular-nums mt-0.5">
                          {dateInfo.dayNum}
                        </span>
                        <span className="text-[8px] uppercase font-bold text-slate-500 leading-none">
                          {dateInfo.weekday}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100/70 px-2 py-0.5 rounded-md">
                          ✓ Asignado
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 mt-1 truncate">
                          {service.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1 font-bold text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            {service.time}
                          </span>
                          {service.rehearsalTime && (
                            <span className="text-slate-500">· Ensayo: <strong className="text-slate-700">{service.rehearsalTime}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Badge del puesto que le toca tocar */}
                    {mySlot && (
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center gap-1.5 shadow-sm shadow-emerald-600/30">
                          <InstrumentIcon instrument={mySlot.key} className="w-3.5 h-3.5 text-white" />
                          <span>{mySlot.label}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* =========================================================== */}
                  {/* BOTÓN ESTRELLA: ENLACE DIRECTO A CANCIONES (REPERTORIO) */}
                  {/* =========================================================== */}
                  <div className="pt-2 border-t border-slate-100">
                    {isPublished ? (
                      <a
                        href={`/#/repertorio/${service.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition-all group"
                      >
                        <Music className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
                        <span>🎵 Ver Canciones & Acordes ({songsCount})</span>
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-200 ml-auto" />
                      </a>
                    ) : hasSongs ? (
                      <a
                        href={`/#/repertorio/${service.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Music className="w-4 h-4 text-emerald-700" />
                        <span>Ver Canciones ({songsCount} en borrador)</span>
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-600 ml-auto" />
                      </a>
                    ) : (
                      <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Music className="w-3.5 h-3.5 text-slate-400" />
                          <span>Canciones en preparación por el equipo</span>
                        </span>
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          Pendiente
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botones secundarios: Ver equipo / Liberar mi puesto */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => onSelectService(service)}
                      className="text-slate-600 hover:text-emerald-700 font-bold flex items-center gap-1 transition-colors py-1"
                    >
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ver compañeros de equipo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {mySlot && (
                      <button
                        type="button"
                        onClick={() => handleRelease(service.id, mySlot.key)}
                        className="text-[11px] text-slate-400 hover:text-rose-600 font-bold transition-colors py-1"
                      >
                        Liberar mi puesto
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ================================================================================= */}
      {/* SECCIÓN PRIORIDAD 2: CULTOS DISPONIBLES PARA POSTULARTE (DONDE NO ESTÁS ASIGNADO) */}
      {/* ================================================================================= */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Cultos Abiertos para Postularte ({availableServices.length})</span>
          </h2>
          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            Vacantes Libres
          </span>
        </div>

        {availableServices.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 text-center shadow-2xs space-y-2">
            <Check className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              No hay cultos con vacantes en este momento
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Todos los puestos están cubiertos o las fechas han sido cerradas por el administrador.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableServices.map(service => {
              const dateInfo = formatServiceDate(service.date);
              const slots = (Object.values(service.slots || {}) as SlotConfig[])
                .filter(s => s && s.enabled !== false);
              const vacantSlots = slots.filter(s => !s.musicianId);
              
              // Mejor puesto vacante recomendado para su instrumento o voz
              const matchingSlot = getBestMatchingSlot(service.slots, musicianUser.primaryInstrument);
              const isClaiming = claimingSlotKey?.startsWith(service.id);

              return (
                <div 
                  key={service.id}
                  className="bg-white border border-slate-200 hover:border-emerald-300 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3 transition-all"
                >
                  {/* Encabezado del culto */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-13 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center flex-shrink-0 text-slate-800 shadow-2xs">
                        <span className="text-[9px] uppercase font-bold text-slate-500 leading-none">
                          {dateInfo.monthName}
                        </span>
                        <span className="text-xl font-black font-display leading-tight tabular-nums mt-0.5">
                          {dateInfo.dayNum}
                        </span>
                        <span className="text-[8px] uppercase font-bold text-slate-400 leading-none">
                          {dateInfo.weekday}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-100/70 px-2 py-0.5 rounded-md">
                          {vacantSlots.length} vacante{vacantSlots.length > 1 ? 's' : ''} libre{vacantSlots.length > 1 ? 's' : ''}
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 mt-1 truncate">
                          {service.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-bold text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            {service.time}
                          </span>
                          {service.rehearsalTime && (
                            <span>· Ensayo: <strong className="text-slate-700">{service.rehearsalTime}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACCIÓN RÁPIDA: POSTULACIÓN A SU INSTRUMENTO */}
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
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/30 transition-all disabled:opacity-50"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>✓ Postularme como {matchingSlot.label} (1 Toque)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic px-1">
                      Tu puesto principal ({musicianUser.primaryInstrument}) ya está cubierto, pero puedes postularte a otros puestos disponibles abajo:
                    </div>
                  )}

                  {/* Otros puestos vacantes en chips tocables */}
                  {vacantSlots.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Todos los puestos disponibles (toca para postularte):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {vacantSlots.map(slot => (
                          <button
                            key={slot.key}
                            type="button"
                            onClick={() => handleQuickClaim(service.id, slot.key)}
                            disabled={Boolean(isClaiming)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 transition-all active:scale-95"
                            title={`Toca para postularte como ${slot.label}`}
                          >
                            <InstrumentIcon instrument={slot.key} className="w-3.5 h-3.5 text-slate-500" />
                            <span>+ {slot.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ver detalles del servicio */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onSelectService(service)}
                      className="text-xs text-slate-500 hover:text-emerald-700 font-bold flex items-center gap-1 transition-colors"
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
                        className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
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
        )}
      </section>

      {/* Botón para ver calendario general */}
      {onGoToFullCalendar && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onGoToFullCalendar}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold shadow-2xs transition-colors flex items-center justify-center gap-2"
          >
            <CalendarDays className="w-4 h-4 text-slate-500" />
            <span>Ver Modo Calendario Mensual Completo</span>
          </button>
        </div>
      )}

    </div>
  );
};

