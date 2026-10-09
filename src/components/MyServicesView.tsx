import React from 'react';
import { useApp } from '../context/AppContext';
import { ServiceDate, SlotConfig } from '../types';
import { Calendar, ChevronRight, Clock, Music, CheckCircle2 } from 'lucide-react';
import { InstrumentIcon } from './InstrumentIcon';
import { isServicePast } from '../utils/dateUtils';

interface Props {
  onSelectService: (service: ServiceDate) => void;
}

export const MyServicesView: React.FC<Props> = ({ onSelectService }) => {
  const { musicianUser, services } = useApp();

  if (!musicianUser) {
    return null;
  }

  const myServices = services
    .filter(s => !isServicePast(s.date) && !(s.blockedMusicianIds || []).includes(musicianUser.id) && Object.values(s.slots).some(slot => slot.musicianId === musicianUser.id))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header Banner Editorial */}
      <div className="bg-white border border-[#E5E8EA] rounded-[18px] p-5 sm:p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-[#202C37]">
            Mis Fechas Asignadas
          </h2>
          <p className="text-xs text-[#64717C] mt-0.5">
            Calendario personal de participaciones para <strong className="text-[#202C37]">{musicianUser.fullName}</strong> ({musicianUser.primaryInstrument}).
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#D9E9EB] border border-[#315F6D]/20 text-[#315F6D] text-xs font-bold self-start sm:self-auto shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-[#315F6D]" />
          <span className="tabular-nums">{myServices.length} fecha(s) confirmada(s)</span>
        </div>
      </div>

      {myServices.length === 0 ? (
        <div className="bg-white border border-[#E5E8EA] rounded-[18px] p-12 text-center shadow-card">
          <Calendar className="w-8 h-8 text-[#89939C] mx-auto mb-2" />
          <p className="text-sm font-bold text-[#202C37]">Aún no tienes fechas asignadas</p>
          <p className="text-xs text-[#64717C] mt-1 max-w-sm mx-auto">
            Dirígete a la pestaña "Fechas de Culto" para ver los cultos disponibles y poner tu check en tu instrumento.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E8EA] rounded-[18px] shadow-card overflow-hidden divide-y divide-[#EEF0F1]">
          {myServices.map((service) => {
            const [year, month, day] = service.date.split('-');
            const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
            const dateFormatted = dateObj.toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });

            const mySlot = (Object.values(service.slots) as SlotConfig[]).find(
              s => s.musicianId === musicianUser.id
            );

            if (!mySlot) return null;

            return (
              <div
                key={service.id}
                onClick={() => onSelectService(service)}
                className="p-4 sm:p-5 hover:bg-[#FAF9F6] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-13 h-14 rounded-xl bg-white border border-[#E5E8EA] flex flex-col items-center justify-center shrink-0 text-[#202C37] group-hover:border-[#315F6D]/50 shadow-2xs transition-colors overflow-hidden">
                    <span className="w-full bg-[#315F6D] text-white text-[9px] uppercase font-bold py-0.5 text-center leading-none">
                      {dateObj.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').toUpperCase()}
                    </span>
                    <span className="text-lg font-black font-display leading-tight tabular-nums text-[#202C37] py-0.5">
                      {dateObj.getDate()}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-[#202C37] capitalize truncate">
                      {dateFormatted}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-[#64717C]">
                      <span className="font-semibold text-[#202C37]">{service.title}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock className="w-3 h-3 text-[#315F6D]" />
                        Culto: {service.time}
                      </span>
                      {service.rehearsalTime && (
                        <span className="hidden sm:inline">· Ensayo: <strong className="text-[#C96B65]">{service.rehearsalTime}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {service.isSongsPublished && service.songs && service.songs.length > 0 && (
                    <a
                      href={`/#/repertorio/${service.id}`}
                      className="px-3 py-1.5 rounded-xl bg-[#315F6D] hover:bg-[#234A57] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                      title="Ver repertorio de canciones y tonos"
                    >
                      <Music className="w-3.5 h-3.5" />
                      <span>🎵 Ver Canciones ({service.songs.length})</span>
                    </a>
                  )}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#D9E9EB] border border-[#315F6D]/30 text-[#315F6D] text-xs font-bold shadow-2xs">
                    <InstrumentIcon instrument={mySlot.key} className="w-4 h-4 text-[#315F6D]" />
                    <span>{mySlot.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectService(service)}
                    className="p-1 text-[#89939C] hover:text-[#202C37] transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
