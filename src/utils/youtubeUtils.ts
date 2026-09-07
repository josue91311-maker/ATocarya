/**
 * Utilidades para manejo de videos de YouTube, extracción de ID y herramientas musicales
 */

export const extractYouTubeId = (url: string | undefined): string | null => {
  if (!url) return null;
  const cleanUrl = url.trim();

  // Formatos soportados:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - VIDEO_ID directamente (si tiene 11 caracteres típicos de YouTube)
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = cleanUrl.match(regExp);

  if (match && match[2].length === 11) {
    return match[2];
  }

  // Si pegó directamente el ID de 11 caracteres alfanuméricos
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  return null;
};

export const getYouTubeEmbedUrl = (urlOrId: string | undefined): string | null => {
  const videoId = extractYouTubeId(urlOrId);
  if (!videoId) return null;
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
};

export const getYouTubeDirectUrl = (urlOrId: string | undefined): string => {
  const videoId = extractYouTubeId(urlOrId);
  if (!videoId) return urlOrId || '#';
  return `https://www.youtube.com/watch?v=VIDEO_ID`.replace('VIDEO_ID', videoId);
};

export const getYouTubeThumbnailUrl = (urlOrId: string | undefined): string | null => {
  const videoId = extractYouTubeId(urlOrId);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

/**
 * Enlaces directos a herramientas externas para cambio de tono
 */
export const getExternalMusicToolLinks = (songTitle: string, key?: string) => {
  const encodedTitle = encodeURIComponent(songTitle);
  const encodedQuery = encodeURIComponent(`${songTitle} ${key || ''} acordes cifrado`);

  return {
    // Extensión de Chrome Transpose (Pitch Shift para YouTube en vivo)
    transposeExtension: 'https://chromewebstore.google.com/detail/transpose-%E2%96%B2%E2%96%BC-pitch-speed/ioimlbgeacgihiffbeabdnkbpneaakcl',
    // Moises App (separador de pistas y cambiador de tono)
    moisesWeb: 'https://moises.ai/',
    // Búsqueda de acordes en LaCuerda
    laCuerdaSearch: `https://www.google.com/search?q=site:lacuerda.net+${encodedTitle}+acordes`,
    // Búsqueda de acordes en Ultimate Guitar
    ultimateGuitarSearch: `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodedTitle}`,
    // Búsqueda general en YouTube con la tonalidad especificada
    youtubeSearchWithKey: `https://www.youtube.com/results?search_query=${encodedQuery}`,
  };
};
