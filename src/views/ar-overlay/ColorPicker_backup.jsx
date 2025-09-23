import { createSignal, createMemo, onMount } from 'solid-js';
import { styled } from 'solid-styled-components';
import { Motion } from 'solid-motionone';

const ColorPickerContainer = styled.div`
  /* width: 100%; */
  padding: 20px;
  touch-action: none;
  user-select: none;
`;

const HueSlider = styled.div`
  position: relative;
  width: 100%;
  height: 8px;
  background: linear-gradient(90deg, 
    hsl(0, 100%, 50%) 0%,
    hsl(60, 100%, 50%) 16.66%,
    hsl(120, 100%, 50%) 33.33%,
    hsl(180, 100%, 50%) 50%,
    hsl(240, 100%, 50%) 66.66%,
    hsl(300, 100%, 50%) 83.33%,
    hsl(360, 100%, 50%) 100%
  );
  border-radius: 4px;
  margin-bottom: 20px;
  cursor: pointer;
`;

const LightnessSlider = styled.div`
  position: relative;
  width: 100%;
  height: 8px;
  border-radius: 4px;
  margin-bottom: 20px;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  touch-action: none;
  
  &:active {
    cursor: grabbing;
    transform: translateY(-50%) scale(1.1);
  }
`;

// Funzione per convertire HSL in esadecimale
function hslToHex(h, s, l) {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (c) => {
        const hex = Math.round(c * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function ColorPicker(props) {
    const [color, setColor] = props.color ? [props.color, props.setColor] : createSignal('#ff0000');
    const [hue, setHue] = createSignal(0);
    const [lightness, setLightness] = createSignal(50);
    const [dragging, setDragging] = createSignal(null);

    // Calcola il colore esadecimale quando cambiano HSL (saturazione fissa al 100%)
    createMemo(() => {
        const hexColor = hslToHex(hue(), 100, lightness());
        // setColor(hexColor);

        // Converte da #ffffff a 0xffffff per ThreeJS
        // const threeJSColor = hexColor.replace('#', '0x');
        const threeJSColor = parseInt(hexColor.replace('#', ''), 16);
        setColor(threeJSColor);

    });

    // Genera il background per lightness slider  
    const lightnessBackground = createMemo(() =>
        `linear-gradient(90deg, #000000, hsl(${hue()}, 100%, 50%), #ffffff)`
    );

    const updateSliderValue = (clientX, sliderRef, setValue, max) => {
        if (!sliderRef) return;

        const rect = sliderRef.getBoundingClientRect();
        const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        setValue(Math.round(percentage * max));
    };

    const handleStart = (e, sliderType, sliderRef) => {
        e.preventDefault();
        setDragging(sliderType);
        const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;

        switch (sliderType) {
            case 'hue':
                updateSliderValue(clientX, sliderRef, setHue, 360);
                break;
            case 'lightness':
                updateSliderValue(clientX, sliderRef, setLightness, 100);
                break;
        }
    };

    const handleMove = (e) => {
        const currentDragging = dragging();
        if (!currentDragging) return;

        const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;

        switch (currentDragging) {
            case 'hue':
                updateSliderValue(clientX, hueRef, setHue, 360);
                break;
            case 'lightness':
                updateSliderValue(clientX, lightnessRef, setLightness, 100);
                break;
        }
    };

    const handleEnd = () => {
        setDragging(null);
    };

    let hueRef, lightnessRef;

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
        <ColorPickerContainer>
            {/* Hue Slider */}
            <HueSlider
                ref={hueRef}
                onMouseDown={(e) => handleStart(e, 'hue', hueRef)}
                onTouchStart={(e) => handleStart(e, 'hue', hueRef)}
            >
                <SliderThumb
                    style={{ left: `calc(${(hue() / 360) * 100}% - 12px)` }}
                    animate={{ scale: dragging() === 'hue' ? 1.1 : 1 }}
                    transition={{ duration: 0.1 }}
                />
            </HueSlider>

            {/* Lightness Slider */}
            <LightnessSlider
                ref={lightnessRef}
                style={{ background: lightnessBackground() }}
                onMouseDown={(e) => handleStart(e, 'lightness', lightnessRef)}
                onTouchStart={(e) => handleStart(e, 'lightness', lightnessRef)}
            >
                <SliderThumb
                    style={{ left: `calc(${(lightness() / 100) * 100}% - 12px)` }}
                    animate={{ scale: dragging() === 'lightness' ? 1.1 : 1 }}
                    transition={{ duration: 0.1 }}
                />
            </LightnessSlider>
        </ColorPickerContainer>
    );
}