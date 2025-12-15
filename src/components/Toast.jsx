// Banner.jsx
import { createSignal, onMount, Show } from "solid-js";
import { styled } from "solid-styled-components";

const ToastOverlay = styled("div")`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  /* bottom: 0; */
  display: flex;
  /* flex-direction: column; */
  /* justify-content: flex-end; */
  align-items: center;
  z-index: 9999;
  pointer-events: none;
  padding: 1rem;
  height: 40px;
`;

const ToastContainer = styled("div")`
  background: #2d2d2d;
  color: #ffffff;
  padding: 8px 18px;
  border-radius: 99px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  width: 100%;
  text-align: center;
  font-size: small;
  font-weight: 300;
  opacity: 0.8;
  line-height: 1.5;
  pointer-events: auto;
  /* margin: 1rem; */
  
  opacity: ${props => props.opacity};
  transform: translateY(${props => props.translateY}px);
  transition: opacity 0.3s ease, transform 0.3s ease;
`;

function Toast(props) {
  const [isVisible, setIsVisible] = createSignal(false);
  const [message, setMessage] = createSignal("");
  const [opacity, setOpacity] = createSignal(0);
  const [translateY, setTranslateY] = createSignal(0);
  
  let timeoutId;

  const show = (text, duration = 3000) => {
    // Cancella timeout precedente se esiste
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    setMessage(text);
    setIsVisible(true);
    
    // Animazione di entrata
    setTimeout(() => {
      setOpacity(1);
    }, 10);
    
    // Programma la scomparsa
    timeoutId = setTimeout(() => {
      hide();
    }, duration);
  };

  const hide = () => {
    // Animazione di uscita
    setOpacity(0);
    
    // Rimuovi dal DOM dopo l'animazione
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  // Esponi la funzione show tramite ref
  onMount(() => {
    if (props.ref) {
      if (typeof props.ref === 'function') {
        props.ref({ show, hide });
      } else {
        props.ref = { show, hide };
      }
    }
  });

  return (
    <Show when={isVisible()}>
      <ToastOverlay>
        <ToastContainer 
          opacity={opacity()} 
          translateY={translateY()}
        >
          {message()}
        </ToastContainer>
      </ToastOverlay>
    </Show>
  );
}

export default Toast;

// ========================================
// ESEMPIO D'USO nel componente genitore
// ========================================

/*
import Banner from "./Banner";

function App() {
  let bannerRef;

  const mostraBanner = () => {
    bannerRef.show("Operazione completata con successo!", 3000);
  };

  const mostraBannerLungo = () => {
    bannerRef.show("Questo messaggio rimarrà visibile per 5 secondi", 5000);
  };

  return (
    <div>
      <h1>La mia App</h1>
      <button onClick={mostraBanner}>Mostra Banner</button>
      <button onClick={mostraBannerLungo}>Mostra Banner Lungo</button>
      
      <Banner ref={bannerRef} />
    </div>
  );
}
*/