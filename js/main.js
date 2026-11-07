
"use strict";

const body = document.body;
const logo = document.querySelector(".brand.intro-logo");
const statusLabel = document.querySelector("#status-label");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function runIntro() {
  if (!logo) return;

  // Le rectangle naturel est la position exacte du logo dans le header.
  const destination = logo.getBoundingClientRect();

  if (reducedMotion) {
    logo.classList.add("intro-ready");
    body.classList.add("intro-reveal", "intro-finish");
    body.classList.remove("intro-running");
    return;
  }

  // Grand au départ, sans dépasser la largeur de l'écran.
  const startScale = Math.min(3, (window.innerWidth - 32) / destination.width);
  const startX = (window.innerWidth - destination.width * startScale) / 2 - destination.left;
  const startY = (window.innerHeight - destination.height * startScale) / 2 - destination.top;
  const startTransform = `translate(${startX}px, ${startY}px) scale(${startScale})`;

  logo.style.transform = startTransform;
  logo.classList.add("intro-ready");

  // Dessiner le trait sous "line"
  const logoLine = logo.querySelector(".logo-line");

  if (logoLine) {
    logoLine.classList.add("draw-line");
  }

  // Laisser le trait se dessiner avant le déplacement
  await wait(850);
  body.classList.add("intro-reveal");

  const travel = logo.animate(
    [
      { transform: startTransform },
      { transform: "none" }
    ],
    {
      duration: 1450,
      easing: "cubic-bezier(.65, 0, .18, 1)",
      fill: "forwards"
    }
  );

  await travel.finished;

  // Fixer l'état final de l'animation directement sur le logo.
  travel.commitStyles();
  travel.cancel();

  // Afficher le reste de l'interface.
  body.classList.add("intro-finish");
  body.classList.remove("intro-running");
}

window.addEventListener("load", () => {
  runIntro().catch((error) => {
    console.error("Erreur animation :", error);
    if (logo) {
      logo.classList.add("intro-ready");
      logo.style.transform = "none";
    }
    body.classList.add("intro-reveal", "intro-finish");
    body.classList.remove("intro-running");
  });
});

if (statusLabel) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        statusLabel.textContent = entry.target.id === "mythweave" ? "BUILDING" : "ONLINE";
      }
    }
  }, { threshold: 0.55 });

  document.querySelectorAll(".scene").forEach((section) => observer.observe(section));
}

/* =====================================
   TRANSITION CINÉMATOGRAPHIQUE
   CONTRÔLÉE PAR LE DÉFILEMENT
===================================== */

const cinematicStage = document.querySelector(".cinematic-stage");
const cinematicScreen = document.querySelector(".cinematic-screen");

if (cinematicStage && cinematicScreen) {

  let ticking = false;

  const clamp01 = (value) =>
    Math.max(0, Math.min(1, value));

  const smoothstep = (value) => {
    const t = clamp01(value);
    return t * t * (3 - 2 * t);
  };

  function updateCinematicTransition() {
    ticking = false;

    // Distance réellement disponible pendant l'écran fixe
    const scrollDistance =
      cinematicStage.offsetHeight - window.innerHeight;

    const scrolled =
      -cinematicStage.getBoundingClientRect().top;

    const progress = clamp01(
      scrolled / Math.max(1, scrollDistance)
    );

    // Fondu des paysages entre 20 % et 75 %
    const mythOpacity = smoothstep(
      (progress - 0.20) / 0.55
    );

    cinematicScreen.style.setProperty(
      "--myth-opacity",
      mythOpacity.toFixed(4)
    );

    // Disparition du texte d'accueil entre 0 % et 25 %
    const homeTextOpacity = 1 - smoothstep(
      progress / 0.25
    );

    cinematicScreen.style.setProperty(
      "--home-text-opacity",
      homeTextOpacity.toFixed(4)
    );
  }

  function requestCinematicUpdate() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateCinematicTransition);
    }
  }

  window.addEventListener(
    "scroll",
    requestCinematicUpdate,
    { passive: true }
  );

  window.addEventListener(
    "resize",
    requestCinematicUpdate
  );

  requestCinematicUpdate();
}