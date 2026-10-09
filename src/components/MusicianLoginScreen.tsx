import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { Logo } from './Logo';

interface Props {
  onGoToAdmin?: () => void;
}

export const MusicianLoginScreen: React.FC<Props> = () => {
  const { musicians, loginMusician } = useApp();
  
  const [selectedId, setSelectedId] = useState('');
  const [typedName, setTypedName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const identifier = selectedId || typedName.trim();
    if (!identifier) {
      setError('Por favor selecciona o escribe tu nombre.');
      return;
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('El PIN debe tener exactamente 4 dígitos numéricos.');
      return;
    }

    const res = loginMusician(identifier, pin);
    if (!res.success) {
      setError(res.message || 'Credenciales incorrectas.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Subtle Ambient Background */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-[0.08]"
        style={{ backgroundImage: 'url("/app-bg.jpg")' }}
        aria-hidden="true"
      />

      <div className="w-full max-w-md relative z-10">
        
        {/* Original Logo Branding */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size="lg" subtitle="Portal del Músico" />
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E5E8EA] rounded-[24px] p-6 sm:p-8 shadow-card">
          
          <div className="mb-6">
            <h2 className="text-xl font-bold font-display text-[#202C37]">
              Iniciar Sesión
            </h2>
            <p className="text-xs text-[#64717C] mt-1">
              Ingresa tu nombre y PIN de 4 números para acceder al cronograma.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-[#F7EAE5] border border-[#C96B65]/30 text-[#C96B65] text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#C96B65]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Musician Select / Name */}
            <div>
              <label className="block text-xs font-bold text-[#202C37] mb-1.5">
                Músico / Integrante
              </label>
              {musicians.length > 0 ? (
                <div className="relative">
                  <select
                    value={selectedId}
                    onChange={(e) => {
                      setSelectedId(e.target.value);
                      const m = musicians.find(item => item.id === e.target.value);
                      if (m) setTypedName(m.fullName);
                    }}
                    className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E5E8EA] rounded-xl text-sm text-[#202C37] focus:bg-white focus:outline-none focus:border-[#315F6D] transition-all font-medium"
                  >
                    <option value="">-- Elige tu nombre de la lista --</option>
                    {musicians.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.primaryInstrument})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E5E8EA] rounded-xl text-sm text-[#202C37] placeholder-[#89939C] focus:bg-white focus:outline-none focus:border-[#315F6D] transition-all"
                  />
                  <User className="w-4 h-4 text-[#89939C] absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              )}
            </div>

            {/* PIN Input */}
            <div>
              <label className="block text-xs font-bold text-[#202C37] mb-1.5">
                PIN de 4 dígitos
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="w-full px-4 py-3 text-center tracking-[0.7em] font-mono text-xl bg-[#FAF9F6] border border-[#E5E8EA] rounded-xl text-[#315F6D] placeholder-[#89939C] focus:bg-white focus:outline-none focus:border-[#315F6D] transition-all"
                />
                <Lock className="w-4 h-4 text-[#89939C] absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Submit Button in Petróleo */}
            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 bg-[#315F6D] hover:bg-[#234A57] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <span>Acceder al Calendario</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Institutional Note */}
          <div className="mt-6 pt-5 border-t border-[#EEF0F1] text-center">
            <p className="text-xs text-[#64717C] leading-relaxed">
              El registro de nuevos integrantes es realizado exclusivamente por el líder administrador. Si aún no tienes acceso, consulta con el director de alabanza.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
