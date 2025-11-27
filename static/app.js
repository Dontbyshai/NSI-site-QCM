/* ==========================================================================
   JS : Gestion du formulaire, validation et affichage dynamique
   ========================================================================== */

// On attend que toute la page HTML soit chargée avant de lancer le script
document.addEventListener('DOMContentLoaded', () => {

  // 1. Récupération des éléments importants du HTML
  const form = document.getElementById('quiz-form');
  if (!form) return; // Si pas de formulaire, on arrête tout (sécurité)

  const osSelect = document.getElementById('os'); // Le menu déroulant "Votre système"

  // Les 3 blocs de questions Q5 (cachés par défaut)
  const q5Windows = document.getElementById('q5-windows');
  const q5Mac = document.getElementById('q5-macos');
  const q5Linux = document.getElementById('q5-linux');

  // Éléments de la fenêtre de confirmation (Modal)
  const modal = document.getElementById('confirm-modal');
  const modalYes = document.getElementById('modal-yes');
  const modalNo = document.getElementById('modal-no');

  /* ---------------------------------------------------------
     GESTION DE L'AFFICHAGE DYNAMIQUE (Q5 selon l'OS)
     --------------------------------------------------------- */
  function showQ5ForOS(value) {
    // Étape 1 : On cache TOUTES les questions Q5
    [q5Windows, q5Mac, q5Linux].forEach(b => { if (b) b.setAttribute('hidden', ''); });

    // Étape 2 : On affiche celle qui correspond au choix de l'utilisateur
    if (value === 'windows' && q5Windows) q5Windows.removeAttribute('hidden');
    if (value === 'macos' && q5Mac) q5Mac.removeAttribute('hidden');
    if (value === 'linux' && q5Linux) q5Linux.removeAttribute('hidden');
  }

  // On écoute le changement de valeur dans le menu déroulant
  if (osSelect) {
    osSelect.addEventListener('change', e => showQ5ForOS(e.target.value));
    // On lance la fonction une première fois au chargement (au cas où une valeur est déjà mise)
    showQ5ForOS(osSelect.value);
  }

  /* ---------------------------------------------------------
     FONCTIONS UTILITAIRES POUR LA VALIDATION (Rouge/Vert)
     --------------------------------------------------------- */

  // Crée ou récupère le petit message d'erreur en bas du champ
  function ensureErrorEl(container) {
    let err = container.querySelector('.error-msg');
    if (!err) {
      err = document.createElement('div');
      err.className = 'error-msg';
      container.appendChild(err);
    }
    return err;
  }

  // Affiche une erreur (Bordure rouge + Message)
  function setError(container, msg) {
    container.classList.add('invalid');   // Ajoute la classe CSS rouge
    container.classList.remove('valid');  // Enlève la classe verte
    const err = ensureErrorEl(container);
    err.textContent = msg; // Affiche le texte de l'erreur

    // Pour l'accessibilité (lecteurs d'écran)
    const input = container.querySelector('input, select, textarea, fieldset');
    if (input) input.setAttribute('aria-invalid', 'true');
  }

  // Efface l'erreur (Remet à zéro)
  function clearError(container) {
    container.classList.remove('invalid');
    container.classList.remove('valid');
    const err = container.querySelector('.error-msg');
    if (err) err.textContent = ''; // Vide le message
    const input = container.querySelector('input, select, textarea, fieldset');
    if (input) input.removeAttribute('aria-invalid');
  }

  // Valide le champ (Bordure verte)
  function markValid(container) {
    container.classList.remove('invalid');
    container.classList.add('valid'); // Ajoute la classe CSS verte
    const err = container.querySelector('.error-msg');
    if (err) err.textContent = '';
    const input = container.querySelector('input, select, textarea, fieldset');
    if (input) input.removeAttribute('aria-invalid');
  }

  /* ---------------------------------------------------------
     VALIDATION COMPLÈTE DU FORMULAIRE
     Cette fonction vérifie tout quand on clique sur "Valider"
     --------------------------------------------------------- */
  function validateForm() {
    let ok = true; // On part du principe que tout est bon

    // 1) Vérification du Nom (doit faire au moins 2 lettres)
    const nomInput = document.getElementById('nom');
    const nomField = nomInput.closest('.field');
    const nom = (nomInput.value || '').trim(); // .trim() enlève les espaces inutiles
    if (nom.length < 2) {
      setError(nomField, 'Veuillez renseigner votre nom (au moins 2 caractères).');
      ok = false; // Il y a une erreur !
    } else {
      markValid(nomField);
    }

    // 2) Vérification de l'OS (doit être sélectionné)
    const osField = osSelect.closest('.field');
    if (!osSelect.value) {
      setError(osField, 'Sélectionnez votre système (Windows, macOS ou Linux).');
      ok = false;
    } else {
      markValid(osField);
    }

    // 3) Vérification des questions Q1 à Q4 (Boutons radio)
    function checkRadio(groupName, qBlockId, label) {
      // Cherche si un bouton est coché dans le groupe
      const group = form.querySelector(`input[name="${groupName}"]:checked`);
      const block = document.getElementById(qBlockId);

      if (!group) {
        setError(block, `Veuillez répondre à ${label}.`);
        ok = false;
      } else {
        markValid(block);
      }
    }
    // On lance la vérification pour chaque question
    checkRadio('q1', 'q-block-q1', 'la question 1');
    checkRadio('q2', 'q-block-q2', 'la question 2');
    checkRadio('q3', 'q-block-q3', 'la question 3');
    checkRadio('q4', 'q-block-q4', 'la question 4');

    // 4) Vérification de Q5 (Un peu spécial car dépend de l'OS)
    const q5Checked = form.querySelector('input[name="q5"]:checked');

    // On identifie quel bloc Q5 est visible actuellement
    let q5Container = null;
    if (osSelect.value === 'windows') q5Container = q5Windows;
    if (osSelect.value === 'macos') q5Container = q5Mac;
    if (osSelect.value === 'linux') q5Container = q5Linux;

    if (!q5Checked) {
      // Si rien n'est coché, on met l'erreur sur le bloc visible
      if (q5Container) setError(q5Container, 'Veuillez répondre à la question 5.');
      ok = false;
    } else {
      if (q5Container) markValid(q5Container);
    }

    // Si il y a des erreurs, on scrolle automatiquement vers la première erreur
    if (!ok) {
      const firstInvalid = form.querySelector('.invalid');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return ok; // Renvoie true si tout est bon, false sinon
  }

  // Ajoute des ID aux blocs de questions pour faciliter la validation
  const qBlocks = form.querySelectorAll('.q-block');
  qBlocks.forEach((b, i) => {
    if (!b.id) b.id = `q-block-q${i + 1}`;
  });

  // Efface les erreurs dès que l'utilisateur commence à corriger
  form.addEventListener('input', (e) => {
    const wrapper = e.target.closest('.field, .q-block');
    if (wrapper) clearError(wrapper);
  });
  form.addEventListener('change', (e) => {
    const wrapper = e.target.closest('.field, .q-block');
    if (wrapper) clearError(wrapper);
  });

  /* ---------------------------------------------------------
     GESTION DE LA MODALE (Fenêtre de confirmation)
     --------------------------------------------------------- */
  function openModal() {
    if (!modal) return;
    modal.removeAttribute('hidden'); // Affiche la modale
    document.body.classList.add('below-modal'); // Bloque le scroll de la page
    if (document.getElementById('modal-yes')) document.getElementById('modal-yes').focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.setAttribute('hidden', ''); // Cache la modale
    document.body.classList.remove('below-modal'); // Réactive le scroll
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.focus(); // Remet le focus sur le bouton valider
  }

  let bypassConfirm = false; // Variable pour savoir si on a confirmé

  // INTERCEPTION DE L'ENVOI DU FORMULAIRE
  form.addEventListener('submit', (e) => {
    if (bypassConfirm) return; // Si on a déjà dit "Oui", on laisse le formulaire partir

    e.preventDefault(); // STOP ! On empêche l'envoi immédiat

    const ok = validateForm(); // On vérifie tout
    if (!ok) return; // Si erreurs, on s'arrête là (les messages rouges sont affichés)

    // Si tout est valide, on ouvre la fenêtre de confirmation
    openModal();
  });

  // Gestion des clics dans la modale
  document.addEventListener('click', (ev) => {
    const t = ev.target;

    // Clic sur OUI
    if (t && t.id === 'modal-yes') {
      bypassConfirm = true; // On autorise l'envoi
      closeModal();
      form.submit(); // On envoie vraiment le formulaire cette fois !
    }

    // Clic sur NON
    if (t && t.id === 'modal-no') {
      closeModal(); // On ferme juste la fenêtre
    }

    // Clic en dehors de la boîte (sur le fond sombre)
    if (t && t === modal) {
      closeModal();
    }
  });

  // Touche ECHAP pour fermer la modale
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && modal && !modal.hasAttribute('hidden')) {
      closeModal();
    }
  });
});
