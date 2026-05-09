/**
 * Fichier : main.js
 * Description : Gère les interactions globales du portfolio (JS)
 * 
 * Remarque : Si tu veux tester des requêtes "fetch" ou l'envoi d'un formulaire,
 *            il faudra un environnement local avec un mini serveur 
 *            (ex. XAMPP, WAMP, node, etc.).
 */

// Configuration globale
const config = {
  animationOffset: 100,   // Décalage pour le déclenchement des animations AOS
  alertDuration: 5000,    // Durée d'affichage des alertes (en ms)
  projectTransition: 300, // Durée (en ms) pour la transition de filtrage des projets
  debounceDelay: 300,     // Délai pour le debouncing (en ms)
  maxRetries: 3           // Nombre maximum de tentatives pour les requêtes
};

// Gestion globale des erreurs
window.addEventListener('error', (event) => {
  console.error('Erreur JavaScript:', event.error);
  // Ne pas afficher d'alerte pour éviter de perturber l'utilisateur
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise rejetée:', event.reason);
  event.preventDefault();
});

// Utilitaires de performance
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Au chargement du DOM, on initialise nos différentes fonctionnalités
document.addEventListener('DOMContentLoaded', () => {
  initAnimations();
  initProjectFilter();
  initCategoryFilter();
  initContactForm();
  initSkillAnimations();
  initProjectNavigation();
  initTooltips();
  initThemeToggle();
  initSystemThemeListener();
  initImageEnlargeButtons();
  selfTestImageEnlarge();
});

/**
 * Initialise les animations au scroll (exemple AOS)
 * Nécessite la bibliothèque AOS si tu l'utilises.
 */
function initAnimations() {
  // Vérifie si AOS existe dans le scope
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-out-quad',
      once: true,
      mirror: false,
      offset: config.animationOffset
    });
  }
}

/**
 * Gestion du filtrage des projets
 * Ici, on suppose que tu as des éléments avec des classes
 * .project-filter et .project-card. 
 * À adapter selon ton HTML.
 */
function initProjectFilter() {
  const filters = document.querySelectorAll('.project-filter');
  const projects = document.querySelectorAll('.project-card');

  // On parcourt tous les filtres
  filters.forEach(filter => {
    filter.addEventListener('click', () => handleFilterClick(filter, projects, filters));
  });
}

/**
 * Gère le clic sur un filtre 
 * @param {HTMLElement} clickedFilter - Le filtre sur lequel on a cliqué
 * @param {NodeList} projects - Les éléments projets
 * @param {NodeList} filters - Tous les filtres
 */
function handleFilterClick(clickedFilter, projects, filters) {
  const filterValue = clickedFilter.dataset.filter;
  
  // Mise à jour visuelle (on enlève la classe active à tous, on l'ajoute à celui cliqué)
  filters.forEach(f => f.classList.remove('active'));
  clickedFilter.classList.add('active');
  
  // Animation des projets : 
  // On vérifie si project.dataset.technologies inclut la tech correspondante
  projects.forEach(project => {
    const match = (filterValue === 'all') || project.dataset.technologies.includes(filterValue);
    
    project.style.transition = `opacity ${config.projectTransition}ms ease`;
    project.style.opacity = match ? 1 : 0;           
    project.style.pointerEvents = match ? 'auto' : 'none'; 
  });
}

/**
 * Gestion du formulaire de contact (si présent dans la page)
 */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;  // Si le formulaire n'existe pas, on quitte la fonction

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // On vérifie que tous les champs required ne sont pas vides
    if (!validateForm(form)) return;

    try {
      // Envoi des données
      const response = await submitFormData(form);
      // Gestion de la réponse
      handleFormResponse(response, form);
    } catch (error) {
      // En cas d'erreur réseau ou autre
      handleFormError(error);
    }
  });
}

/**
 * Valide les champs du formulaire (ex : tous les required)
 * @param {HTMLFormElement} form 
 * @returns {boolean} Vrai si valide, faux sinon
 */
function validateForm(form) {
  const requiredFields = Array.from(form.querySelectorAll('[required]'));
  return requiredFields.every(field => {
    if (!field.value.trim()) {
      showAlert('Tous les champs obligatoires doivent être remplis', 'error');
      return false;
    }
    return true;
  });
}

/**
 * Soumission des données du formulaire 
 * Fait un appel fetch vers form.action (à adapter si tu n'as pas de backend)
 * @param {HTMLFormElement} form 
 * @returns {object} Réponse JSON
 */
