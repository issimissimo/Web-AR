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
        icon: null,
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
        icon: null,
        category: 'Luci',
        allowed: 1,
        localized: false,
        tags: [],
        requirements: {}
    },
    {
        fileName: "envLight",
        title: "Luce HDR localizzata",
        description: "Inserisci un'immagine HDRI 360 come luce ambientale",
        icon: null,
        category: 'Luci',
        allowed: 1,
        localized: true,
        tags: [],
        requirements: {}
    },
    {
        fileName: "envMapBasic",
        title: "Luce HDR",
        description: "Inserisci un'immagine HDRI 360 come luce ambientale, senza localizzazione",
        icon: null,
        category: 'Luci',
        allowed: 1,
        localized: false,
        tags: [],
        requirements: {}
    },
    {
        fileName: "backgroundTest",
        title: 'Piano background di test',
        description: 'Da eliminare, solo di test',
        icon: null,
        category: '3D',
        allowed: 1,
        localized: false,
        tags: [],
        requirements: {}
    },
    {
        fileName: "basicCube",
        title: 'Cubo base',
        description: 'Da eliminare, solo di test',
        icon: null,
        category: '3D',
        allowed: 1,
        localized: false,
        tags: [],
        requirements: {}
    },
    {
        fileName: "basicSphere",
        title: 'Sfera base',
        description: 'Da eliminare, solo di test',
        icon: null,
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
        icon: null,
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
        icon: null,
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
        icon: null,
        category: '3D',
        allowed: 1,
        localized: false,
        tags: [],
        requirements: {}
    },
];

