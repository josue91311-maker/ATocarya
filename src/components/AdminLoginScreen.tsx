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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Subtle Ambient Background */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-[0.24]"
        style={{ backgroundImage: 'url("/app-bg.jpg")' }}
        aria-hidden="true"
      />

      <div className="w-full max-w-md relative z-10">
        
        {/* Original Logo Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size="lg" subtitle="Panel de Coordinación Administrativa" />
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="mb-6">
            <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <span>Acceso de Administrador</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Ingresa el PIN maestro para programar fechas, músicos y cupos.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                  className="w-full px-4 py-3 text-center tracking-[0.7em] font-mono text-xl bg-slate-50 border border-slate-200 rounded-xl text-indigo-900 placeholder-slate-300 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Indigo/Blue Submit button - NO BLACK */}
            <button
              type="submit"
              className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20"
            >
              <span>Acceder al Panel de Control</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <button
            onClick={onGoToMusicians}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Portal de Músicos</span>
          </button>
        </div>
      </div>
    </div>
  );
};
