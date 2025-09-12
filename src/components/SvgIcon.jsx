// SvgIcon.jsx
import { createResource, createMemo } from "solid-js";
import { styled } from "solid-styled-components";

const Wrapper = styled("div")`
  display: flex;
  line-height: 0;
  /* il colore dell'icona seguirà 'color' */
  svg { width: 100%; height: 100%; }
`;

const svgCache = new Map();

/** Carica e cache-a l'SVG come stringa */
async function loadSvg(src) {
  if (svgCache.has(src)) return svgCache.get(src);
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Impossibile caricare ${src} (${res.status})`);
  const text = await res.text();
  svgCache.set(src, text);
  return text;
}

/** Converte fill/stroke (non 'none') in 'currentColor' per permettere il re-coloring via CSS */
function toCurrentColor(svgText) {
  return svgText
    // attributi fill (tranne fill="none")
    .replace(/fill="(?!none)[^"]*"/gi, 'fill="currentColor"')
    // fill dentro gli style inline
    .replace(/fill:\s*#[0-9a-fA-F]{3,6}/gi, 'fill:currentColor')
    .replace(/fill:\s*rgb\([^)]*\)/gi, 'fill:currentColor')

    // attributi stroke (tranne stroke="none")
    .replace(/stroke="(?!none)[^"]*"/gi, 'stroke="currentColor"')
    // stroke dentro gli style inline
    .replace(/stroke:\s*#[0-9a-fA-F]{3,6}/gi, 'stroke:currentColor')
    .replace(/stroke:\s*rgb\([^)]*\)/gi, 'stroke:currentColor');
}


export default function SvgIcon(props) {
  // props: { src, size=24, color="currentColor", alt }
  const [svgText] = createResource(() => props.src, loadSvg);

  const processed = createMemo(() => {
    const raw = svgText();
    return raw ? toCurrentColor(raw) : "";
  });

  return (
    <Wrapper
      role="img"
      aria-label={props.alt ?? "icona"}
      style={{
        width: `${props.size ?? 24}px`,
        height: `${props.size ?? 24}px`,
        color: props.color ?? "currentColor",
      }}
    >
      {/* Quando la resource è pronta, innerHTML riceve UNA stringa, non una Promise */}
      <div style={{
        transform: props.translateY ? `translateY(${props.translateY}em)` : undefined,
      }} innerHTML={processed()} />
    </Wrapper>
  );
}
