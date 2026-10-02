import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calendar, 
  CheckCircle2, 
  LogOut, 
  Users, 
  Share2, 
  Camera,
  Table,
  Sparkles,
  Shield,
  Music2,
  Headphones,
  Home,
  Plus
} from 'lucide-react';
import { Logo } from './Logo';

interface Props {
  portal: 'musician' | 'admin';
  musicianTab: 'calendar' | 'my-services' | 'tracks';
  setMusicianTab: (tab: 'calendar' | 'my-services' | 'tracks') => void;
  adminTab: 'visual-board' | 'schedule' | 'musicians' | 'songs-bank';
  setAdminTab: (tab: 'visual-board' | 'schedule' | 'musicians' | 'songs-bank') => void;
  openShareModal: () => void;
  onNavigatePortal: (portal: 'musician' | 'admin') => void;
}

export const Navbar: React.FC<Props> = ({
  portal,
  musicianTab,
  setMusicianTab,
  adminTab,
  setAdminTab,
  openShareModal,
  onNavigatePortal,
}) => {
  const { 
    musicianUser, 
    logoutMusician, 
    isAdminAuthenticated, 
    logoutAdmin, 
    services 
  } = useApp();

  const assignedCount = musicianUser
    ? services.filter(s => Object.values(s.slots).some(slot => slot.musicianId === musicianUser.id)).length
    : 0;

  // Solo Voz Director o Administrador pueden ver la pestaña de Pistas de Audio
  const canAccessTracks = isAdminAuthenticated || (musicianUser?.primaryInstrument === 'Voz Director');

  return (
    <>
      {/* Top Navbar - Planning Center Services Style */}
      <header className={`sticky top-0 z-40 w-full border-b transition-colors ${
        portal === 'musician' && musicianTab === 'calendar'
          ? 'hidden md:block bg-white border-slate-200/90 shadow-2xs'
          : 'bg-white border-slate-200/90 shadow-2xs'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            
            {/* Logo & Planning Center Tabs */}
            <div className="flex items-center gap-6 h-full">
              <Logo 
                size="sm" 
                subtitle={portal === 'admin' ? 'Administración' : 'Portal de Músicos'} 
              />

              {/* Desktop Tabs (Musicians) */}
              {portal === 'musician' && musicianUser && (
                <nav className="hidden md:flex items-center gap-1 h-full ml-4">
                  <button
                    onClick={() => setMusicianTab('calendar')}
                    className={`h-full flex items-center gap-2 px-3 text-xs font-bold transition-all border-b-2 ${
                      musicianTab === 'calendar'
                        ? 'border-emerald-600 text-emerald-800'
                        : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Fechas de Culto</span>
                  </button>

                  <button
                    onClick={() => setMusicianTab('my-services')}
                    className={`h-full flex items-center gap-2 px-3 text-xs font-bold transition-all border-b-2 ${
                      musicianTab === 'my-services'
                        ? 'border-emerald-600 text-emerald-800'
                        : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Mis Asignaciones</span>
                    {assignedCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF7E22] text-white tabular-nums shadow-xs">
                        {assignedCount}
                      </span>
                    )}
                  </button>

                  {/* Pestaña de Pistas de Audio (solo Voz Director y Administrador) */}
                  {canAccessTracks && (
                    <button
                      onClick={() => setMusicianTab('tracks')}
                      className={`h-full flex items-center gap-2 px-3 text-xs font-bold transition-all border-b-2 ${
                        musicianTab === 'tracks'
                          ? 'border-[#1E74FD] text-[#0B132B]'
                          : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <Headphones className="w-4 h-4 text-[#1E74FD]" />
                      <span>Pistas de Audio</span>
                    </button>
                  )}
                </nav>
              )}

              {/* Desktop Tabs (Admin) - Modern Style */}
              {portal === 'admin' && isAdminAuthenticated && (
                <nav className="hidden md:flex items-center gap-1 h-full ml-4">
                  <button
                    onClick={() => setAdminTab('schedule')}
                    className={`h-full flex items-center gap-2 px-3 text-xs font-bold transition-all border-b-2 ${
                      adminTab === 'schedule'
                        ? 'border-[#1E74FD] text-[#0B132B]'
                        : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <Table className={`w-4 h-4 ${adminTab === 'schedule' ? 'text-[#1E74FD]' : 'text-slate-400'}`} />
                    <span>Matriz de Planes</span>
                  </button>

                  <button
                    onClick={() => setAdminTab('visual-board')}
                    className={`h-full flex items-center gap-2 px-3 text-xs font-bold transition-all border-b-2 ${
                      adminTab === 'visual-board'
                        ? 'border-[#1E74FD] text-[#0B132B]'
                        : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <Camera className={`w-4 h-4 ${adminTab === 'visual-board' ? 'text-[#1E74FD]' : 'text-slate-400'}`} />
                    <span>Fotos / WhatsApp</span>
                  </button>

                  <button
                    onClick={() => setAdminTab('musicians')}
                    className={`h-full flex items-center gap-2 px-3 text-xs font-bold transition-all border-b-2 ${
                      adminTab === 'musicians'
                        ? 'border-[#1E74FD] text-[#0B132B]'
                        : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <Users className={`w-4 h-4 ${adminTab === 'musicians' ? 'text-[#1E74FD]' : 'text-slate-400'}`} />
                    <span>Equipo de Músicos</span>
                  </button>

                  <button
                    onClick={() => setAdminTab('songs-bank')}
                    className={`h-full flex items-center gap-2 px-3 text-xs font-bold transition-all border-b-2 ${
                      adminTab === 'songs-bank'
                        ? 'border-[#1E74FD] text-[#0B132B]'
                        : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <Music2 className={`w-4 h-4 ${adminTab === 'songs-bank' ? 'text-[#1E74FD]' : 'text-slate-400'}`} />
                    <span>Banco Canciones</span>
                  </button>
                </nav>
              )}
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3">
              
              {portal === 'admin' && isAdminAuthenticated && (
                <button
                  onClick={openShareModal}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1E74FD] hover:bg-[#155de0] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              )}

              {/* Musician Session Card (Planning Center People Style) */}
              {portal === 'musician' && musicianUser && (
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                      {musicianUser.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900 leading-tight">
                        {musicianUser.fullName.split(' ')[0]}
                      </p>
                      <p className="text-[10px] text-emerald-800 font-semibold leading-none">
                        {musicianUser.primaryInstrument}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={logoutMusician}
                    title="Cerrar Sesión"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Admin Session Card */}
              {portal === 'admin' && isAdminAuthenticated && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs font-bold text-amber-900 shadow-2xs">
                    <Shield className="w-3.5 h-3.5 text-[#FF7E22]" />
                    <span className="hidden sm:inline">Líder Administrador</span>
                  </div>

                  <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 text-[#1E74FD] flex items-center justify-center text-xs font-black shadow-2xs" title="Administrador">
                    J
                  </div>

                  <button
                    onClick={logoutAdmin}
                    title="Cerrar Sesión Admin"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>

                  <div className="border-l border-slate-200 pl-2">
                    <button
                      onClick={() => onNavigatePortal('musician')}
                      className="text-xs text-slate-500 hover:text-[#1E74FD] px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors font-bold flex items-center gap-1"
                      title="Ver Portal de Músicos"
                    >
                      <span className="hidden md:inline">Vista Músicos</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR (FIXED ON SMARTPHONES < 768px) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1.5 px-3 flex items-center justify-around shadow-lg">
        {portal === 'musician' && (
          <>
            {/* 1. Inicio */}
            <button
              onClick={() => setMusicianTab('calendar')}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
                musicianTab === 'calendar'
                  ? 'text-[#1E74FD] font-black'
                  : 'text-slate-400 hover:text-slate-700 font-medium'
              }`}
            >
              <Home className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Inicio</span>
            </button>

            {/* 2. Mis Cultos */}
            <button
              onClick={() => setMusicianTab('my-services')}
              className={`relative flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
                musicianTab === 'my-services'
                  ? 'text-[#1E74FD] font-black'
                  : 'text-slate-400 hover:text-slate-700 font-medium'
              }`}
            >
              <Calendar className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Mis Cultos</span>
              {assignedCount > 0 && (
                <span className="absolute top-0 right-1.5 w-4 h-4 rounded-full bg-[#FF7E22] text-white text-[9px] font-bold flex items-center justify-center tabular-nums shadow-xs">
                  {assignedCount}
                </span>
              )}
            </button>

            {/* 3. Botón Central Flotante '+' */}
            <button
              onClick={() => setMusicianTab('calendar')}
              className="w-11 h-11 -mt-5 rounded-full bg-[#1E74FD] hover:bg-[#155de0] text-white flex items-center justify-center shadow-lg shadow-blue-500/35 active:scale-95 transition-all cursor-pointer"
              title="Postularse a Culto / Ver Disponibles"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* 4. Pistas de Audio o Equipo */}
            {canAccessTracks ? (
              <button
                onClick={() => setMusicianTab('tracks')}
                className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
                  musicianTab === 'tracks'
                    ? 'text-[#1E74FD] font-black'
                    : 'text-slate-400 hover:text-slate-700 font-medium'
                }`}
              >
                <Headphones className="w-5 h-5 mb-0.5" />
                <span className="text-[10px]">Pistas</span>
              </button>
            ) : (
              <button
                onClick={() => setMusicianTab('my-services')}
                className="flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-xl text-slate-400 hover:text-slate-700 font-medium cursor-pointer"
              >
                <Users className="w-5 h-5 mb-0.5" />
                <span className="text-[10px]">Equipo</span>
              </button>
            )}

            {/* 5. Salir / Sesión */}
            <button
              onClick={logoutMusician}
              className="flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-xl text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Salir</span>
            </button>
          </>
        )}

        {portal === 'admin' && (
          <>
            <button
              onClick={() => setAdminTab('schedule')}
              className={`flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-xl transition-colors touch-target ${
                adminTab === 'schedule'
                  ? 'text-[#1E74FD] font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <Table className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">Matriz</span>
            </button>

            <button
              onClick={() => setAdminTab('visual-board')}
              className={`flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-xl transition-colors touch-target ${
                adminTab === 'visual-board'
                  ? 'text-[#1E74FD] font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <Camera className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">Fotos</span>
            </button>

            <button
              onClick={() => setAdminTab('musicians')}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-xl transition-colors touch-target ${
                adminTab === 'musicians'
                  ? 'text-[#1E74FD] font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <Users className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Músicos</span>
            </button>

            <button
              onClick={() => setAdminTab('songs-bank')}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-xl transition-colors touch-target ${
                adminTab === 'songs-bank'
                  ? 'text-[#1E74FD] font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <Music2 className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Banco</span>
            </button>
          </>
        )}
      </nav>
    </>
  );
};
