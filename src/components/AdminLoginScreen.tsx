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
    <div className="min-h-screen bg-[#0D0D10] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Atmospheric Concert Stage Backdrop */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-25 scale-105"
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
            'radial-gradient(ellipse 75% 55% at 50% 15%, rgba(216, 178, 138, 0.16), rgba(13, 13, 16, 0.94) 70%, #09090B 100%)',
        }}
        aria-hidden="true"
      />

      <div className="w-full max-w-md relative z-10">
        {/* Branding Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size="lg" subtitle="ADMIN" />
          <p className="mt-4 text-[10px] font-display font-semibold uppercase tracking-[0.28em] text-[#94A3B8]">
            PANEL DE COORDINACIÓN GENERAL
          </p>
        </div>

        {/* Dark Glass Card */}
        <div className="bg-[#16161B]/90 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-modal">
          <div className="mb-6">
            <h2 className="text-sm font-display font-bold uppercase tracking-[0.18em] text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#E08E45]" />
              <span>Acceso de Administrador</span>
            </h2>
            <div className="w-10 h-0.5 bg-[#E08E45] mt-2 rounded-full" />
            <p className="text-xs text-[#94A3B8] mt-2.5">
              Ingresa el PIN maestro para programar fechas, músicos y cupos.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#FB7185]/12 border border-[#FB7185]/35 text-[#FDA4AF] text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#FB7185]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-display font-bold uppercase tracking-wider text-[#CBD5E1] mb-2">
                PIN Maestro de Administrador
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
                  className="w-full px-4 py-3 text-center tracking-[0.7em] font-mono text-xl bg-[#0D0D10]/80 border border-white/15 rounded-xl text-[#E08E45] placeholder-[#64748B] focus:bg-[#0D0D10] focus:outline-none focus:border-[#E08E45] focus:ring-2 focus:ring-[#E08E45]/20 transition-all"
                />
                <Lock className="w-4 h-4 text-[#64748B] absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-3 py-3.5 px-6 bg-[#E08E45] hover:bg-[#F3B36C] text-[#0D0D10] text-xs font-display font-extrabold uppercase tracking-[0.18em] rounded-full flex items-center justify-center gap-2 transition-all shadow-glow-yellow active:scale-[0.98]"
            >
              <span>Acceder al Panel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <button
            onClick={onGoToMusicians}
            className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#D8B28A] transition-colors font-semibold uppercase tracking-wider"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Portal de Músicos</span>
          </button>
        </div>
      </div>
    </div>
  );
};
