/*
* ===== PLUGINS CATEGORIES =====
* This list should be NEVER modified!
* Only if you need a new category
*/

export const PLUGINS_CATEGORIES = [
    {
        name: "Luci",
        icon: "/icons/Category_luci.svg"
    },
    {
        name: "3D",
        icon: "/icons/Category_3D.svg"
    },
    {
        name: "Giochi",
        icon: "/icons/Category_giochi.svg"
    },
    {
        name: "Custom",
        icon: "/icons/Category_custom.svg"
    },
]



/*
* ===== PLUGINS LIST =====
* This list MUST be modified when you add (or delete) plugins
*/

export const PLUGINS_LIST = [
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

export default PLUGINS_LIST