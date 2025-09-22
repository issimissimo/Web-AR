import { createSignal, onMount } from 'solid-js';
import { styled } from 'solid-styled-components';
import { Motion } from 'solid-motionone';

const SliderContainer = styled.div`
  position: relative;
  /* width: 100%; */
  height: 60px;
  padding: 20px;
  display: flex;
  align-items: center;
  touch-action: none;
  user-select: none;
`;

const SliderTrack = styled.div`
  width: 100%;
  height: 8px;
  background: linear-gradient(90deg, #e2e8f0 0%, #3b82f6 100%);
  border-radius: 4px;
  position: relative;
  cursor: pointer;
`;

const SliderThumb = styled(Motion.div)`
  position: absolute;
  top: 50%;
  width: 24px;
  height: 24px;
  background: #ffffff;
  border-radius: 50%;
  transform: translateY(-50%);
  cursor: grab;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  touch-action: none;
  
  &:active {
    cursor: grabbing;
    transform: translateY(-50%) scale(1.1);
  }
`;

const SliderValue = styled.div`
  position: absolute;
  top: -35px;
  left: 50%;
  transform: translateX(-50%);
  background: #1f2937;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
`;

export default function HorizontalSlider(props) {
  const [value, setValue] = props.value ? [props.value, props.setValue] : createSignal(5);
  const [isDragging, setIsDragging] = createSignal(false);
  let trackRef;
  let thumbRef;

  const updateValue = (clientX) => {
    if (!trackRef) return;
    
    const rect = trackRef.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newValue = Math.round(percentage * 10);
    setValue(newValue);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    updateValue(e.clientX);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    updateValue(e.touches[0].clientX);
  };

  const handleMove = (e) => {
    if (!isDragging()) return;
    
    const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
    updateValue(clientX);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  onMount(() => {
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  });

  return (
    <SliderContainer>
      <SliderTrack 
        ref={trackRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <SliderThumb
          ref={thumbRef}
          style={{ left: `calc(${(value() / 10) * 100}% - 12px)` }}
          animate={{ 
            scale: isDragging() ? 1.1 : 1,
          }}
          transition={{ duration: 0.1 }}
        >
          <SliderValue>
            {value()}
          </SliderValue>
        </SliderThumb>
      </SliderTrack>
    </SliderContainer>
  );
}