document.addEventListener("DOMContentLoaded", () => {
  // Elementos del DOM
  const pokedex = document.getElementById("pokedex");
  const searchInput = document.getElementById("search");
  const typeFilter = document.getElementById("type-filter");
  const toggleViewBtn = document.getElementById("toggle-view");
  const viewIcon = document.getElementById("view-icon");
  const pokedexView = document.querySelector(".pokedex-view");
  const pokemonDisplay = document.querySelector(".pokemon-display");
  const pokemonNameView = document.querySelector(".pokemon-name-view");
  const pokemonNumberView = document.querySelector(".pokemon-number-view");
  const pokedexInput = document.querySelector(".pokedex-input");
  const btnPrevView = document.querySelector(".btn-prev-view");
  const btnNextView = document.querySelector(".btn-next-view");

  // Variables de estado
  let currentPage = 1;
  const pokemonPerPage = 20;
  let allPokemon = [];
  let filteredPokemon = [];
  let currentPokemonId = 1;
  let isPokedexViewActive = false;

  // Inicializar la aplicación
  const init = async () => {
    await fetchPokemon();
    setupEventListeners();
  };

  // Cargar los primeros 151 Pokémon
  const fetchPokemon = async () => {
    try {
      showLoading(true);
      const promises = [];

      for (let i = 1; i <= 151; i++) {
        const url = `https://pokeapi.co/api/v2/pokemon/${i}`;
        promises.push(
          fetch(url)
            .then((res) => res.json())
            .catch(() => null) // Manejar errores individuales
        );
      }

      const results = await Promise.all(promises);
      allPokemon = results.filter(Boolean).map((data) => ({
        id: data.id,
        name: data.name,
        image:
          data.sprites.other["official-artwork"].front_default ||
          data.sprites.front_default,
        animatedImage:
          data.sprites.versions?.["generation-v"]?.["black-white"]?.animated
            ?.front_default,
        types: data.types.map((type) => type.type.name),
        height: data.height,
        weight: data.weight,
        stats: data.stats.map((stat) => ({
          name: stat.stat.name.replace("-", " "),
          value: stat.base_stat,
        })),
      }));

      filteredPokemon = [...allPokemon];
      displayPage(currentPage);
      showPokemonInView(1); // Cargar primer Pokémon en la vista Pokédex
    } catch (error) {
      console.error("Error fetching Pokémon data:", error);
      showError("Error al cargar los Pokémon. Intenta recargar la página.");
    } finally {
      showLoading(false);
    }
  };

  // Configurar event listeners
  const setupEventListeners = () => {
    // Búsqueda y filtrado
    searchInput.addEventListener("input", handleSearch);
    typeFilter.addEventListener("change", handleTypeFilter);

    // Paginación
    document.getElementById("prev").addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        displayPage(currentPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    document.getElementById("next").addEventListener("click", () => {
      if (currentPage < Math.ceil(filteredPokemon.length / pokemonPerPage)) {
        currentPage++;
        displayPage(currentPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    // Vista Pokédex
    toggleViewBtn.addEventListener("click", togglePokedexView);
    pokedexView.addEventListener("click", (e) => {
      if (e.target === pokedexView) {
        togglePokedexView();
      }
    });

    document.querySelector(".pokedex-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const inputValue = pokedexInput.value.trim();
      if (inputValue) {
        showPokemonInView(inputValue);
      }
    });

    btnPrevView.addEventListener("click", () => navigatePokemon(-1));
    btnNextView.addEventListener("click", () => navigatePokemon(1));
  };

  // Alternar entre vistas
  const togglePokedexView = () => {
    isPokedexViewActive = !isPokedexViewActive;

    if (isPokedexViewActive) {
      pokedexView.classList.add("active");
      viewIcon.src = "assets/images/pokeball.png";
      viewIcon.alt = "Vista Principal";
      document.body.style.overflow = "hidden";
    } else {
      pokedexView.classList.remove("active");
      viewIcon.src = "assets/images/pokedex.png";
      viewIcon.alt = "Vista Pokédex";
      document.body.style.overflow = "";
    }
  };

  // Navegación en la vista Pokédex
  const navigatePokemon = (direction) => {
    const newId = currentPokemonId + direction;
    if (newId >= 1 && newId <= 151) {
      currentPokemonId = newId;
      showPokemonInView(currentPokemonId);
    }
  };

  // Mostrar Pokémon en la vista Pokédex
  const showPokemonInView = async (idOrName) => {
    try {
      pokemonNameView.textContent = "Cargando...";
      pokemonNumberView.textContent = "";
      pokemonDisplay.style.display = "none";

      // Buscar en datos ya cargados primero
      let pokemon = allPokemon.find(
        (p) =>
          p.id === parseInt(idOrName) ||
          p.name === idOrName.toString().toLowerCase()
      );

      // Si no se encuentra en datos cargados, hacer fetch
      if (!pokemon) {
        const response = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${idOrName}`
        );
        if (!response.ok) throw new Error("Pokémon no encontrado");

        const data = await response.json();
        pokemon = {
          id: data.id,
          name: data.name,
          image:
            data.sprites.other["official-artwork"].front_default ||
            data.sprites.front_default,
          animatedImage:
            data.sprites.versions?.["generation-v"]?.["black-white"]?.animated
              ?.front_default,
        };
      }

      // Actualizar vista
      currentPokemonId = pokemon.id;
      pokemonNameView.textContent = pokemon.name;
      pokemonNumberView.textContent = pokemon.id;

      // Cargar imagen (intentar animada primero, luego estática)
      const imageUrl = pokemon.animatedImage || pokemon.image;
      loadImageWithFallback(pokemonDisplay, imageUrl, pokemon.image);

      pokedexInput.value = "";
    } catch (error) {
      console.error("Error loading Pokémon:", error);
      pokemonNameView.textContent = "No encontrado";
      pokemonNumberView.textContent = "";
      pokemonDisplay.style.display = "none";
    }
  };

  // Cargar imagen con fallback
  const loadImageWithFallback = (imgElement, primarySrc, fallbackSrc) => {
    imgElement.style.display = "none";
    imgElement.onerror = null;

    const tryFallback = () => {
      if (primarySrc !== fallbackSrc) {
        imgElement.src = fallbackSrc;
      } else {
        imgElement.style.display = "none";
      }
    };

    imgElement.onerror = tryFallback;
    imgElement.src = primarySrc;
    imgElement.style.display = "block";
  };

  // Mostrar Pokémon en tarjetas
  const displayPokemon = (pokemonList) => {
    const pokemonHTMLString = pokemonList
      .map(
        (poke) => `
            <div class="pokemon-card" onclick="showPokemonDetails(${poke.id})">
                <img class="pokemon-image" src="${poke.image}" alt="${
          poke.name
        }" 
                     onerror="this.src='assets/images/pokeball.png'">
                <h2 class="pokemon-name">${poke.name}</h2>
                <p class="pokemon-id">#${poke.id
                  .toString()
                  .padStart(3, "0")}</p>
                <div class="pokemon-types">
                    ${poke.types
                      .map(
                        (type) => `<span class="type ${type}">${type}</span>`
                      )
                      .join("")}
                </div>
            </div>
        `
      )
      .join("");

    pokedex.innerHTML =
      pokemonHTMLString ||
      `<p class="no-results">No se encontraron Pokémon</p>`;
  };

  // Mostrar página específica
  const displayPage = (page) => {
    const startIndex = (page - 1) * pokemonPerPage;
    const endIndex = startIndex + pokemonPerPage;
    const pokemonToDisplay = filteredPokemon.slice(startIndex, endIndex);
    displayPokemon(pokemonToDisplay);

    // Actualizar información de página
    document.getElementById(
      "page-info"
    ).textContent = `Página ${page} de ${Math.ceil(
      filteredPokemon.length / pokemonPerPage
    )}`;

    // Habilitar/deshabilitar botones
    document.getElementById("prev").disabled = page === 1;
    document.getElementById("next").disabled =
      page === Math.ceil(filteredPokemon.length / pokemonPerPage) ||
      filteredPokemon.length <= pokemonPerPage;
  };

  // Manejar búsqueda
  const handleSearch = () => {
    const searchTerm = searchInput.value.toLowerCase();
    filteredPokemon = allPokemon.filter(
      (poke) =>
        poke.name.includes(searchTerm) ||
        poke.id.toString().includes(searchTerm) ||
        poke.types.some((type) => type.includes(searchTerm))
    );
    currentPage = 1;
    displayPage(currentPage);
  };

  // Manejar filtro por tipo
  const handleTypeFilter = (e) => {
    const type = e.target.value;
    if (type === "all") {
      filteredPokemon = [...allPokemon];
    } else {
      filteredPokemon = allPokemon.filter((poke) => poke.types.includes(type));
    }
    currentPage = 1;
    displayPage(currentPage);
  };

  // Mostrar estado de carga
  const showLoading = (isLoading) => {
    if (isLoading) {
      pokedex.innerHTML = `<div class="loading">Cargando Pokémon...</div>`;
    }
  };

  // Mostrar error
  const showError = (message) => {
    pokedex.innerHTML = `<p class="error">${message}</p>`;
  };

  // Iniciar la aplicación
  init();
});

// Mostrar detalles del Pokémon (función global)
window.showPokemonDetails = async (id) => {
  try {
    const modal = document.getElementById("modal");
    const modalBody = document.getElementById("modal-body");
    const closeBtn = document.querySelector(".close"); // Seleccionar el botón de cerrar

    modalBody.innerHTML = `<div class="loading">Cargando detalles...</div>`;
    modal.style.display = "block";
    document.body.style.overflow = "hidden";

    // Configurar el evento de cerrar
    closeBtn.onclick = function () {
      modal.style.display = "none";
      document.body.style.overflow = "";
    };

    modal.style.display = "block";
    document.body.style.overflow = "hidden";

    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!response.ok) throw new Error("Pokémon no encontrado");

    const data = await response.json();
    const types = data.types.map((type) => type.type.name);
    const stats = data.stats.map((stat) => ({
      name: stat.stat.name.replace("-", " "),
      value: stat.base_stat,
    }));

    // Nuevo diseño del modal
    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <img class="pokemon-image animate__animated animate__bounceIn" 
             src="${
               data.sprites.other["official-artwork"].front_default ||
               data.sprites.front_default
             }" 
             alt="${data.name}" 
             onerror="this.src='assets/images/pokeball.png'"
             style="width: 180px; height: 180px; margin-bottom: 1.5rem;">
        
        <div class="animate__animated animate__fadeIn" style="text-align: center;">
          <h2 class="animate__animated animate__fadeInDown">${data.name}</h2>
          <p class="pokemon-id animate__animated animate__fadeIn">#${data.id
            .toString()
            .padStart(3, "0")}</p>
          <div class="pokemon-types animate__animated animate__fadeIn">
            ${types
              .map((type) => `<span class="type ${type}">${type}</span>`)
              .join("")}
          </div>
        </div>
        
        <div class="pokemon-details animate__animated animate__fadeInUp">
          <div>
            <p><strong>Altura:</strong> ${(data.height / 10).toFixed(1)} m</p>
            <p><strong>Peso:</strong> ${(data.weight / 10).toFixed(1)} kg</p>
          </div>
          <div>
            <p><strong>Habilidades:</strong> ${data.abilities
              .map((a) => a.ability.name.replace("-", " "))
              .join(", ")}</p>
          </div>
        </div>
        
        <div class="pokemon-stats animate__animated animate__fadeIn">
          <h3>Estadísticas base</h3>
          ${stats
            .map(
              (stat) => `
            <div class="stat-row">
              <div class="stat-name">${stat.name}:</div>
              <div class="stat-value">
                <div class="stat-bar">
                  <div class="stat-bar-fill" style="width: 0%" data-value="${stat.value}"></div>
                </div>
                <span>${stat.value}</span>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    // Animación de las barras de estadísticas
    setTimeout(() => {
      document.querySelectorAll(".stat-bar-fill").forEach((bar) => {
        const value = bar.getAttribute("data-value");
        bar.style.width = `${Math.min(100, value)}%`;
      });
    }, 100);
  } catch (error) {
    console.error("Error fetching Pokémon details:", error);
    modalBody.innerHTML = `
      <div class="error animate__animated animate__shakeX" style="text-align: center; padding: 2rem;">
        <p style="color: var(--primary-color); font-weight: bold; font-size: 1.2rem;">
          Error al cargar los detalles del Pokémon
        </p>
        <button onclick="document.getElementById('modal').style.display = 'none'" 
                style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary-color); 
                color: white; border: none; border-radius: 5px; cursor: pointer;">
          Cerrar
        </button>
      </div>
    `;
  }
};

// Cierra el modal al hacer clic fuera del contenido
document.getElementById("modal").addEventListener("click", function (e) {
  if (e.target === this) {
    this.style.display = "none";
    document.body.style.overflow = "";
  }
});

// Cierra el modal con la tecla ESC
document.addEventListener("keydown", function (e) {
  if (
    e.key === "Escape" &&
    document.getElementById("modal").style.display === "block"
  ) {
    document.getElementById("modal").style.display = "none";
    document.body.style.overflow = "";
  }
});

// Cerrar modal al hacer clic fuera del contenido
document.getElementById("modal").addEventListener("click", function (e) {
  if (e.target === this) {
    this.style.display = "none";
    document.body.style.overflow = "";
  }
});

// Cerrar modal con la tecla ESC
document.addEventListener("keydown", function (e) {
  const modal = document.getElementById("modal");
  if (e.key === "Escape" && modal.style.display === "block") {
    modal.style.display = "none";
    document.body.style.overflow = "";
  }
});
