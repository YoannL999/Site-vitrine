
"use strict";

/* =========================================
   01. INITIALISATION
========================================= */

// Toujours revenir à l'accueil au chargement.
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

window.scrollTo({
  top: 0,
  left: 0,
  behavior: "instant"
});

// Éléments utilisés par l'introduction.
const body = document.body;
const logo = document.querySelector(".brand.intro-logo");
const statusLabel = document.querySelector("#status-label");

// Préférence d'accessibilité.
const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// Attente utilisée pour synchroniser les animations.
const wait = (ms) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));


/* =========================================
   02. ANIMATION D'INTRODUCTION
========================================= */

async function runIntro() {
  if (!logo) return;

  // Position naturelle du logo dans l'en-tête.
  const destination = logo.getBoundingClientRect();

  // Introduction simplifiée si les animations
  // sont désactivées par l'utilisateur.
  if (reducedMotion) {
    logo.classList.add("intro-ready");
    body.classList.add("intro-reveal", "intro-finish");
    body.classList.remove("intro-running");
    return;
  }

  // Taille et position initiales du logo.
  const startScale = Math.min(
    3,
    (window.innerWidth - 32) / destination.width
  );

  const startX =
    (window.innerWidth - destination.width * startScale) / 2
    - destination.left;

  const startY =
    (window.innerHeight - destination.height * startScale) / 2
    - destination.top;

  const startTransform =
    `translate(${startX}px, ${startY}px) scale(${startScale})`;

  logo.style.transform = startTransform;
  logo.classList.add("intro-ready");

  // Tracé du trait cyan sous le logo.
  const logoLine = logo.querySelector(".logo-line");

  if (logoLine) {
    logoLine.classList.add("draw-line");
  }

  // Laisser le trait se dessiner.
  await wait(850);

  // Révéler le paysage.
  body.classList.add("intro-reveal");

  // Déplacer le logo vers sa position définitive.
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

  // Conserver la position finale du logo.
  travel.commitStyles();
  travel.cancel();

  // Afficher le reste de l'interface.
  body.classList.add("intro-finish");
  body.classList.remove("intro-running");
}


/* =========================================
   03. LANCEMENT ET GESTION DES ERREURS
========================================= */

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


/* =========================================
   04. STATUT ONLINE / BUILDING
========================================= */

if (statusLabel) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          statusLabel.textContent =
            entry.target.id === "mythweave"
              ? "BUILDING"
              : "ONLINE";
        }
      }
    },
    { threshold: 0.55 }
  );

  document.querySelectorAll(".scene").forEach(
    (section) => observer.observe(section)
  );
}


/* =========================================
   05. MOTEUR CINÉMATOGRAPHIQUE — ÉLÉMENTS
========================================= */

// Conteneurs principaux du défilement.
const cinematicStage = document.querySelector(".cinematic-stage");
const cinematicScreen = document.querySelector(".cinematic-screen");

// Scènes directement contenues dans l'écran.
const cinematicScenes = cinematicScreen
  ? Array.from(
      cinematicScreen.querySelectorAll(":scope > .scene")
    )
  : [];

// Nombre total de scènes.
const cinematicSceneCount = cinematicScenes.length;


/* =========================================
   06. NAVIGATION — SCÈNE ACTIVE
========================================= */

// Liens du menu associés aux scènes.
const navigationLinks = Array.from(
  document.querySelectorAll(".header-menu a[data-scene]")
);

// Masquer le lien de la scène actuellement affichée.
function updateActiveNavigation(activeSceneId) {
  navigationLinks.forEach((link) => {
    const isActive = link.dataset.scene === activeSceneId;

    link.hidden = isActive;
    link.setAttribute(
      "aria-current",
      isActive ? "page" : "false"
    );
  });
}


/* =========================================
   07. MYTHWEAVE ET WEB — ÉLÉMENTS
========================================= */

