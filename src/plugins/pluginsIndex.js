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
        name: "Oggetti",
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
        interactable: false,
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
        interactable: false,
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
        interactable: false,
        tags: [],
        requirements: {}
    },
    {
        fileName: "envMapBasic",
        title: "Luce HDR",
        description: "Scegli un'immagine in formato High Dynamic Range (HDR) tra quelle disponibili per aggiungere realismo",
        icon: "/icons/HDR.svg",
        category: 'Luci',
        allowed: 1,
        localized: false,
        interactable: false,
        tags: [],
        requirements: {}
    },
    {
        fileName: "backgroundTest",
        title: 'Piano background di test',
        description: 'Da eliminare, solo di test',
        icon: null,
        category: 'Oggetti',
        allowed: 1,
        localized: false,
        interactable: false,
        tags: [],
        requirements: {}
    },
    {
        fileName: "basicCube",
        title: 'Cubo base',
        description: 'Da eliminare, solo di test',
        icon: null,
        category: 'Oggetti',
        allowed: 1,
        localized: false,
        interactable: false,
        tags: [],
        requirements: {}
    },
    {
        fileName: "basicSphere",
        title: 'Sfera base',
        description: 'Da eliminare, solo di test',
        icon: null,
        category: 'Oggetti',
        allowed: 1,
        localized: false,
        interactable: false,
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
        interactable: true,
        tags: [],
        requirements: {}
    },
    {
        fileName: "growingFlowers",
        title: 'Fiori che crescono',
        description: 'Posiziona sulle superfici dei fiori che crescono',
        icon: null,
        category: 'Oggetti',
        allowed: 1,
        localized: false,
        interactable: true,
        tags: [],
        requirements: {}
    },
    {
        fileName: "testRobot",
        title: 'Test per robot Comau',
        description: 'Posiziona su una superficie il robot',
        icon: null,
        category: 'Custom',
        allowed: 1,
        localized: false,
        interactable: true,
        tags: [],
        requirements: {}
    },
    {
        fileName: "fakeLocalization",
        title: 'Fake per localizzazione',
        description: 'Elimina appena possibile',
        icon: null,
        category: 'Custom',
        allowed: 1,
        localized: true,
        interactable: false,
        tags: [],
        requirements: {}
    },
];

