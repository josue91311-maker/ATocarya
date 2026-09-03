import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Musician, PrimaryInstrument } from '../types';
import { X, Edit, AlertCircle, Check, Lock, User, Phone } from 'lucide-react';
import { InstrumentIcon } from './InstrumentIcon';

interface Props {
  musician: Musician | null;
  isOpen: boolean;
  onClose: () => void;
}

const INSTRUMENTS: PrimaryInstrument[] = [
  'Bajo',
  'Guitarra Eléctrica',
  'Guitarra Acústica',
  'Batería',
  'Voz Director',
  'Voz Coro',
  'Piano',
  'Sonido',
];

export const AdminEditMusicianModal: React.FC<Props> = ({ musician, isOpen, onClose }) => {
  const { updateMusician } = useApp();

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<number | ''>(24);
  const [pin, setPin] = useState('');
  const [primaryInstrument, setPrimaryInstrument] = useState<PrimaryInstrument>('Piano');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (musician) {
      setFullName(musician.fullName);
      setAge(musician.age);
      setPin(musician.pin);
      setPrimaryInstrument(musician.primaryInstrument);
      setPhone(musician.phone || '');
    }
  }, [musician, isOpen]);

  if (!isOpen || !musician) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('El nombre completo es obligatorio.');
      return;
    }

    if (!age || Number(age) < 5 || Number(age) > 100) {
      setError('Ingresa una edad válida (entre 5 y 100).');
      return;
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('El PIN debe tener exactamente 4 dígitos numéricos.');
      return;
    }

    const res = updateMusician(musician.id, {
      fullName: fullName.trim(),
      age: Number(age),
      pin,
      primaryInstrument,
      phone: phone.trim() || undefined,
    });

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 900);
    } else {
      setError(res.message || 'Error al actualizar el músico.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Edit className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Editar Músico / Usuario
              </h3>
              <p className="text-xs text-slate-500">
                Modifica todos los datos del integrante en el sistema.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>¡Usuario actualizado con éxito!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombres Completos *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Lucas Daniel Morales"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Edad *
              </label>
              <input
                type="number"
                min={5}
                max={99}
                required
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PIN de 4 dígitos *
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Ej. 1234"
                  className="w-full px-3 py-2 text-center tracking-widest font-mono bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-blue-600"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Instrumento / Rol Principal *
            </label>
            <div className="relative">
              <select
                value={primaryInstrument}
                onChange={(e) => setPrimaryInstrument(e.target.value as PrimaryInstrument)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
              >
                {INSTRUMENTS.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <InstrumentIcon instrument={primaryInstrument} className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Teléfono / WhatsApp (Opcional)
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+51 987 654 321"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
              />
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
