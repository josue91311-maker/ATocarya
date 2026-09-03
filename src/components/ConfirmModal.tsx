import React from 'react';
import { AlertTriangle, Info, CheckCircle2, Trash2, X } from 'lucide-react';

export interface ConfirmDialogOptions {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

interface Props {
  options: ConfirmDialogOptions | null;
}

export const ConfirmModal: React.FC<Props> = ({ options }) => {
  if (!options || !options.isOpen) return null;

  const {
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'danger',
    onConfirm,
    onCancel,
  } = options;

  const typeStyles = {
    danger: {
      iconBg: 'bg-red-50 text-red-600 border border-red-200',
      icon: <Trash2 className="w-5 h-5 text-red-600" />,
      btnConfirm: 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20',
    },
    warning: {
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      btnConfirm: 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20',
    },
    info: {
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-200',
      icon: <Info className="w-5 h-5 text-blue-600" />,
      btnConfirm: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20',
    },
    success: {
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      btnConfirm: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20',
    },
  }[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Top Corner */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${typeStyles.iconBg}`}>
            {typeStyles.icon}
          </div>

          <div className="flex-1 pr-4">
            <h3 className="text-base font-bold text-slate-900">
              {title}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${typeStyles.btnConfirm}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
