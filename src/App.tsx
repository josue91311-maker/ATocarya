import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ServiceDate } from './types';

import { Navbar } from './components/Navbar';
import { MusicianLoginScreen } from './components/MusicianLoginScreen';
import { AdminLoginScreen } from './components/AdminLoginScreen';
import { CalendarView } from './components/CalendarView';
import { MyServicesView } from './components/MyServicesView';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { AdminScheduleTable } from './components/AdminScheduleTable';
import { VisualCronogramaExport } from './components/VisualCronogramaExport';
import { MusicianDirectory } from './components/MusicianDirectory';
import { AdminCreateServiceModal } from './components/AdminCreateServiceModal';
import { AdminEditServiceModal } from './components/AdminEditServiceModal';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import { PublicSetlistView } from './components/PublicSetlistView';
import { ServiceSetlistModal } from './components/ServiceSetlistModal';

type PortalType = 'musician' | 'admin';

const getPublicRepertoireServiceId = (): string | null => {
  const hash = window.location.hash;
  const match = hash.match(/#\/(?:repertorio|canciones|setlist)\/([a-zA-Z0-9_-]+)/i);
  if (match && match[1]) return match[1];

  const params = new URLSearchParams(window.location.search);
  const fromParam = params.get('repertorio') || params.get('canciones') || params.get('setlist');
  if (fromParam) return fromParam;

  return null;
};

const MainRouter: React.FC = () => {
  const { 
    musicianUser, 
    isAdminAuthenticated, 
    services 
  } = useApp();

  const [publicServiceId, setPublicServiceId] = useState<string | null>(getPublicRepertoireServiceId);

  const getInitialPortal = (): PortalType => {
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    if (hash.includes('admin') || path.includes('/admin')) {
      return 'admin';
    }
    return 'musician';
  };

  const [portal, setPortal] = useState<PortalType>(getInitialPortal);
  const [musicianTab, setMusicianTab] = useState<'calendar' | 'my-services'>('calendar');
  const [adminTab, setAdminTab] = useState<'visual-board' | 'schedule' | 'musicians'>('visual-board');

  const [selectedService, setSelectedService] = useState<ServiceDate | null>(null);
  const [editingService, setEditingService] = useState<ServiceDate | null>(null);
  const [setlistModalService, setSetlistModalService] = useState<ServiceDate | null>(null);
  const [createServiceOpen, setCreateServiceOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const handleLocationChange = () => {
      const pubId = getPublicRepertoireServiceId();
      setPublicServiceId(pubId);

      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      if (hash.includes('admin') || path.includes('/admin')) {
        setPortal('admin');
      } else {
        setPortal('musician');
      }
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const navigateTo = (newPortal: PortalType) => {
    setPortal(newPortal);
    if (newPortal === 'admin') {
      window.location.hash = '#/admin';
    } else {
      window.location.hash = '#/';
    }
  };

  const activeSelectedService = selectedService
    ? services.find(s => s.id === selectedService.id) || null
    : null;

  // --- 0. RUTA PÚBLICA OFICIAL DE REPERTORIO (SIN USUARIO NI CONTRASEÑA) ---
  if (publicServiceId) {
    return (
      <PublicSetlistView
        serviceId={publicServiceId}
        onGoToPortal={() => {
          window.location.hash = '#/';
          setPublicServiceId(null);
        }}
      />
    );
  }

  // --- 1. PORTAL DE MÚSICOS (LINK INDEPENDIENTE) ---
  if (portal === 'musician') {
    if (!musicianUser) {
      return <MusicianLoginScreen />;
    }

    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 relative">
        {/* Subtle Ambient Background */}
        <div 
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-[0.18]"
          style={{ backgroundImage: 'url("/app-bg.jpg")' }}
          aria-hidden="true"
        />

        <Navbar
          portal="musician"
          musicianTab={musicianTab}
          setMusicianTab={setMusicianTab}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          openShareModal={() => setShareOpen(true)}
          onNavigatePortal={navigateTo}
        />

        <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
          {musicianTab === 'calendar' && (
            <CalendarView 
              onSelectService={(s) => setSelectedService(s)} 
              onOpenSetlist={(s) => setSetlistModalService(s)}
            />
          )}

          {musicianTab === 'my-services' && (
            <MyServicesView onSelectService={(s) => setSelectedService(s)} />
          )}
        </main>

        <footer className="relative z-10 mt-auto border-t border-slate-200/80 py-5 px-4 text-center bg-white/80 backdrop-blur-sm hidden md:block">
          <p className="text-xs text-slate-500">
            AtocarYa · Coordinador de Músicos & Alabanza
          </p>
        </footer>

        {activeSelectedService && (
          <ServiceDetailModal
            service={activeSelectedService}
            onClose={() => setSelectedService(null)}
            isMusicianView={true}
            onOpenSetlist={(s) => setSetlistModalService(s)}
          />
        )}

        {setlistModalService && (
          <ServiceSetlistModal
            service={services.find(s => s.id === setlistModalService.id) || setlistModalService}
            isOpen={Boolean(setlistModalService)}
            onClose={() => setSetlistModalService(null)}
          />
        )}
      </div>
    );
  }

  // --- 2. PORTAL DE ADMINISTRADOR (LINK INDEPENDIENTE) ---
  if (!isAdminAuthenticated) {
    return <AdminLoginScreen onGoToMusicians={() => navigateTo('musician')} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 relative">
      {/* Subtle Ambient Background */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-[0.18]"
        style={{ backgroundImage: 'url("/app-bg.jpg")' }}
        aria-hidden="true"
      />

      <Navbar
        portal="admin"
        musicianTab={musicianTab}
        setMusicianTab={setMusicianTab}
        adminTab={adminTab}
        setAdminTab={setAdminTab}
        openShareModal={() => setShareOpen(true)}
        onNavigatePortal={navigateTo}
      />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {/* Vista Visual lista para descargar como Imagen o enviar a WhatsApp */}
        {adminTab === 'visual-board' && (
          <VisualCronogramaExport
            onOpenService={(serviceId) => {
              const s = services.find(item => item.id === serviceId);
              if (s) setSelectedService(s);
            }}
            onEditService={(s) => setEditingService(s)}
          />
        )}

        {/* Tabla Matricial clásica */}
        {adminTab === 'schedule' && (
          <AdminScheduleTable
            onOpenService={(serviceId) => {
              const s = services.find(item => item.id === serviceId);
              if (s) setSelectedService(s);
            }}
            onOpenCreateModal={() => setCreateServiceOpen(true)}
            onOpenShareModal={() => setShareOpen(true)}
            onGoToVisualBoard={() => setAdminTab('visual-board')}
            onEditService={(s) => setEditingService(s)}
            onOpenSetlist={(s) => setSetlistModalService(s)}
          />
        )}

        {/* Directorio de músicos y registro exclusivo por admin */}
        {adminTab === 'musicians' && (
          <MusicianDirectory />
        )}
      </main>

      <footer className="mt-auto border-t border-slate-200 py-6 px-4 text-center bg-white">
        <p className="text-xs text-slate-500">
          AtocarYa · Panel de Administración de Alabanza
        </p>
      </footer>

      {activeSelectedService && (
        <ServiceDetailModal
          service={activeSelectedService}
          onClose={() => setSelectedService(null)}
          isMusicianView={false}
          onOpenSetlist={(s) => setSetlistModalService(s)}
        />
      )}

      {createServiceOpen && (
        <AdminCreateServiceModal
          isOpen={createServiceOpen}
          onClose={() => setCreateServiceOpen(false)}
        />
      )}

      {editingService && (
        <AdminEditServiceModal
          service={services.find(s => s.id === editingService.id) || editingService}
          isOpen={Boolean(editingService)}
          onClose={() => setEditingService(null)}
        />
      )}

      {setlistModalService && (
        <ServiceSetlistModal
          service={services.find(s => s.id === setlistModalService.id) || setlistModalService}
          isOpen={Boolean(setlistModalService)}
          onClose={() => setSetlistModalService(null)}
        />
      )}

      {shareOpen && (
        <WhatsAppShareModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainRouter />
    </AppProvider>
  );
}
