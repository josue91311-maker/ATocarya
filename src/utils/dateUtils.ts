import { ServiceDate } from '../types';

/**
 * Retorna la fecha de hoy en formato YYYY-MM-DD en hora local
 */
export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Retorna si una fecha (YYYY-MM-DD) ya pasó con respecto a hoy
 */
export const isServicePast = (serviceDate: string): boolean => {
  const today = getTodayDateString();
  return serviceDate < today;
};

/**
 * Determina si la inscripción de un servicio ha expirado:
 * 1. Si el admin cerró inscripciones (isOpen === false)
 * 2. Si la fecha del servicio ya pasó (service.date < today)
 * 3. Si se definió una fecha de expiración y hoy ya superó esa fecha límite
 */
export const isServiceExpired = (service: ServiceDate): boolean => {
  if (!service.isOpen) return true;
  if (isServicePast(service.date)) return true;
  
  if (service.registrationDeadline) {
    const today = getTodayDateString();
    if (today > service.registrationDeadline) {
      return true;
    }
  }

  return false;
};

/**
 * Retorna la clave de mes YYYY-MM
 */
export const getMonthKey = (dateStr: string): string => {
  if (!dateStr || dateStr.length < 7) return '';
  return dateStr.slice(0, 7);
};

/**
 * Retorna el nombre formateado de un mes: ej. "Septiembre 2026"
 */
export const getMonthLabel = (monthKey: string): string => {
  const [year, month] = monthKey.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  const monthName = d.toLocaleDateString('es-ES', { month: 'long' });
  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
};

/**
 * Formatea una fecha en formato legible largo
 */
export const formatFormattedDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-');
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};
