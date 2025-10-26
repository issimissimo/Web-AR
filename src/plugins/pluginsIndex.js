import pointLightIcon from '/icons/pointLight.svg';
import hdrIcon from '/icons/HDR.svg';
import categoryLuciIcon from '/icons/Category_luci.svg';
import category3DIcon from '/icons/Category_3D.svg';
import categoryGiochiIcon from '/icons/Category_giochi.svg';
import categoryCustomIcon from '/icons/Category_custom.svg';


/*
* ===== PLUGINS CATEGORIES =====
* This list should be NEVER modified!
* Only if you need a new category
*/

export const PLUGINS_CATEGORIES = [
    {
        name: "Luci",
        icon: categoryLuciIcon
    },
    {
        name: "Oggetti",
        icon: category3DIcon
    },
    {
        name: "Giochi",
        icon: categoryGiochiIcon
    },
    {
        name: "Custom",
        icon: categoryCustomIcon
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
        icon: pointLightIcon,
        category: 'Luci',
        allowed: 1,
        localized: true,
        interactable: false,
        editable: true,
        tags: [],
        requirements: {}
    },
    {
        fileName: "envMapBasic",
        title: "Luce HDR",
        description: "Scegli un'immagine in formato High Dynamic Range (HDR) tra quelle disponibili per aggiungere realismo",
        icon: hdrIcon,
        category: 'Luci',
        allowed: 1,
        localized: false,
        interactable: false,
        editable: true,
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
        editable: false,
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
        editable: true,
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
        editable: false,
        tags: [],
        requirements: {}
    },
    {
        fileName: "placeCustomModel",
        title: 'Modello custom',
        description: 'Posiziona su una superficie un modello caricato da dispositivo',
        icon: null,
        category: 'Oggetti',
        allowed: 1,
        localized: false,
        interactable: true,
        editable: true,
        tags: [],
        requirements: {}
    },
    {
        fileName: "backgroundTest",
        title: 'Sfondo',
        description: 'Da eliminare, solo di test',
        icon: null,
        category: 'Oggetti',
        allowed: 1,
        localized: false,
        interactable: false,
        editable: false,
        tags: [],
        requirements: {}
    },
];

