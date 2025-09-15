import { Group, RingGeometry, MeshBasicMaterial, Mesh, DoubleSide } from 'three';

export default class ConcentricRings extends Group {
  constructor(outerRadius, color, numRings = 5, ringThickness = 0.1) {
    super();

    this.outerRadius = outerRadius;
    this.color = color;
    this.numRings = numRings;
    this.ringThickness = ringThickness;
    this.rings = [];

    this.createRings();
  }

  createRings() {
    const radiusStep = this.outerRadius / this.numRings;

    for (let i = 0; i < this.numRings; i++) {
      const outerR = this.outerRadius - (i * radiusStep);
      const innerR = Math.max(0, outerR - (radiusStep * this.ringThickness));

      const geometry = new RingGeometry(innerR, outerR, 64);
      const material = new MeshBasicMaterial({
        color: this.color,
        transparent: true,
        side: DoubleSide
      });

      const ring = new Mesh(geometry, material);
      ring.rotateX(Math.PI / 2)
      this.rings.push(ring);
      this.add(ring);
    }
  }

  setVisible(visible) {
    this.rings.forEach(ring => {
      ring.visible = visible;
    });
  }

  fadeOutCascade(duration = 1000, delay = 200) {
    this.rings.forEach((ring, index) => {
      setTimeout(() => {
        const startTime = Date.now();
        const startOpacity = ring.material.opacity;

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);

          ring.material.opacity = startOpacity * (1 - progress);

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        animate();
      }, index * delay);
    });
  }

  fadeInCascade(duration = 1000, delay = 200) {
    this.rings.forEach((ring, index) => {
      ring.material.opacity = 0;

      setTimeout(() => {
        const startTime = Date.now();

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);

          ring.material.opacity = progress;

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        animate();
      }, (this.rings.length - 1 - index) * delay);
    });
  }

  dispose() {
    this.rings.forEach(ring => {
      ring.geometry.dispose();
      ring.material.dispose();
    });
    this.rings = [];
  }
}