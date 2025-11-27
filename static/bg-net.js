// =============================================================================
// ANIMATION DE FOND "CONSTELLATION"
// Ce script dessine des étoiles qui bougent doucement et se connectent à la souris
// =============================================================================

// 1. Récupération de l'élément <canvas> dans le HTML
const canvasBG = document.getElementById('net-bg');
// On demande le contexte "2d" pour pouvoir dessiner dessus (lignes, cercles...)
const ctxBG = canvasBG.getContext('2d', { alpha: true });

// Variables globales pour la taille de l'écran (VW = View Width, VH = View Height)
let VW = 0, VH = 0;
let pts = []; // Liste qui contiendra toutes nos "étoiles"
let mouse = { x: null, y: null, inside: false }; // Position de la souris

// ====== PARAMÈTRES  ======
const BASE_POINTS = 888;     // Nombre d'étoiles
const POINT_RADIUS = [1.0, 1.8]; // Taille min et max des étoiles
const DRIFT_SPEED = 0.055;   // Vitesse de déplacement automatique
const MOUSE_LINK_R = 90;      // Distance max pour relier une étoile à la souris
const LINE_OPACITY_MAX = 0.65;    // Transparence des lignes (0 = invisible, 1 = opaque)
const POINT_CORE_ALPHA = 0.8;     // Transparence du centre de l'étoile
const HALO_ALPHA = 0.18;    // Transparence du halo autour de l'étoile
// ===========================================================================

// 2. Fonction pour redimensionner le canvas quand on change la taille de la fenêtre
function resizeBG() {
  // Gestion des écrans haute résolution (Retina, etc.)
  const dpr = window.devicePixelRatio || 1;
  // On prend la taille max disponible
  VW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  VH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

  // On ajuste la taille réelle du dessin (pixels physiques)
  canvasBG.width = Math.floor(VW * dpr);
  canvasBG.height = Math.floor(VH * dpr);
  // On ajuste la taille d'affichage (CSS)
  canvasBG.style.width = VW + 'px';
  canvasBG.style.height = VH + 'px';

  // On remet l'échelle normale pour dessiner facilement
  ctxBG.setTransform(dpr, 0, 0, dpr, 0, 0);
}
// On lance le redimensionnement au démarrage et à chaque changement de taille
resizeBG();
window.addEventListener('resize', resizeBG);

// Petites fonctions utilitaires
const rand = (a, b) => Math.random() * (b - a) + a; // Donne un nombre aléatoire entre a et b
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); // Garde une valeur entre a et b

// 3. Création des étoiles (Seed)
function seedBG() {
  pts = []; // On vide la liste
  for (let i = 0; i < BASE_POINTS; i++) {
    const ang = Math.random() * Math.PI * 2; // Direction aléatoire (0 à 360°)
    const spd = DRIFT_SPEED * rand(0.4, 1.2); // Vitesse aléatoire

    // On ajoute une étoile dans la liste
    pts.push({
      x: rand(0, VW), y: rand(0, VH), // Position de départ aléatoire
      vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, // Vitesse horizontale et verticale
      r: rand(POINT_RADIUS[0], POINT_RADIUS[1]), // Rayon aléatoire
      tw: rand(0, Math.PI * 2) // Décalage pour le scintillement
    });
  }
}
seedBG(); // On crée les étoiles au démarrage

// 4. Gestion de la souris (pour savoir où elle est)
window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.inside = true; // La souris est sur la page
});
window.addEventListener('mouseleave', () => {
  mouse.inside = false; mouse.x = mouse.y = null; // La souris est sortie
});
// Gestion du tactile (pour les téléphones)
window.addEventListener('touchmove', (e) => {
  const t = e.touches[0];
  if (!t) return;
  mouse.x = t.clientX;
  mouse.y = t.clientY;
  mouse.inside = true;
}, { passive: true });
window.addEventListener('touchend', () => {
  mouse.inside = false; mouse.x = mouse.y = null;
}, { passive: true });

// 5. Dessiner une seule étoile
function drawPoint(p, t) {
  // Dessin du halo (cercle flou et transparent autour)
  ctxBG.fillStyle = `rgba(168,199,255,${HALO_ALPHA})`;
  ctxBG.beginPath();
  ctxBG.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
  ctxBG.fill();

  // Dessin du noyau (le point blanc au centre)
  // "pulse" fait scintiller l'étoile avec une fonction sinus
  const pulse = 0.85 + 0.25 * Math.sin(t * 0.002 + p.tw);
  ctxBG.fillStyle = `rgba(255,255,255,${POINT_CORE_ALPHA})`;
  ctxBG.beginPath();
  ctxBG.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2);
  ctxBG.fill();
}

// 6. Boucle d'animation (exécutée environ 60 fois par seconde)
function frame(t) {
  // --- Nettoyage de l'écran précédent ---
  ctxBG.save();
  ctxBG.setTransform(1, 0, 0, 1, 0, 0);
  ctxBG.clearRect(0, 0, canvasBG.width, canvasBG.height); // On efface tout
  ctxBG.restore();
  // --------------------------------------

  // Mise à jour de la position des étoiles
  for (let p of pts) {
    p.x += p.vx; p.y += p.vy; // On ajoute la vitesse à la position

    // Si l'étoile sort de l'écran, on la fait réapparaître de l'autre côté (effet Pac-Man)
    if (p.x < -10) p.x = VW + 10; else if (p.x > VW + 10) p.x = -10;
    if (p.y < -10) p.y = VH + 10; else if (p.y > VH + 10) p.y = -10;
  }

  // Dessin des lignes vers la souris
  if (mouse.inside && mouse.x != null) {
    ctxBG.lineWidth = 1;
    for (let p of pts) {
      // Calcul de la distance entre l'étoile et la souris (Théorème de Pythagore)
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;

      // Si l'étoile est assez proche...
      if (d2 < MOUSE_LINK_R * MOUSE_LINK_R) {
        const d = Math.sqrt(d2);
        // On calcule l'opacité : plus c'est proche, plus c'est visible
        const a = (1 - d / MOUSE_LINK_R) * LINE_OPACITY_MAX;
        ctxBG.strokeStyle = `rgba(255,255,255,${a})`;

        // On trace la ligne
        ctxBG.beginPath();
        ctxBG.moveTo(p.x, p.y);
        ctxBG.lineTo(mouse.x, mouse.y);
        ctxBG.stroke();
      }
    }
  }

  // Dessin de toutes les étoiles
  for (let p of pts) drawPoint(p, t);

  // On demande au navigateur de rappeler cette fonction à la prochaine image
  requestAnimationFrame(frame);
}
// Démarrage de l'animation
requestAnimationFrame(frame);

// Optimisation : Recréer les étoiles si on change d'onglet (évite les bugs graphiques)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { resizeBG(); seedBG(); }
});
