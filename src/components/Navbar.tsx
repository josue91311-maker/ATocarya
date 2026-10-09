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
  const servicesToday = services.filter(s => s.date === peruToday);

  // Mis servicios de hoy (músico)
  const myAssignedToday = musicianUser
    ? servicesToday.filter(s => Object.values(s.slots || {}).some(sl => sl && sl.musicianId === musicianUser.id))
    : [];

  const assignedCount = musicianUser
    ? services.filter(s => Object.values(s.slots).some(slot => slot.musicianId === musicianUser.id)).length
    : 0;

  // Contador de notificaciones
  const hasNotificationsToday = portal === 'musician'
    ? myAssignedToday.length > 0 || servicesToday.length > 0
    : servicesToday.length > 0;

  const notificationCount = portal === 'musician'
    ? (myAssignedToday.length > 0 ? myAssignedToday.length : (servicesToday.length > 0 ? 1 : 0))
    : servicesToday.length;

  const canAccessTracks = isAdminAuthenticated || (musicianUser?.primaryInstrument === 'Voz Director');

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F7F4EF] text-[#202C37]">
      {/* ========================================================================= */}
      {/* 1. DESKTOP SIDEBAR (STYLE: ATOCARYA EDITORIAL PETRÓLEO #315F6D)           */}
      {/* ========================================================================= */}
      <aside 
        className={`hidden md:flex flex-col justify-between min-h-screen bg-[#315F6D] text-white sticky top-0 shrink-0 shadow-lg z-30 select-none transition-all duration-300 ease-in-out ${
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
                />
              </div>

              {/* Botón Plegar / Desplegar en la cabecera */}
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title={isSidebarCollapsed ? "Desplegar barra de módulos" : "Plegar barra de módulos"}
              >
                {isSidebarCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Badge Administrador: Visible y elegante debajo del logo (sin recortes) */}
            {!isSidebarCollapsed && portal === 'admin' && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/12 border border-white/20 text-[11px] font-bold text-white tracking-wide shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#E8B844] animate-pulse shrink-0" />
                <span>Panel Administrador</span>
              </div>
            )}
            {isSidebarCollapsed && portal === 'admin' && (
              <div className="flex justify-center mt-1" title="Panel Administrador">
                <span className="w-2 h-2 rounded-full bg-[#E8B844] animate-pulse" />
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
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  musicianTab === 'calendar'
                    ? 'bg-white text-[#315F6D] shadow-xs'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <CalendarDays className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Fechas de Culto</span>}
              </button>

              <button
                type="button"
                onClick={() => setMusicianTab('my-services')}
                title="Mis Asignaciones"
                className={`relative w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'} py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  musicianTab === 'my-services'
                    ? 'bg-white text-[#315F6D] shadow-xs'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <CircleCheck className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span>Mis Asignaciones</span>}
                </div>
                {assignedCount > 0 && (
                  <span className={`${isSidebarCollapsed ? 'absolute -top-1 -right-1 w-4 h-4 text-[9px]' : 'w-5 h-5 text-[10px]'} rounded-full bg-[#C96B65] text-white font-black flex items-center justify-center tabular-nums shadow-xs`}>
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
                title="Repertorio"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  musicianTab === 'tracks'
                    ? 'bg-white text-[#315F6D] shadow-xs'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Music className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Repertorio</span>}
              </button>

              <button
                type="button"
                onClick={() => setMusicianTab('calendar')}
                title="Equipos"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-xl text-xs font-semibold text-white/85 hover:bg-white/10 hover:text-white transition-all cursor-pointer`}
              >
                <UsersRound className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Equipos</span>}
              </button>

              <button
                type="button"
                onClick={() => onNavigatePortal('admin')}
                title="Mi Perfil"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-xl text-xs font-semibold text-white/85 hover:bg-white/10 hover:text-white transition-all cursor-pointer`}
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
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminTab === 'schedule'
                    ? 'bg-white text-[#315F6D] shadow-xs'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Table className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Matriz de Planes</span>}
              </button>

              <button
                type="button"
                onClick={() => setAdminTab('visual-board')}
                title="Fotos / WhatsApp"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminTab === 'visual-board'
                    ? 'bg-white text-[#315F6D] shadow-xs'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Camera className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Fotos / WhatsApp</span>}
              </button>

              <button
                type="button"
                onClick={() => setAdminTab('musicians')}
                title="Equipo de Músicos"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminTab === 'musicians'
                    ? 'bg-white text-[#315F6D] shadow-xs'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <UsersRound className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Equipo de Músicos</span>}
              </button>

              <button
                type="button"
                onClick={() => setAdminTab('songs-bank')}
                title="Banco Canciones"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminTab === 'songs-bank'
                    ? 'bg-white text-[#315F6D] shadow-xs'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Music2 className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Banco Canciones</span>}
              </button>

              <button
                type="button"
                onClick={() => onNavigatePortal('musician')}
                title="Vista Músicos"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5 gap-3'} py-3 rounded-xl text-xs font-semibold text-white/85 hover:bg-white/10 hover:text-white transition-all cursor-pointer`}
              >
                <UserRound className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Vista Músicos</span>}
              </button>
            </nav>
          )}
        </div>

        {/* Bottom Actions: Cerrar Sesión & Botón Plegar/Desplegar abajo */}
        <div className="pt-4 border-t border-white/15 space-y-2">
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer`}
            title={isSidebarCollapsed ? "Desplegar barra de módulos" : "Plegar barra de módulos"}
          >
            <div className="flex items-center gap-2">
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {!isSidebarCollapsed && <span>Plegar menú</span>}
            </div>
            {!isSidebarCollapsed && (
              <span className="text-[10px] text-white/50 bg-white/10 px-1.5 py-0.5 rounded">Ctrl+B</span>
            )}
          </button>

          <button
            type="button"
            onClick={portal === 'admin' ? logoutAdmin : logoutMusician}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3'} py-2.5 rounded-xl text-xs font-bold text-white/80 hover:text-white hover:bg-[#C96B65]/80 transition-colors cursor-pointer`}
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

            {/* Notificación Campana Interactiva */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`p-2 rounded-full transition-all relative cursor-pointer ${
                  hasNotificationsToday 
                    ? 'text-[#C96B65] bg-[#F7E3DF] hover:bg-[#F7E3DF]/80 shadow-2xs' 
                    : 'text-[#64717C] hover:text-[#202C37] hover:bg-[#FAF9F6]'
                }`}
                title="Notificaciones de Culto (Hora Perú)"
              >
                <Bell className={`w-5 h-5 ${hasNotificationsToday ? 'animate-pulse' : ''}`} />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#C96B65] text-white text-[10px] font-black flex items-center justify-center tabular-nums shadow-xs animate-bounce">
                    {notificationCount}
                  </span>
                )}
              </button>

              {/* Popover / Menú Desplegable de Notificaciones */}
              {notificationsOpen && (
                <>
                  {/* Backdrop para cerrar al hacer clic afuera */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setNotificationsOpen(false)} 
                  />

                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-modal border border-[#E5E8EA] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Header Notificaciones */}
                    <div className="p-4 bg-[#315F6D] text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#E8B844]" />
                        <h3 className="text-sm font-bold">Notificaciones de Culto</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-white/70 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                        title="Cerrar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="px-4 py-2 bg-[#FAF9F6] border-b border-[#EEF0F1] flex items-center justify-between text-[11px] text-[#64717C]">
                      <span className="font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#315F6D]" />
                        Hora Oficial Perú (UTC-5)
                      </span>
                      <span className="font-bold text-[#315F6D]">{peruToday}</span>
                    </div>

                    {/* Contenido Notificaciones */}
                    <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                      {/* 1. Cultos de HOY */}
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#64717C] mb-2 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#315F6D]" />
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
                                  className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E8EA] hover:border-[#315F6D]/40 transition-colors space-y-2"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="text-xs font-bold text-[#202C37]">
                                        {service.title || 'Culto de Adoración'}
                                      </p>
                                      <p className="text-[11px] text-[#64717C] flex items-center gap-1 mt-0.5">
                                        <Clock className="w-3 h-3 text-[#E8B844]" />
                                        <span>Hora: {service.time || '19:30'}</span>
                                      </p>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D9E9EB] text-[#315F6D] shadow-2xs">
                                      ¡Hoy!
                                    </span>
                                  </div>

                                  {mySlot && (
                                    <div className="p-2 rounded-lg bg-[#F7E3DF] border border-[#C96B65]/30 flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-[#C96B65]">
                                        Asignado: {mySlot[1].label || mySlot[0]}
                                      </span>
                                      {service.isSongsPublished && service.songs && service.songs.length > 0 && onOpenSetlist && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setNotificationsOpen(false);
                                            onOpenSetlist(service);
                                          }}
                                          className="text-[10px] font-bold text-white bg-[#315F6D] hover:bg-[#234A57] px-2 py-1 rounded-md transition-colors cursor-pointer"
                                        >
                                          🎵 Canciones
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
                                      className="w-full text-center text-[11px] font-bold text-[#315F6D] hover:text-[#234A57] hover:underline pt-1 cursor-pointer"
                                    >
                                      Ver detalles del equipo →
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-dashed border-[#E5E8EA] text-center">
                            <p className="text-xs text-[#64717C] font-semibold">
                              No hay cultos programados para hoy (Hora Perú).
                            </p>
                            <p className="text-[10px] text-[#89939C] mt-0.5">
                              ¡Disfruta tu día o revisa las próximas fechas de servicio!
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 2. Próximos cultos para el músico o admin */}
                      {portal === 'musician' && musicianUser && assignedCount > 0 && (
                        <div className="pt-2 border-t border-[#EEF0F1]">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#64717C] mb-1">
                            Tus Asignaciones Confirmadas
                          </p>
                          <p className="text-xs text-[#202C37]">
                            Tienes <span className="font-bold text-[#315F6D]">{assignedCount}</span> culto(s) programado(s) en tu agenda.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-[#FAF9F6] border-t border-[#EEF0F1] flex items-center justify-between">
                      <span className="text-[10px] text-[#89939C]">
                        ATocarYa · Notificaciones activas
                      </span>
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-xs font-bold text-[#315F6D] hover:underline cursor-pointer"
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
