import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, initDb } from './db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDb();
    const db = getDb();

    // GET /api/song_bank - Obtener todas las canciones del banco
    if (req.method === 'GET') {
      const result = await db.execute('SELECT * FROM song_bank ORDER BY title ASC');
      const list = result.rows.map(r => ({
        id: String(r.id),
        title: String(r.title),
        artist: r.artist ? String(r.artist) : undefined,
        defaultKey: r.default_key ? String(r.default_key) : undefined,
        originalKey: r.original_key ? String(r.original_key) : undefined,
        bpm: r.bpm ? Number(r.bpm) : undefined,
        youtubeUrl: r.youtube_url ? String(r.youtube_url) : undefined,
        audioUrl: r.audio_url ? String(r.audio_url) : undefined,
        chordsUrl: r.chords_url ? String(r.chords_url) : undefined,
        chordChart: r.chord_chart ? String(r.chord_chart) : undefined,
        lyrics: r.lyrics ? String(r.lyrics) : undefined,
        notes: r.notes ? String(r.notes) : undefined,
        createdAt: String(r.created_at || new Date().toISOString()),
      }));
      return res.status(200).json(list);
    }

    // POST /api/song_bank - Guardar o actualizar canción en el banco
    if (req.method === 'POST') {
      const song = req.body;
      if (!song || !song.title) {
        return res.status(400).json({ error: 'Título requerido' });
      }

      const id = song.id || `bank_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

      await db.execute({
        sql: `INSERT OR REPLACE INTO song_bank (
                id, title, artist, default_key, original_key, bpm,
                youtube_url, audio_url, chords_url, chord_chart, lyrics, notes, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          String(song.title).trim(),
          song.artist?.trim() || null,
          song.defaultKey?.trim() || null,
          song.originalKey?.trim() || null,
          song.bpm || null,
          song.youtubeUrl?.trim() || null,
          song.audioUrl?.trim() || null,
          song.chordsUrl?.trim() || null,
          song.chordChart !== undefined ? (song.chordChart?.trim() || null) : null,
          song.lyrics !== undefined ? (song.lyrics?.trim() || null) : null,
          song.notes?.trim() || null,
          song.createdAt || new Date().toISOString(),
        ],
      });

      return res.status(200).json({ success: true, id });
    }

    // DELETE /api/song_bank?id=xxx - Eliminar canción
    if (req.method === 'DELETE') {
      const id = req.query.id as string || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: 'ID requerido' });
      }

      await db.execute({
        sql: 'DELETE FROM song_bank WHERE id = ?',
        args: [id],
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Error en /api/song_bank:', err);
    return res.status(500).json({ error: err.message || 'Database error' });
  }
}
