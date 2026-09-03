import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PrimaryInstrument } from '../types';
import { 
  X, 
  Lock, 
  User, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  AlertCircle,
  Phone,
  CalendarDays
} from 'lucide-react';
import { InstrumentIcon } from './InstrumentIcon';

interface Props {
  isOpen: boolean;
  initialMode: 'login' | 'register' | 'admin';
  onClose: () => void;
}

const INSTRUMENT_OPTIONS: PrimaryInstrument[] = [
  'Bajo',
  'Guitarra Eléctrica',
  'Guitarra Acústica',
  'Batería',
  'Voz Director',
  'Voz Coro',
  'Piano',
  'Sonido',
];

export const AuthModal: React.FC<Props> = ({ isOpen, initialMode, onClose }) => {
  const { musicians, registerMusician, loginMusician, loginAdmin } = useApp();
  
  const [mode, setMode] = useState<'login' | 'register' | 'admin'>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [selectedMusicianId, setSelectedMusicianId] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [age, setAge] = useState<string>('24');
  const [pin, setPin] = useState<string>('');
  const [primaryInstrument, setPrimaryInstrument] = useState<PrimaryInstrument>('Guitarra Eléctrica');
  const [phone, setPhone] = useState<string>('');
  const [adminPinInput, setAdminPinInput] = useState<string>('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const identifier = selectedMusicianId || fullName;
    if (!identifier) {
      setError('Por favor selecciona tu nombre o ingrésalo.');
      return;
    }
    if (pin.length !== 4) {
      setError('El PIN debe tener 4 dígitos.');
      return;
    }

    const res = loginMusician(identifier, pin);
    if (res.success) {
      onClose();
    } else {
      setError(res.message || 'Error al iniciar sesión.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Ingresa tu nombre completo.');
      return;
    }
    if (!age || Number(age) <= 0) {
      setError('Ingresa una edad válida.');
      return;
    }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('El PIN debe ser exactamente de 4 números.');
      return;
    }

    const res = registerMusician(fullName, Number(age), pin, primaryInstrument, phone);
    if (res.success) {
      setSuccessMsg('¡Registro exitoso! Bienvenido al equipo.');
      setTimeout(() => {
        onClose();
      }, 900);
    } else {
      setError(res.message || 'Error en el registro.');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (adminPinInput.length < 4) {
      setError('Ingresa el PIN de administrador.');
      return;
    }

    const res = loginAdmin(adminPinInput);
    if (res.success) {
      onClose();
    } else {
      setError(res.message || 'PIN de Administrador inválido.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header decoration */}
        <div className="relative h-24 bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 p-6 flex items-center justify-between">
          <div className="relative z-10">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <span>🎸</span> AtocarYa
            </h2>
            <p className="text-xs text-violet-100">
              {mode === 'login' && 'Ingreso de Músico con PIN'}
              {mode === 'register' && 'Nuevo Registro de Instrumentista'}
              {mode === 'admin' && 'Acceso Administrador / Líder'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ingresar
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Crear Usuario
          </button>
          <button
            onClick={() => { setMode('admin'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
              mode === 'admin'
                ? 'bg-amber-600 text-white shadow'
                : 'text-amber-400/80 hover:text-amber-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </button>
        </div>

        {/* Content area */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Selecciona o escribe tu nombre:
                </label>
                {musicians.length > 0 ? (
                  <select
                    value={selectedMusicianId}
                    onChange={(e) => {
                      setSelectedMusicianId(e.target.value);
                      const m = musicians.find(item => item.id === e.target.value);
                      if (m) setFullName(m.fullName);
                    }}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                  >
                    <option value="">-- Elige tu nombre de la lista --</option>
                    {musicians.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.primaryInstrument})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  PIN de 4 dígitos:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full text-center tracking-[1em] text-2xl font-mono py-3 bg-slate-950 border border-slate-700 rounded-xl text-violet-400 focus:outline-none focus:border-violet-500"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ingresa el código PIN con el que te registraste.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-violet-900/40 transition-all text-sm"
              >
                Entrar a Elegir Fechas
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-xs text-violet-400 hover:text-violet-300 font-semibold"
                >
                  ¿No tienes usuario? Regístrate aquí
                </button>
              </div>
            </form>
          )}

          {/* MODE: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Nombres Completos: *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Lucas Daniel Morales"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Edad: *
                  </label>
                  <input
                    type="number"
                    min={6}
                    max={99}
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Ej. 24"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    PIN 4 Números: *
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full text-center font-mono text-base tracking-widest py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-violet-400 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Instrumento / Rol Principal: *
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {INSTRUMENT_OPTIONS.map((inst) => {
                    const isSelected = primaryInstrument === inst;
                    return (
                      <button
                        key={inst}
                        type="button"
                        onClick={() => setPrimaryInstrument(inst)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                          isSelected
                            ? 'bg-violet-600/30 border-violet-500 text-white shadow-sm'
                            : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <InstrumentIcon instrument={inst} className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{inst}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Teléfono / WhatsApp (Opcional):
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+51 987 654 321"
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl shadow-lg shadow-violet-900/40 transition-all text-sm mt-2"
              >
                Crear Mi Perfil de Músico
              </button>
            </form>
          )}

          {/* MODE: ADMIN */}
          {mode === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-amber-200 text-xs">
                👑 <strong>Modo Administrador</strong>: Habilita y programa fechas de servicio dominical, asigna cupos y descarga cronogramas.
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1.5 uppercase tracking-wider">
                  PIN de Administrador:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={6}
                    inputMode="numeric"
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value)}
                    placeholder="••••"
                    className="w-full text-center tracking-[1em] text-2xl font-mono py-3 bg-slate-950 border border-amber-500/50 rounded-xl text-amber-400 focus:outline-none focus:border-amber-400"
                  />
                  <Lock className="w-4 h-4 text-amber-500 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-900/40 transition-all text-sm"
              >
                Ingresar al Panel de Control
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
