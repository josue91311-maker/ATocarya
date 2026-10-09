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
  Lock,
  Music,
  Share2,
  ExternalLink,
  UserX,
  UserCheck,
  Search
} from 'lucide-react';
import { InstrumentIcon } from './InstrumentIcon';
import { ConfirmModal, ConfirmDialogOptions } from './ConfirmModal';
import { isServiceExpired } from '../utils/dateUtils';
import { getBestMatchingSlot } from '../utils/instrumentMatcher';

interface Props {
  service: ServiceDate | null;
  onClose: () => void;
  isMusicianView?: boolean;
  onOpenSetlist?: (service: ServiceDate) => void;
}

export const ServiceDetailModal: React.FC<Props> = ({ 
  service, 
  onClose, 
  isMusicianView = false,
  onOpenSetlist 
}) => {
  const { 
    musicianUser, 
    isAdminAuthenticated, 
    claimSlot, 
    releaseSlot, 
    adminAssignSlot, 
    adminClearSlot, 
    toggleBlockMusicianInService,
    musicians 
  } = useApp();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);
  const [showBlockedUsersPanel, setShowBlockedUsersPanel] = useState(false);
  const [blockedSearch, setBlockedSearch] = useState('');

  if (!service) return null;

  // Si el músico actual está bloqueado en este culto, no permitir acceso
  const isMusicianBlocked = Boolean(musicianUser && service.blockedMusicianIds?.includes(musicianUser.id));
  if (isMusicianView && isMusicianBlocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full text-center shadow-xl border border-slate-200">
          <Lock className="w-12 h-12 text-[#C96B65] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#202C37] font-display">Acceso Restringido</h3>
          <p className="text-xs text-[#64717C] mt-2">
            No tienes permiso para ver los detalles ni postularte a este culto.
          </p>
          <button
            onClick={onClose}
            className="mt-5 px-5 py-2.5 bg-[#315F6D] text-white text-xs font-bold rounded-xl"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

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

  const slotsList = (Object.values(service.slots || {}) as SlotConfig[]).filter(s => s && s.enabled !== false);
  const totalSlots = slotsList.length;
  const occupiedCount = slotsList.filter(s => Boolean(s.musicianId)).length;

  const myAssignedSlot = musicianUser
    ? slotsList.find(s => s.musicianId === musicianUser.id)
    : null;

  // Sugerencia inteligente según instrumento del músico (Voz -> Voz Coro 1, etc.)
  const recommendedSlot = musicianUser && !myAssignedSlot
    ? getBestMatchingSlot(service.slots, musicianUser.primaryInstrument)
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

        {/* Sección de Repertorio de Canciones (Setlist) */}
        {(() => {
          const isDirector = Boolean(
            musicianUser && (
              musicianUser.primaryInstrument === 'Voz Director' ||
              musicianUser.primaryInstrument?.toLowerCase().includes('director') ||
              service.slots?.voz_director?.musicianId === musicianUser.id
            )
          );
          // El Administrador SIEMPRE puede gestionar canciones, o el Director Musical
          const canManageSetlist = isAdminAuthenticated || isDirector;
          const songs = service.songs || [];
          const isPublished = Boolean(service.isSongsPublished && songs.length > 0);
          const publicUrl = `/#/repertorio/${service.id}`;

          if (canManageSetlist) {
            return (
              <div className="mx-5 sm:mx-6 mt-3 p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm shadow-emerald-600/30">
                    <Music className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        Repertorio de Canciones (Setlist)
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.2 rounded-md ${
                        service.isSongsPublished
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {service.isSongsPublished ? '✓ Publicado' : 'Borrador'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {songs.length > 0
                        ? `${songs.length} alabanza(s) configurada(s) con videos y tonos.`
                        : 'Aún no has agregado canciones a este culto.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {onOpenSetlist && (
                    <button
                      type="button"
                      onClick={() => onOpenSetlist(service)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Music className="w-3.5 h-3.5" />
                      <span>Gestionar Canciones</span>
                    </button>
                  )}
                  <a
                    href={publicUrl}
                    onClick={onClose}
                    className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-colors"
                    title="Ver link público oficial"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  </a>
                </div>
              </div>
            );
          }

          if (isPublished) {
            return (
              <div className="mx-5 sm:mx-6 mt-3 p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm shadow-emerald-600/30">
                    <Music className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <span>🎵 Repertorio Oficial Publicado</span>
                    </h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      {songs.length} alabanza(s) listas para ensayar con videos de YouTube y tonos.
                    </p>
                  </div>
                </div>

                <a
                  href={publicUrl}
                  onClick={onClose}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1.5 self-end sm:self-auto"
                >
                  <span>Ver Canciones & Tonos</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            );
          }

          return null;
        })()}

        {/* Panel de Gestión de Bloqueo de Músicos por Culto (Exclusivo Administrador) */}
        {showAdminControls && (
          <div className="mx-5 sm:mx-6 mt-3 bg-white border border-[#E5E8EA] rounded-2xl overflow-hidden shadow-xs">
            <div 
              onClick={() => setShowBlockedUsersPanel(!showBlockedUsersPanel)}
              className="p-3 sm:p-3.5 bg-[#FAF9F6] flex items-center justify-between cursor-pointer hover:bg-[#F1F5F5] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  (service.blockedMusicianIds || []).length > 0 
                    ? 'bg-[#F7E3DF] text-[#C96B65]' 
                    : 'bg-[#D9E9EB] text-[#315F6D]'
                }`}>
                  <UserX className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#202C37] flex items-center gap-2 flex-wrap">
                    <span>Bloqueo de Músicos para este Culto</span>
                    {(service.blockedMusicianIds || []).length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F7E3DF] text-[#C96B65] border border-[#C96B65]/30">
                        {(service.blockedMusicianIds || []).length} bloqueado(s)
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-[#64717C]">
                    Los músicos bloqueados no verán este culto disponible ni tendrán acceso a sus canciones publicadas.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E8EA] text-xs font-bold text-[#315F6D] hover:bg-slate-50 transition-colors shadow-2xs shrink-0"
              >
                {showBlockedUsersPanel ? 'Ocultar' : 'Gestionar'}
              </button>
            </div>

            {showBlockedUsersPanel && (
              <div className="p-3.5 sm:p-4 border-t border-[#E5E8EA] bg-white space-y-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar músico por nombre o instrumento..."
                    value={blockedSearch}
                    onChange={(e) => setBlockedSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-[#FAF9F6] border border-[#E5E8EA] rounded-xl focus:outline-none focus:border-[#315F6D] text-[#202C37]"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 custom-scrollbar pr-0.5">
                  {musicians
                    .filter(m => !blockedSearch || m.fullName.toLowerCase().includes(blockedSearch.toLowerCase()) || m.primaryInstrument.toLowerCase().includes(blockedSearch.toLowerCase()))
                    .map(m => {
                      const isBlocked = (service.blockedMusicianIds || []).includes(m.id);
                      return (
                        <div 
                          key={m.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                            isBlocked 
                              ? 'bg-[#F7E3DF]/50 border-[#C96B65]/50' 
                              : 'bg-white border-[#E5E8EA] hover:bg-[#FAF9F6]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              isBlocked ? 'bg-[#C96B65] text-white' : 'bg-[#D9E9EB] text-[#315F6D]'
                            }`}>
                              {m.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#202C37] truncate">{m.fullName}</p>
                              <p className="text-[10px] text-[#64717C] truncate">{m.primaryInstrument}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleBlockMusicianInService(service.id, m.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                              isBlocked
                                ? 'bg-[#C96B65] text-white hover:bg-[#B95752] shadow-2xs'
                                : 'bg-[#FAF9F6] text-[#64717C] hover:text-[#C96B65] hover:bg-[#F7E3DF] border border-[#E5E8EA]'
                            }`}
                          >
                            {isBlocked ? (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                <span>Bloqueado</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Permitido</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
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
                    {catSlots.filter(s => Boolean(s.musicianId)).length} de {catSlots.length} cubiertos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {catSlots.map((slot) => {
                    const isOccupied = Boolean(slot.musicianId);
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
