import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, User, ArrowRight, AlertCircle, Radio } from 'lucide-react';
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
    <div className="min-h-screen bg-[#0D0D10] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Atmospheric Concert Stage Backdrop (inspired by live spotlight crowd) */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-30 scale-105"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1600&q=80")',
        }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse 75% 55% at 50% 15%, rgba(216, 178, 138, 0.16), rgba(13, 13, 16, 0.92) 70%, #09090B 100%)',
        }}
        aria-hidden="true"
      />

      <div className="w-full max-w-md relative z-10">
        {/* Branding & Atmospheric Hero Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size="lg" subtitle="MÚSICOS" />
          <p className="mt-5 text-[10px] font-display font-semibold uppercase tracking-[0.32em] text-[#94A3B8] flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-[#D8B28A]" />
            <span>MÚSICA PARA SENTIR Y ADORAR</span>
          </p>
          <h1 className="font-script text-4xl sm:text-5xl text-white mt-1 drop-shadow-md">
            Bienvenido al Escenario
          </h1>
        </div>

        {/* Sleek Midnight Glass Card */}
        <div className="bg-[#16161B]/90 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-modal">
          <div className="mb-6">
            <h2 className="text-sm font-display font-bold uppercase tracking-[0.2em] text-white">
              Iniciar Sesión
            </h2>
            <div className="w-10 h-0.5 bg-[#D8B28A] mt-2 rounded-full" />
            <p className="text-xs text-[#94A3B8] mt-2.5 leading-relaxed">
              Ingresa tu nombre y PIN de 4 dígitos para acceder a tus fechas y repertorio.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#FB7185]/12 border border-[#FB7185]/35 text-[#FDA4AF] text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#FB7185]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Musician Select / Name */}
            <div>
              <label className="block text-[11px] font-display font-bold uppercase tracking-wider text-[#CBD5E1] mb-2">
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
                    className="w-full px-4 py-3 bg-[#0D0D10]/80 border border-white/15 rounded-xl text-sm text-white focus:bg-[#0D0D10] focus:outline-none focus:border-[#D8B28A] focus:ring-2 focus:ring-[#D8B28A]/20 transition-all font-medium"
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
                    className="w-full px-4 py-3 bg-[#0D0D10]/80 border border-white/15 rounded-xl text-sm text-white placeholder-[#64748B] focus:bg-[#0D0D10] focus:outline-none focus:border-[#D8B28A] focus:ring-2 focus:ring-[#D8B28A]/20 transition-all"
                  />
                  <User className="w-4 h-4 text-[#64748B] absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              )}
            </div>

            {/* PIN Input */}
            <div>
              <label className="block text-[11px] font-display font-bold uppercase tracking-wider text-[#CBD5E1] mb-2">
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
                  className="w-full px-4 py-3 text-center tracking-[0.7em] font-mono text-xl bg-[#0D0D10]/80 border border-white/15 rounded-xl text-[#D8B28A] placeholder-[#64748B] focus:bg-[#0D0D10] focus:outline-none focus:border-[#D8B28A] focus:ring-2 focus:ring-[#D8B28A]/20 transition-all"
                />
                <Lock className="w-4 h-4 text-[#64748B] absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Pill CTA Button */}
            <button
              type="submit"
              className="w-full mt-3 py-3.5 px-6 bg-[#D8B28A] hover:bg-[#E5C6A4] text-[#0D0D10] text-xs font-display font-extrabold uppercase tracking-[0.18em] rounded-full flex items-center justify-center gap-2 transition-all shadow-glow active:scale-[0.98]"
            >
              <span>Acceder al Calendario</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Institutional Note */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              El registro de nuevos integrantes es realizado exclusivamente por el líder administrador. Si aún no tienes acceso, consulta con el director de alabanza.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
