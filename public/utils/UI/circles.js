// circles.js
function initCircles() {
    const circles = [
        { size: '80vw', top: '5%', left: '-20%', delay: '0s', color: 'accent' },
        { size: '90vw', top: '25%', right: '-25%', delay: '-4s', color: 'secondary' },
        { size: '100vw', bottom: '15%', left: '-10%', delay: '-8s', color: 'primary' },
        { size: '70vw', top: '45%', right: '-15%', delay: '-2s', color: 'accent' },
        { size: '85vw', bottom: '35%', left: '-30%', delay: '-6s', color: 'secondary' },
        { size: '75vw', top: '60%', right: '-20%', delay: '-10s', color: 'primary' }
    ];

    const container = document.getElementById('backgroundContainer');
    if (!container) return; // Safety check

    circles.forEach((c, i) => {
        const div = document.createElement('div');
        div.className = `circle circle-${i + 1}`;
        container.appendChild(div);
    });
}

// Esegui quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCircles);
} else {
    initCircles();
}