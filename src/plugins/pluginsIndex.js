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
        fileName: "pointLights",
        title: "Luci puntiformi",
        description: "Inserisci luci puntiformi",
        icon: '/icons/360.svg',
        category: 'Luci',
        allowed: 1,
        localized: true,
        tags: [],
        requirements: {}
    },
    {
        fileName: "studioLights",
        title: "Setup preimpostati di luci",
        description: "Inserisci un setup preimpostato di luci",
        icon: '/icons/360.svg',
        category: 'Luci',
        allowed: 1,    
        localized: false,
        tags: [],
        requirements: {}
    },
    {
        fileName: "envLight",
        title: "Luce HDRI",
        description: "Inserisci un'immagine HDRI 360 come luce ambientale",
        icon: '/icons/360.svg',
        category: 'Luci',
        allowed: 1,
        localized: true,
        tags: [],
        requirements: {}
    },
    {
        fileName: "envMapBasic",
        title: "Immagine HDRI semplice",
        description: "Inserisci un'immagine HDRI 360 come luce ambientale, senza localizzazione",
        icon: '/icons/360.svg',
        category: 'Luci',
        allowed: 1,
        localized: false,
        tags: [],
        requirements: {}
    },
    {
        fileName: "basicRotCube",
        title: 'Cubo che ruota',
        description: 'Da eliminare, solo di test',
        icon: '/icons/360.svg',
        category: '3D',
        allowed: 1,
        localized: false,
        tags: [],
        requirements: {}
    },
    {
        fileName: "baloons",
        title: 'Palloncini fluttuanti',
        description: 'Inserisci dei palloncini a cazzo dove vuoi',
        icon: '/icons/360.svg',
        category: 'Giochi',
        allowed: 1,
        localized: true,
        tags: [],
        requirements: {}
    },
    {
        fileName: "growingFlowers",
        title: 'Fiori che crescono',
        description: 'Posiziona sulle superfici dei fiori che crescono',
        icon: '/icons/360.svg',
        category: '3D',
        allowed: 1,
        localized: false,
        tags: [],
        requirements: {}
    },
     {
        fileName: "testRobot",
        title: 'Test per robot Comau',
        description: 'Posiziona su una superficie il robot',
        icon: '/icons/360.svg',
        category: '3D',
        allowed: 1,
        localized: false,
        tags: [],
        requirements: {}
    },
];

