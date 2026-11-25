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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0B1120] text-[#F8FAFC]">
      {/* ========================================================================= */}
      {/* 1. DESKTOP SIDEBAR (MIDNIGHT CONCERT STAGE #080E1D)                       */}
      {/* ========================================================================= */}
      <aside 
        className={`hidden md:flex flex-col justify-between min-h-screen bg-[#080E1D] border-r border-white/10 text-white sticky top-0 shrink-0 shadow-modal z-30 select-none transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-20 p-3' : 'w-64 p-5'
        }`}
      >
        <div className="space-y-6">
          {/* Header del Sidebar: Logo + Botón Plegar/Desplegar + Badge Administrador */}
          <div className="pt-1 flex flex-col gap-2">
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} w-full`}>
              <div className="flex items-center overflow-hidden">
                <Logo 
                  lightText 
                  size="sm" 
                  showText={!isSidebarCollapsed}
                  subtitle={portal === 'admin' ? 'ADMIN' : 'LIVE'}
                />
              </div>

              {/* Botón Plegar / Desplegar en la cabecera */}
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1.5 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title={isSidebarCollapsed ? "Desplegar barra de módulos" : "Plegar barra de módulos"}
              >
                {isSidebarCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Badge Administrador */}
            {!isSidebarCollapsed && portal === 'admin' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FACC15]/10 border border-[#FACC15]/25 text-[10px] font-display font-bold uppercase tracking-widest text-[#FACC15]">
                <span className="w-2 h-2 rounded-full bg-[#FACC15] animate-pulse shrink-0" />
                <span>Panel Administrador</span>
              </div>
            )}
            {isSidebarCollapsed && portal === 'admin' && (
              <div className="flex justify-center mt-1" title="Panel Administrador">
                <span className="w-2 h-2 rounded-full bg-[#FACC15] animate-pulse" />
              </div>
            )}
          </div>

          {/* Navigation Links for Musicians */}
          {portal === 'musician' && musicianUser && (
            <nav className="space-y-1.5">
              <button
                type="button"
                onClick={() => setMusicianTab('calendar')}
                title="Fechas de Culto"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-xl text-[11px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  musicianTab === 'calendar'
                    ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/35 shadow-glow'
                    : 'text-[#94A3B8] hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <CalendarDays className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Fechas de Culto</span>}
              </button>

              <button
                type="button"
                onClick={() => setMusicianTab('my-services')}
                title="Mis Asignaciones"
                className={`relative w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'} py-3 rounded-xl text-[11px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  musicianTab === 'my-services'
                    ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/35 shadow-glow'
                    : 'text-[#94A3B8] hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <CircleCheck className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span>Mis Asignaciones</span>}
                </div>
                {assignedCount > 0 && (
                  <span className={`${isSidebarCollapsed ? 'absolute -top-1 -right-1 w-4 h-4 text-[9px]' : 'w-5 h-5 text-[10px]'} rounded-full bg-[#FACC15] text-[#0B1120] font-black flex items-center justify-center tabular-nums`}>
                    {assignedCount}
                  </span>
                )}
              </button>

              {/* Repertorio: Exclusivo para rol de Voz Director / Director */}
              {isDirector && (
                <button
                  type="button"
                  onClick={() => setMusicianTab('tracks')}
                  title="Repertorio Musical"
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-xl text-[11px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    musicianTab === 'tracks'
                      ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/35 shadow-glow'
                      : 'text-[#94A3B8] hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  <Music className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span>Repertorio</span>}
                </button>
              )}

              {/* Mi Perfil */}
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                title="Mi Perfil"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-xl text-[11px] font-display font-bold uppercase tracking-wider text-[#94A3B8] hover:bg-white/5 hover:text-white border border-transparent transition-all cursor-pointer`}
              >
                <UserRound className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Mi Perfil</span>}
              </button>
            </nav>
          )}

          {/* Navigation Links for Administrator */}
          {portal === 'admin' && isAdminAuthenticated && (
            <nav className="space-y-1.5">
              <button
                type="button"
                onClick={() => setAdminTab('schedule')}
                title="Matriz de Planes"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-xl text-[11px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  adminTab === 'schedule'
                    ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/35 shadow-glow'
                    : 'text-[#94A3B8] hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Table className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Matriz de Planes</span>}
              </button>

              <button
                type="button"
                onClick={() => setAdminTab('visual-board')}
                title="Fotos / WhatsApp"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-xl text-[11px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  adminTab === 'visual-board'
                    ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/35 shadow-glow'
                    : 'text-[#94A3B8] hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Camera className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Fotos / WhatsApp</span>}
              </button>

              <button
                type="button"
                onClick={() => setAdminTab('musicians')}
                title="Equipo de Músicos"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-xl text-[11px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  adminTab === 'musicians'
                    ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/35 shadow-glow'
                    : 'text-[#94A3B8] hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <UsersRound className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Equipo de Músicos</span>}
              </button>

              <button
                type="button"
                onClick={() => setAdminTab('songs-bank')}
                title="Banco Canciones"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-xl text-[11px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  adminTab === 'songs-bank'
                    ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/35 shadow-glow'
                    : 'text-[#94A3B8] hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Music2 className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Banco Canciones</span>}
              </button>

              <button
                type="button"
                onClick={() => onNavigatePortal('musician')}
                title="Vista Músicos"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-xl text-[11px] font-display font-bold uppercase tracking-wider text-[#94A3B8] hover:bg-white/5 hover:text-white border border-transparent transition-all cursor-pointer`}
              >
                <UserRound className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Vista Músicos</span>}
              </button>
            </nav>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-white/10 space-y-2">
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors cursor-pointer`}
            title={isSidebarCollapsed ? "Desplegar barra de módulos" : "Plegar barra de módulos"}
          >
            <div className="flex items-center gap-2">
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {!isSidebarCollapsed && <span>Plegar menú</span>}
            </div>
            {!isSidebarCollapsed && (
              <span className="text-[10px] text-[#64748B] bg-white/5 px-1.5 py-0.5 rounded">Ctrl+B</span>
            )}
          </button>

          <button
            type="button"
            onClick={portal === 'admin' ? logoutAdmin : logoutMusician}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3'} py-2.5 rounded-xl text-xs font-bold text-[#94A3B8] hover:text-white hover:bg-[#F43F5E]/20 transition-colors cursor-pointer`}
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4 shrink-0 text-[#FB7185]" />
            {!isSidebarCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. ÁREA PRINCIPAL CON HEADER ESCRITORIO + CHILDREN CONTENIDO              */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex items-center justify-between h-16 px-6 sm:px-8 bg-[#0B1120]/85 border-b border-white/10 sticky top-0 z-20 backdrop-blur-xl">
          {/* Input Buscador General */}
          <div className="relative w-80 max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar fecha, instrumento o canción..."
              className="w-full pl-9 pr-4 py-2 bg-[#131D35]/90 border border-white/10 rounded-full text-xs text-white placeholder-[#64748B] focus:bg-[#131D35] focus:outline-none focus:border-[#38BDF8] transition-all"
            />
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Lado Derecho: WhatsApp (Admin), Campana, Perfil */}
          <div className="flex items-center gap-4">
            {portal === 'admin' && isAdminAuthenticated && (
              <button
                onClick={openShareModal}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#0B1120] rounded-full text-[11px] font-display font-extrabold uppercase tracking-wider transition-all shadow-glow"
              >
                <Share2 className="w-3.5 h-3.5" />
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
                    ? 'text-[#FACC15] bg-[#FACC15]/15 hover:bg-[#FACC15]/25 border border-[#FACC15]/30' 
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/10'
                }`}
                title="Notificaciones de Culto (Hora Perú)"
              >
                <Bell className={`w-5 h-5 ${hasNotificationsToday ? 'animate-pulse' : ''}`} />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F43F5E] text-white text-[10px] font-black flex items-center justify-center tabular-nums shadow-xs">
                    {notificationCount}
                  </span>
                )}
              </button>

              {/* Popover / Menú Desplegable de Notificaciones */}
              {notificationsOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setNotificationsOpen(false)} 
                  />

                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#131D35] rounded-2xl shadow-modal border border-white/15 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-4 bg-[#080E1D] border-b border-white/10 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#FACC15]" />
                        <h3 className="text-xs font-display font-bold uppercase tracking-wider">Notificaciones de Culto</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-[#94A3B8] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                        title="Cerrar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="px-4 py-2 bg-[#0E1629] border-b border-white/10 flex items-center justify-between text-[11px] text-[#94A3B8]">
                      <span className="font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#38BDF8]" />
                        Hora Oficial Perú (UTC-5)
                      </span>
                      <span className="font-bold text-[#38BDF8] tabular-nums">{peruToday}</span>
                    </div>

                    <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                      <div>
                        <p className="text-[10px] font-display font-bold uppercase tracking-widest text-[#94A3B8] mb-2 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#38BDF8]" />
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
                                  className="p-3 rounded-xl bg-[#182442] border border-white/10 hover:border-[#38BDF8]/40 transition-colors space-y-2"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="text-xs font-bold text-white">
                                        {service.title || 'Culto de Adoración'}
                                      </p>
                                      <p className="text-[11px] text-[#94A3B8] flex items-center gap-1 mt-0.5">
                                        <Clock className="w-3 h-3 text-[#FACC15]" />
                                        <span>Hora: {service.time || '19:30'}</span>
                                      </p>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
                                      Hoy
                                    </span>
                                  </div>

                                  {mySlot && (
                                    <div className="p-2 rounded-lg bg-[#FACC15]/12 border border-[#FACC15]/30 flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-[#FACC15]">
                                        Asignado: {mySlot[1].label || mySlot[0]}
                                      </span>
                                      {service.isSongsPublished && service.songs && service.songs.length > 0 && onOpenSetlist && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setNotificationsOpen(false);
                                            onOpenSetlist(service);
                                          }}
                                          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0B1120] bg-[#38BDF8] hover:bg-[#7DD3FC] px-2.5 py-1 rounded-full transition-colors cursor-pointer"
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
                                      className="w-full text-center text-[11px] font-bold text-[#38BDF8] hover:text-[#7DD3FC] hover:underline pt-1 cursor-pointer"
                                    >
                                      Ver detalles del equipo →
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-[#0E1629] border border-dashed border-white/15 text-center">
                            <p className="text-xs text-[#CBD5E1] font-semibold">
                              No hay cultos programados para hoy (Hora Perú).
                            </p>
                            <p className="text-[10px] text-[#64748B] mt-0.5">
                              Revisa las próximas fechas de servicio en tu agenda.
                            </p>
                          </div>
                        )}
                      </div>

                      {portal === 'musician' && musicianUser && assignedCount > 0 && (
                        <div className="pt-2 border-t border-white/10">
                          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-[#94A3B8] mb-1">
                            Tus Asignaciones Confirmadas
                          </p>
                          <p className="text-xs text-[#CBD5E1]">
                            Tienes <span className="font-bold text-[#38BDF8]">{assignedCount}</span> culto(s) programado(s) en tu agenda.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-[#080E1D] border-t border-white/10 flex items-center justify-between">
                      <span className="text-[10px] text-[#64748B]">
                        ATocarYa · Notificaciones activas
                      </span>
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-xs font-bold text-[#38BDF8] hover:underline cursor-pointer"
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
                  className="flex items-center gap-3 pl-1 pr-2.5 py-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer border border-white/10 hover:border-[#38BDF8]/40"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#38BDF8] to-[#0284C7] text-[#0B1120] flex items-center justify-center text-xs font-black shadow-xs">
                    {musicianUser.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-bold text-white leading-tight">
                      {musicianUser.fullName.split(' ')[0]}
                    </p>
                    <p className="text-[10px] text-[#38BDF8] font-semibold leading-none mt-0.5">
                      {musicianUser.primaryInstrument}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#131D35] border border-white/15 rounded-2xl shadow-modal py-2 z-50">
                    <div className="px-3.5 py-2 border-b border-white/10">
                      <p className="text-xs font-bold text-white">{musicianUser.fullName}</p>
                      <p className="text-[10px] text-[#38BDF8]">{musicianUser.primaryInstrument}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setProfileModalOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-white hover:bg-white/5 font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <UserRound className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>Ver Mi Perfil</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onNavigatePortal('admin');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-[#94A3B8] hover:bg-white/5 hover:text-white font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-[#FACC15]" />
                      <span>Acceso Administrador</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logoutMusician();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-[#FB7185] hover:bg-[#F43F5E]/15 font-semibold flex items-center gap-2"
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
                <div className="w-8 h-8 rounded-full bg-[#FACC15] text-[#0B1120] flex items-center justify-center text-xs font-black shadow-glow-yellow">
                  A
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-bold text-white">Administrador</p>
                  <p className="text-[10px] text-[#FACC15] font-bold uppercase tracking-wider">Líder General</p>
                </div>
                <button
                  type="button"
                  onClick={logoutAdmin}
                  className="p-1.5 text-[#94A3B8] hover:text-[#FB7185] rounded-lg transition-colors ml-1"
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
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#080E1D]/95 backdrop-blur-xl border-t border-white/10 py-2 px-3 flex items-center justify-around shadow-modal">
        {portal === 'musician' && (
          <>
            {/* 1. Inicio */}
            <button
              onClick={() => setMusicianTab('calendar')}
              className={`relative flex flex-col items-center justify-center min-w-[66px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                musicianTab === 'calendar'
                  ? 'text-[#38BDF8] font-bold'
                  : 'text-[#64748B] hover:text-white font-medium'
              }`}
            >
              {musicianTab === 'calendar' && (
                <span className="absolute -top-2 w-6 h-0.5 bg-[#38BDF8] rounded-full" />
              )}
              <Home className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-display uppercase tracking-wider">Inicio</span>
            </button>

            {/* 2. Mis Cultos */}
            <button
              onClick={() => setMusicianTab('my-services')}
              className={`relative flex flex-col items-center justify-center min-w-[66px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                musicianTab === 'my-services'
                  ? 'text-[#38BDF8] font-bold'
                  : 'text-[#64748B] hover:text-white font-medium'
              }`}
            >
              {musicianTab === 'my-services' && (
                <span className="absolute -top-2 w-6 h-0.5 bg-[#38BDF8] rounded-full" />
              )}
              <CalendarDays className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-display uppercase tracking-wider">Cultos</span>
              {assignedCount > 0 && (
                <span className="absolute top-0 right-1.5 w-4 h-4 rounded-full bg-[#FACC15] text-[#0B1120] text-[9px] font-black flex items-center justify-center tabular-nums">
                  {assignedCount}
                </span>
              )}
            </button>

            {/* 3. Repertorio / Pistas: Solo si es Voz Director / Director */}
            {isDirector && (
              <button
                onClick={() => setMusicianTab('tracks')}
                className={`relative flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                  musicianTab === 'tracks'
                    ? 'text-[#38BDF8] font-bold'
                    : 'text-[#64748B] hover:text-white font-medium'
                }`}
              >
                {musicianTab === 'tracks' && (
                  <span className="absolute -top-2 w-6 h-0.5 bg-[#38BDF8] rounded-full" />
                )}
                <Music className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-display uppercase tracking-wider">Pistas</span>
              </button>
            )}

            {/* 4. Mi Perfil */}
            <button
              onClick={() => setProfileModalOpen(true)}
              className="flex flex-col items-center justify-center min-w-[62px] py-1 px-2 rounded-xl text-[#64748B] hover:text-[#38BDF8] font-medium transition-all cursor-pointer"
            >
              <UserRound className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-display uppercase tracking-wider">Perfil</span>
            </button>

            {/* 5. Salir */}
            <button
              onClick={logoutMusician}
              className="flex flex-col items-center justify-center min-w-[54px] py-1 px-2 rounded-xl text-[#64748B] hover:text-[#FB7185] transition-colors cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-display uppercase tracking-wider">Salir</span>
            </button>
          </>
        )}

        {portal === 'admin' && (
          <>
            <button
              onClick={() => setAdminTab('schedule')}
              className={`relative flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-xl transition-colors ${
                adminTab === 'schedule'
                  ? 'text-[#38BDF8] font-bold'
                  : 'text-[#64748B] hover:text-white font-medium'
              }`}
            >
              {adminTab === 'schedule' && (
                <span className="absolute -top-2 w-6 h-0.5 bg-[#38BDF8] rounded-full" />
              )}
              <Table className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-display uppercase tracking-wider">Matriz</span>
            </button>

            <button
              onClick={() => setAdminTab('visual-board')}
              className={`relative flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-xl transition-colors ${
                adminTab === 'visual-board'
                  ? 'text-[#38BDF8] font-bold'
                  : 'text-[#64748B] hover:text-white font-medium'
              }`}
            >
              {adminTab === 'visual-board' && (
                <span className="absolute -top-2 w-6 h-0.5 bg-[#38BDF8] rounded-full" />
              )}
              <Camera className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-display uppercase tracking-wider">Fotos</span>
            </button>

            <button
              onClick={() => setAdminTab('musicians')}
              className={`relative flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-xl transition-colors ${
                adminTab === 'musicians'
                  ? 'text-[#38BDF8] font-bold'
                  : 'text-[#64748B] hover:text-white font-medium'
              }`}
            >
              {adminTab === 'musicians' && (
                <span className="absolute -top-2 w-6 h-0.5 bg-[#38BDF8] rounded-full" />
              )}
              <UsersRound className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-display uppercase tracking-wider">Músicos</span>
            </button>

            <button
              onClick={() => setAdminTab('songs-bank')}
              className={`relative flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-xl transition-colors ${
                adminTab === 'songs-bank'
                  ? 'text-[#38BDF8] font-bold'
                  : 'text-[#64748B] hover:text-white font-medium'
              }`}
            >
              {adminTab === 'songs-bank' && (
                <span className="absolute -top-2 w-6 h-0.5 bg-[#38BDF8] rounded-full" />
              )}
              <Music2 className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-display uppercase tracking-wider">Banco</span>
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