// Prestations Web affichées progressivement.
const webServices = Array.from(
  document.querySelectorAll(".scene-web .web-service")
);

// Encart de présentation du concept Mythweave.
const mythConcept = document.querySelector(
  ".scene-mythweave .myth-concept"
);

const hasMythConcept = Boolean(mythConcept);

// Réalisation présentée dans la scène Web.
const webProject = document.querySelector(
  ".scene-web .web-project"
);

const webContent = document.querySelector(
  ".scene-web .web-content"
);

const hasWebProject = Boolean(webProject);


/* =========================================
   08. SUPERPOSITION DES SCÈNES
========================================= */

// Les scènes suivantes passent au-dessus
// des précédentes pendant les transitions.
cinematicScenes.forEach((scene, index) => {
  scene.style.zIndex = index + 1;
});


/* =========================================
   09. HAUTEUR DU DÉFILEMENT
========================================= */

// 100 svh pour la première scène.
// 200 svh pour chaque transition.
// 100 svh pour chaque séquence supplémentaire.
if (cinematicStage && cinematicSceneCount > 0) {
  cinematicStage.style.height = `${
    100
    + (cinematicSceneCount - 1) * 200
    + (hasMythConcept ? 100 : 0)
    + (webServices.length ? 100 : 0)
    + (hasWebProject ? 100 : 0)
  }svh`;
}


/* =========================================
   10. MOTEUR CINÉMATOGRAPHIQUE
========================================= */

