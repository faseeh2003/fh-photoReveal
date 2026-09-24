import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Body parser for JSON with ample limit for puzzle piece images
  app.use(express.json({ limit: '30mb' }));

  // Storage directory for puzzles
  const puzzlesDir = path.join(__dirname, 'data', 'puzzles');
  if (!fs.existsSync(puzzlesDir)) {
    fs.mkdirSync(puzzlesDir, { recursive: true });
  }

  // In-memory cache for fast lookup
  const puzzleCache = new Map<string, any>();

  // API Routes
  app.post('/api/puzzles', (req, res) => {
    try {
      const puzzle = req.body;
      if (!puzzle || !puzzle.id || !puzzle.pieces || !Array.isArray(puzzle.pieces)) {
        return res.status(400).json({ error: 'Invalid puzzle structure' });
      }

      // Keep in memory
      puzzleCache.set(puzzle.id, puzzle);

      // Save to disk asynchronously
      const filePath = path.join(puzzlesDir, `${puzzle.id}.json`);
      fs.writeFile(filePath, JSON.stringify(puzzle), (err) => {
        if (err) console.error('Error saving puzzle to disk:', err);
      });

      return res.json({ success: true, id: puzzle.id });
    } catch (err: any) {
      console.error('Failed to create puzzle:', err);
      return res.status(500).json({ error: 'Failed to create puzzle' });
    }
  });

  app.get('/api/puzzles/:id', (req, res) => {
    try {
      const { id } = req.params;

      // Check cache first
      if (puzzleCache.has(id)) {
        return res.json(puzzleCache.get(id));
      }

      // Check disk
      const filePath = path.join(puzzlesDir, `${id}.json`);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        puzzleCache.set(id, parsed);
        return res.json(parsed);
      }

      return res.status(404).json({ error: 'Puzzle not found' });
    } catch (err: any) {
      console.error('Failed to get puzzle:', err);
      return res.status(500).json({ error: 'Failed to get puzzle' });
    }
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Reveal Puzzle] Server active on port ${PORT}`);
  });
}

startServer();
