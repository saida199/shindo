// ═══════════════════════════════════════════════════════════════════
//  SHINDO 振動 — Serveur principal (server.js)
//  Lance avec : node server.js  ou  npm run dev
// ═══════════════════════════════════════════════════════════════════
require('dotenv').config();

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const path         = require('path');

const { initDB }        = require('./db/database');
const authRoutes        = require('./routes/auth');
const productRoutes     = require('./routes/products');
const orderRoutes       = require('./routes/orders');
const promoRoutes       = require('./routes/promos');
const uploadRoutes      = require('./routes/upload');
const adminRoutes       = require('./routes/admin');
const { apiLimiter }    = require('./middleware/rateLimiter');
const { errorHandler }  = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── 1. SÉCURITÉ HTTP (Helmet) ─────────────────────────────────────
// Ajoute automatiquement les bons headers sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:     ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:      ["'self'", 'data:', 'blob:'],
      connectSrc:  ["'self'"],
      frameSrc:    ["'none'"],
      objectSrc:   ["'none'"],
    },
  },
  hsts: {
    maxAge:            63072000, // 2 ans
    includeSubDomains: true,
    preload:           true,
  },
  crossOriginEmbedderPolicy: false,
}));

// ── 2. CORS ───────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5500',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
];
app.use(cors({
  origin(origin, cb) {
    // Autorise les requêtes sans origin (Postman, mobile)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS bloqué : ${origin}`));
  },
  credentials:    true,   // autorise les cookies cross-origin
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── 3. PARSERS ────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));          // limite taille body JSON
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// ── 4. FICHIERS STATIQUES (images produits) ───────────────────────
app.use('/images', express.static(path.join(__dirname, '../images'), {
  maxAge:   '7d',
  etag:     true,
  dotfiles: 'deny',   // interdit les fichiers cachés
}));

// ── 5. RATE LIMITING GLOBAL ───────────────────────────────────────
app.use('/api/', apiLimiter);

// ── 6. ROUTES API ─────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/promos',   promoRoutes);
app.use('/api/upload',   uploadRoutes);
app.use('/api/admin',    adminRoutes);

// ── 7. ROUTE SANTÉ ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status:    'ok',
    name:      'SHINDO API 振動',
    version:   '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── 8. ROUTE 404 ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

// ── 9. GESTIONNAIRE D'ERREURS GLOBAL ─────────────────────────────
app.use(errorHandler);

// ── 10. DÉMARRAGE ─────────────────────────────────────────────────
async function start() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log('');
      console.log('  振動  SHINDO API démarrée');
      console.log(`  ➜  http://localhost:${PORT}`);
      console.log(`  ➜  Environnement : ${process.env.NODE_ENV || 'development'}`);
      console.log('');
    });
  } catch (err) {
    console.error('Erreur au démarrage :', err.message);
    process.exit(1);
  }
}

start();