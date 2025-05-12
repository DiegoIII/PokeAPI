document.addEventListener("DOMContentLoaded", () => {
  const pokedex = document.getElementById("pokedex");
  const searchInput = document.getElementById("search");
  const typeFilter = document.getElementById("type-filter");
  const pokedexViewBtn = document.getElementById("pokedex-view");
  const pokedexView = document.querySelector(".pokedex-view");

  // Variables globales
  let currentPage = 1;
  const pokemonPerPage = 20;
  let allPokemon = [];
  let filteredPokemon = [];
  let currentPokemonId = 1;

  // Elementos de la vista Pokédex
  const pokemonDisplay = document.querySelector(".pokemon-display");
  const pokemonNameView = document.querySelector(".pokemon-name-view");
  const pokemonNumberView = document.querySelector(".pokemon-number-view");
  const pokedexInput = document.querySelector(".pokedex-input");
  const btnPrevView = document.querySelector(".btn-prev-view");
  const btnNextView = document.querySelector(".btn-next-view");

  // Cargar los primeros 151 Pokémon
  const fetchPokemon = async () => {
    try {
      const promises = [];
      for (let i = 1; i <= 151; i++) {
        const url = `https://pokeapi.co/api/v2/pokemon/${i}`;
        promises.push(fetch(url).then((res) => res.json()));
      }

      const results = await Promise.all(promises);
      allPokemon = results.map((data) => ({
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
      setupPagination();

      // Manejar búsqueda
      searchInput.addEventListener("input", handleSearch);

      // Manejar filtro por tipo
      typeFilter.addEventListener("change", handleTypeFilter);

      // Configurar vista Pokédex
      setupPokedexView();
    } catch (error) {
      console.error("Error fetching Pokémon data:", error);
      pokedex.innerHTML = `<p class="error">Error al cargar los Pokémon. Intenta recargar la página.</p>`;
    }
  };

  // Mostrar Pokémon en tarjetas
  const displayPokemon = (pokemonList) => {
    const pokemonHTMLString = pokemonList
      .map(
        (poke) => `
                <div class="pokemon-card" onclick="showPokemonDetails(${
                  poke.id
                })">
                    <img class="pokemon-image" src="${poke.image}" alt="${
          poke.name
        }"/>
                    <h2 class="pokemon-name">${poke.name}</h2>
                    <p class="pokemon-id">#${poke.id
                      .toString()
                      .padStart(3, "0")}</p>
                    <div class="pokemon-types">
                        ${poke.types
                          .map(
                            (type) =>
                              `<span class="type ${type}">${type}</span>`
                          )
                          .join("")}
                    </div>
                </div>
            `
      )
      .join("");

    pokedex.innerHTML = pokemonHTMLString || `<p>No se encontraron Pokémon</p>`;
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

  // Configurar paginación
  const setupPagination = () => {
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

  // Configurar vista Pokédex
  const setupPokedexView = () => {
    // Mostrar primer Pokémon al cargar
    showPokemonInView(currentPokemonId);

    // Event listeners para la vista Pokédex
    pokedexViewBtn.addEventListener("click", () => {
      pokedexView.classList.add("active");
      showPokemonInView(currentPokemonId);
    });

    pokedexView.addEventListener("click", (e) => {
      if (e.target === pokedexView) {
        pokedexView.classList.remove("active");
      }
    });

    document.querySelector(".pokedex-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const inputValue = pokedexInput.value.trim();
      if (inputValue) {
        showPokemonInView(inputValue.toLowerCase());
      }
    });

    btnPrevView.addEventListener("click", () => {
      if (currentPokemonId > 1) {
        currentPokemonId--;
        showPokemonInView(currentPokemonId);
      }
    });

    btnNextView.addEventListener("click", () => {
      if (currentPokemonId < 151) {
        currentPokemonId++;
        showPokemonInView(currentPokemonId);
      }
    });
  };

  // Mostrar Pokémon en la vista Pokédex
  const showPokemonInView = async (id) => {
    try {
      pokemonNameView.textContent = "Loading...";
      pokemonNumberView.textContent = "";

      // Buscar en los datos ya cargados primero
      const existingPokemon = allPokemon.find(
        (p) => p.id === parseInt(id) || p.name === id.toLowerCase()
      );

      if (existingPokemon) {
        pokemonDisplay.style.display = "block";
        pokemonNameView.textContent = existingPokemon.name;
        pokemonNumberView.textContent = existingPokemon.id;
        pokemonDisplay.src =
          existingPokemon.animatedImage || existingPokemon.image;
        currentPokemonId = existingPokemon.id;
        return;
      }

      // Si no está en los datos cargados, hacer fetch
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const data = await response.json();

      if (data) {
        pokemonDisplay.style.display = "block";
        pokemonNameView.textContent = data.name;
        pokemonNumberView.textContent = data.id;

        // Usar sprite animado si está disponible, si no, usar el normal
        const animatedSprite =
          data.sprites.versions?.["generation-v"]?.["black-white"]?.animated
            ?.front_default;
        pokemonDisplay.src =
          animatedSprite ||
          data.sprites.other["official-artwork"].front_default ||
          data.sprites.front_default;

        currentPokemonId = data.id;
      } else {
        pokemonDisplay.style.display = "none";
        pokemonNameView.textContent = "No encontrado :c";
        pokemonNumberView.textContent = "";
      }
    } catch (error) {
      console.error("Error loading Pokémon:", error);
      pokemonDisplay.style.display = "none";
      pokemonNameView.textContent = "Error al cargar";
      pokemonNumberView.textContent = "";
    }
  };

  // Iniciar la aplicación
  fetchPokemon();
});

// Mostrar detalles del Pokémon (función global para que funcione con onclick)
window.showPokemonDetails = async (id) => {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await response.json();

    const modal = document.getElementById("modal");
    const modalBody = document.getElementById("modal-body");

    const types = data.types.map((type) => type.type.name);
    const stats = data.stats.map((stat) => ({
      name: stat.stat.name.replace("-", " "),
      value: stat.base_stat,
    }));

    modalBody.innerHTML = `
            <img class="pokemon-image" src="${
              data.sprites.other["official-artwork"].front_default ||
              data.sprites.front_default
            }" alt="${data.name}"/>
            <h2>${data.name}</h2>
            <p class="pokemon-id">#${data.id.toString().padStart(3, "0")}</p>
            <div class="pokemon-types">
                ${types
                  .map((type) => `<span class="type ${type}">${type}</span>`)
                  .join("")}
            </div>
            
            <div class="pokemon-details">
                <p><strong>Altura:</strong> ${(data.height / 10).toFixed(
                  1
                )} m</p>
                <p><strong>Peso:</strong> ${(data.weight / 10).toFixed(
                  1
                )} kg</p>
            </div>
            
            <div class="pokemon-stats">
                <h3>Estadísticas base</h3>
                ${stats
                  .map(
                    (stat) => `
                        <div class="stat-row">
                            <div class="stat-name">${stat.name}:</div>
                            <div class="stat-value">
                                <div class="stat-bar">
                                    <div class="stat-bar-fill" style="width: ${Math.min(
                                      100,
                                      stat.value
                                    )}%"></div>
                                </div>
                                <span>${stat.value}</span>
                            </div>
                        </div>
                    `
                  )
                  .join("")}
            </div>
        `;

    modal.style.display = "block";

    // Cerrar modal
    document.querySelector(".close").onclick = () => {
      modal.style.display = "none";
    };

    window.onclick = (event) => {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    };
  } catch (error) {
    console.error("Error fetching Pokémon details:", error);
  }
};
