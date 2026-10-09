import React from 'react';
import { useApp } from '../context/AppContext';
import { ServiceDate, SlotConfig } from '../types';
import { Clock, ChevronRight, Check, Sparkles, Lock, Music, User } from 'lucide-react';
import { InstrumentIcon } from './InstrumentIcon';
import { isServiceExpired } from '../utils/dateUtils';
import { getBestMatchingSlot } from '../utils/instrumentMatcher';
import { getServiceCardTheme, MusicCardIllustration } from './MusicCardIllustration';

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
  const monthName = dateObj.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').toUpperCase();
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

  // Sugerencia inteligente de 1 toque según instrumento del usuario
  const matchPrimarySlot = musicianUser && !myAssignedSlot && !isExpired
    ? getBestMatchingSlot(service.slots, musicianUser.primaryInstrument)
    : null;

  const theme = getServiceCardTheme(service.id);

  return (
    <div
      onClick={() => onSelect(service)}
      className={`bg-white hover:bg-[#FAF9F6] border rounded-[18px] cursor-pointer transition-all duration-200 flex flex-col justify-between shadow-card hover:shadow-hover overflow-hidden group ${
        isExpired 
          ? 'border-[#E5E8EA] opacity-90' 
          : 'border-[#E5E8EA] hover:border-[#315F6D]/50'
      }`}
    >
      <div>
        {/* ========================================================================= */}
        {/* 1. HEADER ILUSTRADO EDITORIAL CON ARTE MUSICAL Y DATOS PRINCIPALES        */}
        {/* ========================================================================= */}
        <div 
          className="relative px-4 py-3.5 sm:px-5 sm:py-4 overflow-hidden flex flex-col justify-between min-h-[105px]"
          style={{ backgroundColor: theme.headerBg }}
        >
          {/* Ilustración SVG lineal en el fondo derecho */}
          <MusicCardIllustration 
            theme={theme} 
            className="absolute -right-4 -top-3 w-48 h-36" 
          />

          <div className="relative z-10 flex items-start justify-between gap-3">
            {/* Lado izquierdo: Calendario Hoja + Título y Hora */}
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
              {/* Tarjeta de Fecha Estilo Editorial */}
              <div className="w-13 h-14 sm:w-14 sm:h-15 rounded-xl bg-white shadow-md flex flex-col items-center overflow-hidden shrink-0 border border-black/5">
                <div 
                  className="w-full text-white text-[9px] sm:text-[10px] uppercase font-extrabold py-0.5 text-center tracking-wider leading-none"
                  style={{ backgroundColor: theme.accentColor }}
                >
                  {monthName}
                </div>
                <div className="flex-1 flex flex-col items-center justify-center py-0.5">
                  <span className="text-xl sm:text-2xl font-black font-display leading-none tabular-nums text-[#202C37]">
                    {dayNumber}
                  </span>
                  <span className="text-[8px] sm:text-[9px] uppercase font-bold text-[#64717C] leading-none mt-0.5">
                    {dayName.slice(0, 3)}
                  </span>
                </div>
              </div>

              {/* Título y Horario */}
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base text-white truncate font-display drop-shadow-xs">
                  {service.title}
                </h3>
                <div className="flex items-center flex-wrap gap-1.5 mt-0.5 text-xs text-white/90">
                  <span className="flex items-center gap-1 font-semibold tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-white/80" />
                    {service.time}
                  </span>
                  {service.rehearsalTime && (
                    <span className="text-white/80 text-[11px]">
                      · Ensayo: <strong className="text-white">{service.rehearsalTime}</strong>
                    </span>
                  )}
                  <span className="capitalize text-white/70 text-[11px] hidden sm:inline">
                    · {dayName}
                  </span>
                </div>
              </div>
            </div>

            {/* Lado derecho: Badges de Estado */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {isExpired ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/30 backdrop-blur-xs text-white border border-white/20">
                  <Lock className="w-3 h-3" />
                  Expirado
                </span>
              ) : myAssignedSlot ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-[#315F6D] shadow-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                  {myAssignedSlot.label}
                </span>
              ) : availableCount === 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/25 backdrop-blur-xs text-white border border-white/20">
                  Completo
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/95 text-[#202C37] shadow-xs tabular-nums">
                  {availableCount} vacantes
                </span>
              )}

              {/* Tag opcional de puesto recomendado o rol */}
              {myAssignedSlot && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/20 text-white backdrop-blur-xs">
                  {myAssignedSlot.key}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. CUERPO DE LA TARJETA (PROGRESO, REPERTORIO, EQUIPO)                     */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Progress summary bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-[#64717C]">
              <span>
                Equipo: <strong className="text-[#202C37] tabular-nums font-semibold">{occupiedCount} de {totalSlots}</strong> posiciones
              </span>
              <span className="text-[#315F6D] font-bold flex items-center gap-0.5 text-xs group-hover:translate-x-0.5 transition-transform">
                Ver equipo <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="w-full bg-[#E5E8EA] h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-[#315F6D] rounded-full transition-all duration-300"
                style={{ width: `${totalSlots > 0 ? (occupiedCount / totalSlots) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Repertorio Indicator / Botón Ver Repertorio */}
          {(() => {
            const isDirector = Boolean(
              musicianUser && (
                musicianUser.primaryInstrument === 'Voz Director' ||
                musicianUser.primaryInstrument?.toLowerCase().includes('director') ||
                service.slots?.voz_director?.musicianId === musicianUser.id
              )
            );
            const canManage = isAdminAuthenticated || isDirector;
            const songsCount = service.songs?.length || 0;
            const isPublished = Boolean(service.isSongsPublished && songsCount > 0);

            if (canManage) {
              return (
                <div 
                  className="pt-2.5 border-t border-[#EEF0F1] flex items-center justify-between text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5 text-[#202C37] font-bold">
                    <Music className="w-3.5 h-3.5 text-[#315F6D]" />
                    <span>Repertorio: {songsCount > 0 ? `${songsCount} alabanzas` : 'Sin canciones'}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                      service.isSongsPublished ? 'bg-[#D9E9EB] text-[#315F6D]' : 'bg-[#FFF1CB] text-[#87621D]'
                    }`}>
                      {service.isSongsPublished ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>
                  {onOpenSetlist && (
                    <button
                      type="button"
                      onClick={() => onOpenSetlist(service)}
                      className="px-2.5 py-1 bg-[#D9E9EB] hover:bg-[#315F6D] text-[#315F6D] hover:text-white border border-[#315F6D]/30 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
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
                  className="pt-2.5 border-t border-[#EEF0F1] flex items-center justify-between text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5 text-[#202C37] font-semibold">
                    <Music className="w-3.5 h-3.5 text-[#315F6D]" />
                    <span>🎵 {songsCount} canciones con videos y tonos</span>
                  </div>
                  <a
                    href={`/#/repertorio/${service.id}`}
                    className="px-3 py-1.5 bg-[#C96B65] hover:bg-[#B95752] text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <span>Ver Repertorio</span>
                  </a>
                </div>
              );
            }

            return null;
          })()}

          {/* Lista de Miembros Confirmados en Chips Modernos */}
          <div className="pt-1 flex flex-wrap gap-1.5">
            {slotsList.map(slot => {
              const isFilled = Boolean(slot.musicianId);
              const isMe = musicianUser && slot.musicianId === musicianUser.id;

              return (
                <span
                  key={slot.key}
                  title={`${slot.label}: ${slot.musicianName || 'Vacante'}`}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] border transition-colors ${
                    isMe
                      ? 'bg-[#D9E9EB] text-[#315F6D] border-[#315F6D]/40 font-bold shadow-2xs'
                      : isFilled
                      ? 'bg-[#FAF9F6] text-[#202C37] border-[#E5E8EA] font-medium'
                      : 'bg-white text-[#89939C] border-[#E5E8EA] border-dashed'
                  }`}
                >
                  <InstrumentIcon instrument={slot.key} className={`w-3 h-3 ${isMe ? 'text-[#315F6D]' : 'text-[#89939C]'}`} />
                  <span className="truncate max-w-[70px]">
                    {isFilled ? slot.musicianName?.split(' ')[0] : slot.label.split(' ')[0]}
                  </span>
                </span>
              );
            })}
          </div>

          {/* Sugerencia de 1-Toque para el músico (Caja Coral/Petróleo) */}
          {matchPrimarySlot && !myAssignedSlot && !isExpired && (
            <div 
              className="mt-2 p-3 bg-[#D9E9EB]/50 border border-[#315F6D]/20 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-2xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#315F6D] text-white flex items-center justify-center shrink-0 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <span className="text-xs text-[#202C37] font-bold block">
                    Sugerido para ti: <strong>{matchPrimarySlot.label}</strong>
                  </span>
                  <span className="text-[10px] text-[#64717C]">
                    Puesto libre para tu instrumento ({musicianUser?.primaryInstrument})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => claimSlot(service.id, matchPrimarySlot.key)}
                className="w-full sm:w-auto px-4 py-2 bg-[#315F6D] hover:bg-[#234A57] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Confirmar {matchPrimarySlot.label}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
