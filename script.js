// -------------------------------------------------------------------------------------------------------
// 1. Exécution dès que le DOM est entièrement chargé
// -------------------------------------------------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  // ----------------------
  // A. Bandeau d'avertissement pour Firefox
  // ----------------------
  if (navigator.userAgent.includes("Firefox")) {
    const banner = document.createElement("div");
    banner.innerText = "Attention : sous Firefox, la copie du SVG se fera en format PNG (fonctionnalités limitées).";
    banner.style.backgroundColor = "#f0f0f0";
    banner.style.color = "#333";
    banner.style.padding = "5px 10px";
    banner.style.fontSize = "12px";
    banner.style.textAlign = "center";
    banner.style.borderBottom = "1px solid #ccc";
    banner.style.position = "relative";
    banner.style.marginBottom = "5px";

    const closeBtn = document.createElement("button");
    closeBtn.innerText = "✖️";
    closeBtn.style.float = "right";
    closeBtn.style.background = "none";
    closeBtn.style.border = "none";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.fontSize = "12px";
    closeBtn.addEventListener("click", () => {
      banner.remove();
    });
    banner.appendChild(closeBtn);

    const header = document.querySelector("header");
    if (header) {
      header.insertAdjacentElement("afterend", banner);
    } else {
      document.body.prepend(banner);
    }
  }

  // ----------------------
  // B. Gestion du dark mode et du basculement
  // ----------------------
  const html = document.documentElement;
  const toggleDark = document.getElementById("toggleDark");
  const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 7.05L5.636 5.636M16.95 16.95l1.414 1.414M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>`;
  const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>`;

  if (
    localStorage.theme === "dark" ||
    (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    html.classList.add("dark");
    if (toggleDark) toggleDark.innerHTML = sunIcon;
  } else {
    html.classList.remove("dark");
    if (toggleDark) toggleDark.innerHTML = moonIcon;
  }

  if (toggleDark) {
    toggleDark.addEventListener("click", () => {
      if (html.classList.contains("dark")) {
        html.classList.remove("dark");
        localStorage.theme = "light";
        toggleDark.innerHTML = moonIcon;
      } else {
        html.classList.add("dark");
        localStorage.theme = "dark";
        toggleDark.innerHTML = sunIcon;
      }
    });
  }

  // -----------------------------------------------------------------------------------------------------
  // 2. Helpers pour gérer le localStorage (Favoris et Historique)
  // -----------------------------------------------------------------------------------------------------
  function getFavorites() {
    const fav = localStorage.getItem("favorites");
    return fav ? JSON.parse(fav) : [];
  }

  function saveFavorites(arr) {
    localStorage.setItem("favorites", JSON.stringify(arr));
  }

  function getHistory() {
    const hist = localStorage.getItem("history");
    return hist ? JSON.parse(hist) : [];
  }

  function saveHistory(arr) {
    localStorage.setItem("history", JSON.stringify(arr));
  }

  // -----------------------------------------------------------------------------------------------------
  // 3. Fonction pour afficher l'historique dans la sidebar
  //    - Icônes 12×12 px, centrées verticalement
  //    - Clic sur la ligne (li) copie en SVG si non-Firefox, sinon en PNG
  //    - Retour visuel "✔ Copié" (fade) sur la ligne
  //    - Suppression : bouton supprime sans conflit de clic
  // -----------------------------------------------------------------------------------------------------
  function renderHistory() {
    const historyList = document.getElementById("historyList");
    if (!historyList) return;

    const history = getHistory();
    historyList.innerHTML = "";

    if (history.length === 0) {
      const li = document.createElement("li");
      li.classList.add("text-neutral-400", "italic", "p-1");
      li.textContent = "Aucun élément pour l’instant.";
      historyList.appendChild(li);
      return;
    }

    history.forEach((entry, index) => {
      const li = document.createElement("li");
      li.classList.add(
        "relative",                // pour positionner le message de retour
        "flex",
        "items-center",
        "justify-between",
        "p-1",
        "rounded",
        "hover:bg-neutral-100",
        "dark:hover:bg-neutral-800",
        "cursor-pointer"
      );

      // Message "✔ Copié" caché par défaut, ne captera pas les clics
      const feedback = document.createElement("div");
      feedback.innerText = "✔ Copié";
      feedback.classList.add(
        "absolute",
        "right-2",
        "text-green-500",
        "text-xs",
        "opacity-0",
        "pointer-events-none",    // Ne pas bloquer les clics
        "transition-opacity",
        "duration-300"
      );
      li.appendChild(feedback);

      // Clic sur la ligne pour copier en SVG ou PNG selon le navigateur
      li.addEventListener("click", () => {
        const svgText = entry.svg;
        let copyPromise;
        if (navigator.userAgent.includes("Firefox")) {
          copyPromise = copySvgAsPng(svgText, 100, 100);
        } else {
          copyPromise = copySvgAsImage(svgText);
        }
        copyPromise
          .then(() => {
            // Afficher le feedback
            feedback.classList.remove("opacity-0");
            // Masquer après 1 seconde
            setTimeout(() => {
              feedback.classList.add("opacity-0");
            }, 1000);
          })
          .catch((err) => {
            console.error("Erreur lors de la copie :", err);
          });
      });

      // Mini aperçu SVG (12×12 px), centré verticalement
      const preview = document.createElement("div");
      preview.innerHTML = entry.svg;
      preview.classList.add(
        "h-3",       // 0.75rem = 12px
        "w-3",       // 0.75rem = 12px
        "flex-shrink-0",
        "mr-2",
        "fill-current",
        "text-neutral-700",
        "dark:text-neutral-300"
      );
      // Retirer tout filtre (blur) si présent et forcer la taille du SVG
      const svgElem = preview.querySelector("svg");
      if (svgElem) {
        svgElem.style.filter = "none";
        svgElem.style.height = "100%";
        svgElem.style.width = "100%";
      }

      const nameSpan = document.createElement("span");
      nameSpan.textContent = entry.name;
      nameSpan.classList.add("flex-1", "pl-1", "truncate", "text-xs", "text-neutral-700", "dark:text-neutral-300");

      const btns = document.createElement("div");
      btns.classList.add("flex", "space-x-1");

      // ❌ : retirer de l'historique, positionné au-dessus pour rester cliquable
      const removeBtn = document.createElement("button");
      removeBtn.innerHTML = "❌";
      removeBtn.title = "Retirer de l’historique";
      removeBtn.classList.add(
        "relative",        // position relative pour z-index
        "z-10",            // toujours devant
        "p-1",
        "hover:bg-red-200",
        "dark:hover:bg-red-700",
        "rounded"
      );
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const newHistory = getHistory();
        newHistory.splice(index, 1);
        saveHistory(newHistory);
        renderHistory();
      });

      btns.appendChild(removeBtn);

      li.appendChild(preview);
      li.appendChild(nameSpan);
      li.appendChild(btns);

      historyList.appendChild(li);
    });
  }

  // -----------------------------------------------------------------------------------------------------
  // 4. Fonction pour copier du texte (SVG) dans le presse-papier
  // -----------------------------------------------------------------------------------------------------
  function copyToClipboard(text) {
    return navigator.clipboard
      .writeText(text)
      .catch((err) => {
        console.error("Erreur lors de la copie :", err);
      });
  }

  // -----------------------------------------------------------------------------------------------------
  // 5. Fonction pour ajouter un élément à l’historique après copie
  // -----------------------------------------------------------------------------------------------------
  function addToHistory(icon) {
    let history = getHistory();

    // Si le dernier élément a le même id, on ne réajoute pas
    if (history.length > 0 && history[0].id === icon.path) {
      return;
    }

    const entry = {
      id: icon.path,
      name: icon.name,
      svg: icon.svgString
    };

    history.unshift(entry);
    if (history.length > 10) {
      history = history.slice(0, 10);
    }
    saveHistory(history);
    renderHistory();
  }

  // -----------------------------------------------------------------------------------------------------
  // 6. Fonction pour basculer un favori (ajout/retrait)
  // -----------------------------------------------------------------------------------------------------
  function toggleFavorite(iconPath) {
    let favorites = getFavorites();
    if (favorites.includes(iconPath)) {
      favorites = favorites.filter((p) => p !== iconPath);
    } else {
      favorites.push(iconPath);
    }
    saveFavorites(favorites);

    // Réinitialiser l’affichage pour appliquer le tri favori
    iconsLoaded = 0;
    filteredIcons = getFilteredIcons(currentSearchTerm);
    document.getElementById("iconsGrid").innerHTML = "";
    renderNextBatch();
  }

  // -----------------------------------------------------------------------------------------------------
  // 7. Chargement des icônes, recherche, et rendu par batch
  // -----------------------------------------------------------------------------------------------------
  let iconsData = {};
  let iconsLoaded = 0;
  const batchSize = 40;
  let filteredIcons = [];
  let currentSearchTerm = "";

  fetch("icons_sorted_structure.json")
    .then((res) => res.json())
    .then((data) => {
      iconsData = data;
      filteredIcons = getFilteredIcons("");
      renderHistory();     // On affiche l’historique existant
      renderNextBatch();   // Puis on affiche la première fournée
    })
    .catch((err) => {
      console.error("Erreur lors du chargement du JSON des icônes :", err);
    });

  document.getElementById("searchInput").addEventListener("input", (e) => {
    currentSearchTerm = e.target.value;
    iconsLoaded = 0;
    filteredIcons = getFilteredIcons(currentSearchTerm);
    document.getElementById("iconsGrid").innerHTML = "";
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
        if (key !== "files") {
          walk(node[key], path ? `${path}/${key}` : key);
        }
      }
    };
    walk(iconsData, "");
    return results;
  }

  function renderNextBatch() {
    const grid = document.getElementById("iconsGrid");
    const batch = filteredIcons.slice(iconsLoaded, iconsLoaded + batchSize);
    const favorites = getFavorites();

    // Trier localement pour faire remonter les favoris
    batch.sort((a, b) => {
      const aFav = favorites.includes(a.path) ? 0 : 1;
      const bFav = favorites.includes(b.path) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;
      return a.name.localeCompare(b.name);
    });

    for (const icon of batch) {
      const card = document.createElement("div");
      card.className =
        "relative rounded-xl p-2 transition shadow hover:shadow-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 dark:text-white text-center group cursor-pointer";

      const fileName = icon.name;
      const friendlyName = fileName
        .replace(/\.(svg|png)/, "")
        .replace(/[-_]/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      // Contenu HTML de la carte
      card.innerHTML = `
        <div class="relative flex flex-col items-center">
          <img 
            data-src="Icons_Sorted${icon.path}" 
            alt="${fileName}" 
            class="lazy-image h-10 w-10 object-contain filter blur-sm transition-opacity duration-300"
            style="pointer-events: none;"
          />
          <div class="text-xs mt-1 truncate w-full" title="${fileName}">${friendlyName}</div>
          <!-- Bouton favori en haut à droite (plus haut et plus gros) -->
          <button class="favorite-btn absolute -top-1 -right-1 text-2xl z-10 focus:outline-none">
            ${favorites.includes(icon.path) ? "★" : "☆"}
          </button>
          <!-- Tooltip de copie (initialement masqué) -->
          <div class="copy-tooltip absolute bottom-0 left-1/2 -translate-x-1/2 bg-black dark:bg-neutral-700 text-white text-xs py-1 px-2 whitespace-nowrap rounded shadow-md z-50 opacity-0 group-hover:opacity-100 transition-opacity">
            Copier l’image
          </div>
          <!-- Affichage du nom au hover, en dessous -->
          <div class="absolute hidden group-hover:flex items-center justify-center bottom-0 left-1/2 -translate-x-1/2 translate-y-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs px-2 py-1 whitespace-nowrap rounded shadow-md z-50">
            ${fileName}
          </div>
        </div>
      `;

      // 7.A. Gestion du clic sur la carte (copie du SVG ou PNG)
      card.addEventListener("click", () => {
        fetch(`Icons_Sorted${icon.path}`)
          .then((response) => response.text())
          .then((svgText) => {
            // Normalisation du SVG
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
              console.error("Erreur parsing du SVG", e);
            }

            // Copier en SVG si non-Firefox, sinon en PNG
            let copyPromise;
            if (navigator.userAgent.includes("Firefox")) {
              copyPromise = copySvgAsPng(svgText, 100, 100);
            } else {
              copyPromise = copySvgAsImage(svgText);
            }
            return copyPromise.then(() => svgText);
          })
          .then((finalSvgText) => {
            const tooltip = card.querySelector(".copy-tooltip");
            if (tooltip) {
              tooltip.textContent = "✔ Copié";
              tooltip.classList.remove("bg-black", "dark:bg-neutral-700");
              tooltip.classList.add("bg-green-500");
              setTimeout(() => {
                tooltip.textContent = "Copier l’image";
                tooltip.classList.remove("bg-green-500");
                tooltip.classList.add("bg-black", "dark:bg-neutral-700");
              }, 1000);
            }
            icon.svgString = finalSvgText;
            addToHistory(icon);
          })
          .catch((err) => {
            const tooltip = card.querySelector(".copy-tooltip");
            if (tooltip) {
              if (err.message === "limited") {
                tooltip.textContent = "Copie avec fonctions limitées";
              } else {
                tooltip.textContent = "Erreur";
              }
            }
            console.error(err);
          });
      });

      // 7.B. Gestion du clic sur le bouton favori
      const favBtn = card.querySelector(".favorite-btn");
      if (favBtn) {
        // Couleur initiale de l'étoile
        if (getFavorites().includes(icon.path)) {
          favBtn.classList.add("text-yellow-400");
        } else {
          favBtn.classList.add("text-neutral-400");
        }
        favBtn.addEventListener("click", (e) => {
          e.stopPropagation(); // Empêche la propagation vers le card (copie)
          toggleFavorite(icon.path);
        });
      }

      grid.appendChild(card);
    }

    lazyLoadImages();
    iconsLoaded += batch.length;
  }

  // -----------------------------------------------------------------------------------------------------
  // 8. Fonction pour lazy-load des images (suppression du blur au chargement)
  // -----------------------------------------------------------------------------------------------------
  function lazyLoadImages() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          // Dès que l'image est chargée, on supprime tout filtre (blur)
          img.addEventListener("load", () => {
            img.style.filter = "none";
          });
          observer.unobserve(img);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('img.lazy-image:not([src])').forEach((img) => {
      observer.observe(img);
    });
  }

  // -----------------------------------------------------------------------------------------------------
  // 9. Scroll infini pour charger la suite
  // -----------------------------------------------------------------------------------------------------
  window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
      renderNextBatch();
    }
  });
});

// -------------------------------------------------------------------------------------------------------
// 10. Fonctions utilitaires pour la copie en tant qu'image (vectorielle ou PNG)
// -------------------------------------------------------------------------------------------------------
function copySvgAsImage(svgText) {
  const blob = new Blob([svgText], { type: "image/svg+xml" });
  const item = new ClipboardItem({ "image/svg+xml": blob });
  return navigator.clipboard.write([item]);
}

function copySvgAsPng(svgText, width, height) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas vide"));
          return;
        }
        const item = new ClipboardItem({ "image/png": blob });
        navigator.clipboard.write([item]).then(resolve).catch(reject);
      });
    };
    img.onerror = reject;
    img.src = "data:image/svg+xml;base64," + btoa(svgText);
  });
}
