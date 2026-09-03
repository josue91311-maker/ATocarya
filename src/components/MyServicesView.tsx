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
    .filter(s => !isServicePast(s.date) && Object.values(s.slots).some(slot => slot.musicianId === musicianUser.id))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">
            Mis Fechas Asignadas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Calendario personal de participaciones para <strong className="text-slate-800">{musicianUser.fullName}</strong> ({musicianUser.primaryInstrument}).
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold self-start sm:self-auto">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="tabular-nums">{myServices.length} fecha(s) confirmada(s)</span>
        </div>
      </div>

      {myServices.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-2xs">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-900">Aún no tienes fechas asignadas</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Dirígete a la pestaña "Fechas Abiertas" para ver los cultos disponibles y poner tu check en tu instrumento.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden divide-y divide-slate-100">
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
                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col items-center justify-center flex-shrink-0 text-slate-800 group-hover:border-blue-200 transition-colors">
                    <span className="text-[10px] uppercase font-bold text-blue-600 leading-none">
                      {dateObj.toLocaleDateString('es-ES', { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold font-display leading-tight tabular-nums">
                      {dateObj.getDate()}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 capitalize truncate">
                      {dateFormatted}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{service.title}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Culto: {service.time}
                      </span>
                      {service.rehearsalTime && (
                        <span className="hidden sm:inline">· Ensayo: {service.rehearsalTime}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    <InstrumentIcon instrument={mySlot.key} className="w-4 h-4 text-emerald-600" />
                    <span>{mySlot.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
