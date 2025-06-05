// -------------------------------------------------
// 1) Exemple de tableau d’icônes (à remplacer par la vôtre)
// -------------------------------------------------
const icons = [
  {
    name: 'home',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z"/></svg>'
  },
  {
    name: 'search',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21.53 20.47l-4.82-4.82a8 8 0 10-1.06 1.06l4.82 4.82a.75.75 0 001.06-1.06zM10.5 17a6.5 6.5 0 110-13 6.5 6.5 0 010 13z"/></svg>'
  }
  // … placez ici l’ensemble de vos icônes
];

// -------------------------------------------------
// 2) Variables globales pour favoris, historique, modale, etc.
// -------------------------------------------------
let showFavorites = false;
let showHistory = false;
let favorites = JSON.parse(localStorage.getItem('iconFavorites') || '[]');
let history = JSON.parse(localStorage.getItem('iconHistory') || '[]');

// Configuration Fuse.js pour la recherche fuzzy
const fuseOptions = { keys: ['name'], threshold: 0.3 };
const fuse = new Fuse(icons, fuseOptions);

// Sélections DOM
const iconsGrid = document.getElementById('icons-grid');
const favoritesList = document.getElementById('favorites-list');
const historyList = document.getElementById('history-list');
const mainSection = document.getElementById('main-section');
const favoritesSection = document.getElementById('favorites-section');
const historySection = document.getElementById('history-section');
const searchInput = document.getElementById('search');
const toggleFavBtn = document.getElementById('toggle-favorites');
const toggleHistBtn = document.getElementById('toggle-history');
const exportZipBtn = document.getElementById('export-zip');

const previewModal = document.getElementById('preview-modal');
const previewIcon = document.getElementById('preview-icon');
const closeModalBtn = document.getElementById('close-modal');
const copySvgBtn = document.getElementById('copy-svg');
const copyPngBtn = document.getElementById('copy-png');
const formatMenuToggle = document.getElementById('format-menu-toggle');
const formatMenu = document.getElementById('format-menu');
const formatOptions = document.querySelectorAll('.format-option');
const toggleFavModalBtn = document.getElementById('toggle-favorite-modal');
const favIconModal = document.getElementById('fav-icon-modal');

let currentIcon = null;

// -------------------------------------------------
// 3) Fonctions de sauvegarde en localStorage
// -------------------------------------------------
function saveFavorites() {
  localStorage.setItem('iconFavorites', JSON.stringify(favorites));
}

function saveHistory() {
  localStorage.setItem('iconHistory', JSON.stringify(history));
}

function addToHistory(icon) {
  // Déjà présent ? On le retire puis le remet en tête
  history = history.filter(i => i.name !== icon.name);
  history.unshift(icon);
  if (history.length > 20) history.pop();
  saveHistory();
}

// -------------------------------------------------
// 4) Rendu d’une liste d’icônes (grid)
// -------------------------------------------------
function renderIcons(list, container) {
  container.innerHTML = '';
  list.forEach(icon => {
    const div = document.createElement('div');
    div.classList.add(
      'relative',
      'p-2',
      'border',
      'border-gray-200',
      'dark:border-gray-700',
      'rounded-md',
      'hover:bg-gray-100',
      'dark:hover:bg-gray-800',
      'cursor-pointer'
    );
    div.innerHTML = `
      <div class="icon-content text-4xl" data-name="\${icon.name}">\${icon.svg}</div>
      <button class="favorite-btn absolute top-1 right-1 text-yellow-500 \${favorites.find(f => f.name === icon.name) ? 'opacity-100' : 'opacity-20'}">
        <i class="fas fa-star"></i>
      </button>
    `;
    // Clic sur l'icône -> ouvre la modale
    div.querySelector('.icon-content').addEventListener('click', () => openPreview(icon));
    // Clic sur étoile -> toggle favori
    div.querySelector('.favorite-btn').addEventListener('click', e => {
      e.stopPropagation();
      toggleFavorite(icon);
      renderAll();
    });
    container.appendChild(div);
  });
}

// -------------------------------------------------
// 5) Ouverture/fermeture de la modale d’aperçu
// -------------------------------------------------
function openPreview(icon) {
  currentIcon = icon;
  previewIcon.innerHTML = icon.svg;
  favIconModal.classList.toggle('text-yellow-500', !!favorites.find(f => f.name === icon.name));
  previewModal.classList.remove('hidden');
  addToHistory(icon);
}

function closePreview() {
  previewModal.classList.add('hidden');
  currentIcon = null;
}

// -------------------------------------------------
// 6) Toggle favori (dans modale ou grille)
// -------------------------------------------------
function toggleFavorite(icon) {
  if (favorites.find(f => f.name === icon.name)) {
    favorites = favorites.filter(f => f.name !== icon.name);
  } else {
    favorites.push(icon);
  }
  saveFavorites();
}

// -------------------------------------------------
// 7) Copier SVG dans le presse-papier
// -------------------------------------------------
function copySvg(icon) {
  const blob = new Blob([icon.svg], { type: 'image/svg+xml' });
  const item = new ClipboardItem({ 'image/svg+xml': blob });
  navigator.clipboard.write([item]);
}

// -------------------------------------------------
// 8) Copier PNG (canvg) dans le presse-papier
// -------------------------------------------------
async function copyPng(icon, size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  await canvg.Canvg.fromString(ctx, icon.svg).then(v => v.render());
  canvas.toBlob(blob => {
    const item = new ClipboardItem({ 'image/png': blob });
    navigator.clipboard.write([item]);
  });
}

