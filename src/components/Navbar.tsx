import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CalendarDays, 
  CircleCheck, 
  LogOut, 
  UsersRound, 
  Share2, 
  Camera,
  Table,
  Music2,
  Home,
  Music,
  Bell,
  Search,
  ChevronDown,
  UserRound,
  Shield
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
  children?: React.ReactNode;
}

export const Navbar: React.FC<Props> = ({
  portal,
  musicianTab,
  setMusicianTab,
  adminTab,
  setAdminTab,
  openShareModal,
  onNavigatePortal,
  children
}) => {
  const { 
    musicianUser, 
    logoutMusician, 
    isAdminAuthenticated, 
    logoutAdmin, 
    services 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const assignedCount = musicianUser
    ? services.filter(s => Object.values(s.slots).some(slot => slot.musicianId === musicianUser.id)).length
    : 0;

  const canAccessTracks = isAdminAuthenticated || (musicianUser?.primaryInstrument === 'Voz Director');

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F7F4EF] text-[#202C37]">
      {/* ========================================================================= */}
      {/* 1. DESKTOP SIDEBAR (STYLE: ATOCARYA EDITORIAL PETRÓLEO #315F6D)           */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col justify-between w-60 min-h-screen bg-[#315F6D] text-white p-5 sticky top-0 shrink-0 shadow-lg z-30 select-none">
        <div className="space-y-7">
          {/* Official Logo in White Typography */}
          <div className="pt-1">
            <Logo 
              lightText 
              size="sm" 
              showText 
              subtitle={portal === 'admin' ? 'Administración' : ''} 
            />
          </div>

          {/* Navigation Links for Musicians */}
          {portal === 'musician' && musicianUser && (
            <nav className="space-y-1.5">
              <button
                type="button"
                onClick={() => setMusicianTab('calendar')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  musicianTab === 'calendar'
                    ? 'bg-white text-[#315F6D] shadow-xs'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <CalendarDays className="w-4 h-4 shrink-0" />
                <span>Fechas de Culto</span>
              </button>

              <button
                type="button"
                onClick={() => setMusicianTab('my-services')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  musicianTab === 'my-services'
                    ? 'bg-white text-[#315F6D] shadow-xs'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CircleCheck className="w-4 h-4 shrink-0" />
                  <span>Mis Asignaciones</span>
                </div>
                {assignedCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#C96B65] text-white text-[10px] font-black flex items-center justify-center tabular-nums shadow-xs">
                    {assignedCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (canAccessTracks) {
                    setMusicianTab('tracks');
                  } else {
                    setMusicianTab('calendar');
                  }
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  musicianTab === 'tracks'
                    ? 'bg-white text-[#315F6D] shadow-xs'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Music className="w-4 h-4 shrink-0" />
                <span>Repertorio</span>
              </button>

              <button
                type="button"
                onClick={() => setMusicianTab('calendar')}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold text-white/85 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
              >
                <UsersRound className="w-4 h-4 shrink-0" />
                <span>Equipos</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigatePortal('admin')}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold text-white/85 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
              >
                <UserRound className="w-4 h-4 shrink-0" />
                <span>Mi Perfil</span>
              </button>
            </nav>
          )}

          {/* Navigation Links for Administrator */}
          {portal === 'admin' && isAdminAuthenticated && (
            <nav className="space-y-1.5">
              <button
                type="button"
                onClick={() => setAdminTab('schedule')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminTab === 'schedule'
                    ? 'bg-white text-[#315F6D] shadow-xs'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Table className="w-4 h-4 shrink-0" />
                <span>Matriz de Planes</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminTab('visual-board')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminTab === 'visual-board'
                    ? 'bg-white text-[#315F6D] shadow-xs'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Camera className="w-4 h-4 shrink-0" />
                <span>Fotos / WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminTab('musicians')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminTab === 'musicians'
                    ? 'bg-white text-[#315F6D] shadow-xs'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <UsersRound className="w-4 h-4 shrink-0" />
                <span>Equipo de Músicos</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminTab('songs-bank')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminTab === 'songs-bank'
                    ? 'bg-white text-[#315F6D] shadow-xs'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Music2 className="w-4 h-4 shrink-0" />
                <span>Banco Canciones</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigatePortal('musician')}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold text-white/85 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
              >
                <UserRound className="w-4 h-4 shrink-0" />
                <span>Vista Músicos</span>
              </button>
            </nav>
          )}
        </div>

        {/* Bottom Actions: Cerrar Sesión */}
        <div className="pt-4 border-t border-white/15">
          <button
            type="button"
            onClick={portal === 'admin' ? logoutAdmin : logoutMusician}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. ÁREA PRINCIPAL CON HEADER ESCRITORIO + CHILDREN CONTENIDO              */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex items-center justify-between h-16 px-6 sm:px-8 bg-white/95 border-b border-[#E5E8EA] sticky top-0 z-20 backdrop-blur-md">
          {/* Input Buscador General */}
          <div className="relative w-80 max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar fecha, instrumento o canción..."
              className="w-full pl-9 pr-4 py-2 bg-[#FAF9F6] border border-[#E5E8EA] rounded-full text-xs text-[#202C37] placeholder-[#89939C] focus:bg-white focus:outline-none focus:border-[#315F6D] transition-all"
            />
            <Search className="w-4 h-4 text-[#89939C] absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Lado Derecho: WhatsApp (Admin), Campana, Perfil */}
          <div className="flex items-center gap-4">
            {portal === 'admin' && isAdminAuthenticated && (
              <button
                onClick={openShareModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#315F6D] hover:bg-[#234A57] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartir WhatsApp</span>
              </button>
            )}

            {/* Notificación Campana */}
            <button 
              type="button"
              className="p-2 rounded-full text-[#64717C] hover:text-[#202C37] hover:bg-[#FAF9F6] transition-colors relative"
              title="Notificaciones"
            >
              <Bell className="w-5 h-5" />
            </button>

            {/* Chip de Perfil de Músico */}
            {portal === 'musician' && musicianUser && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-full hover:bg-[#FAF9F6] transition-colors cursor-pointer border border-transparent hover:border-[#E5E8EA]"
                >
                  <div className="w-8 h-8 rounded-full bg-[#315F6D] text-white flex items-center justify-center text-xs font-black shadow-xs">
                    {musicianUser.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-bold text-[#202C37] leading-tight">
                      {musicianUser.fullName.split(' ')[0]}
                    </p>
                    <p className="text-[10px] text-[#64717C] font-semibold leading-none mt-0.5">
                      {musicianUser.primaryInstrument}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#89939C]" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E5E8EA] rounded-2xl shadow-modal py-2 z-50">
                    <div className="px-3.5 py-2 border-b border-[#EEF0F1]">
                      <p className="text-xs font-bold text-[#202C37]">{musicianUser.fullName}</p>
                      <p className="text-[10px] text-[#64717C]">{musicianUser.primaryInstrument}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onNavigatePortal('admin');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-[#202C37] hover:bg-[#FAF9F6] font-semibold flex items-center gap-2"
                    >
                      <Shield className="w-3.5 h-3.5 text-[#315F6D]" />
                      <span>Acceso Administrador</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logoutMusician();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-[#C96B65] hover:bg-[#F7EAE5] font-semibold flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Chip Administrador */}
            {portal === 'admin' && isAdminAuthenticated && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#BD8C29] text-white flex items-center justify-center text-xs font-black shadow-xs">
                  A
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-bold text-[#202C37]">Administrador</p>
                  <p className="text-[10px] text-[#BD8C29] font-bold">Líder General</p>
                </div>
                <button
                  type="button"
                  onClick={logoutAdmin}
                  className="p-1.5 text-[#89939C] hover:text-[#C96B65] rounded-lg transition-colors ml-1"
                  title="Cerrar sesión admin"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content Rendered Inside Desktop Right Column & Mobile */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE BOTTOM NAVIGATION BAR (FIXED EN CELULAR < 768px)                */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/98 backdrop-blur-md border-t border-[#E5E8EA] py-2 px-4 flex items-center justify-around shadow-modal">
        {portal === 'musician' && (
          <>
            {/* 1. Inicio */}
            <button
              onClick={() => setMusicianTab('calendar')}
              className={`flex flex-col items-center justify-center min-w-[70px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                musicianTab === 'calendar'
                  ? 'text-[#315F6D] font-bold'
                  : 'text-[#89939C] hover:text-[#202C37] font-medium'
              }`}
            >
              <Home className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Inicio</span>
            </button>

            {/* 2. Mis Cultos */}
            <button
              onClick={() => setMusicianTab('my-services')}
              className={`relative flex flex-col items-center justify-center min-w-[70px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                musicianTab === 'my-services'
                  ? 'text-[#315F6D] font-bold'
                  : 'text-[#89939C] hover:text-[#202C37] font-medium'
              }`}
            >
              <CalendarDays className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Mis Cultos</span>
              {assignedCount > 0 && (
                <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-[#C96B65] text-white text-[9px] font-black flex items-center justify-center tabular-nums shadow-xs">
                  {assignedCount}
                </span>
              )}
            </button>

            {/* 3. Repertorio / Pistas */}
            <button
              onClick={() => {
                if (canAccessTracks) {
                  setMusicianTab('tracks');
                } else {
                  setMusicianTab('calendar');
                }
              }}
              className={`flex flex-col items-center justify-center min-w-[70px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                musicianTab === 'tracks'
                  ? 'text-[#315F6D] font-bold'
                  : 'text-[#89939C] hover:text-[#202C37] font-medium'
              }`}
            >
              <Music className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Repertorio</span>
            </button>

            {/* 4. Salir */}
            <button
              onClick={logoutMusician}
              className="flex flex-col items-center justify-center min-w-[70px] py-1 px-2 rounded-xl text-[#89939C] hover:text-[#C96B65] transition-colors cursor-pointer"
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
              className={`flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-xl transition-colors ${
                adminTab === 'schedule'
                  ? 'text-[#315F6D] font-bold'
                  : 'text-[#89939C] hover:text-[#202C37] font-medium'
              }`}
            >
              <Table className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">Matriz</span>
            </button>

            <button
              onClick={() => setAdminTab('visual-board')}
              className={`flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-xl transition-colors ${
                adminTab === 'visual-board'
                  ? 'text-[#315F6D] font-bold'
                  : 'text-[#89939C] hover:text-[#202C37] font-medium'
              }`}
            >
              <Camera className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">Fotos</span>
            </button>

            <button
              onClick={() => setAdminTab('musicians')}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-xl transition-colors ${
                adminTab === 'musicians'
                  ? 'text-[#315F6D] font-bold'
                  : 'text-[#89939C] hover:text-[#202C37] font-medium'
              }`}
            >
              <UsersRound className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Músicos</span>
            </button>

            <button
              onClick={() => setAdminTab('songs-bank')}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-xl transition-colors ${
                adminTab === 'songs-bank'
                  ? 'text-[#315F6D] font-bold'
                  : 'text-[#89939C] hover:text-[#202C37] font-medium'
              }`}
            >
              <Music2 className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Banco</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
};
