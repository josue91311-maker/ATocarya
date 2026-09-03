import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceDate, SlotConfig, SlotKey } from '../types';
import { toPng } from 'html-to-image';
import { 
  Camera, 
  Share2, 
  Copy, 
  Check, 
  Trash2, 
  Calendar, 
  Clock, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { InstrumentIcon } from './InstrumentIcon';
import { Logo } from './Logo';
import { ConfirmModal, ConfirmDialogOptions } from './ConfirmModal';
import { getMonthKey, getMonthLabel, isServicePast, isServiceExpired } from '../utils/dateUtils';

interface Props {
  onOpenService?: (serviceId: string) => void;
  onEditService?: (service: ServiceDate) => void;
}

export const VisualCronogramaExport: React.FC<Props> = ({ onOpenService, onEditService }) => {
  const { services, deleteService } = useApp();
  const fullBoardRef = useRef<HTMLDivElement>(null);
  
  // Ref for single date high-resolution flyer export
  const singleDateExportRef = useRef<HTMLDivElement>(null);
  const [exportingDate, setExportingDate] = useState<ServiceDate | null>(null);
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [hidePast, setHidePast] = useState<boolean>(true);

  const availableMonths = Array.from(new Set(services.map(s => getMonthKey(s.date)))).filter(Boolean).sort();
  const filteredServices = services.filter(s => {
    if (hidePast && isServicePast(s.date)) return false;
    if (selectedMonth !== 'all' && getMonthKey(s.date) !== selectedMonth) return false;
    return true;
  });

  // Slot display order
  const slotOrder: SlotKey[] = [
    'voz_director',
    'voz_coro_1',
    'voz_coro_2',
    'voz_coro_3',
    'voz_coro_4',
    'piano_1',
    'piano_2',
    'guitarra_1',
    'guitarra_2',
    'guitarra_acustica',
    'bateria',
    'bajo',
    'sonido',
  ];

  // 1. Download image for ONE SPECIFIC DATE (por fecha programada)
  const handleDownloadSingleDate = async (service: ServiceDate) => {
    setExportingDate(service);
    setDownloadingId(service.id);

    // Give React a frame to render the flyer ref
    setTimeout(async () => {
      if (!singleDateExportRef.current) {
        setDownloadingId(null);
        return;
      }

      try {
        const dataUrl = await toPng(singleDateExportRef.current, {
          quality: 0.98,
          backgroundColor: '#ffffff',
          pixelRatio: 2.5,
        });

        const link = document.createElement('a');
        link.download = `culto_alabanza_${service.date}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Error generando imagen de la fecha:', err);
        alert('Error al generar la imagen. Puedes copiar los datos a WhatsApp.');
      } finally {
        setDownloadingId(null);
      }
    }, 120);
  };

  // 2. Download full monthly board image
  const handleDownloadFullBoard = async () => {
    if (!fullBoardRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(fullBoardRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `cronograma_general_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generando tablero completo:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // 3. WhatsApp text for a single service date
  const generateSingleDateWhatsApp = (service: ServiceDate): string => {
    const [year, month, day] = service.date.split('-');
    const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
    const dateStr = dateObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const lines: string[] = [];
    lines.push(`📅 *ALABANZA: ${dateStr.toUpperCase()}*`);
    lines.push(`⏰ Culto: ${service.time}${service.rehearsalTime ? ` | Ensayo: ${service.rehearsalTime}` : ''}`);
    lines.push(`📖 *${service.title}*`);
    lines.push('──────────────────────────────');

    const slotsList = (Object.values(service.slots) as SlotConfig[]).filter(slot => slot.enabled !== false);
    slotsList.forEach(slot => {
      const status = slot.musicianId ? `✅ *${slot.musicianName}*` : '⚪ _Vacante_';
      lines.push(`• ${slot.label}: ${status}`);
    });

    if (service.notes) {
      lines.push('');
      lines.push(`📝 *Notas/Repertorio:* ${service.notes}`);
    }

    lines.push('──────────────────────────────');
    lines.push('Coordinado mediante AtocarYa 🎸');
    return lines.join('\n');
  };

  const handleCopySingleDate = async (service: ServiceDate) => {
    const text = generateSingleDateWhatsApp(service);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(service.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (e) {
      alert('Copiado al portapapeles.');
    }
  };

  const handleShareWhatsAppSingle = (service: ServiceDate) => {
    const text = generateSingleDateWhatsApp(service);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // 4. Delete service date
  const handleDeleteDate = (service: ServiceDate) => {
    const [year, month, day] = service.date.split('-');
    const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
    const formatted = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar fecha de servicio?',
      message: `¿Estás seguro de que deseas borrar la programación del ${formatted}? Esta fecha y todas sus vacantes se eliminarán del cronograma.`,
      confirmText: 'Sí, borrar fecha',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: () => {
        setConfirmDialog(null);
        deleteService(service.id);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            Cronograma Visual por Fecha (Descarga de Foto)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cada fecha programada cuenta con su botón visible para <strong>descargar su imagen individual</strong> o <strong>eliminar la fecha</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadFullBoard}
            disabled={isDownloading || services.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            <span>{isDownloading ? 'Generando imagen...' : '📸 Descargar Todo el Mes (PNG)'}</span>
          </button>
        </div>
      </div>

      {/* Month Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-700">Filtro por Mes:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="all">📅 Todos los meses ({services.length})</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {getMonthLabel(m)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hidePast}
              onChange={(e) => setHidePast(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <span>Ocultar fechas pasadas</span>
          </label>
          <span className="text-xs text-slate-300">|</span>
          <span className="text-xs font-bold text-slate-700 tabular-nums">
            {filteredServices.length} fecha(s) visible(s)
          </span>
        </div>
      </div>

      {/* Services List / Cards with Individual Date Actions */}
      {filteredServices.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-base font-bold text-slate-800">No hay fechas de servicio con los filtros aplicados</p>
          <p className="text-xs text-slate-500 mt-1">
            {hidePast ? 'Las fechas pasadas están ocultas. Desmarca la casilla si deseas ver el historial.' : 'No se encontraron cultos programados para este mes.'}
          </p>
        </div>
      ) : (
        <div ref={fullBoardRef} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredServices.map((service) => {
              const [year, month, day] = service.date.split('-');
              const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
              const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
              const monthName = dateObj.toLocaleDateString('es-ES', { month: 'long' });
              const fullDateStr = `${dayName}, ${day} de ${monthName} de ${year}`;

              const isPast = isServicePast(service.date);
              const isExpired = isServiceExpired(service);

              const slotsList = (Object.values(service.slots || {}) as SlotConfig[]).filter(s => s && s.enabled !== false);
              const occupied = slotsList.filter(s => Boolean(s.musicianId)).length;
              const total = slotsList.length;

              return (
                <div 
                  key={service.id} 
                  className={`bg-white border rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-150 ${
                    isPast ? 'border-slate-200/60 bg-slate-50/50 opacity-85' : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Header with Prominent Date Badge */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-13 h-13 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col items-center justify-center font-bold flex-shrink-0 text-slate-800">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 leading-none">
                            {monthName.slice(0, 3)}
                          </span>
                          <span className="text-xl font-bold font-display leading-tight tabular-nums">
                            {day}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                              {dayName} · {service.date}
                            </span>
                            {isPast && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-bold">
                                Pasada
                              </span>
                            )}
                            {isExpired && !isPast && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-50 text-red-700 font-bold border border-red-200">
                                Expirada
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-base text-slate-900 line-clamp-1">
                            {service.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Culto: <strong>{service.time}</strong></span>
                            {service.rehearsalTime && (
                              <span>· Ensayo: <strong>{service.rehearsalTime}</strong></span>
                            )}
                            {service.registrationDeadline && (
                              <span className="text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded text-[11px]">
                                Límite: {service.registrationDeadline}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 border border-slate-200 text-slate-700 flex-shrink-0">
                        {occupied}/{total} cupos
                      </span>
                    </div>

                    {/* Slots List for this Date */}
                    <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                      {slotOrder.map((key) => {
                        const slot = service.slots?.[key];
                        if (!slot || slot.enabled === false) return null;
                        const isOccupied = Boolean(slot.musicianId);

                        return (
                          <div
                            key={key}
                            className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 border transition-colors ${
                              isOccupied
                                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950 font-medium'
                                : 'bg-slate-50/60 border-slate-200/80 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <InstrumentIcon instrument={key} className={`w-4 h-4 flex-shrink-0 ${isOccupied ? 'text-emerald-700' : 'text-slate-400'}`} />
                              <span className="font-semibold text-slate-800 truncate">
                                {slot.label}
                              </span>
                            </div>

                            <span className={`font-bold truncate text-right max-w-[140px] ${
                              isOccupied ? 'text-emerald-800' : 'text-slate-400 font-normal italic'
                            }`}>
                              {isOccupied ? slot.musicianName : 'Vacante'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {service.notes && (
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-1.5">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2"><strong>Notas:</strong> {service.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* VISIBLE DATE ACTION BUTTONS (PHOTO EXPORT & DELETE) */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    
                    {/* Left: Export as Image for this specific date */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadSingleDate(service)}
                        disabled={downloadingId === service.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold rounded-lg text-xs transition-colors shadow-2xs disabled:opacity-50"
                        title="Descargar imagen cuadrada/vertical con la fecha destacada"
                      >
                        <Camera className="w-3.5 h-3.5 text-blue-600" />
                        <span>{downloadingId === service.id ? 'Descargando...' : 'Descargar Foto'}</span>
                      </button>

                      <button
                        onClick={() => handleCopySingleDate(service)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-lg text-xs transition-colors"
                        title="Copiar texto para WhatsApp"
                      >
                        {copiedId === service.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span>{copiedId === service.id ? 'Copiado' : 'Copiar'}</span>
                      </button>

                      <button
                        onClick={() => handleShareWhatsAppSingle(service)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold rounded-lg text-xs transition-colors"
                        title="Abrir en WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>

                    {/* Center: Edit Date & Dynamic Instruments */}
                    <div className="flex items-center gap-2">
                      {onEditService && (
                        <button
                          onClick={() => onEditService(service)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition-colors"
                          title="Configurar dinámicamente qué instrumentos participarán ese día"
                        >
                          <span>⚙️ Editar Instrumentos</span>
                        </button>
                      )}

                      {/* Right: Prominent Delete Date Button */}
                      <button
                        onClick={() => handleDeleteDate(service)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                        title="Borrar este día de la programación"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>Borrar Fecha</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HIDDEN OFF-SCREEN FLYER TEMPLATE TO RENDER HIGH-RES PNG FOR A SINGLE DATE */}
      {exportingDate && (
        <div className="overflow-hidden h-0 w-0 relative">
          <div 
            ref={singleDateExportRef} 
            className="w-[620px] bg-white p-8 border border-slate-200 font-sans"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Church Branding Header */}
            <div className="flex items-center justify-between border-b-2 border-blue-600 pb-4 mb-5">
              <Logo size="md" subtitle="Ministerio de Alabanza & Adoración" />
              <div className="text-right">
                <span className="text-xs font-extrabold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  Rol de Servicio
                </span>
              </div>
            </div>

            {/* Very Prominent Date Header Banner */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white rounded-2xl p-5 mb-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-200">
                Fecha del Culto
              </span>
              <h2 className="text-2xl font-black capitalize tracking-tight mt-0.5">
                {(() => {
                  const [year, month, day] = exportingDate.date.split('-');
                  const d = new Date(Number(year), Number(month) - 1, Number(day));
                  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                })()}
              </h2>
              <div className="flex items-center gap-4 mt-2 text-xs text-blue-100 font-medium">
                <span>⏰ Culto: <strong className="text-white">{exportingDate.time}</strong></span>
                {exportingDate.rehearsalTime && (
                  <span>· 🎼 Ensayo: <strong className="text-white">{exportingDate.rehearsalTime}</strong></span>
                )}
                <span>· 📖 {exportingDate.title}</span>
              </div>
            </div>

            {/* Instrument Roster List */}
            <div className="space-y-2 mb-5">
              {slotOrder.map((key) => {
                const slot = exportingDate.slots[key];
                if (!slot || slot.enabled === false) return null;
                const isOccupied = slot.musicianId !== null;

                return (
                  <div 
                    key={key} 
                    className={`px-3.5 py-2 rounded-xl text-xs flex items-center justify-between border ${
                      isOccupied 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-semibold' 
                        : 'bg-slate-50 border-slate-200 text-slate-400 italic'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <InstrumentIcon instrument={key} className={`w-4 h-4 ${isOccupied ? 'text-emerald-700' : 'text-slate-400'}`} />
                      <span className="font-bold text-slate-800">
                        {slot.label}
                      </span>
                    </div>

                    <span className={`font-black text-xs ${isOccupied ? 'text-emerald-800' : 'text-slate-400'}`}>
                      {isOccupied ? slot.musicianName : 'Vacante'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Notes if present */}
            {exportingDate.notes && (
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 mb-5">
                <strong>Notas / Repertorio:</strong> {exportingDate.notes}
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span>* Los integrantes deben presentarse puntuales para el ensayo previo.</span>
              <span className="font-bold text-slate-700">AtocarYa</span>
            </div>
          </div>
        </div>
      )}

      {/* Modern In-App Confirmation Dialog */}
      <ConfirmModal options={confirmDialog} />

    </div>
  );
};
