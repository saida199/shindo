// ── SERVIR LE FRONTEND (HTML + CSS + JS + IMAGES) ─────────────────────────────

// Dossier public (où se trouve shindo.html)
app.use(express.static(path.join(__dirname, '../')));

// Dossier images (tes images produits)
app.use('/images', express.static(path.join(__dirname, '../images')));
