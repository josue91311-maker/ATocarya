import React from 'react';
import { useApp } from '../context/AppContext';
import { ServiceDate, SlotConfig } from '../types';
import { Clock, ChevronRight, Check, Sparkles, AlertCircle, Lock, Music } from 'lucide-react';
import { InstrumentIcon } from './InstrumentIcon';
import { isServiceExpired } from '../utils/dateUtils';
import { getBestMatchingSlot } from '../utils/instrumentMatcher';

interface Props {
  service: ServiceDate;
  onSelect: (service: ServiceDate) => void;
  onOpenSetlist?: (service: ServiceDate) => void;
}

export const ServiceCard: React.FC<Props> = ({ service, onSelect, onOpenSetlist }) => {
  const { musicianUser, isAdminAuthenticated, claimSlot } = useApp();

  const [year, month, day] = service.date.split('-');
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
  
  const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
  const monthName = dateObj.toLocaleDateString('es-ES', { month: 'short' });
  const dayNumber = dateObj.getDate();

  const isExpired = isServiceExpired(service);

  const slotsList = (Object.values(service.slots || {}) as SlotConfig[]).filter(s => s && s.enabled !== false);
  const totalSlots = slotsList.length;
  const occupiedList = slotsList.filter(s => Boolean(s.musicianId));
  const occupiedCount = occupiedList.length;
  const availableCount = totalSlots - occupiedCount;

  const myAssignedSlot = musicianUser
    ? slotsList.find(s => s.musicianId === musicianUser.id)
    : null;

  // Sugerencia inteligente de 1 toque según instrumento del usuario (Voz -> Voz Coro 1, etc.)
  const matchPrimarySlot = musicianUser && !myAssignedSlot && !isExpired
    ? getBestMatchingSlot(service.slots, musicianUser.primaryInstrument)
    : null;

  return (
    <div
      onClick={() => onSelect(service)}
      className={`bg-white hover:bg-slate-50/50 border rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-150 flex flex-col justify-between shadow-2xs hover:shadow-pc group ${
        isExpired ? 'border-slate-200/70 opacity-90' : 'border-slate-200/90 hover:border-emerald-400'
      }`}
    >
      <div>
        {/* Header: Planning Center Date Box + Title & Times + Status Pill */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Ultra-Visible Calendar Sheet Badge */}
            <div className="w-14 h-15 rounded-2xl border border-emerald-300 bg-white flex flex-col items-center overflow-hidden flex-shrink-0 shadow-sm group-hover:border-emerald-500 group-hover:shadow-md transition-all">
              <div className="w-full bg-emerald-600 text-white text-[10px] uppercase font-black py-0.5 text-center tracking-wider leading-tight">
                {monthName}
              </div>
              <div className="flex-1 flex flex-col items-center justify-center py-0.5">
                <span className="text-2xl font-black font-display leading-none tabular-nums text-slate-900">
                  {dayNumber}
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-500 leading-none mt-0.5">
                  {dayName.slice(0, 3)}
                </span>
              </div>
            </div>

            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate font-display group-hover:text-emerald-950 transition-colors">
                {service.title}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-bold text-slate-700 tabular-nums">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  {service.time}
                </span>
                {service.rehearsalTime && (
                  <span className="hidden sm:inline text-slate-400">· Ensayo: <strong className="text-slate-600">{service.rehearsalTime}</strong></span>
                )}
                <span className="capitalize text-slate-400 hidden sm:inline">· {dayName}</span>
                {service.registrationDeadline && (
                  <span className="text-[11px] text-amber-700 hidden md:inline">
                    · Límite: {service.registrationDeadline}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Badges - Planning Center Style */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {isExpired ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <Lock className="w-3 h-3" />
                Expirado
              </span>
            ) : myAssignedSlot ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <Check className="w-3 h-3 text-emerald-700 stroke-[3]" />
                {myAssignedSlot.label}
              </span>
            ) : availableCount === 0 ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                Completo
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 tabular-nums">
                {availableCount} vacantes
              </span>
            )}

            {!service.isOpen && !isExpired && (
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                Cerrado
              </span>
            )}
          </div>
        </div>

        {/* Progress summary bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Equipo: <strong className="text-slate-800 tabular-nums">{occupiedCount} de {totalSlots}</strong> posiciones
          </span>
          <span className="text-emerald-700 font-bold flex items-center gap-0.5 text-xs group-hover:translate-x-0.5 transition-transform">
            Ver equipo <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-300"
            style={{ width: `${(occupiedCount / totalSlots) * 100}%` }}
          />
        </div>

        {/* Setlist Indicator / Direct Link */}
        {(() => {
          const isDirector = Boolean(musicianUser && service.slots?.voz_director?.musicianId === musicianUser.id);
          const canManage = isAdminAuthenticated || isDirector;
          const songsCount = service.songs?.length || 0;
          const isPublished = Boolean(service.isSongsPublished && songsCount > 0);

          if (canManage) {
            return (
              <div 
                className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                  <Music className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Repertorio: {songsCount > 0 ? `${songsCount} alabanzas` : 'Sin canciones'}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
                    service.isSongsPublished ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {service.isSongsPublished ? 'Publicado' : 'Borrador'}
                  </span>
                </div>
                {onOpenSetlist && (
                  <button
                    type="button"
                    onClick={() => onOpenSetlist(service)}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                  >
                    <span>Editar Canciones</span>
                  </button>
                )}
              </div>
            );
          }

          if (isPublished) {
            return (
              <div 
                className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                  <Music className="w-3.5 h-3.5 text-emerald-600" />
                  <span>🎵 {songsCount} canciones con videos y tonos</span>
                </div>
                <a
                  href={`/#/repertorio/${service.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <span>Ver Repertorio</span>
                </a>
              </div>
            );
          }

          return null;
        })()}
      </div>

      {/* Acceso Rápido de 1-Toque para el músico en Móvil */}
      {matchPrimarySlot && !myAssignedSlot && !isExpired && (
        <div 
          className="mt-3.5 p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-2xs"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <span className="text-xs text-emerald-950 font-bold block">
                Sugerido para ti: <strong>{matchPrimarySlot.label}</strong>
              </span>
              <span className="text-[10px] text-emerald-700">
                Puesto libre para tu instrumento ({musicianUser?.primaryInstrument})
              </span>
            </div>
          </div>
          <button
            onClick={() => claimSlot(service.id, matchPrimarySlot.key)}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Confirmar {matchPrimarySlot.label}</span>
          </button>
        </div>
      )}

      {/* Aviso si la fecha ya expiró */}
      {isExpired && !myAssignedSlot && (
        <div 
          className="mt-3.5 p-2 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs text-slate-600 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>Inscripciones expiradas</span>
          </span>
          <span className="text-[11px] font-bold text-slate-400">
            No disponible
          </span>
        </div>
      )}

      {/* Slots chips preview - Planning Center Clean Badges */}
      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {slotsList.map(slot => {
          const isFilled = Boolean(slot.musicianId);
          const isMe = musicianUser && slot.musicianId === musicianUser.id;

          return (
            <span
              key={slot.key}
              title={`${slot.label}: ${slot.musicianName || 'Vacante'}`}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border transition-colors ${
                isMe
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold shadow-2xs'
                  : isFilled
                  ? 'bg-slate-50 text-slate-700 border-slate-200 font-medium'
                  : 'bg-white text-slate-400 border-slate-200 border-dashed'
              }`}
            >
              <InstrumentIcon instrument={slot.key} className={`w-3 h-3 ${isMe ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className="truncate max-w-[65px]">
                {isFilled ? slot.musicianName?.split(' ')[0] : slot.label.split(' ')[0]}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
};
