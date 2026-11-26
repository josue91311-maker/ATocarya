import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceDate } from '../types';
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
  ChevronLeft, 
  ChevronRight, 
  UserRound, 
  Shield, 
  X, 
  Clock, 
  Calendar, 
  AlertCircle, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Logo } from './Logo';
import { MusicianProfileModal } from './MusicianProfileModal';

interface Props {
  portal: 'musician' | 'admin';
  musicianTab: 'calendar' | 'my-services' | 'tracks';
  setMusicianTab: (tab: 'calendar' | 'my-services' | 'tracks') => void;
  adminTab: 'visual-board' | 'schedule' | 'musicians' | 'songs-bank';
  setAdminTab: (tab: 'visual-board' | 'schedule' | 'musicians' | 'songs-bank') => void;
  openShareModal: () => void;
  onNavigatePortal: (portal: 'musician' | 'admin') => void;
  onOpenService?: (service: ServiceDate) => void;
  onOpenSetlist?: (service: ServiceDate) => void;
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
  onOpenService,
  onOpenSetlist,
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
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Fecha de hoy en Perú (America/Lima UTC-5)
  const getPeruDateStr = (): string => {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());
    } catch {
      const d = new Date();
      const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
      const peruDate = new Date(utc - (5 * 3600000));
      return peruDate.toISOString().split('T')[0];
    }
  };

  const peruToday = getPeruDateStr();
  const servicesToday = services.filter(s => s.date === peruToday && !(s.blockedMusicianIds || []).includes(musicianUser?.id || ''));

  // Mis servicios de hoy (músico)
  const myAssignedToday = musicianUser
    ? servicesToday.filter(s => Object.values(s.slots || {}).some(sl => sl && sl.musicianId === musicianUser.id))
    : [];

  const assignedCount = musicianUser
    ? services.filter(s => !(s.blockedMusicianIds || []).includes(musicianUser.id) && Object.values(s.slots).some(slot => slot.musicianId === musicianUser.id)).length
    : 0;

  // Contador de notificaciones
  const hasNotificationsToday = portal === 'musician'
    ? myAssignedToday.length > 0 || servicesToday.length > 0
    : servicesToday.length > 0;

  const notificationCount = portal === 'musician'
    ? (myAssignedToday.length > 0 ? myAssignedToday.length : (servicesToday.length > 0 ? 1 : 0))
    : servicesToday.length;

  // Validación de rol de dirección musical
  const isDirector = Boolean(
    musicianUser && (
      musicianUser.primaryInstrument === 'Voz Director' ||
      musicianUser.primaryInstrument?.toLowerCase().includes('director')
    )
  );

  const canAccessTracks = isAdminAuthenticated || isDirector;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8F4EA] text-[#302C24]">
      {/* ========================================================================= */}
      {/* 1. DESKTOP SIDEBAR (AZUL IGLESIA #2E4056 CON PÍLDORAS CINÉTICAS)          */}
      {/* ========================================================================= */}
      <aside 
        className={`hidden md:flex flex-col justify-between min-h-screen bg-gradient-to-b from-[#2E4056] to-[#223143] text-[#F8F4EA] sticky top-0 shrink-0 shadow-modal z-30 select-none transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-20 p-3' : 'w-64 p-5'
        }`}
      >
        <div className="space-y-6">
          {/* Header del Sidebar */}
          <div className="pt-1 flex flex-col gap-2.5">
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} w-full`}>
              <div className="flex items-center overflow-hidden">
                <Logo 
                  lightText 
                  size="sm" 
                  showText={!isSidebarCollapsed}
                />
              </div>

              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1.5 rounded-xl text-[#DCBD9E] hover:text-white hover:bg-white/10 transition-all cursor-pointer shrink-0"
                title={isSidebarCollapsed ? "Desplegar barra de módulos" : "Plegar barra de módulos"}
              >
                {isSidebarCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </button>
            </div>

            {!isSidebarCollapsed && portal === 'admin' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#DCBD9E]/18 border border-[#DCBD9E]/35 text-[10px] font-display font-bold uppercase tracking-widest text-[#F5EBE0]">
                <span className="w-2 h-2 rounded-full bg-[#8E9B84] animate-pulse shrink-0" />
                <span>Panel Administrador</span>
              </div>
            )}
            {isSidebarCollapsed && portal === 'admin' && (
              <div className="flex justify-center mt-1" title="Panel Administrador">
                <span className="w-2 h-2 rounded-full bg-[#DCBD9E] animate-pulse" />
              </div>
            )}
          </div>

          {/* Navigation Links for Musicians */}
          {portal === 'musician' && musicianUser && (
            <nav className="space-y-2">
              <button
                type="button"
                onClick={() => setMusicianTab('calendar')}
                title="Fechas de Culto"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-2xl text-[11px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  musicianTab === 'calendar'
                    ? 'bg-[#F8F4EA] text-[#2E4056] shadow-md translate-x-1'
                    : 'text-[#F8F4EA]/80 hover:bg-white/10 hover:text-white hover:translate-x-0.5'
                }`}
              >
                <CalendarDays className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Fechas de Culto</span>}
              </button>

              <button
                type="button"
                onClick={() => setMusicianTab('my-services')}
                title="Mis Asignaciones"
                className={`relative w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'} py-3 rounded-2xl text-[11px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  musicianTab === 'my-services'
                    ? 'bg-[#F8F4EA] text-[#2E4056] shadow-md translate-x-1'
                    : 'text-[#F8F4EA]/80 hover:bg-white/10 hover:text-white hover:translate-x-0.5'
                }`}
              >
                <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <CircleCheck className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span>Mis Asignaciones</span>}
                </div>
                {assignedCount > 0 && (
                  <span className={`${isSidebarCollapsed ? 'absolute -top-1 -right-1 w-4 h-4 text-[9px]' : 'w-5 h-5 text-[10px]'} rounded-full bg-[#DCBD9E] text-[#302C24] font-black flex items-center justify-center tabular-nums shadow-xs`}>
                    {assignedCount}
                  </span>
                )}
              </button>

              {isDirector && (
                <button
                  type="button"
                  onClick={() => setMusicianTab('tracks')}
                  title="Repertorio Musical"
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-2xl text-[11px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    musicianTab === 'tracks'
                      ? 'bg-[#F8F4EA] text-[#2E4056] shadow-md translate-x-1'
                      : 'text-[#F8F4EA]/80 hover:bg-white/10 hover:text-white hover:translate-x-0.5'
                  }`}
                >
                  <Music className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span>Repertorio</span>}
                </button>
              )}

              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                title="Mi Perfil"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-2xl text-[11px] font-display font-bold uppercase tracking-wider text-[#F8F4EA]/80 hover:bg-white/10 hover:text-white hover:translate-x-0.5 transition-all cursor-pointer`}
              >
                <UserRound className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Mi Perfil</span>}
              </button>
            </nav>
          )}

          {/* Navigation Links for Administrator */}
          {portal === 'admin' && isAdminAuthenticated && (
            <nav className="space-y-2">
              <button
                type="button"
                onClick={() => setAdminTab('schedule')}
                title="Matriz de Planes"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-2xl text-[11px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  adminTab === 'schedule'
                    ? 'bg-[#F8F4EA] text-[#2E4056] shadow-md translate-x-1'
                    : 'text-[#F8F4EA]/80 hover:bg-white/10 hover:text-white hover:translate-x-0.5'
                }`}
              >
                <Table className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Matriz de Planes</span>}
              </button>

              <button
                type="button"
                onClick={() => setAdminTab('visual-board')}
                title="Fotos / WhatsApp"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-2xl text-[11px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  adminTab === 'visual-board'
                    ? 'bg-[#F8F4EA] text-[#2E4056] shadow-md translate-x-1'
                    : 'text-[#F8F4EA]/80 hover:bg-white/10 hover:text-white hover:translate-x-0.5'
                }`}
              >
                <Camera className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Fotos / WhatsApp</span>}
              </button>

              <button
                type="button"
                onClick={() => setAdminTab('musicians')}
                title="Equipo de Músicos"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-2xl text-[11px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  adminTab === 'musicians'
                    ? 'bg-[#F8F4EA] text-[#2E4056] shadow-md translate-x-1'
                    : 'text-[#F8F4EA]/80 hover:bg-white/10 hover:text-white hover:translate-x-0.5'
                }`}
              >
                <UsersRound className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Equipo de Músicos</span>}
              </button>

              <button
                type="button"
                onClick={() => setAdminTab('songs-bank')}
                title="Banco Canciones"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-2xl text-[11px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  adminTab === 'songs-bank'
                    ? 'bg-[#F8F4EA] text-[#2E4056] shadow-md translate-x-1'
                    : 'text-[#F8F4EA]/80 hover:bg-white/10 hover:text-white hover:translate-x-0.5'
                }`}
              >
                <Music2 className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Banco Canciones</span>}
              </button>

              <button
                type="button"
                onClick={() => onNavigatePortal('musician')}
                title="Vista Músicos"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-2xl text-[11px] font-display font-bold uppercase tracking-wider text-[#F8F4EA]/80 hover:bg-white/10 hover:text-white hover:translate-x-0.5 transition-all cursor-pointer`}
              >
                <UserRound className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Vista Músicos</span>}
              </button>
            </nav>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-white/15 space-y-2">
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2 rounded-xl text-xs font-semibold text-[#F8F4EA]/75 hover:text-white hover:bg-white/10 transition-colors cursor-pointer`}
            title={isSidebarCollapsed ? "Desplegar barra de módulos" : "Plegar barra de módulos"}
          >
            <div className="flex items-center gap-2">
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {!isSidebarCollapsed && <span>Plegar menú</span>}
            </div>
            {!isSidebarCollapsed && (
              <span className="text-[10px] text-[#F8F4EA]/60 bg-white/10 px-1.5 py-0.5 rounded">Ctrl+B</span>
            )}
          </button>

          <button
            type="button"
            onClick={portal === 'admin' ? logoutAdmin : logoutMusician}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3'} py-2.5 rounded-xl text-xs font-bold text-[#F8F4EA]/85 hover:text-white hover:bg-[#A84C3A] transition-colors cursor-pointer`}
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. ÁREA PRINCIPAL CON HEADER ESCRITORIO + CHILDREN CONTENIDO              */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex items-center justify-between h-16 px-6 sm:px-8 bg-[#FCFBF8]/88 border-b border-[#E5DEC9] sticky top-0 z-20 backdrop-blur-xl">
          {/* Input Buscador General */}
          <div className="relative w-80 max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar fecha, instrumento o canción..."
              className="w-full pl-9 pr-4 py-2 bg-[#F8F4EA] border border-[#E5DEC9] rounded-full text-xs text-[#302C24] placeholder-[#8D8579] focus:bg-white focus:outline-none focus:border-[#2E4056] transition-all font-medium"
            />
            <Search className="w-4 h-4 text-[#8D8579] absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Lado Derecho */}
          <div className="flex items-center gap-4">
            {portal === 'admin' && isAdminAuthenticated && (
              <button
                onClick={openShareModal}
                className="btn-kinetic flex items-center gap-1.5 px-4 py-2 bg-[#2E4056] hover:bg-[#213042] text-[#F8F4EA] rounded-full text-[11px] font-display font-extrabold uppercase tracking-wider shadow-glow cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-[#DCBD9E]" />
                <span>Compartir WhatsApp</span>
              </button>
            )}

            {/* Notificación Campana Interactiva */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`p-2 rounded-full transition-all relative cursor-pointer ${
                  hasNotificationsToday 
                    ? 'text-[#2E4056] bg-[#F5EBE0] hover:bg-[#DCBD9E]/50 border border-[#DCBD9E]' 
                    : 'text-[#635C51] hover:text-[#302C24] hover:bg-[#EFECE4]'
                }`}
                title="Notificaciones de Culto (Hora Perú)"
              >
                <Bell className={`w-5 h-5 ${hasNotificationsToday ? 'animate-pulse' : ''}`} />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#A84C3A] text-white text-[10px] font-black flex items-center justify-center tabular-nums shadow-xs">
                    {notificationCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setNotificationsOpen(false)} 
                  />

                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#FCFBF8] rounded-3xl shadow-modal border border-[#E5DEC9] z-50 overflow-hidden animate-card-reveal">
                    <div className="p-4 bg-[#2E4056] text-[#F8F4EA] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#DCBD9E]" />
                        <h3 className="text-xs font-display font-bold uppercase tracking-wider">Notificaciones de Culto</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-[#F8F4EA]/75 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                        title="Cerrar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="px-4 py-2 bg-[#F8F4EA] border-b border-[#E5DEC9] flex items-center justify-between text-[11px] text-[#635C51]">
                      <span className="font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#2E4056]" />
                        Hora Oficial Perú (UTC-5)
                      </span>
                      <span className="font-bold text-[#2E4056] tabular-nums">{peruToday}</span>
                    </div>

                    <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                      <div>
                        <p className="text-[10px] font-display font-bold uppercase tracking-widest text-[#635C51] mb-2 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#8E9B84]" />
                          <span>Cultos Programados Hoy</span>
                        </p>

                        {servicesToday.length > 0 ? (
                          <div className="space-y-2">
                            {servicesToday.map(service => {
                              const mySlot = musicianUser
                                ? Object.entries(service.slots || {}).find(([_, sl]) => sl && sl.musicianId === musicianUser.id)
                                : null;

                              return (
                                <div 
                                  key={service.id}
                                  className="p-3 rounded-2xl bg-[#F8F4EA] border border-[#E5DEC9] hover:border-[#2E4056]/35 transition-colors space-y-2"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="text-xs font-bold text-[#302C24]">
                                        {service.title || 'Culto de Adoración'}
                                      </p>
                                      <p className="text-[11px] text-[#635C51] flex items-center gap-1 mt-0.5">
                                        <Clock className="w-3 h-3 text-[#8E9B84]" />
                                        <span>Hora: {service.time || '19:30'}</span>
                                      </p>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF0E7] text-[#2E4056] border border-[#8E9B84]/40">
                                      Hoy
                                    </span>
                                  </div>

                                  {mySlot && (
                                    <div className="p-2 rounded-xl bg-[#F5EBE0] border border-[#DCBD9E] flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-[#302C24]">
                                        Asignado: {mySlot[1].label || mySlot[0]}
                                      </span>
                                      {service.isSongsPublished && service.songs && service.songs.length > 0 && onOpenSetlist && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setNotificationsOpen(false);
                                            onOpenSetlist(service);
                                          }}
                                          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#F8F4EA] bg-[#2E4056] hover:bg-[#213042] px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                                        >
                                          <Music className="w-3 h-3" />
                                          <span>Canciones</span>
                                        </button>
                                      )}
                                    </div>
                                  )}

                                  {portal === 'admin' && onOpenService && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNotificationsOpen(false);
                                        onOpenService(service);
                                      }}
                                      className="w-full text-center text-[11px] font-bold text-[#2E4056] hover:underline pt-1 cursor-pointer"
                                    >
                                      Ver detalles del equipo →
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-2xl bg-[#F8F4EA] border border-dashed border-[#E5DEC9] text-center">
                            <p className="text-xs text-[#302C24] font-semibold">
                              No hay cultos programados para hoy (Hora Perú).
                            </p>
                            <p className="text-[10px] text-[#8D8579] mt-0.5">
                              Revisa las próximas fechas de servicio en tu agenda.
                            </p>
                          </div>
                        )}
                      </div>

                      {portal === 'musician' && musicianUser && assignedCount > 0 && (
                        <div className="pt-2 border-t border-[#ECE6D8]">
                          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-[#635C51] mb-1">
                            Tus Asignaciones Confirmadas
                          </p>
                          <p className="text-xs text-[#302C24]">
                            Tienes <span className="font-bold text-[#2E4056]">{assignedCount}</span> culto(s) programado(s) en tu agenda.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-[#F8F4EA] border-t border-[#E5DEC9] flex items-center justify-between">
                      <span className="text-[10px] text-[#8D8579]">
                        AtocarYa · Notificaciones activas
                      </span>
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-xs font-bold text-[#2E4056] hover:underline cursor-pointer"
                      >
                        Entendido
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Chip de Perfil de Músico */}
            {portal === 'musician' && musicianUser && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-3 pl-1 pr-2.5 py-1 rounded-full bg-[#F8F4EA] hover:bg-[#EFECE4] transition-all cursor-pointer border border-[#E5DEC9]"
                >
                  <div className="w-8 h-8 rounded-full bg-[#2E4056] text-[#F8F4EA] flex items-center justify-center text-xs font-black shadow-xs">
                    {musicianUser.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-bold text-[#302C24] leading-tight">
                      {musicianUser.fullName.split(' ')[0]}
                    </p>
                    <p className="text-[10px] text-[#637358] font-bold leading-none mt-0.5">
                      {musicianUser.primaryInstrument}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#635C51]" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-[#FCFBF8] border border-[#E5DEC9] rounded-2xl shadow-modal py-2 z-50 animate-card-reveal">
                    <div className="px-3.5 py-2 border-b border-[#ECE6D8]">
                      <p className="text-xs font-bold text-[#302C24]">{musicianUser.fullName}</p>
                      <p className="text-[10px] text-[#637358] font-semibold">{musicianUser.primaryInstrument}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setProfileModalOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-[#302C24] hover:bg-[#F8F4EA] font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <UserRound className="w-3.5 h-3.5 text-[#2E4056]" />
                      <span>Ver Mi Perfil</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onNavigatePortal('admin');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-[#635C51] hover:bg-[#F8F4EA] font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-[#8E9B84]" />
                      <span>Acceso Administrador</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logoutMusician();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-[#A84C3A] hover:bg-[#F7E8E4] font-semibold flex items-center gap-2"
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
                <div className="w-8 h-8 rounded-full bg-[#DCBD9E] text-[#302C24] flex items-center justify-center text-xs font-black shadow-xs">
                  A
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-bold text-[#302C24]">Administrador</p>
                  <p className="text-[10px] text-[#637358] font-bold uppercase tracking-wider">Líder General</p>
                </div>
                <button
                  type="button"
                  onClick={logoutAdmin}
                  className="p-1.5 text-[#635C51] hover:text-[#A84C3A] rounded-lg transition-colors ml-1"
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
      {/* 3. MOBILE FLOATING DOCK BAR (MODERNO, ERGONÓMICO Y PRÁCTICO EN CELULAR)    */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-2.5 inset-x-3 z-40 bg-[#2E4056]/95 backdrop-blur-xl border border-white/15 rounded-2xl py-2 px-2 flex items-center justify-around shadow-modal">
        {portal === 'musician' && (
          <>
            <button
              onClick={() => setMusicianTab('calendar')}
              className={`relative flex flex-col items-center justify-center min-w-[62px] py-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
                musicianTab === 'calendar'
                  ? 'bg-[#DCBD9E] text-[#302C24] font-extrabold shadow-xs -translate-y-0.5'
                  : 'text-[#F8F4EA]/75 hover:text-white font-medium'
              }`}
            >
              <Home className="w-4 h-4 mb-0.5" />
              <span className="text-[9px] font-display uppercase tracking-wider">Inicio</span>
            </button>

            <button
              onClick={() => setMusicianTab('my-services')}
              className={`relative flex flex-col items-center justify-center min-w-[62px] py-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
                musicianTab === 'my-services'
                  ? 'bg-[#DCBD9E] text-[#302C24] font-extrabold shadow-xs -translate-y-0.5'
                  : 'text-[#F8F4EA]/75 hover:text-white font-medium'
              }`}
            >
              <CalendarDays className="w-4 h-4 mb-0.5" />
              <span className="text-[9px] font-display uppercase tracking-wider">Cultos</span>
              {assignedCount > 0 && (
                <span className="absolute -top-1 right-0.5 w-4 h-4 rounded-full bg-[#8E9B84] text-white text-[9px] font-black flex items-center justify-center tabular-nums border border-[#2E4056]">
                  {assignedCount}
                </span>
              )}
            </button>

            {isDirector && (
              <button
                onClick={() => setMusicianTab('tracks')}
                className={`relative flex flex-col items-center justify-center min-w-[60px] py-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
                  musicianTab === 'tracks'
                    ? 'bg-[#DCBD9E] text-[#302C24] font-extrabold shadow-xs -translate-y-0.5'
                    : 'text-[#F8F4EA]/75 hover:text-white font-medium'
                }`}
              >
                <Music className="w-4 h-4 mb-0.5" />
                <span className="text-[9px] font-display uppercase tracking-wider">Pistas</span>
              </button>
            )}

            <button
              onClick={() => setProfileModalOpen(true)}
              className="flex flex-col items-center justify-center min-w-[58px] py-1.5 px-2 rounded-xl text-[#F8F4EA]/75 hover:text-[#DCBD9E] font-medium transition-all cursor-pointer"
            >
              <UserRound className="w-4 h-4 mb-0.5" />
              <span className="text-[9px] font-display uppercase tracking-wider">Perfil</span>
            </button>

            <button
              onClick={logoutMusician}
              className="flex flex-col items-center justify-center min-w-[50px] py-1.5 px-2 rounded-xl text-[#F8F4EA]/70 hover:text-[#FDA4AF] transition-colors cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4 mb-0.5" />
              <span className="text-[9px] font-display uppercase tracking-wider">Salir</span>
            </button>
          </>
        )}

        {portal === 'admin' && (
          <>
            <button
              onClick={() => setAdminTab('schedule')}
              className={`relative flex flex-col items-center justify-center min-w-[64px] py-1.5 px-2.5 rounded-xl transition-all ${
                adminTab === 'schedule'
                  ? 'bg-[#DCBD9E] text-[#302C24] font-extrabold shadow-xs -translate-y-0.5'
                  : 'text-[#F8F4EA]/75 hover:text-white font-medium'
              }`}
            >
              <Table className="w-4 h-4 mb-0.5" />
              <span className="text-[9px] font-display uppercase tracking-wider">Matriz</span>
            </button>

            <button
              onClick={() => setAdminTab('visual-board')}
              className={`relative flex flex-col items-center justify-center min-w-[64px] py-1.5 px-2.5 rounded-xl transition-all ${
                adminTab === 'visual-board'
                  ? 'bg-[#DCBD9E] text-[#302C24] font-extrabold shadow-xs -translate-y-0.5'
                  : 'text-[#F8F4EA]/75 hover:text-white font-medium'
              }`}
            >
              <Camera className="w-4 h-4 mb-0.5" />
              <span className="text-[9px] font-display uppercase tracking-wider">Fotos</span>
            </button>

            <button
              onClick={() => setAdminTab('musicians')}
              className={`relative flex flex-col items-center justify-center min-w-[58px] py-1.5 px-2 rounded-xl transition-all ${
                adminTab === 'musicians'
                  ? 'bg-[#DCBD9E] text-[#302C24] font-extrabold shadow-xs -translate-y-0.5'
                  : 'text-[#F8F4EA]/75 hover:text-white font-medium'
              }`}
            >
              <UsersRound className="w-4 h-4 mb-0.5" />
              <span className="text-[9px] font-display uppercase tracking-wider">Músicos</span>
            </button>

            <button
              onClick={() => setAdminTab('songs-bank')}
              className={`relative flex flex-col items-center justify-center min-w-[58px] py-1.5 px-2 rounded-xl transition-all ${
                adminTab === 'songs-bank'
                  ? 'bg-[#DCBD9E] text-[#302C24] font-extrabold shadow-xs -translate-y-0.5'
                  : 'text-[#F8F4EA]/75 hover:text-white font-medium'
              }`}
            >
              <Music2 className="w-4 h-4 mb-0.5" />
              <span className="text-[9px] font-display uppercase tracking-wider">Banco</span>
            </button>
          </>
        )}
      </nav>

      {/* Modal del Perfil del Músico */}
      {portal === 'musician' && (
        <MusicianProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
        />
      )}
    </div>
  );
};
