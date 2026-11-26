import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Lock, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { Logo } from './Logo';

interface Props {
  onGoToMusicians: () => void;
}

export const AdminLoginScreen: React.FC<Props> = ({ onGoToMusicians }) => {
  const { loginAdmin } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pin) {
      setError('Por favor ingresa el PIN de administrador.');
      return;
    }

    const res = loginAdmin(pin);
    if (!res.success) {
      setError(res.message || 'PIN inválido.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F4EA] flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden">
      <div className="fixed -top-24 -right-24 w-80 h-80 rounded-full bg-[#DCBD9E]/35 blur-3xl pointer-events-none animate-float-slow" />
      <div className="fixed bottom-0 -left-24 w-80 h-80 rounded-full bg-[#8E9B84]/25 blur-3xl pointer-events-none animate-float-slow" />

      <div className="w-full max-w-md relative z-10 animate-card-reveal">
        <div className="text-center mb-7 flex flex-col items-center">
          <Logo size="lg" />
          <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F5EBE0] border border-[#DCBD9E] text-[10px] font-display font-bold uppercase tracking-[0.2em] text-[#302C24]">
            <Shield className="w-3.5 h-3.5 text-[#2E4056]" />
            <span>Coordinación Administrativa</span>
          </div>
        </div>

        <div className="bento-card rounded-[28px] overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#2E4056] via-[#DCBD9E] to-[#8E9B84]" />

          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-display font-extrabold text-[#302C24] flex items-center gap-2">
                <span>Acceso de Administrador</span>
              </h2>
              <p className="text-xs text-[#635C51] mt-1">
                Ingresa el PIN maestro para gestionar fechas, repertorios e integrantes.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-[#F7E8E4] border border-[#A84C3A]/25 text-[#A84C3A] text-xs font-medium flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#A84C3A]" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-display font-bold uppercase tracking-wider text-[#302C24] mb-1.5">
                  PIN Maestro
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={6}
                    inputMode="numeric"
                    required
                    autoFocus
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-4 py-3.5 text-center tracking-[0.7em] font-mono text-xl bg-[#F8F4EA] border border-[#E5DEC9] rounded-2xl text-[#2E4056] placeholder-[#8D8579] focus:bg-white focus:outline-none focus:border-[#2E4056] focus:ring-4 focus:ring-[#2E4056]/10 transition-all"
                  />
                  <Lock className="w-4 h-4 text-[#8D8579] absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                className="btn-kinetic group w-full mt-2 py-3.5 px-6 bg-[#2E4056] hover:bg-[#213042] text-[#F8F4EA] text-xs font-display font-extrabold uppercase tracking-[0.16em] rounded-2xl flex items-center justify-center gap-2.5 shadow-glow cursor-pointer"
              >
                <span>Abrir Panel de Control</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onGoToMusicians}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/70 hover:bg-white border border-[#E5DEC9] text-xs text-[#302C24] hover:text-[#2E4056] transition-all font-bold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Portal de Músicos</span>
          </button>
        </div>
      </div>
    </div>
  );
};
