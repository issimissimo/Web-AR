import { styled } from 'solid-styled-components';
import { Motion } from 'solid-motionone';
import { createMemo } from 'solid-js';

const InfinityContainer = styled('div')`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const InfinityElement = styled(Motion.div)`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const InfinityAnimation = (props) => {
  // Props con valori di default
  const width = () => props.width || 200;
  const height = () => props.height || 100;
  const duration = () => props.duration || 4;
  
  // Calcolo del percorso dell'infinito con velocità costante
  const infinityPath = createMemo(() => {
    const w = width() / 2;
    const h = height() / 2;
    const scale = w * 0.8;
    
    // Prima genero molti punti per calcolare la lunghezza totale della curva
    const rawPoints = [];
    const numSamples = 1000;
    
    for (let i = 0; i <= numSamples; i++) {
      const t = (i / numSamples) * 2 * Math.PI;
      const sin2t = Math.sin(t) * Math.sin(t);
      const x = scale * Math.cos(t) / (1 + sin2t);
      const y = scale * Math.sin(t) * Math.cos(t) / (1 + sin2t) * 0.6;
      rawPoints.push({ x, y, t });
    }
    
    // Calcolo le distanze cumulative lungo la curva
    let totalLength = 0;
    const distances = [0];
    
    for (let i = 1; i < rawPoints.length; i++) {
      const dx = rawPoints[i].x - rawPoints[i-1].x;
      const dy = rawPoints[i].y - rawPoints[i-1].y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);
      totalLength += segmentLength;
      distances.push(totalLength);
    }
    
    // Ora genero i punti finali con spaziatura uniforme lungo la curva
    const finalPoints = [];
    const numFinalPoints = 80;
    
    for (let i = 0; i <= numFinalPoints; i++) {
      const targetDistance = (i / numFinalPoints) * totalLength;
      
      // Trovo i due punti più vicini a questa distanza
      let closestIndex = 0;
      for (let j = 0; j < distances.length - 1; j++) {
        if (distances[j] <= targetDistance && distances[j + 1] >= targetDistance) {
          closestIndex = j;
          break;
        }
      }
      
      // Interpolo tra i due punti più vicini
      const ratio = (targetDistance - distances[closestIndex]) / 
                   (distances[closestIndex + 1] - distances[closestIndex]);
      
      const p1 = rawPoints[closestIndex];
      const p2 = rawPoints[closestIndex + 1];
      
      const x = p1.x + ratio * (p2.x - p1.x);
      const y = p1.y + ratio * (p2.y - p1.y);
      
      finalPoints.push({ x, y });
    }
    
    return finalPoints;
  });

  // Converto i punti in valori x e y separati
  const xValues = createMemo(() => infinityPath().map(point => point.x));
  const yValues = createMemo(() => infinityPath().map(point => point.y));

  return (
    <InfinityContainer 
      class={props.class} 
      style={{ 
        width: `${width()}px`, 
        height: `${height()}px`,
        ...props.style 
      }}
    >
      <InfinityElement
        animate={{
          x: xValues(),
          y: yValues(),
        }}
        transition={{
          duration: duration(),
          repeat: Infinity,
          easing: "linear" // Linear per mantenere velocità costante sulla curva
        }}
      >
        {/* Qui puoi inserire qualsiasi contenuto */}
        {props.children}
      </InfinityElement>
    </InfinityContainer>
  );
};

export default InfinityAnimation;