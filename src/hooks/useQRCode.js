import QRCode from "qrcode";

export function downloadQRCode(markerName) {
    const img = document.getElementById("qr-code");
    const dataURL = img.src;

    // Crea un link temporaneo
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `qrcode-${markerName}.png`;

    // Per iOS Safari: forza l'apertura in una nuova scheda
    // L'utente potrà poi salvare l'immagine manualmente
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOS || isSafari) {
        // Su iOS/Safari, apri in nuova finestra
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
    }

    // Aggiungi al DOM, clicca e rimuovi
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function generateQRCode(text) {
    //apply to #qr-code
    document.getElementById("qr-code").src = await QRCode.toDataURL(text, {
        margin: 2,
        color: {
            dark: "#000000",
            light: "#FFFFFF",
        },
    });
}

async function generateLaunchCode() {
    let url = await VLaunch.getLaunchUrl(window.location.href);
    generateQRCode(url);
}

async function generateLaunchCodeWithPath(path) {
    let url = await VLaunch.getLaunchUrl(path);
    generateQRCode(url);
}

function isVLaunchDefined() {
    return typeof VLaunch !== "undefined" && VLaunch !== null;
}

export function init() {
    //If we have a valid Variant Launch SDK, we can generate a Launch Code. This will allow iOS users to jump right into the app without having to visit the Launch Card page.
    window.addEventListener("vlaunch-initialized", (e) => {
        if (isVLaunchDefined()) {
            generateLaunchCode();
        } else {
            generateQRCode(window.location.href);
        }
    });

    if (isVLaunchDefined() && VLaunch.initialized) {
        generateLaunchCode(); // generate a Launch Code for this url
    } else {
        generateQRCode(window.location.href); // generate regular QR code for this url
    }
}

// export function generateQRCodeForForMarker(userId, markerId) {
//     const path = `${window.location.href}?userId=${userId}&markerId=${markerId}`;
//     generateQRCode(path);
// }


export function generateQRCodeForMarker(userId, markerId) {
    const path = `${window.location.href}?userId=${userId}&markerId=${markerId}`;
    if (isVLaunchDefined() && VLaunch.initialized) {
        generateLaunchCodeWithPath(path);
    } else {
        generateQRCode(path);
    }
}