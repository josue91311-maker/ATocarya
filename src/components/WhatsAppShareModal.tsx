import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SlotConfig } from '../types';
import { X, Copy, Check, ExternalLink, MessageCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppShareModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { services } = useApp();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateWhatsAppText = (): string => {
    const lines: string[] = [];
    lines.push('📋 *CRONOGRAMA DE ALABANZA - ATOCARYA*');
    lines.push('──────────────────────────────');
    lines.push('');

    const futureSorted = [...services]
      .filter(s => s.date >= new Date().toISOString().slice(0, 10))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (futureSorted.length === 0) {
      lines.push('No hay servicios próximos programados.');
    }

    futureSorted.forEach((service) => {
      const [year, month, day] = service.date.split('-');
      const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
      const dateStr = dateObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

      lines.push(`📅 *${dateStr.toUpperCase()}*`);
      lines.push(`⏰ Culto: ${service.time}${service.rehearsalTime ? ` | Ensayo: ${service.rehearsalTime}` : ''}`);
      lines.push(`📖 *${service.title}*`);

      // 1. Director al comienzo
      const director = service.slots?.voz_director?.musicianName;
      if (director) {
        lines.push(`🎤 *Director de Alabanza:* ${director}`);
      }
      lines.push('');

      // 2. Músicos confirmados (sin vacantes)
      const confirmedSlots = (Object.values(service.slots) as SlotConfig[])
        .filter(slot => slot.enabled !== false && Boolean(slot.musicianId));

      if (confirmedSlots.length > 0) {
        lines.push('*Equipo Confirmado:*');
        confirmedSlots.forEach(slot => {
          lines.push(`  • ${slot.label}: ✅ ${slot.musicianName}`);
        });
        lines.push('');
      }

      // 3. Canciones con sus URLs
      const songs = service.songs || [];
      if (songs.length > 0) {
        lines.push('🎵 *Canciones:*');
        songs.forEach((song, idx) => {
          const keyStr = song.key ? ` [Tono: *${song.key}*]` : '';
          lines.push(`  ${idx + 1}. *${song.title}*${keyStr}`);
          if (song.youtubeUrl) {
            lines.push(`     ▶️ ${song.youtubeUrl}`);
          }
        });
        lines.push('');
        const origin = window.location.origin || 'https://atocarya.vercel.app';
        lines.push(`  👉 *Ver repertorio y acordes:* ${origin}/#/repertorio/${service.id}`);
        lines.push('');
      } else if (service.notes) {
        lines.push(`📝 *Notas:* ${service.notes}`);
        lines.push('');
      }

      lines.push('──────────────────────────────');
      lines.push('');
    });

    lines.push('Coordinado mediante AtocarYa 🎸');
    return lines.join('\n');
  };

  const text = generateWhatsAppText();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Formato para WhatsApp
              </h3>
              <p className="text-xs text-slate-500">
                Texto estructurado para compartir en el grupo de alabanza.
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

        {/* Text preview */}
        <div className="flex-1 overflow-y-auto p-6">
          <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto">
            {text}
          </pre>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Texto</span>
              </>
            )}
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir en WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
