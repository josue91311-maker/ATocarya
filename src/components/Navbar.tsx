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
  User as UserIcon
} from 'lucide-react';
import { Logo } from './Logo';

interface Props {
  portal: 'musician' | 'admin';
  musicianTab: 'calendar' | 'my-services';
  setMusicianTab: (tab: 'calendar' | 'my-services') => void;
  adminTab: 'visual-board' | 'schedule' | 'musicians';
  setAdminTab: (tab: 'visual-board' | 'schedule' | 'musicians') => void;
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

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full bg-white/90 border-b border-slate-200/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-15">
            
            {/* Logo & Portal Workspace Indicator */}
            <div className="flex items-center gap-5">
              <Logo 
                size="sm" 
                subtitle={portal === 'admin' ? 'Administración' : 'Portal de Músicos'} 
              />

              {/* Desktop Segmented Navigation (Musicians) */}
              {portal === 'musician' && musicianUser && (
                <nav className="hidden md:flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 ml-2">
                  <button
                    onClick={() => setMusicianTab('calendar')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      musicianTab === 'calendar'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Fechas Abiertas</span>
                  </button>

                  <button
                    onClick={() => setMusicianTab('my-services')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      musicianTab === 'my-services'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mis Asignaciones</span>
                    {assignedCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 tabular-nums">
                        {assignedCount}
                      </span>
                    )}
                  </button>
                </nav>
              )}

              {/* Desktop Segmented Navigation (Admin) */}
              {portal === 'admin' && isAdminAuthenticated && (
                <nav className="hidden md:flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 ml-2">
                  <button
                    onClick={() => setAdminTab('visual-board')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      adminTab === 'visual-board'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    <span>Fotos del Mes</span>
                  </button>

                  <button
                    onClick={() => setAdminTab('schedule')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      adminTab === 'schedule'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Matriz de Cultos</span>
                  </button>

                  <button
                    onClick={() => setAdminTab('musicians')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      adminTab === 'musicians'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-slate-600" />
                    <span>Directorio Músicos</span>
                  </button>
                </nav>
              )}
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-2.5">
              
              {portal === 'admin' && isAdminAuthenticated && (
                <button
                  onClick={openShareModal}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </button>
              )}

              {/* Musician Session Card */}
              {portal === 'musician' && musicianUser && (
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200/70 rounded-xl">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">
                      {musicianUser.fullName.charAt(0)}
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-xs font-bold text-slate-900 leading-tight">
                        {musicianUser.fullName.split(' ')[0]}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium leading-none">
                        {musicianUser.primaryInstrument}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={logoutMusician}
                    title="Cerrar Sesión"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Admin Session Card */}
              {portal === 'admin' && isAdminAuthenticated && (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block text-xs font-bold text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-xl border border-slate-200/80">
                    Líder Administrador
                  </span>
                  <button
                    onClick={logoutAdmin}
                    title="Cerrar Sesión Admin"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>

                  <div className="border-l border-slate-200 pl-2">
                    <button
                      onClick={() => onNavigatePortal('musician')}
                      className="text-xs text-slate-500 hover:text-blue-600 px-2.5 py-1 rounded-xl hover:bg-slate-100 transition-colors font-semibold flex items-center gap-1"
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
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1.5 px-4 flex items-center justify-around shadow-lg">
        {portal === 'musician' && (
          <>
            <button
              onClick={() => setMusicianTab('calendar')}
              className={`flex flex-col items-center justify-center min-w-[72px] py-1 px-2 rounded-xl transition-colors touch-target ${
                musicianTab === 'calendar'
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <Calendar className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">Fechas</span>
            </button>

            <button
              onClick={() => setMusicianTab('my-services')}
              className={`relative flex flex-col items-center justify-center min-w-[72px] py-1 px-2 rounded-xl transition-colors touch-target ${
                musicianTab === 'my-services'
                  ? 'text-emerald-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">Mis Puestos</span>
              {assignedCount > 0 && (
                <span className="absolute top-0.5 right-3 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                  {assignedCount}
                </span>
              )}
            </button>
          </>
        )}

        {portal === 'admin' && (
          <>
            <button
              onClick={() => setAdminTab('visual-board')}
              className={`flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-xl transition-colors touch-target ${
                adminTab === 'visual-board'
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <Camera className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">Fotos</span>
            </button>

            <button
              onClick={() => setAdminTab('schedule')}
              className={`flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-xl transition-colors touch-target ${
                adminTab === 'schedule'
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <Table className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">Matriz</span>
            </button>

            <button
              onClick={() => setAdminTab('musicians')}
              className={`flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-xl transition-colors touch-target ${
                adminTab === 'musicians'
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <Users className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">Músicos</span>
            </button>
          </>
        )}
      </nav>
    </>
  );
};
