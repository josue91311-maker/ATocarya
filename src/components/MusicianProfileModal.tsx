import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InstrumentIcon } from './InstrumentIcon';
import { 
  X, 
  User, 
  Phone, 
  Calendar, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  Edit2, 
  LogOut, 
  Sparkles, 
  Clock, 
  CalendarDays,
  ShieldCheck
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MusicianProfileModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { musicianUser, updateMusician, updateMusicianPin, logoutMusician, services } = useApp();

  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(() => musicianUser?.phone || '');
  const [phoneFeedback, setPhoneFeedback] = useState<string | null>(null);

  const [showPin, setShowPin] = useState(false);
  const [changingPin, setChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinFeedback, setPinFeedback] = useState<string | null>(null);

  if (!isOpen || !musicianUser) return null;

  const isDirector = Boolean(
    musicianUser.primaryInstrument === 'Voz Director' ||
    musicianUser.primaryInstrument?.toLowerCase().includes('director')
  );

  // Servicios asignados al usuario
  const myAssignedServices = services
    .filter(s => Object.values(s.slots || {}).some(slot => slot && slot.musicianId === musicianUser.id))
    .sort((a, b) => a.date.localeCompare(b.date));

  const handleSavePhone = () => {
    const res = updateMusician(musicianUser.id, {
      fullName: musicianUser.fullName,
      age: musicianUser.age,
      pin: musicianUser.pin,
      primaryInstrument: musicianUser.primaryInstrument,
      phone: phoneNumber.trim() || undefined
    });

    if (res.success) {
      setPhoneFeedback('Teléfono guardado');
      setEditingPhone(false);
      setTimeout(() => setPhoneFeedback(null), 3000);
    } else {
      setPhoneFeedback(res.message || 'Error al guardar');
    }
  };

  const handleSavePin = () => {
    if (!/^\d{4}$/.test(newPin)) {
      setPinFeedback('El PIN debe tener exactamente 4 dígitos numéricos.');
      return;
    }

    updateMusicianPin(musicianUser.id, newPin);
    setPinFeedback('¡PIN actualizado con éxito!');
    setChangingPin(false);
    setNewPin('');
    setTimeout(() => setPinFeedback(null), 3500);
  };

  const userInitial = musicianUser.fullName.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-in fade-in select-none">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-modal border border-[#E5E8EA] overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Editorial */}
        <div className="p-5 bg-[#315F6D] text-white flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#E8B844] text-[#26313B] font-black text-xl flex items-center justify-center shadow-md border-2 border-white/20">
              {userInitial}
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                {musicianUser.fullName}
              </h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/15 text-[11px] font-bold text-white">
                  <InstrumentIcon instrument={musicianUser.primaryInstrument} className="w-3 h-3 text-[#E8B844]" />
                  <span>{musicianUser.primaryInstrument}</span>
                </span>
                {isDirector && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E8B844] text-[#26313B] text-[10px] font-black uppercase tracking-wider shadow-xs">
                    <Sparkles className="w-3 h-3" />
                    <span>Director</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="relative z-10 p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Cerrar perfil"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Información del Músico */}
          <div className="bg-[#FAF9F6] border border-[#E5E8EA] rounded-xl p-4 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64717C] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#315F6D]" />
              <span>Datos Personales</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-[#EEF0F1]">
                <p className="text-[10px] text-[#89939C] font-semibold">Instrumento</p>
                <p className="font-bold text-[#202C37] mt-0.5 flex items-center gap-1 truncate">
                  <InstrumentIcon instrument={musicianUser.primaryInstrument} className="w-3.5 h-3.5 text-[#315F6D] shrink-0" />
                  <span className="truncate">{musicianUser.primaryInstrument}</span>
                </p>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-[#EEF0F1]">
                <p className="text-[10px] text-[#89939C] font-semibold">Edad</p>
                <p className="font-bold text-[#202C37] mt-0.5">
                  {musicianUser.age} años
                </p>
              </div>
            </div>

            {/* Teléfono de Contacto */}
            <div className="p-3 bg-white rounded-lg border border-[#EEF0F1] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#64717C] font-semibold flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#315F6D]" />
                  <span>Teléfono / WhatsApp</span>
                </span>
                {!editingPhone && (
                  <button
                    type="button"
                    onClick={() => setEditingPhone(true)}
                    className="text-[11px] font-bold text-[#315F6D] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>{musicianUser.phone ? 'Editar' : 'Agregar'}</span>
                  </button>
                )}
              </div>

              {editingPhone ? (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Ej. +51 987654321"
                      className="flex-1 px-3 py-1.5 text-xs bg-[#FAF9F6] border border-[#E5E8EA] rounded-lg focus:outline-none focus:border-[#315F6D]"
                    />
                    <button
                      type="button"
                      onClick={handleSavePhone}
                      className="px-3 py-1.5 bg-[#315F6D] hover:bg-[#234A57] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneNumber(musicianUser.phone || '');
                        setEditingPhone(false);
                      }}
                      className="px-2 py-1.5 text-xs text-[#64717C] hover:text-[#202C37] cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs font-bold text-[#202C37]">
                  {musicianUser.phone || <span className="text-[#89939C] font-normal italic">No registrado</span>}
                </p>
              )}
              {phoneFeedback && (
                <p className="text-[10px] font-bold text-[#347D69]">{phoneFeedback}</p>
              )}
            </div>

            {/* Seguridad: PIN de Acceso */}
            <div className="p-3 bg-white rounded-lg border border-[#EEF0F1] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#64717C] font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#315F6D]" />
                  <span>PIN de Acceso (4 dígitos)</span>
                </span>
                {!changingPin && (
                  <button
                    type="button"
                    onClick={() => setChangingPin(true)}
                    className="text-[11px] font-bold text-[#315F6D] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Cambiar PIN</span>
                  </button>
                )}
              </div>

              {changingPin ? (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      maxLength={4}
                      pattern="[0-9]*"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Nuevo PIN 4 dígitos"
                      className="flex-1 px-3 py-1.5 text-xs bg-[#FAF9F6] border border-[#E5E8EA] rounded-lg tracking-widest text-center font-mono font-bold focus:outline-none focus:border-[#315F6D]"
                    />
                    <button
                      type="button"
                      onClick={handleSavePin}
                      className="px-3 py-1.5 bg-[#315F6D] hover:bg-[#234A57] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Actualizar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChangingPin(false);
                        setNewPin('');
                      }}
                      className="px-2 py-1.5 text-xs text-[#64717C] hover:text-[#202C37] cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#202C37] tracking-widest">
                    {showPin ? musicianUser.pin : '••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="p-1 text-[#89939C] hover:text-[#202C37] transition-colors cursor-pointer"
                    title={showPin ? "Ocultar PIN" : "Ver PIN"}
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
              {pinFeedback && (
                <p className="text-[10px] font-bold text-[#347D69]">{pinFeedback}</p>
              )}
            </div>
          </div>

          {/* Resumen de Asignaciones */}
          <div className="bg-[#FAF9F6] border border-[#E5E8EA] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64717C] flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-[#315F6D]" />
                <span>Mis Cultos ({myAssignedServices.length})</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#D9E9EB] text-[#315F6D] text-[10px] font-bold">
                Confirmados
              </span>
            </div>

            {myAssignedServices.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {myAssignedServices.map(service => {
                  const mySlot = Object.entries(service.slots || {}).find(([_, sl]) => sl && sl.musicianId === musicianUser.id);
                  return (
                    <div 
                      key={service.id}
                      className="p-2.5 rounded-lg bg-white border border-[#EEF0F1] flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#202C37]">{service.title || 'Culto de Adoración'}</p>
                        <p className="text-[10px] text-[#64717C] flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-[#315F6D]" />
                          <span>{service.date} · {service.time || '19:30'}</span>
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F7E3DF] text-[#C96B65]">
                        {mySlot ? (mySlot[1].label || mySlot[0]) : 'Asignado'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#89939C] text-center py-2 italic">
                Aún no tienes cultos asignados. ¡Postúlate en las fechas disponibles!
              </p>
            )}
          </div>
        </div>

        {/* Footer con Acciones */}
        <div className="p-4 bg-[#FAF9F6] border-t border-[#EEF0F1] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              logoutMusician();
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#C96B65] hover:bg-[#F7EAE5] rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#315F6D] hover:bg-[#234A57] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
