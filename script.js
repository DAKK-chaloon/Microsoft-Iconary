// Exécution dès que le DOM est entièrement chargé
window.addEventListener("DOMContentLoaded", () => {
  // Ajout du bandeau d'avertissement pour Firefox, inséré juste après l'en-tête
  if (navigator.userAgent.includes("Firefox")) {
    const banner = document.createElement("div");
    banner.innerText = "Attention : sous Firefox, la copie du SVG se fera en format PNG (fonctionnalités limitées).";
    // Styles pour un bandeau discret placé sous la navbar
    banner.style.backgroundColor = "#f0f0f0";
    banner.style.color = "#333";
    banner.style.padding = "5px 10px";
    banner.style.fontSize = "12px";
    banner.style.textAlign = "center";
    banner.style.borderBottom = "1px solid #ccc";
    banner.style.position = "relative";
    banner.style.marginBottom = "5px";
  
    // Création d'un bouton "Fermer" positionné à droite
    const closeBtn = document.createElement("button");
    closeBtn.innerText = "✖️";
    closeBtn.style.float = "right";
    closeBtn.style.background = "none";
    closeBtn.style.border = "none";
    closeBtn.style.color = "#007bff";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.fontSize = "12px";
    // Ajout du bouton dans le bandeau
    banner.appendChild(closeBtn);
    closeBtn.addEventListener("click", () => {
      banner.remove();
    });
  
    // Insérer le bandeau sous l'élément <header> s'il existe, sinon en début de <body>
    const header = document.querySelector("header");
    if (header && header.parentNode) {
      header.parentNode.insertBefore(banner, header.nextSibling);
    } else {
      document.body.prepend(banner);
    }
  }
  
  // ----------------------
  // Gestion du dark mode et du basculement
  // ----------------------
  const html = document.documentElement;
  const toggleDark = document.getElementById('toggleDark');
  
  const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l-1.414 1.414M7.05 7.05L5.636 5.636M12 8a4 4 0 100 8 4 4 0 000-8z"/>
  </svg>`;
  
  const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>`;
  
  toggleDark.innerHTML = html.classList.contains('dark') ? sunIcon : moonIcon;
  
  toggleDark.addEventListener('click', () => {
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      toggleDark.innerHTML = moonIcon;
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      toggleDark.innerHTML = sunIcon;
    }
  });
  
  // ------------------------------
  // Fonction utilitaire : conversion d'un Data URI en Blob
  // ------------------------------
  function dataURItoBlob(dataURI) {
    const parts = dataURI.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    if (!mimeMatch) {
      throw new Error("Format de Data URI invalide.");
    }
    const mime = mimeMatch[1];
    const byteString = atob(parts[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mime });
  }
  
  // ------------------------------
  // Fonctions de copie du SVG en image
  // ------------------------------
  
  // Copie le SVG en tant qu'image vectorielle (si supporté)
  function copySvgAsImage(svgText) {
    return new Promise((resolve, reject) => {
      try {
        const encodedSvg = btoa(unescape(encodeURIComponent(svgText)));
        const dataURI = "data:image/svg+xml;base64," + encodedSvg;
        const blob = dataURItoBlob(dataURI);
        navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]).then(resolve).catch(reject);
      } catch (e) {
        reject(e);
      }
    });
  }
  
  // Fallback : conversion du SVG en PNG avant de copier (résultat raster, fonctionnalités limitées)
  function copySvgAsPng(svgText, width, height) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const encodedSvg = btoa(unescape(encodeURIComponent(svgText)));
      const dataURI = "data:image/svg+xml;base64," + encodedSvg;
      img.src = dataURI;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob })
            ]).then(resolve).catch(reject);
          } else {
            reject(new Error("La conversion du canvas en blob a échoué."));
          }
        }, "image/png");
      };
      img.onerror = reject;
    });
  }
  
  // ------------------------------
  // Gestion de l'affichage des icônes, recherche et lazy loading
  // ------------------------------
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
        fetch(`Icons_Sorted${icon.path}`)
          .then(response => response.text())
          .then(svgText => {
            // Normaliser le SVG pour des dimensions fixes (ici 100x100)
            try {
              const parser = new DOMParser();
              const doc = parser.parseFromString(svgText, "image/svg+xml");
              const svgElem = doc.documentElement;
              svgElem.setAttribute("width", "100");
              svgElem.setAttribute("height", "100");
              if (!svgElem.hasAttribute("viewBox")) {
                svgElem.setAttribute("viewBox", "0 0 100 100");
              }
              svgText = new XMLSerializer().serializeToString(svgElem);
            } catch (e) {
              console.error("Erreur lors du parsing du SVG", e);
            }
  
            // Vérifier si le navigateur supporte la copie du SVG en tant qu'image vectorielle
            const supportsSvg = (ClipboardItem && ClipboardItem.supports && ClipboardItem.supports("image/svg+xml"));
            let copyPromise;
            if (supportsSvg) {
              copyPromise = copySvgAsImage(svgText);
            } else {
              // Fallback : convertir le SVG en PNG pour la copie
              copyPromise = copySvgAsPng(svgText, 100, 100);
            }
            return copyPromise;
          })
          .then(() => {
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
          })
          .catch(err => {
            const tooltip = card.querySelector('.copy-tooltip');
            if (tooltip) {
              if (err.message === "limited") {
                tooltip.textContent = 'Copie avec des fonctions limitées';
              } else {
                tooltip.textContent = 'Erreur';
              }
            }
            console.error(err);
          });
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
});
