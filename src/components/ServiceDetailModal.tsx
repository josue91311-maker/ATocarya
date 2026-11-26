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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#213042]/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#FCFBF8] border border-[#E5DEC9] rounded-3xl shadow-modal overflow-hidden my-auto max-h-[92vh] flex flex-col text-[#302C24]">
        
        {/* Header Superior Azul Iglesia con Alto Contraste */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-[#213042] bg-gradient-to-r from-[#2E4056] to-[#26374B] text-[#F8F4EA] shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-xs font-display font-extrabold px-2.5 py-0.5 rounded-lg bg-[#DCBD9E] text-[#302C24]">
                  {service.title}
                </span>
                {isExpired ? (
                  <span className="text-[11px] font-bold text-[#F8F4EA] bg-rose-500/30 border border-rose-300/40 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                    <Lock className="w-3 h-3" /> Inscripciones Expiradas
                  </span>
                ) : service.isOpen ? (
                  <span className="text-[11px] font-bold text-[#EBF0E7] bg-[#8E9B84]/30 border border-[#8E9B84]/50 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#DCBD9E] animate-pulse"></span> Fechas Abiertas
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-[#E7EDF3] bg-[#F8F4EA]/10 border border-[#F8F4EA]/20 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#DCBD9E]" /> Inscripciones cerradas
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-2xl font-extrabold font-display text-[#F8F4EA] capitalize">
                {dateFormatted}
              </h2>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#E7EDF3]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#DCBD9E]" />
                  Culto: <strong className="text-[#F8F4EA] tabular-nums">{service.time}</strong>
                </span>
                {service.rehearsalTime && (
                  <span>
                    · Ensayo: <strong className="text-[#F8F4EA] tabular-nums">{service.rehearsalTime}</strong>
                  </span>
                )}
                <span>
                  · Cobertura: <strong className="text-[#F8F4EA] tabular-nums">{occupiedCount} de {totalSlots}</strong> posiciones
                </span>
                {service.registrationDeadline && (
                  <span className="text-[#302C24] bg-[#DCBD9E] px-2 py-0.5 rounded-md font-bold">
                    Fecha límite: <strong>{service.registrationDeadline}</strong>
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-kinetic p-2 rounded-xl text-[#E7EDF3] hover:text-[#F8F4EA] hover:bg-[#F8F4EA]/15 shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {service.notes && (
            <div className="mt-3 p-3 rounded-xl bg-[#F8F4EA]/10 border border-[#F8F4EA]/20 text-xs text-[#F8F4EA] flex items-start gap-2">
              <FileText className="w-4 h-4 text-[#DCBD9E] flex-shrink-0 mt-0.5" />
              <span><strong className="text-[#DCBD9E]">Notas / Repertorio:</strong> {service.notes}</span>
            </div>
          )}
        </div>

        {/* Cuerpo Principal Desplazable (incluye Setlist, Bloqueo de Músicos y Puestos sin recortarse) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar bg-[#F8F4EA]/55">

          {/* ACCESO RÁPIDO RECOMENDADO PARA EL USUARIO MÚSICO */}
          {musicianUser && isMusicianView && (
            <div>
              {isExpired && !myAssignedSlot ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold flex-shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#302C24]">
                      Inscripciones expiradas para este servicio
                    </h4>
                    <p className="text-xs text-rose-700 mt-0.5">
                      El plazo de postulación para esta fecha ha finalizado{service.registrationDeadline ? ` (límite: ${service.registrationDeadline})` : ''}. Ya no se admiten registros de puestos.
                    </p>
                  </div>
                </div>
              ) : myAssignedSlot ? (
                <div className="p-4 bg-[#EBF0E7] border border-[#8E9B84]/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#637358] text-[#F8F4EA] flex items-center justify-center font-bold flex-shrink-0">
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#302C24]">
                        Estás confirmado en este servicio
                      </h4>
                      <p className="text-xs text-[#4A5940] mt-0.5">
                        Puesto asignado: <strong>{myAssignedSlot.label}</strong>
                      </p>
                    </div>
                  </div>

                  {!isExpired && (
                    <button
                      onClick={() => handleRelease(myAssignedSlot.key)}
                      className="btn-kinetic px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Liberar mi puesto
                    </button>
                  )}
                </div>
              ) : recommendedSlot && service.isOpen && !isExpired ? (
                <div className="p-4 bg-[#F5EBE0] border border-[#DCBD9E] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#2E4056] text-[#DCBD9E] flex items-center justify-center font-bold flex-shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-display uppercase font-black tracking-wider px-2 py-0.5 bg-[#2E4056] text-[#F8F4EA] rounded-md">
                          Acceso Rápido
                        </span>
                        <h4 className="text-xs font-bold text-[#302C24]">
                          {musicianUser.fullName}, tu instrumento es {musicianUser.primaryInstrument}
                        </h4>
                      </div>
                      <p className="text-xs text-[#635C51] mt-0.5">
                        El puesto <strong>{recommendedSlot.label}</strong> está libre para este {dayName}.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleClaim(recommendedSlot.key)}
                    className="btn-kinetic w-full sm:w-auto px-4 py-2 bg-[#2E4056] hover:bg-[#213042] text-[#F8F4EA] rounded-xl text-xs font-display font-extrabold flex items-center justify-center gap-2 shadow-glow cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3] text-[#DCBD9E]" />
                    <span>Aceptar puesto ({recommendedSlot.label})</span>
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-[#EBF0E7] border border-[#8E9B84]/50 rounded-xl text-[#4A5940] text-xs flex items-center gap-2 font-semibold">
              <Check className="w-4 h-4 text-[#637358] flex-shrink-0" />
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
            const canManageSetlist = isAdminAuthenticated || isDirector;
            const songs = service.songs || [];
            const isPublished = Boolean(service.isSongsPublished && songs.length > 0);
            const publicUrl = `/#/repertorio/${service.id}`;

            if (canManageSetlist) {
              return (
                <div className="bento-card p-4 bg-[#FCFBF8] border-[#DCBD9E] rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2E4056] text-[#DCBD9E] flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                      <Music className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-display font-bold text-[#302C24]">
                          Repertorio de Canciones (Setlist)
                        </span>
                        <span className={`text-[10px] font-display font-black uppercase px-2 py-0.5 rounded-md ${
                          service.isSongsPublished
                            ? 'bg-[#EBF0E7] text-[#4A5940] border border-[#8E9B84]/45'
                            : 'bg-[#F5EBE0] text-[#7D5A38] border border-[#DCBD9E]'
                        }`}>
                          {service.isSongsPublished ? '✓ Publicado' : 'Borrador'}
                        </span>
                      </div>
                      <p className="text-xs text-[#635C51] mt-0.5">
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
                        className="btn-kinetic px-4 py-2 bg-[#2E4056] hover:bg-[#213042] text-[#F8F4EA] rounded-xl text-xs font-display font-bold shadow-glow flex items-center gap-1.5 cursor-pointer"
                      >
                        <Music className="w-3.5 h-3.5 text-[#DCBD9E]" />
                        <span>Gestionar Canciones</span>
                      </button>
                    )}
                    <a
                      href={publicUrl}
                      onClick={onClose}
                      className="btn-kinetic p-2 bg-[#F5EBE0] hover:bg-[#DCBD9E]/55 text-[#2E4056] border border-[#DCBD9E] rounded-xl"
                      title="Ver link público oficial"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            }

            if (isPublished) {
              return (
                <div className="bento-card p-4 bg-[#FCFBF8] border-[#DCBD9E] rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2E4056] text-[#DCBD9E] flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                      <Music className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-display font-bold text-[#302C24] flex items-center gap-1.5">
                        <span>Repertorio Oficial Publicado</span>
                      </h4>
                      <p className="text-xs text-[#635C51] mt-0.5">
                        {songs.length} alabanza(s) listas para ensayar con videos de YouTube y tonos.
                      </p>
                    </div>
                  </div>

                  <a
                    href={publicUrl}
                    onClick={onClose}
                    className="btn-kinetic px-4 py-2 bg-[#2E4056] hover:bg-[#213042] text-[#F8F4EA] rounded-xl text-xs font-display font-bold shadow-glow flex items-center justify-center gap-1.5 self-end sm:self-auto"
                  >
                    <span>Ver Canciones & Tonos</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#DCBD9E]" />
                  </a>
                </div>
              );
            }

            return null;
          })()}

          {/* Panel de Gestión de Bloqueo de Músicos por Culto (Exclusivo Administrador - Sin Recortes y Alto Contraste) */}
          {showAdminControls && (
            <div className="bg-[#FCFBF8] border border-[#E5DEC9] rounded-2xl overflow-hidden shadow-card">
              <div 
                onClick={() => setShowBlockedUsersPanel(!showBlockedUsersPanel)}
                className="p-4 bg-[#F5EBE0]/65 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#F5EBE0] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    (service.blockedMusicianIds || []).length > 0 
                      ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                      : 'bg-[#E7EDF3] text-[#2E4056] border border-[#2E4056]/20'
                  }`}>
                    <UserX className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-display font-bold text-[#302C24] flex items-center gap-2 flex-wrap">
                      <span>Bloqueo de Músicos para este Culto</span>
                      {(service.blockedMusicianIds || []).length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          {(service.blockedMusicianIds || []).length} bloqueado(s)
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-[#635C51] mt-0.5 leading-snug">
                      Los músicos bloqueados no verán este culto disponible ni tendrán acceso a sus canciones publicadas.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-kinetic px-3.5 py-2 rounded-xl bg-[#2E4056] hover:bg-[#213042] text-[#F8F4EA] text-xs font-display font-bold shrink-0 cursor-pointer"
                >
                  {showBlockedUsersPanel ? 'Ocultar' : 'Gestionar'}
                </button>
              </div>

              {showBlockedUsersPanel && (
                <div className="p-4 border-t border-[#E5DEC9] bg-[#FCFBF8] space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#8D8579] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar músico por nombre o instrumento..."
                      value={blockedSearch}
                      onChange={(e) => setBlockedSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F8F4EA] border border-[#E5DEC9] rounded-xl focus:bg-white focus:outline-none focus:border-[#2E4056] text-[#302C24] placeholder-[#8D8579]"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                    {musicians
                      .filter(m => !blockedSearch || m.fullName.toLowerCase().includes(blockedSearch.toLowerCase()) || m.primaryInstrument.toLowerCase().includes(blockedSearch.toLowerCase()))
                      .map(m => {
                        const isBlocked = (service.blockedMusicianIds || []).includes(m.id);
                        return (
                          <div 
                            key={m.id}
                            className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                              isBlocked 
                                ? 'bg-rose-50 border-rose-200' 
                                : 'bg-[#F8F4EA] border-[#E5DEC9] hover:border-[#2E4056]/30'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-xs shrink-0 ${
                                isBlocked ? 'bg-rose-600 text-white' : 'bg-[#E7EDF3] text-[#2E4056]'
                              }`}>
                                {m.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#302C24] truncate">{m.fullName}</p>
                                <p className="text-[11px] text-[#635C51] truncate">{m.primaryInstrument}</p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleBlockMusicianInService(service.id, m.id)}
                              className={`btn-kinetic px-3 py-1.5 rounded-xl text-xs font-display font-bold flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                isBlocked
                                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                                  : 'bg-white text-[#4A5940] hover:text-rose-700 hover:border-rose-300 border border-[#8E9B84]/45'
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

          {/* Slots Categories */}
          <div className="space-y-6 pt-1">
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
                                className={`btn-kinetic inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-bold rounded-xl shadow-2xs ${
                                  service.isOpen && !isExpired
                                    ? 'bg-[#2E4056] hover:bg-[#213042] text-[#F8F4EA] shadow-sm cursor-pointer'
                                    : 'bg-[#F5EBE0] text-[#8D8579] cursor-not-allowed border border-[#E5DEC9]'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5] text-[#DCBD9E]" />
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
        </div>

        {/* Footer info */}
        <div className="p-4 bg-[#FCFBF8] border-t border-[#E5DEC9] flex items-center justify-between gap-3 text-xs text-[#635C51] shrink-0">
          <div className="flex items-center gap-1.5 text-[#635C51]">
            <Info className="w-3.5 h-3.5 text-[#2E4056] shrink-0" />
            <span>Regla de Alabanza: Solo puedes poner tu check en <strong className="text-[#302C24]">1 puesto</strong> por fecha de servicio.</span>
          </div>
          <button
            onClick={onClose}
            className="btn-kinetic px-4 py-1.5 rounded-xl bg-[#2E4056] hover:bg-[#213042] text-[#F8F4EA] text-xs font-display font-bold shrink-0 cursor-pointer"
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
