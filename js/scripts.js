/**
 * @typedef {{name: string, detailsUrl: string}} Pokemon
 */

let pokemonRepository = (function () {
    let pokemonList = [];
    let apiUrl = 'https://pokeapi.co/api/v2/pokemon/?limit=150';

    /**
     * Takes a pokemon object and checks if it contains the correct keys,
     * then adds it to the {@link pokemonList} array.
     * 
     * @param {Pokemon} pokemon - {@link Pokemon} object
     */
    function add(pokemon) {
        if ((typeof pokemon === 'object') && 'name' in pokemon && 'detailsUrl' in pokemon) {
            pokemonList.push(pokemon);
        }
        else {
            console.log(`Pokemon does not contain expected values`);
        }
    }

    function getAll() {
        return pokemonList;
    }

    function find(pokemonName) {
        return pokemonList.filter(pokemon => pokemon.name === pokemonName);
    }

    function showDetails(pokemon) {
        loadDetails(pokemon)
            .then(() => {
                // console.log(pokemon);
                showModal(pokemon);
            }); 
    }

    function showLoadingMessage() {
        let loadingDiv = document.querySelector('.loading-message');
        let loadingText = document.createElement('h1');
        loadingText.classList.add('loading-text');
        loadingText.innerText = 'Loading...';
        loadingDiv.appendChild(loadingText);
    }

    function hideLoadingMessage() {
        let loadingDiv = document.querySelector('.loading-message');
        let loadingText = document.querySelector('.loading-text');
        // setTimeout here so you can actually see the loading message
        // * will probably remove later
        setTimeout(() => loadingDiv.removeChild(loadingText), 300);    
        // loadingDiv.removeChild(loadingText);      
    }

    function addEventListener(button, pokemon) {
        button.addEventListener('click', function (event) {
            showDetails(pokemon);
        });
    }

    /**
     * Fetches the full list of Pokemon from the pokeAPI, then creates a {@link Pokemon} object
     *  for each one and calls {@link add} on it.
     */
    function loadList() {
        showLoadingMessage();
        return fetch(apiUrl)
            .then((response) => { return response.json() })
            .then((json) => {
                json.results.forEach((item) => {
                    let pokemon = {
                        name: item.name,
                        detailsUrl: item.url
                    };
                    add(pokemon);
                });
                hideLoadingMessage();
            })
            .catch((e) => { 
                console.error(e);
                hideLoadingMessage();
            });
    }

    /**
     * Calls {@link loadSprite} to get the spriteUrl for each sprite.
     * 
     * Then it creates a list item containing a button that displays the pokemon's name and sprite,
     *  then adds it to the DOM.
     * 
     * @param {Pokemon} pokemon - {@link Pokemon} object
     */
    function addListItem(pokemon) {
        loadSprite(pokemon)
            .then(() => {
                const { name, spriteUrl } = pokemon;

                let list = document.querySelector('.pokemon-list');
                let listItem = document.createElement('li');
                let pokemonButton = document.createElement('button');
                pokemonButton.innerHTML = `
                    <img src="${spriteUrl}" alt="${name}"/>
                    <p>${name}</p>
                `;

                pokemonButton.classList.add('pokemon-button');
                listItem.appendChild(pokemonButton);
                list.appendChild(listItem);
                addEventListener(pokemonButton, pokemon);
            });
    }

    /**
     * This function uses the detailsUrl from each pokemon to retrieve the spriteUrl for the sprites
     *  so they can be displayed on the main list.
     * 
     * @param {Pokemon} pokemon - {@link Pokemon} object
     */
    async function loadSprite(pokemon) {
        let res = await fetch(pokemon.detailsUrl);
        let resData = await res.json();
        
        pokemon.spriteUrl = resData.sprites.front_default;

        return resData;
    }    

    /**
     * Fetches further details about a pokemon and adds the new keys (and info) to the 
     * Pokemon object.
     * 
     * @see {@link showDetails} - function is called here
     * @param {Pokemon} pokemon - {@link Pokemon} object
     */
    function loadDetails(pokemon) {
        showLoadingMessage();
        let url = pokemon.detailsUrl;
        return fetch(url)
            .then((response) => { return response.json() })
            .then((details) => {
                // pokemon.artUrl = details.sprites.other.dream_world.front_default;
                pokemon.artUrl = details.sprites.other['official-artwork'].front_default;
                pokemon.id = details.id;
                pokemon.height = details.height;
                pokemon.weight = details.weight;
                pokemon.types = details.types;
                hideLoadingMessage();
            })
            .catch((e) => { 
                console.error(e);
                hideLoadingMessage();
            });
    }

    /**
     * A small helper function to get the actual type names because they are nested a couple
     * layers deep in types.
     */
    function getTypeNames(types) {
        if (types.length > 1) { 
            return `Types: ${types[0].type.name}, ${types[1].type.name}`; 
        }
        return `Type: ${types[0].type.name}`
    }
    
    function convertHeight(height) {
        // convert height to feet w/ decimal
        height = ((height / 10) * 3.28).toFixed(2); 
        // separate out the decimal and convert to inches
        let whole = Math.floor(height); 
        let dec = Math.round((height - whole) * 12);

        dec = String(dec).padStart(2, '0');
        let returnString = ``;
        // round up inches to the next foot
        returnString = dec === '12' ? `${whole + 1}' 00"` : `${whole}' ${dec}"`;

        return returnString;
    }

    function convertWeight(weight) {
        weight = ((weight / 10) * 2.2).toFixed(1);
        return weight % 1 === 0 ? Math.floor(weight) : weight;
    }

    /**
     * This is called when a pokemon's button is clicked.
     * Creates a modal popup and displays the pokemon's artwork and info 
     * 
     * @param {Pokemon} pokemon - {@link Pokemon} object
     */
    function showModal(pokemon) {
        let { name, artUrl, id, height, weight, types } = pokemon;
        
        id = String(id).padStart(3, '0');
        // convert values to feet and pounds
        height = convertHeight(height);
        weight = convertWeight(weight);

        let typeNames = getTypeNames(types);

        let modalContainer = document.querySelector('#modal-container');

        // clear modal
        modalContainer.innerHTML = '';

        let modal = document.createElement('div');
        modal.classList.add('modal');

        // add modal content
        let closeButtonEl = document.createElement('button');
        closeButtonEl.classList.add('modal-close');
        closeButtonEl.innerText = 'Close';
        closeButtonEl.addEventListener('click', hideModal);

        let titleEl = document.createElement('h1');
        titleEl.innerText = name + ` #${id}`;

        let contentEl = document.createElement('div');
        contentEl.classList.add('pokemon-content');
        contentEl.innerHTML = `
            <img src="${artUrl}" alt="${name}"/>
            <div class="pokemon-info">
                <span>Height: ${height}</span>
                <span>Weight: ${weight} lbs</span>
                <span class="types">${typeNames}</span>
            </div
        `;

        modal.appendChild(closeButtonEl);
        modal.appendChild(titleEl);
        modal.appendChild(contentEl);
        modalContainer.appendChild(modal);
        modalContainer.classList.add('is-visible');
    }

    function hideModal() {
        let modalContainer = document.querySelector('#modal-container');
        modalContainer.classList.remove('is-visible');
    }

    window.addEventListener('keydown', (e) => {
        let modalContainer = document.querySelector('#modal-container');
        if (e.key === 'Escape' && modalContainer.classList.contains('is-visible')) {
            hideModal();
        }
    })

    window.addEventListener('click', (e) => {
        let modalContainer = document.querySelector('#modal-container')
        let target = e.target;
        if (target === modalContainer) {
            hideModal();
        }
    })

    return {
        // * do i need all of these if some of them are only called internally? prob not
        add: add,
        getAll: getAll,
        find: find,
        showDetails: showDetails,
        showLoadingMessage: showLoadingMessage,
        hideLoadingMessage: hideLoadingMessage,
        addEventListener: addEventListener,
        loadList: loadList,
        addListItem: addListItem,
        loadSprite: loadSprite,
        loadDetails: loadDetails,
        getTypeNames: getTypeNames,
        showModal: showModal,
        hideModal: hideModal,
    };
})();

pokemonRepository.loadList()
    .then(() => {
        pokemonRepository.getAll().forEach((pokemon) => pokemonRepository.addListItem(pokemon));
    })
    .catch((e) => console.log(`this broken`));