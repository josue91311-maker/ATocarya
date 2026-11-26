import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, User, ArrowRight, AlertCircle, Music2 } from 'lucide-react';
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
    <div className="min-h-screen bg-[#F8F4EA] flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden">
      {/* Formas Orgánicas Flotantes en Arena Cálida y Salvia Apagado */}
      <div className="fixed -top-24 -left-24 w-80 h-80 rounded-full bg-[#DCBD9E]/35 blur-3xl pointer-events-none animate-float-slow" />
      <div className="fixed top-1/3 -right-24 w-96 h-96 rounded-full bg-[#8E9B84]/25 blur-3xl pointer-events-none animate-float-slow" />
      <div className="fixed -bottom-24 left-1/4 w-72 h-72 rounded-full bg-[#2E4056]/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-card-reveal">
        {/* Logo Oficial AtocarYa */}
        <div className="text-center mb-7 flex flex-col items-center">
          <Logo size="lg" />
          <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/80 border border-[#E5DEC9] shadow-2xs text-[10px] font-display font-bold uppercase tracking-[0.2em] text-[#2E4056]">
            <Music2 className="w-3.5 h-3.5 text-[#8E9B84]" />
            <span>Portal Oficial de Integrantes</span>
          </div>
        </div>

        {/* Cuadro Bento Arquitectónico con Barra Tricolor Oficial */}
        <div className="bento-card rounded-[28px] overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#2E4056] via-[#8E9B84] to-[#DCBD9E]" />

          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-display font-extrabold text-[#302C24] tracking-tight">
                Bienvenido al Ministerio
              </h2>
              <p className="text-xs text-[#635C51] mt-1 leading-relaxed">
                Selecciona tu nombre e ingresa tu PIN de 4 dígitos para ver tus cultos y canciones.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-[#F7E8E4] border border-[#A84C3A]/25 text-[#A84C3A] text-xs font-medium flex items-center gap-2.5 animate-card-reveal">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#A84C3A]" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-display font-bold uppercase tracking-wider text-[#302C24] mb-1.5">
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
                      className="w-full px-4 py-3.5 bg-[#F8F4EA] border border-[#E5DEC9] rounded-2xl text-sm text-[#302C24] focus:bg-white focus:outline-none focus:border-[#2E4056] focus:ring-4 focus:ring-[#2E4056]/10 transition-all font-semibold cursor-pointer"
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
                      className="w-full px-4 py-3.5 bg-[#F8F4EA] border border-[#E5DEC9] rounded-2xl text-sm text-[#302C24] placeholder-[#8D8579] focus:bg-white focus:outline-none focus:border-[#2E4056] focus:ring-4 focus:ring-[#2E4056]/10 transition-all"
                    />
                    <User className="w-4 h-4 text-[#8D8579] absolute right-4 top-1/2 -translate-y-1/2" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-display font-bold uppercase tracking-wider text-[#302C24] mb-1.5">
                  PIN de Acceso (4 dígitos)
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
                    className="w-full px-4 py-3.5 text-center tracking-[0.7em] font-mono text-xl bg-[#F8F4EA] border border-[#E5DEC9] rounded-2xl text-[#2E4056] placeholder-[#8D8579] focus:bg-white focus:outline-none focus:border-[#2E4056] focus:ring-4 focus:ring-[#2E4056]/10 transition-all"
                  />
                  <Lock className="w-4 h-4 text-[#8D8579] absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Botón Cinético Moderno en Azul Iglesia */}
              <button
                type="submit"
                className="btn-kinetic group w-full mt-2 py-3.5 px-6 bg-[#2E4056] hover:bg-[#213042] text-[#F8F4EA] text-xs font-display font-extrabold uppercase tracking-[0.16em] rounded-2xl flex items-center justify-center gap-2.5 shadow-glow cursor-pointer"
              >
                <span>Ingresar a Programación</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-[#ECE6D8] text-center">
              <p className="text-[11px] text-[#635C51] leading-relaxed">
                El registro de integrantes es gestionado por el líder administrador. Si necesitas tu PIN, consulta con dirección de alabanza.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
