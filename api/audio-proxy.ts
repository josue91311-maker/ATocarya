import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,HEAD');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, Range'
  );
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const audioUrl = req.query.url;
  if (!audioUrl || typeof audioUrl !== 'string') {
    return res.status(400).json({ error: 'Falta el parámetro url' });
  }

  try {
    let targetUrl = audioUrl.trim();

    // Si es enlace de Google Drive, extraer el ID y convertir a stream directo
    const driveMatch = targetUrl.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      const fileId = driveMatch[1];
      targetUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Error al obtener audio: ${response.statusText}` });
    }

    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');

    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    const arrayBuffer = await response.arrayBuffer();
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error('Error en audio-proxy:', err);
    return res.status(500).json({ error: err.message || 'Error interno en audio proxy' });
  }
}