if (cinematicStage && cinematicScreen) {

  let ticking = false;

  // Limiter une valeur entre 0 et 1.
  const clamp01 = (value) =>
    Math.max(0, Math.min(1, value));

  // Interpolation progressive pour les fondus.
  const smoothstep = (value) => {
    const t = clamp01(value);
    return t * t * (3 - 2 * t);
  };


  /* =========================================
     11. CALCUL DE LA PROGRESSION
  ========================================= */

  function updateCinematicTransition() {
    ticking = false;

    // Distance disponible pendant l'écran fixe.
    const scrollDistance =
      cinematicStage.offsetHeight - window.innerHeight;

    const scrolled =
      -cinematicStage.getBoundingClientRect().top;

    const screenHeight = cinematicScreen.offsetHeight;

    // Distances des séquences supplémentaires.
    const mythDistance = hasMythConcept
      ? screenHeight
      : 0;

    const servicesDistance = webServices.length
      ? screenHeight
      : 0;

    const projectDistance = hasWebProject
      ? screenHeight
      : 0;

    const webExtraDistance =
      servicesDistance + projectDistance;

    const transitionCount = Math.max(
      1,
      cinematicSceneCount - 1
    );

    // Position des scènes dans le parcours.
    const mythSceneIndex = cinematicScenes.findIndex(
      (scene) => scene.classList.contains("scene-mythweave")
    );

    const webSceneIndex = cinematicScenes.findIndex(
      (scene) => scene.classList.contains("scene-web")
    );

    // Début des séquences supplémentaires.
    const mythStart = mythSceneIndex >= 0
      ? mythSceneIndex * 2 * screenHeight
      : scrollDistance;

    const servicesStart = webSceneIndex >= 0
      ? webSceneIndex * 2 * screenHeight + mythDistance
      : scrollDistance;

    // Progression dans les séquences supplémentaires.
    const mythPause = Math.max(
      0,
      Math.min(mythDistance, scrolled - mythStart)
    );

    const webPause = Math.max(
      0,
      Math.min(webExtraDistance, scrolled - servicesStart)
    );

    // Progression hors séquences supplémentaires.
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

    const transitionIndex = Math.min(
      Math.floor(transitionPosition),
      transitionCount - 1
    );

    const transitionProgress = clamp01(
      transitionPosition - transitionIndex
    );


    /* =========================================
       12. NAVIGATION ACTIVE
    ========================================= */

    // Déterminer la scène majoritairement visible.
    const activeSceneIndex = Math.min(
      transitionIndex + (transitionProgress >= 0.5 ? 1 : 0),
      cinematicSceneCount - 1
    );

    const activeScene = cinematicScenes[activeSceneIndex];

    if (activeScene) {
      updateActiveNavigation(activeScene.id);
    }


    /* =========================================
       13. FONDU DES PAYSAGES
    ========================================= */

    cinematicScenes.forEach((scene, index) => {
      if (index === 0) return;

      let sceneOpacity;

      if (index <= transitionIndex) {
        // Scènes déjà traversées.
        sceneOpacity = 1;

      } else if (index === transitionIndex + 1) {
        // Scène entrante.
        sceneOpacity = smoothstep(
          (transitionProgress - 0.20) / 0.55
        );

      } else {
        // Scènes suivantes.
        sceneOpacity = 0;
      }

      scene.style.setProperty(
        "--scene-opacity",
        sceneOpacity.toFixed(4)
      );
    });


    /* =========================================
       14. FONDU DES TEXTES
    ========================================= */

    cinematicScenes.forEach((scene, index) => {
      if (index === 0) return;

      let textOpacity = 0;

      if (index < transitionIndex) {
        // Scènes précédentes : texte masqué.
        textOpacity = 0;

      } else if (index === transitionIndex) {
        // Scène sortante.
        textOpacity = 1 - smoothstep(
          (transitionProgress - 0.05) / 0.20
        );

      } else if (index === transitionIndex + 1) {
        // Scène entrante.
        textOpacity = smoothstep(
          (transitionProgress - 0.75) / 0.20
        );
      }

      scene.style.setProperty(
        "--scene-text-opacity",
        textOpacity.toFixed(4)
      );
    });


    /* =========================================
       15. TEXTE D'ACCUEIL
    ========================================= */

    const homeTextOpacity =
      1 - smoothstep((progress - 0.05) / 0.20);

    cinematicScreen.style.setProperty(
      "--home-text-opacity",
      homeTextOpacity.toFixed(4)
    );


    /* =========================================
       16. MYTHWEAVE — APPARITION DU CONCEPT
    ========================================= */

    if (mythConcept && mythDistance > 0) {

      // Progression de la séquence Mythweave.
      const mythProgress = clamp01(
        (scrolled - mythStart) /
        Math.max(1, mythDistance)
      );

      // Fondu de l'introduction vers l'encart.
      const conceptReveal = smoothstep(
        (mythProgress - 0.10) / 0.55
      );

      // Synchronisation avec les règles CSS.
      cinematicScreen.style.setProperty(
        "--myth-concept-fade",
        conceptReveal.toFixed(4)
      );

      mythConcept.style.opacity =
        conceptReveal.toFixed(4);

      mythConcept.style.visibility =
        conceptReveal > 0 ? "visible" : "hidden";
    }


    /* =========================================
       17. WEB — APPARITION DES PRESTATIONS
    ========================================= */

    if (webServices.length) {

      const servicesProgress = clamp01(
        (scrolled - servicesStart) /
        Math.max(1, servicesDistance)
      );

      // Répartir la séquence entre les prestations.
      const serviceStep = 1 / webServices.length;

      webServices.forEach((service, index) => {

        const start = index * serviceStep;

        const localProgress = clamp01(
          (servicesProgress - start) / (serviceStep * 0.8)
        );

        const reveal = smoothstep(localProgress);

        // Apparition progressive.
        service.style.opacity = reveal.toFixed(4);

        // Léger déplacement vertical.
        service.style.transform =
          `translateY(${(1 - reveal) * 22}px)`;
      });
    }


    /* =========================================
       18. WEB — TRANSITION VERS LES BALADINS
    ========================================= */

    if (webProject && webContent) {

      // La présentation commence après les prestations.
      const projectStart = servicesStart + servicesDistance;

      const projectProgress = clamp01(
        (scrolled - projectStart) /
        Math.max(1, projectDistance)
      );

      const projectReveal = smoothstep(
        (projectProgress - 0.10) / 0.55
      );

      // Fondu de la présentation des prestations.
      cinematicScreen.style.setProperty(
        "--web-project-fade",
        projectReveal.toFixed(4)
      );

      // Apparition de la réalisation.
      webProject.style.opacity =
        projectReveal.toFixed(4);

      webProject.style.visibility =
        projectReveal > 0 ? "visible" : "hidden";

      // Activer les interactions seulement
      // lorsque la réalisation est presque visible.
      webProject.style.pointerEvents =
        projectReveal > 0.95 ? "auto" : "none";
    }

  } // Fin de updateCinematicTransition()


  /* =========================================
     19. OPTIMISATION DES MISES À JOUR
  ========================================= */

  function requestCinematicUpdate() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateCinematicTransition);
    }
  }

  // Défilement : mise à jour limitée aux images d'animation.
  window.addEventListener(
    "scroll",
    requestCinematicUpdate,
    { passive: true }
  );

  // Recalcul lors du redimensionnement.
  window.addEventListener(
    "resize",
    requestCinematicUpdate
  );

  // Initialiser les scènes dès le chargement du script.
  requestCinematicUpdate();

} // Fin du moteur cinématographique


