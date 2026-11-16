// Toujours revenir à l'Accueil au chargement de la page
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

window.scrollTo({
  top: 0,
  left: 0,
  behavior: "instant"
});

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

// Liste des pages présentes dans l'écran cinématographique
const cinematicScenes = cinematicScreen
  ? Array.from(cinematicScreen.querySelectorAll(":scope > .scene"))
  : [];

// Nombre total de pages
const cinematicSceneCount = cinematicScenes.length;


/* ========================================
   NAVIGATION — PAGE ACTIVE
======================================== */

const navigationLinks = Array.from(
  document.querySelectorAll(".header-menu a[data-scene]")
);

function updateActiveNavigation(activeSceneId) {
  navigationLinks.forEach((link) => {
    const isActive = link.dataset.scene === activeSceneId;

    link.hidden = isActive;
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });
}

// Prestations de la page Web
const webServices = Array.from(
  document.querySelectorAll(".scene-web .web-service")
);

// MYTHWEAVE — Présentation du concept
const mythConcept = document.querySelector(".scene-mythweave .myth-concept");
const hasMythConcept = Boolean(mythConcept);

// Présentation de la réalisation Web
const webProject = document.querySelector(".scene-web .web-project");
const webContent = document.querySelector(".scene-web .web-content");

// Hauteur supplémentaire pour présenter la réalisation
const hasWebProject = Boolean(webProject);

// Ordre de superposition automatique des pages
cinematicScenes.forEach((scene, index) => {
  scene.style.zIndex = index + 1;
});

// Une hauteur d'écran pour l'affichage initial,
// puis deux hauteurs pour chaque transition.
if (cinematicStage && cinematicSceneCount > 0) {
  cinematicStage.style.height =
    `${100
      + (cinematicSceneCount - 1) * 200
      + (hasMythConcept ? 100 : 0)
      + (webServices.length ? 100 : 0)
      + (hasWebProject ? 100 : 0)
    }svh`;
}


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
   
    // Hauteur d'une séquence supplémentaire
    const screenHeight = cinematicScreen.offsetHeight;

    // MYTHWEAVE — Distance réservée au concept
    const mythDistance = hasMythConcept
      ? screenHeight
      : 0;

    // WEB — Distance réservée aux prestations
    const servicesDistance = webServices.length
      ? screenHeight
      : 0;

    // WEB — Distance réservée aux Baladins
    const projectDistance = hasWebProject
      ? screenHeight
      : 0;

    const webExtraDistance =
      servicesDistance + projectDistance;

    // Nombre de transitions entre les scènes
    const transitionCount = Math.max(
      1,
      cinematicSceneCount - 1
    );

    // Repérer Mythweave et Web
    const mythSceneIndex = cinematicScenes.findIndex(
      (scene) => scene.classList.contains("scene-mythweave")
    );

    const webSceneIndex = cinematicScenes.findIndex(
      (scene) => scene.classList.contains("scene-web")
    );

    // Début de la présentation du concept Mythweave
    const mythStart = mythSceneIndex >= 0
      ? mythSceneIndex * 2 * screenHeight
      : scrollDistance;

    // Début des prestations Web, après la séquence Mythweave
    const servicesStart = webSceneIndex >= 0
      ? webSceneIndex * 2 * screenHeight + mythDistance
      : scrollDistance;

    // Distance consommée dans la séquence Mythweave
    const mythPause = Math.max(
      0,
      Math.min(mythDistance, scrolled - mythStart)
    );

    // Distance consommée dans les séquences Web
    const webPause = Math.max(
      0,
      Math.min(webExtraDistance, scrolled - servicesStart)
    );

    // Progression cinématographique hors séquences supplémentaires
    const cinematicScroll =
      scrolled - mythPause - webPause;

    const progress = clamp01(
      cinematicScroll /
      Math.max(
        1,
        scrollDistance - mythDistance - webExtraDistance
      )
    );

    const transitionPosition = progress * transitionCount;

    // Index de la transition actuellement parcourue
    const transitionIndex = Math.min(
      Math.floor(transitionPosition),
      transitionCount - 1
    );

    // Progression locale de cette transition : de 0 à 1
    const transitionProgress = clamp01(
      transitionPosition - transitionIndex
    );


    // Déterminer la scène majoritairement visible
    const activeSceneIndex = Math.min(
      transitionIndex + (transitionProgress >= 0.5 ? 1 : 0),
      cinematicSceneCount - 1
    );

    const activeScene = cinematicScenes[activeSceneIndex];

    if (activeScene) {
      updateActiveNavigation(activeScene.id);
    }


    // Fondu automatique des paysages pour chaque transition
    cinematicScenes.forEach((scene, index) => {
      if (index === 0) return;

      let sceneOpacity;

      if (index <= transitionIndex) {
        // Pages déjà traversées : visibles
        sceneOpacity = 1;
      } else if (index === transitionIndex + 1) {
        // Page entrante : fondu progressif
        sceneOpacity = smoothstep(
          (transitionProgress - 0.20) / 0.55
        );
      } else {
        // Pages suivantes : invisibles
        sceneOpacity = 0;
      }

      scene.style.setProperty(
        "--scene-opacity",
        sceneOpacity.toFixed(4)
      );
    });

    // Animation automatique des textes de chaque page
    cinematicScenes.forEach((scene, index) => {
      if (index === 0) return;

      let textOpacity = 0;

      if (index < transitionIndex) {
      // Pages précédentes : texte masqué
      textOpacity = 0;
    } else if (index === transitionIndex) {
      // Page sortante : disparition progressive
      textOpacity = 1 - smoothstep(
        (transitionProgress - 0.05) / 0.20
      );
    } else if (index === transitionIndex + 1) {
        // Page entrante : apparition en fin de transition
        textOpacity = smoothstep(
          (transitionProgress - 0.75) / 0.20
        );
      }

      scene.style.setProperty(
        "--scene-text-opacity",
        textOpacity.toFixed(4)
      );
    });

    // Disparition du texte d'accueil entre 0 % et 25 %
    const homeTextOpacity = 1 - smoothstep((progress - 0.05) / 0.20);

    cinematicScreen.style.setProperty(
      "--home-text-opacity",
      homeTextOpacity.toFixed(4)
    );


    // ========================================
    // MYTHWEAVE — TRANSITION VERS LE CONCEPT
    // ========================================

    if (mythConcept && mythDistance > 0) {

      // Progression de la séquence Mythweave
      const mythProgress = clamp01(
        (scrolled - mythStart) /
        Math.max(1, mythDistance)
      );

      // Fondu progressif vers l'encart
      const conceptReveal = smoothstep(
        (mythProgress - 0.10) / 0.55
      );

      // Transmettre le fondu au CSS
      cinematicScreen.style.setProperty(
        "--myth-concept-fade",
        conceptReveal.toFixed(4)
      );

      // Afficher progressivement l'encart
      mythConcept.style.opacity =
        conceptReveal.toFixed(4);

      mythConcept.style.visibility =
        conceptReveal > 0 ? "visible" : "hidden";
    }


    // Apparition successive des prestations Web
    if (webServices.length) {

      const servicesProgress = clamp01(
        (scrolled - servicesStart) /
        Math.max(1, servicesDistance)
      );

      const serviceStep = 1 / webServices.length;

      webServices.forEach((service, index) => {

        const start = index * serviceStep;

        const localProgress = clamp01(
          (servicesProgress - start) / (serviceStep * 0.8)
        );

        const reveal = smoothstep(localProgress);

        service.style.opacity = reveal.toFixed(4);

        service.style.transform =
          `translateY(${(1 - reveal) * 22}px)`;

      });
    }

    // ========================================
    // WEB — TRANSITION VERS LES BALADINS
    // ========================================

    if (webProject && webContent) {

      // Début de la séquence après les prestations
      const projectStart = servicesStart + servicesDistance;

      // Progression de la séquence Baladins
      const projectProgress = clamp01(
        (scrolled - projectStart) /
        Math.max(1, projectDistance)
      );

      // Fondu progressif entre les deux présentations
      const projectReveal = smoothstep(
        (projectProgress - 0.10) / 0.55
      );

      // Transmettre la progression au CSS
      cinematicScreen.style.setProperty(
        "--web-project-fade",
        projectReveal.toFixed(4)
      );

      // La réalisation devient visible
      webProject.style.opacity = projectReveal.toFixed(4);

      webProject.style.visibility =
        projectReveal > 0 ? "visible" : "hidden";

      // Autoriser le clic seulement lorsque
      // la réalisation est suffisamment visible
      webProject.style.pointerEvents =
        projectReveal > 0.95 ? "auto" : "none";
    }
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


