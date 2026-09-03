import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Musician } from '../types';
import { 
  Users, 
  UserPlus, 
  KeyRound, 
  Trash2, 
  Search,
  Edit3
} from 'lucide-react';
import { InstrumentIcon } from './InstrumentIcon';
import { AdminRegisterMusicianModal } from './AdminRegisterMusicianModal';
import { AdminEditMusicianModal } from './AdminEditMusicianModal';
import { ConfirmModal, ConfirmDialogOptions } from './ConfirmModal';

export const MusicianDirectory: React.FC = () => {
  const { musicians, services, deleteMusician, updateMusicianPin } = useApp();
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [editingMusician, setEditingMusician] = useState<Musician | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const getAssignmentCount = (musicianId: string): number => {
    return services.filter(s =>
      Object.values(s.slots).some(slot => slot.musicianId === musicianId)
    ).length;
  };

  const filteredMusicians = musicians.filter(m => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      m.fullName.toLowerCase().includes(term) ||
      m.primaryInstrument.toLowerCase().includes(term) ||
      (m.phone && m.phone.includes(term))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header and Add Musician Button */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold font-display text-slate-900">
              Directorio del Ministerio de Alabanza
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Solo el líder administrador puede dar de alta nuevos músicos y editar sus datos o PIN de acceso.
          </p>
        </div>

        <button
          onClick={() => setRegisterModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-2xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar Nuevo Músico</span>
        </button>
      </div>

      {/* Filter and stats */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o instrumento..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Total: <strong className="text-slate-900">{filteredMusicians.length}</strong> músicos registrados
        </span>
      </div>

      {/* Musician Table */}
      {filteredMusicians.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No se encontraron músicos</p>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Registra a los integrantes del equipo para que puedan ingresar con su PIN.
          </p>
          <button
            onClick={() => setRegisterModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm"
          >
            Registrar Músico
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold text-slate-700">
                    Nombre Completo
                  </th>
                  <th className="py-3.5 px-3 font-bold text-slate-700">
                    Instrumento Principal
                  </th>
                  <th className="py-3.5 px-3 text-center font-bold text-slate-700">
                    Edad
                  </th>
                  <th className="py-3.5 px-3 text-center font-bold text-slate-700">
                    PIN
                  </th>
                  <th className="py-3.5 px-3 font-bold text-slate-700">
                    Teléfono
                  </th>
                  <th className="py-3.5 px-3 text-center font-bold text-slate-700">
                    Asignaciones
                  </th>
                  <th className="py-3.5 px-3 text-center font-bold text-slate-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMusicians.map((m) => {
                  const assignCount = getAssignmentCount(m.id);

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Name */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {m.fullName}
                      </td>

                      {/* Instrument */}
                      <td className="py-3 px-3 text-slate-700">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-semibold text-[11px]">
                          <InstrumentIcon instrument={m.primaryInstrument} className="w-3.5 h-3.5 text-slate-500" />
                          <span>{m.primaryInstrument}</span>
                        </span>
                      </td>

                      {/* Age */}
                      <td className="py-3 px-3 text-center text-slate-600">
                        {m.age} años
                      </td>

                      {/* PIN */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {m.pin}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3 text-slate-500">
                        {m.phone || '—'}
                      </td>

                      {/* Assignments */}
                      <td className="py-3 px-3 text-center">
                        <span className={`font-bold ${assignCount > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {assignCount}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingMusician(m)}
                            title="Editar usuario por completo"
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              const newPin = prompt(`Nuevo PIN de 4 dígitos para ${m.fullName}:`, m.pin);
                              if (newPin && /^\d{4}$/.test(newPin)) {
                                updateMusicianPin(m.id, newPin);
                                alert('PIN actualizado.');
                              } else if (newPin) {
                                alert('El PIN debe tener exactamente 4 dígitos numéricos.');
                              }
                            }}
                            title="Modificar PIN rápido"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: `¿Eliminar a ${m.fullName}?`,
                                message: `Esta acción eliminará al integrante y cancelará todas sus participaciones en los cultos del ministerio.`,
                                confirmText: 'Sí, eliminar integrante',
                                cancelText: 'Cancelar',
                                type: 'danger',
                                onConfirm: () => {
                                  setConfirmDialog(null);
                                  deleteMusician(m.id);
                                },
                                onCancel: () => setConfirmDialog(null),
                              });
                            }}
                            title="Eliminar músico"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {registerModalOpen && (
        <AdminRegisterMusicianModal
          isOpen={registerModalOpen}
          onClose={() => setRegisterModalOpen(false)}
        />
      )}

      {/* Complete Edit Musician Modal */}
      {editingMusician && (
        <AdminEditMusicianModal
          musician={editingMusician}
          isOpen={Boolean(editingMusician)}
          onClose={() => setEditingMusician(null)}
        />
      )}

      {/* Modern In-App Confirmation Dialog */}
      <ConfirmModal options={confirmDialog} />

    </div>
  );
};