// -------------------------------------------------
// 9) Télécharger dans différents formats
// -------------------------------------------------
async function downloadFormat(icon, format) {
  if (format === 'svg') {
    const blob = new Blob([icon.svg], { type: 'image/svg+xml' });
    saveAs(blob, `\${icon.name}.svg`);
  } else if (format.startsWith('png')) {
    const size = parseInt(format.split('-')[1]);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    await canvg.Canvg.fromString(ctx, icon.svg).then(v => v.render());
    canvas.toBlob(blob => saveAs(blob, `\${icon.name}_\${size}x\${size}.png`));
  } else if (format === 'ico') {
    // Exemple simplifié : on crée un ZIP contenant 16×16 et 32×32
    const zip = new JSZip();
    const canvas16 = document.createElement('canvas');
    const canvas32 = document.createElement('canvas');
    canvas16.width = canvas16.height = 16;
    canvas32.width = canvas32.height = 32;
    const ctx16 = canvas16.getContext('2d');
    const ctx32 = canvas32.getContext('2d');
    await canvg.Canvg.fromString(ctx16, icon.svg).then(v => v.render());
    await canvg.Canvg.fromString(ctx32, icon.svg).then(v => v.render());
    const blob16 = await new Promise(res => canvas16.toBlob(res, 'image/png'));
    const blob32 = await new Promise(res => canvas32.toBlob(res, 'image/png'));
    zip.file(`\${icon.name}_16x16.png`, blob16);
    zip.file(`\${icon.name}_32x32.png`, blob32);
    zip.generateAsync({ type: 'blob' }).then(content => saveAs(content, `\${icon.name}_pack.zip`));
  }
}

// -------------------------------------------------
// 10) Rendu global (selon recherche / favoris / historique)
// -------------------------------------------------
function renderAll() {
  const query = searchInput.value.trim();
  let results;
  if (query) {
    results = fuse.search(query).map(r => r.item);
  } else {
    results = icons;
  }

  // Si on affiche les favoris
  if (showFavorites) {
    const favIcons = favorites.filter(icon => (!query) || (fuse.search(query).some(r => r.item.name === icon.name)));
    renderIcons(favIcons, favoritesList);
  }
  // Si on affiche l'historique
  if (showHistory) {
    const histIcons = history.filter(icon => (!query) || (fuse.search(query).some(r => r.item.name === icon.name)));
    renderIcons(histIcons, historyList);
  }
  // Sinon affichage normal
  if (!showFavorites && !showHistory) {
    renderIcons(results, iconsGrid);
  }

  // Bouton Export scraper visible seulement en mode grille avec recherche active
  if (!showFavorites && !showHistory && query) {
    exportZipBtn.classList.remove('hidden');
  } else {
    exportZipBtn.classList.add('hidden');
  }
}

// -------------------------------------------------
// 11) Gestion du toggle Thème Dark/Light
// -------------------------------------------------
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
function updateThemeIcon() {
  if (document.documentElement.classList.contains('dark')) {
    themeIcon.classList.replace('fa-moon', 'fa-sun');
  } else {
    themeIcon.classList.replace('fa-sun', 'fa-moon');
  }
}
themeToggleBtn.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  updateThemeIcon();
});
// Initialisation selon préférence système
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark');
}
updateThemeIcon();

// -------------------------------------------------
// 12) Événements DOM
// -------------------------------------------------
searchInput.addEventListener('input', () => renderAll());

toggleFavBtn.addEventListener('click', () => {
  showFavorites = !showFavorites;
  showHistory = false;
  favoritesSection.classList.toggle('hidden', !showFavorites);
  historySection.classList.add('hidden');
  mainSection.classList.toggle('hidden', showFavorites);
  renderAll();
});
toggleHistBtn.addEventListener('click', () => {
  showHistory = !showHistory;
  showFavorites = false;
  historySection.classList.toggle('hidden', !showHistory);
  favoritesSection.classList.add('hidden');
  mainSection.classList.toggle('hidden', showHistory);
  renderAll();
});

closeModalBtn.addEventListener('click', closePreview);
copySvgBtn.addEventListener('click', () => { if (currentIcon) copySvg(currentIcon); });
copyPngBtn.addEventListener('click', () => { if (currentIcon) copyPng(currentIcon, 128); });

formatMenuToggle.addEventListener('click', () => formatMenu.classList.toggle('hidden'));
formatOptions.forEach(btn => {
  btn.addEventListener('click', () => {
    const format = btn.getAttribute('data-format');
    if (currentIcon) downloadFormat(currentIcon, format);
    formatMenu.classList.add('hidden');
  });
});

toggleFavModalBtn.addEventListener('click', () => {
  if (currentIcon) toggleFavorite(currentIcon);
  favIconModal.classList.toggle('text-yellow-500');
  renderAll();
});

exportZipBtn.addEventListener('click', () => {
  const zip = new JSZip();
  const visibleIcons = fuse.search(searchInput.value.trim()).map(r => r.item);
  const promises = visibleIcons.map(icon => {
    return new Promise(async res => {
      const size = 128;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      await canvg.Canvg.fromString(ctx, icon.svg).then(v => v.render());
      canvas.toBlob(blob => {
        zip.file(`\${icon.name}_\${size}x\${size}.png`, blob);
        res();
      });
    });
  });
  Promise.all(promises).then(() => {
    zip.generateAsync({ type: 'blob' }).then(content => saveAs(content, `icons_pack.zip`));
  });
});

// -------------------------------------------------
// 13) Lancement du rendu initial
// -------------------------------------------------
renderAll();