/* ========================================
   MENU BURGER — NAVIGATION MOBILE
======================================== */

const menuToggle = document.querySelector(".menu-toggle");
const mainNavigation = document.querySelector("#main-navigation");

if (menuToggle && mainNavigation) {

  function closeMobileMenu() {
    mainNavigation.classList.remove("is-open");
    menuToggle.classList.remove("is-open");

    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Ouvrir le menu");
  }

  // Ouvrir ou fermer le menu
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNavigation.classList.toggle("is-open");

    menuToggle.classList.toggle("is-open", isOpen);

    menuToggle.setAttribute("aria-expanded", String(isOpen));

    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Fermer le menu" : "Ouvrir le menu"
    );
  });

  // Fermer après un clic sur un lien
  mainNavigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  // Fermer avec la touche Échap
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
    }
  });

  // Fermer en cliquant à l'extérieur
  document.addEventListener("click", (event) => {
    if (
      !mainNavigation.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeMobileMenu();
    }
  });
}


/* ========================================
   NAVIGATION ENTRE LES SCÈNES
======================================== */


function navigateToScene(sceneId) {
  const targetIndex = cinematicScenes.findIndex(
    (scene) => scene.id === sceneId
  );

  if (targetIndex === -1 || !cinematicStage || !cinematicScreen) {
    return;
  }

  const screenHeight = cinematicScreen.offsetHeight;

  const mythDistance = hasMythConcept
    ? screenHeight
    : 0;

  const servicesDistance = webServices.length
    ? screenHeight
    : 0;

  const projectDistance = hasWebProject
    ? screenHeight
    : 0;

  const mythSceneIndex = cinematicScenes.findIndex(
    (scene) => scene.classList.contains("scene-mythweave")
  );

  const webSceneIndex = cinematicScenes.findIndex(
    (scene) => scene.classList.contains("scene-web")
  );

  // Position initiale de chaque scène
  let targetScroll = targetIndex * 2 * screenHeight;

  // Décaler les scènes situées après Mythweave
  if (mythSceneIndex >= 0 && targetIndex > mythSceneIndex) {
    targetScroll += mythDistance;
  }

  // Décaler les scènes situées après Web
  if (webSceneIndex >= 0 && targetIndex > webSceneIndex) {
    targetScroll += servicesDistance + projectDistance;
  }

  const targetPosition =
    cinematicStage.getBoundingClientRect().top +
    window.scrollY +
    targetScroll;

  window.scrollTo({
    top: targetPosition,
    behavior: reducedMotion ? "instant" : "smooth"
  });
}


// Liens du menu
navigationLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    navigateToScene(link.dataset.scene);
  });
});

// Logo : retour à l'accueil
if (logo) {
  logo.addEventListener("click", (event) => {
    event.preventDefault();
    navigateToScene("accueil");
  });
}