async function submitFormData(form) {
  const formData = new FormData(form);
  
  // Exemple d'ajout d'un token CSRF (si nécessaire)
  // formData.append('csrf_token', 'token_valeur');

  const response = await fetch(form.action, {
    method: 'POST',
    body: formData,
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Gestion de la réponse du formulaire (réussite, échec...)
 * @param {object} response - Réponse en JSON
 * @param {HTMLFormElement} form 
 */
function handleFormResponse(response, form) {
  if (response.success) {
    showAlert('Message envoyé avec succès!', 'success');
    form.reset(); 
  } else {
    // Si le serveur renvoie un message d'erreur spécifique
    showAlert(`Erreur: ${response.message}`, 'error');
  }
}

/**
 * Gestion d'erreur (par ex. erreur réseau)
 * @param {Error} error 
 */
function handleFormError(error) {
  console.error('Erreur:', error);
  showAlert('Une erreur réseau est survenue', 'error');
}

function initCategoryFilter() {
  const filters = document.querySelectorAll('.filter-btn');
  const container = document.querySelector('.projets-grid');
  const cards = container ? Array.from(container.querySelectorAll('.projet-card')) : [];
  if (!filters.length || !cards.length || !container) return;
  // Exclure les projets personnels (masqués par CSS)
  const original = cards.filter(c => c.dataset.category !== 'personnel');
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      const wasActive = btn.classList.contains('active');
      filters.forEach(f => f.classList.remove('active'));
      if (wasActive) {
        original.forEach(c => container.appendChild(c));
        original.forEach(c => {
          c.style.transition = `opacity ${config.projectTransition}ms ease`;
          c.style.opacity = 1;
          c.style.pointerEvents = 'auto';
        });
        return;
      }
      btn.classList.add('active');
      const value = btn.dataset.filter;
      const sorted = original.slice().sort((a, b) => {
        const am = a.dataset.category === value ? 1 : 0;
        const bm = b.dataset.category === value ? 1 : 0;
        return bm - am;
      });
      sorted.forEach(c => container.appendChild(c));
      sorted.forEach(c => {
        const match = c.dataset.category === value;
        c.style.transition = `opacity ${config.projectTransition}ms ease`;
        c.style.opacity = match ? 1 : 0;
        c.style.pointerEvents = match ? 'auto' : 'none';
      });
    });
  });
}

/**
 * Affiche un message d'alerte dans la page
 * @param {string} message - Le texte du message
 * @param {string} type - success | error
 */
function showAlert(message, type) {
  // On crée un élément div pour l'alerte
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} fade-in`;
  alert.innerHTML = `
    <span class="alert-icon">${type === 'success' ? '✓' : '⚠'}</span>
    ${message}
  `;

  // On l'ajoute au body
  document.body.appendChild(alert);
  
  // On le retire après un délai (config.alertDuration)
  setTimeout(() => {
    alert.classList.add('fade-out');
    setTimeout(() => alert.remove(), 500);
  }, config.alertDuration);
}

/**
 * Animation des barres de compétences (ex. progress-bar)
 * Exemple : la largeur part de 0% jusqu'au % désiré
 */
function initSkillAnimations() {
  const skills = document.querySelectorAll('.progress-bar[aria-valuenow]');
  
  skills.forEach(skill => {
    const targetWidth = skill.getAttribute('aria-valuenow');
    skill.style.width = '0%';
    setTimeout(() => {
      skill.style.width = `${targetWidth}%`;
    }, 500);
  });
}

/**
 * Navigation entre projets : 
 * Ici, on redirige vers portfolio-details.html?id=xxx
 * en se basant sur data-project-id
 */
function initProjectNavigation() {
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => {
      const projectId = card.dataset.projectId;
      if (projectId) {
        window.location.href = `portfolio-details.html?id=${projectId}`;
      }
    });
  });
}

/**
 * Initialise les tooltips Bootstrap (si tu utilises Bootstrap)
 */
function initTooltips() {
  if (typeof bootstrap !== 'undefined') {
    const tooltipTriggerList = [...document.querySelectorAll('[data-bs-toggle="tooltip"]')];
    tooltipTriggerList.map(triggerEl => new bootstrap.Tooltip(triggerEl, {
      boundary: document.body,
      trigger: 'hover focus'
    }));
  }
}

/**
 * Boutons d'agrandissement des images (pages projet)
 */
function initImageEnlargeButtons() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.enlarge-btn');
    if (!btn) return;
    const card = btn.closest('.code-card');
    const img = card ? card.querySelector('img') : null;
    if (!img) return;
    const zoomed = img.classList.toggle('zoomed');
    btn.setAttribute('aria-pressed', zoomed ? 'true' : 'false');
    btn.innerHTML = zoomed
      ? '<i class="bi bi-arrows-angle-contract"></i> Réduire'
      : '<i class="bi bi-arrows-fullscreen"></i> Agrandir l’image';
  });
}

function selfTestImageEnlarge() {
  try {
    if (!location.pathname.includes('regle-de-remise.html')) return;
    const buttons = Array.from(document.querySelectorAll('.code-card .enlarge-btn'));
    if (!buttons.length) return;
    const results = [];
    buttons.forEach((btn) => {
      const img = btn.closest('.code-card')?.querySelector('img');
      if (!img) return;
      btn.click();
      const first = img.classList.contains('zoomed') && btn.innerHTML.includes('Réduire');
      btn.click();
      const second = !img.classList.contains('zoomed') && btn.innerHTML.includes('Agrandir');
      results.push(first && second);
    });
    const ok = results.every(Boolean);
    if (ok) {
      showAlert('Test boutons images: OK', 'success');
    } else {
      showAlert('Test boutons images: échec', 'error');
    }
  } catch (e) {
    console.error(e);
  }
}

// Fin du fichier main.js
// Les fonctions sont disponibles globalement



/**
 * Fonctions spécifiques à BTS_SIO.html
 */

// Activation des onglets SLAM/SISR
function initBTSTabs() {
  const options = document.querySelectorAll('.option');
  
  options.forEach(option => {
    option.addEventListener('click', () => {
      // Retire la classe active de toutes les options
      options.forEach(opt => opt.classList.remove('active'));
      // Ajoute la classe active à l'option cliquée
      option.classList.add('active');
      
      // Animation de transition
      option.style.transform = 'scale(0.98)';
      setTimeout(() => {
        option.style.transform = 'scale(1)';
      }, 200);
    });
  });
}

// Affichage des PDF en modal
function initPDFPreviews() {
  const pdfLinks = document.querySelectorAll('[data-pdf-preview]');
  
  pdfLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const pdfUrl = link.href;
      showPDFModal(pdfUrl);
    });
  });
}

function showPDFModal(pdfUrl) {
  const modalHTML = `
    <div class="pdf-modal">
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <iframe src="${pdfUrl}#view=fitH" frameborder="0"></iframe>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  const modal = document.querySelector('.pdf-modal');
  
  // Fermeture de la modal
  document.querySelector('.close-modal').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// Smooth scroll pour la navigation interne
function initBTSScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Mise à jour de l'initialisation principale
document.addEventListener('DOMContentLoaded', () => {
  // ... autres initialisations
  
  // Fonctions spécifiques à BTS_SIO
  if (document.querySelector('.bts-page')) {
    initBTSTabs();
    initPDFPreviews();
    initBTSScroll();
  }
});

/**
 * Initialise le système de basculement du mode sombre
 */
function initThemeToggle() {
  // Créer le bouton de basculement s'il n'existe pas
  if (!document.querySelector('.theme-toggle')) {
    createThemeToggleButton();
  }
  
  // Charger le thème sauvegardé
  loadSavedTheme();
  
  // Ajouter l'événement de clic
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

/**
 * Crée le bouton de basculement du mode sombre
 */
function createThemeToggleButton() {
  const toggleButton = document.createElement('button');
  toggleButton.className = 'theme-toggle';
  toggleButton.innerHTML = '<i class="bi bi-moon-fill"></i>';
  toggleButton.setAttribute('aria-label', 'Basculer le mode sombre');
  toggleButton.setAttribute('title', 'Basculer le mode sombre');
  
  document.body.appendChild(toggleButton);
}

/**
 * Bascule entre le mode clair et sombre
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  setTheme(newTheme);
  saveTheme(newTheme);
}

/**
 * Applique un thème spécifique
 * @param {string} theme - 'light' ou 'dark'
 */
function setTheme(theme) {
  const themeToggle = document.querySelector('.theme-toggle');
  
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (themeToggle) {
      themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
      themeToggle.setAttribute('title', 'Basculer vers le mode clair');
    }
  } else {
    document.documentElement.removeAttribute('data-theme');
    if (themeToggle) {
      themeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>';
      themeToggle.setAttribute('title', 'Basculer vers le mode sombre');
    }
  }
}

/**
 * Sauvegarde le thème dans le localStorage
 * @param {string} theme - 'light' ou 'dark'
 */
function saveTheme(theme) {
  try {
    localStorage.setItem('portfolio-theme', theme);
  } catch (error) {
    console.warn('Impossible de sauvegarder le thème:', error);
  }
}

/**
 * Charge le thème sauvegardé depuis le localStorage
 */
function loadSavedTheme() {
  try {
    const savedTheme = localStorage.getItem('portfolio-theme');
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Détecter la préférence système
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  } catch (error) {
    console.warn('Impossible de charger le thème sauvegardé:', error);
    setTheme('light'); // Thème par défaut
  }
}

/**
 * Écoute les changements de préférence système
 */
function initSystemThemeListener() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  mediaQuery.addEventListener('change', (e) => {
    // Ne change que si aucun thème n'est sauvegardé
    const savedTheme = localStorage.getItem('portfolio-theme');
    if (!savedTheme) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });
 }