/* =========================================
   20. NAVIGATION MOBILE — MENU HAMBURGER
========================================= */

const menuToggle = document.querySelector(".menu-toggle");
const mainNavigation = document.querySelector("#main-navigation");

if (menuToggle && mainNavigation) {

  // Fermer le menu et actualiser son accessibilité.
  function closeMobileMenu() {
    mainNavigation.classList.remove("is-open");
    menuToggle.classList.remove("is-open");

    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Ouvrir le menu");
  }

  // Ouvrir ou fermer le menu.
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNavigation.classList.toggle("is-open");

    menuToggle.classList.toggle("is-open", isOpen);

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Fermer le menu" : "Ouvrir le menu"
    );
  });

  // Fermer après un clic sur un lien.
  mainNavigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  // Fermer avec la touche Échap.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
    }
  });

  // Fermer en cliquant à l'extérieur du menu.
  document.addEventListener("click", (event) => {
    if (
      !mainNavigation.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeMobileMenu();
    }
  });
}


/* =========================================
   21. NAVIGATION — CALCUL DES POSITIONS
========================================= */

function navigateToScene(sceneId) {
  const targetIndex = cinematicScenes.findIndex(
    (scene) => scene.id === sceneId
  );

  if (
    targetIndex === -1 ||
    !cinematicStage ||
    !cinematicScreen
  ) {
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

  // Position de base de la scène.
  let targetScroll = targetIndex * 2 * screenHeight;

  // Ajouter la durée de présentation du concept Mythweave.
  if (mythSceneIndex >= 0 && targetIndex > mythSceneIndex) {
    targetScroll += mythDistance;
  }

  // Ajouter les séquences Web et Baladins.
  if (webSceneIndex >= 0 && targetIndex > webSceneIndex) {
    targetScroll += servicesDistance + projectDistance;
  }

  // Convertir la position relative en position dans la page.
  const targetPosition =
    cinematicStage.getBoundingClientRect().top +
    window.scrollY +
    targetScroll;

  // Déplacement vers la scène demandée.
  window.scrollTo({
    top: targetPosition,
    behavior: reducedMotion ? "instant" : "smooth"
  });
}


/* =========================================
   22. NAVIGATION — INTERACTIONS
========================================= */

// Liens du menu principal.
navigationLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    navigateToScene(link.dataset.scene);
  });
});

// Clic sur le logo : retour à l'accueil.
if (logo) {
  logo.addEventListener("click", (event) => {
    event.preventDefault();
    navigateToScene("accueil");
  });
}
