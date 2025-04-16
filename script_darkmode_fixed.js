
let iconsData = {};
let iconsLoaded = 0;
const batchSize = 40;
let filteredIcons = [];

fetch('icons_sorted_structure.json')
  .then(res => res.json())
  .then(data => {
    iconsData = data;
    filteredIcons = getFilteredIcons('');
    renderNextBatch();
  });

document.getElementById('searchInput').addEventListener('input', (e) => {
  iconsLoaded = 0;
  filteredIcons = getFilteredIcons(e.target.value);
  document.getElementById('iconsGrid').innerHTML = '';
  renderNextBatch();
});

function getFilteredIcons(search) {
  const results = [];
  const walk = (node, path) => {
    if (node.files) {
      for (const file of node.files) {
        if (file.toLowerCase().includes(search.toLowerCase())) {
          results.push({ path: `${path}/${file}`, name: file });
        }
      }
    }
    for (const key in node) {
      if (key !== 'files') {
        walk(node[key], path ? `${path}/${key}` : key);
      }
    }
  };
  walk(iconsData, '');
  document.getElementById('noResults').classList.toggle('hidden', results.length > 0);
  return results;
}

function renderNextBatch() {
  const grid = document.getElementById('iconsGrid');
  const batch = filteredIcons.slice(iconsLoaded, iconsLoaded + batchSize);

  for (const icon of batch) {
    const card = document.createElement('div');
    card.className = 'rounded-xl p-4 transition shadow hover:shadow-lg bg-white text-neutral-900 dark:bg-neutral-800 dark:text-white text-center relative group cursor-pointer';

    const fileName = icon.name;
    const friendlyName = fileName
      .replace(/\.(svg|png)/, '')
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    card.innerHTML = `
      <div class="relative group flex flex-col items-center">
        <img data-src="Icons_Sorted${icon.path}" alt="${fileName}" class="lazy-image h-12 object-contain" style="pointer-events: none;" />
        <div class="text-xs mt-2 truncate w-full" title="${fileName}">${friendlyName}</div>
        <div class="copy-tooltip absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition bg-black dark:bg-neutral-700 text-white text-xs px-2 py-1 whitespace-nowrap rounded shadow-md z-50 pointer-events-none">
          Copier l’image
        </div>
        <div class="absolute hidden group-hover:flex items-center justify-center px-3 py-1 rounded bg-black dark:bg-neutral-700 text-white text-xs top-0 left-1/2 transform -translate-x-1/2 -translate-y-full whitespace-nowrap shadow-md z-50">
          ${fileName}
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = `Icons_Sorted${icon.path}`;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => {
          if (blob) {
            const item = new ClipboardItem({ 'image/png': blob });
            navigator.clipboard.write([item]);
          }
        });
      };

      const tooltip = card.querySelector('.copy-tooltip');
      if (tooltip) {
        tooltip.textContent = '✔ Copié';
        tooltip.classList.remove('bg-black', 'dark:bg-neutral-700');
        tooltip.classList.add('bg-green-500');

        setTimeout(() => {
          tooltip.textContent = 'Copier l’image';
          tooltip.classList.remove('bg-green-500');
          tooltip.classList.add('bg-black', 'dark:bg-neutral-700');
        }, 1000);
      }
    });

    grid.appendChild(card);
  }

  lazyLoadImages();
  iconsLoaded += batch.length;
}

function lazyLoadImages() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.onload = () => img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('img[data-src]:not([src])').forEach(img => {
    observer.observe(img);
  });
}

window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
    renderNextBatch();
  }
});

const html = document.documentElement;
const toggleDark = document.getElementById('toggleDark');
const saved = localStorage.getItem('theme');
if (saved === 'dark') html.classList.add('dark');
else html.classList.remove('dark');
toggleDark.innerText = html.classList.contains('dark') ? 'Désactiver le mode sombre' : 'Mode sombre';

toggleDark.addEventListener('click', () => {
  const isDark = html.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  toggleDark.innerText = isDark ? 'Désactiver le mode sombre' : 'Mode sombre';
});
