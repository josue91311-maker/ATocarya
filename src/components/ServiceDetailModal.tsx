import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceDate, SlotKey, SlotConfig } from '../types';
import { 
  X, 
  Clock, 
  Check, 
  AlertCircle, 
  Trash2, 
  FileText,
  Info,
  Sparkles,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { InstrumentIcon } from './InstrumentIcon';
import { ConfirmModal, ConfirmDialogOptions } from './ConfirmModal';
import { isServiceExpired } from '../utils/dateUtils';

interface Props {
  service: ServiceDate | null;
  onClose: () => void;
  isMusicianView?: boolean;
}

export const ServiceDetailModal: React.FC<Props> = ({ service, onClose, isMusicianView = false }) => {
  const { 
    musicianUser, 
    isAdminAuthenticated, 
    claimSlot, 
    releaseSlot, 
    adminAssignSlot, 
    adminClearSlot, 
    musicians 
  } = useApp();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);

  if (!service) return null;

  const isExpired = isServiceExpired(service);

  // Only allow admin dropdown if NOT in musician view AND admin is authenticated
  const showAdminControls = !isMusicianView && isAdminAuthenticated;

  const [year, month, day] = service.date.split('-');
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
  const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
  const dateFormatted = dateObj.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const slotsList = (Object.values(service.slots) as SlotConfig[]).filter(s => s.enabled !== false);
  const totalSlots = slotsList.length;
  const occupiedCount = slotsList.filter(s => s.musicianId !== null).length;

  const myAssignedSlot = musicianUser
    ? slotsList.find(s => s.musicianId === musicianUser.id)
    : null;

  // Find quick recommended slot matching musician's instrument
  const recommendedSlot = musicianUser && !myAssignedSlot
    ? slotsList.find(s => 
        s.musicianId === null &&
        (s.label.toLowerCase().includes(musicianUser.primaryInstrument.toLowerCase()) ||
         musicianUser.primaryInstrument.toLowerCase().includes(s.label.toLowerCase()) ||
         musicianUser.primaryInstrument.toLowerCase().includes(s.category.toLowerCase()))
      )
    : null;

  const handleClaim = (slotKey: SlotKey) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = claimSlot(service.id, slotKey);
    if (res.success) {
      setSuccessMsg('¡Te has anotado con éxito!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(res.message || 'No se pudo seleccionar el puesto.');
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  const handleRelease = (slotKey: SlotKey) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Desmarcarte de este servicio?',
      message: `Estás a punto de liberar tu puesto en el servicio del ${dateFormatted}. Quedará vacante para otro integrante del ministerio.`,
      confirmText: 'Sí, liberar puesto',
      cancelText: 'Cancelar',
      type: 'warning',
      onConfirm: () => {
        setConfirmDialog(null);
        setErrorMsg(null);
        setSuccessMsg(null);
        const res = releaseSlot(service.id, slotKey);
        if (res.success) {
          setSuccessMsg('Puesto liberado.');
          setTimeout(() => setSuccessMsg(null), 2500);
        } else {
          setErrorMsg(res.message || 'Error al liberar puesto.');
        }
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const categories: Array<'Voces' | 'Guitarras' | 'Teclados' | 'Ritmo' | 'Técnica'> = [
    'Voces',
    'Guitarras',
    'Teclados',
    'Ritmo',
    'Técnica'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header - Planning Center Plan Sheet Style */}
        <div className="px-6 py-5 border-b border-slate-200/90 bg-slate-50/60">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {service.title}
                </span>
                {isExpired ? (
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                    <Lock className="w-3 h-3" /> Inscripciones Expiradas
                  </span>
                ) : service.isOpen ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Fechas Abiertas
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" /> Inscripciones cerradas
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-2xl font-bold font-display text-slate-900 capitalize">
                {dateFormatted}
              </h2>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Culto: <strong className="text-slate-800 tabular-nums">{service.time}</strong>
                </span>
                {service.rehearsalTime && (
                  <span>
                    · Ensayo: <strong className="text-slate-800 tabular-nums">{service.rehearsalTime}</strong>
                  </span>
                )}
                <span>
                  · Cobertura: <strong className="text-slate-800 tabular-nums">{occupiedCount} de {totalSlots}</strong> posiciones
                </span>
                {service.registrationDeadline && (
                  <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                    Fecha límite: <strong>{service.registrationDeadline}</strong>
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {service.notes && (
            <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 flex items-start gap-2 shadow-2xs">
              <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Notas / Repertorio:</strong> {service.notes}</span>
            </div>
          )}
        </div>

        {/* ACCESO RÁPIDO RECOMENDADO PARA EL USUARIO MÚSICO (Planning Center Style) */}
        {musicianUser && isMusicianView && (
          <div className="mx-6 mt-4">
            {isExpired && !myAssignedSlot ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold flex-shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-950">
                    Inscripciones expiradas para este servicio
                  </h4>
                  <p className="text-xs text-rose-800 mt-0.5">
                    El plazo de postulación para esta fecha ha finalizado{service.registrationDeadline ? ` (límite: ${service.registrationDeadline})` : ''}. Ya no se admiten registros de puestos.
                  </p>
                </div>
              </div>
            ) : myAssignedSlot ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">
                      ¡Estás confirmado en este servicio!
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Puesto asignado: <strong>{myAssignedSlot.label}</strong>
                    </p>
                  </div>
                </div>

                {!isExpired && (
                  <button
                    onClick={() => handleRelease(myAssignedSlot.key)}
                    className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                  >
                    Liberar mi puesto
                  </button>
                )}
              </div>
            ) : recommendedSlot && service.isOpen && !isExpired ? (
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm shadow-emerald-600/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-600 text-white rounded-md">
                        Acceso Rápido
                      </span>
                      <h4 className="text-xs font-bold text-emerald-950">
                        {musicianUser.fullName}, tu instrumento es {musicianUser.primaryInstrument}
                      </h4>
                    </div>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      El puesto <strong>{recommendedSlot.label}</strong> está libre para este {dayName}.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleClaim(recommendedSlot.key)}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Aceptar puesto ({recommendedSlot.label})</span>
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Slots Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {categories.map((cat) => {
            const catSlots = slotsList.filter(s => s.category === cat);
            if (catSlots.length === 0) return null;

            return (
              <div key={cat} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1 border-b border-slate-200">
                  <span>{cat}</span>
                  <span className="text-slate-500 font-normal">
                    {catSlots.filter(s => s.musicianId !== null).length} de {catSlots.length} cubiertos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {catSlots.map((slot) => {
                    const isOccupied = slot.musicianId !== null;
                    const isMe = musicianUser && slot.musicianId === musicianUser.id;

                    return (
                      <div
                        key={slot.key}
                        onClick={() => {
                          if (isMusicianView && service.isOpen && !isExpired) {
                            if (isMe) {
                              handleRelease(slot.key);
                            } else if (!isOccupied) {
                              handleClaim(slot.key);
                            }
                          } else if (isMusicianView && isMe && !isExpired) {
                            handleRelease(slot.key);
                          }
                        }}
                        className={`p-3 rounded-2xl border transition-all ${
                          isMe
                            ? 'bg-emerald-50/90 border-emerald-300 shadow-sm cursor-pointer hover:border-emerald-400'
                            : isOccupied
                            ? 'bg-slate-50 border-slate-200'
                            : isMusicianView && service.isOpen && !isExpired
                            ? 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-2xs cursor-pointer'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex-shrink-0">
                              <InstrumentIcon instrument={slot.key} className={`w-4 h-4 ${isMe ? 'text-emerald-600' : 'text-slate-500'}`} />
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {slot.label}
                              </p>
                              {isOccupied ? (
                                <p className="text-[11px] font-semibold text-emerald-700 truncate flex items-center gap-1">
                                  <span>{slot.musicianName}</span>
                                  {isMe && <span className="text-emerald-800 font-bold">(Tú)</span>}
                                </p>
                              ) : (
                                <p className="text-[11px] text-slate-400">
                                  Vacante · Disponible
                                </p>
                              )}
                            </div>
                          </div>

                          {/* ACTIONS */}
                          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            {showAdminControls ? (
                              // ADMIN MODE ONLY: select dropdown to manually assign musicians
                              <div className="flex items-center gap-1">
                                <select
                                  value={slot.musicianId || ''}
                                  onChange={(e) => {
                                    if (e.target.value === '') {
                                      adminClearSlot(service.id, slot.key);
                                    } else {
                                      adminAssignSlot(service.id, slot.key, e.target.value);
                                    }
                                  }}
                                  className="text-xs px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none max-w-[120px]"
                                >
                                  <option value="">Vacante</option>
                                  {musicians.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.fullName}
                                    </option>
                                  ))}
                                </select>
                                {isOccupied && (
                                  <button
                                    onClick={() => adminClearSlot(service.id, slot.key)}
                                    title="Quitar asignación"
                                    className="p-1 text-slate-400 hover:text-rose-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ) : isMe ? (
                              // MUSICIAN: ALREADY OCCUPIED BY USER
                              <button
                                onClick={() => !isExpired && handleRelease(slot.key)}
                                disabled={isExpired}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
                                  isExpired
                                    ? 'text-emerald-800 bg-emerald-50 border border-emerald-200 cursor-default'
                                    : 'text-emerald-800 bg-emerald-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-emerald-300 shadow-2xs'
                                }`}
                                title={isExpired ? 'Inscripción confirmada (expirada)' : 'Hacer clic para desmarcarte'}
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Confirmado</span>
                              </button>
                            ) : isOccupied ? (
                              // MUSICIAN: OCCUPIED BY SOMEONE ELSE (CANNOT SELECT OTHERS)
                              <span className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Confirmado
                              </span>
                            ) : isExpired ? (
                              <span className="px-2.5 py-1 text-[11px] font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-lg">
                                Expirado
                              </span>
                            ) : (
                              // MUSICIAN: 1-CLICK DYNAMIC CHECK TO CLAIM SLOT
                              <button
                                onClick={() => handleClaim(slot.key)}
                                disabled={!service.isOpen || isExpired}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-2xs ${
                                  service.isOpen && !isExpired
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 active:scale-95 shadow-sm shadow-emerald-600/20'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Anotarme</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Regla de Alabanza: Solo puedes poner tu check en <strong>1 puesto</strong> por fecha de servicio.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>

      {/* Modern In-App Confirmation Dialog */}
      <ConfirmModal options={confirmDialog} />
    </div>
  );
};
