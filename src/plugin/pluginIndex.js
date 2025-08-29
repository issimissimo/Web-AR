/*
* ===== GAMES LIST =====
* This list must be modified to add (or delete) games
*/

export const GAMES_LIST = [
    {
        fileName: "envLight",
        title: "Luce HDRI",
        description: "Inserisci un'immagine HDRI 360 come luce ambientale",
        image: '/images/games/backgrounds/vetro.jpg',
        category: 'light',
        allowed: 1,
        localized: true,
        tags: [],
        requirements: {}
    },
    {
        fileName: "basicRotCube",
        title: 'Cubo che ruota',
        description: 'Da eliminare, solo di test',
        image: '/images/games/backgrounds/vetro.jpg',
        category: 'test',
        allowed: 1,
        localized: false,
        tags: [],
        requirements: {}
    },
    {
        fileName: "baloons",
        title: 'Palloncini fluttuanti',
        description: 'Inserisci dei palloncini a cazzo dove vuoi',
        image: '/images/games/backgrounds/vetro.jpg',
        category: 'placeOnAir',
        allowed: 1,
        localized: true,
        tags: [],
        requirements: {}
    },
    {
        fileName: "growingFlowers",
        title: 'Fiori che crescono',
        description: 'Posiziona sulle superfici dei fiori che crescono',
        image: '/images/games/backgrounds/vetro.jpg',
        category: 'game',
        allowed: 1,
        localized: false,
        tags: [],
        requirements: {}
    },
];

export default GAMES_LIST