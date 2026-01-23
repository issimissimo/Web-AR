// Toast.jsx
import { createSignal, onMount, Show } from "solid-js";
import { styled } from "solid-styled-components";

const ToastOverlay = styled("div")`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  z-index: 9999;
  pointer-events: none;
  padding: 1rem;
  height: 40px;
`;

const ToastContainer = styled("div")`
  background: ${props => props.isError ? '#d32f2f' : '#2d2d2d'};
  color: #ffffff;
  padding: 8px 18px;
  border-radius: 99px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  width: 100%;
  text-align: center;
  font-size: small;
  font-weight: 300;
  line-height: 1.5;
  pointer-events: auto;
  
  opacity: ${props => props.opacity};
  transform: translateY(${props => props.translateY}px);
  transition: opacity 0.3s ease, transform 0.3s ease, background 0.3s ease;
`;

function Toast(props) {
  const [isVisible, setIsVisible] = createSignal(false);
  const [message, setMessage] = createSignal("");
  const [isError, setIsError] = createSignal(false);
  const [opacity, setOpacity] = createSignal(0);
  const [translateY, setTranslateY] = createSignal(0);
  
  let timeoutId;
  let hideTimeoutId;

  const show = (text, options = {}) => {
    // Opzioni: { duration: 3000, isError: false, infinite }
    const duration = options.duration ? options.duration : (options.infinite ? 1000000 : 3000);
    const error = options.isError || false;
    
    // ✅ GESTIONE CHIAMATE MULTIPLE
    // Cancella i timeout precedenti se esistono
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (hideTimeoutId) {
      clearTimeout(hideTimeoutId);
    }
    
    // Se già visibile, reset immediato
    if (isVisible()) {
      setOpacity(0);
      setTimeout(() => {
        showToast(text, error, duration);
      }, 100);
    } else {
      showToast(text, error, duration);
    }
  };

  const showToast = (text, error, duration) => {
    setMessage(text);
    setIsError(error);
    setIsVisible(true);
    
    // Animazione di entrata
    setTimeout(() => {
      setOpacity(1);
      // setTranslateY(0);
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
    hideTimeoutId = setTimeout(() => {
      setIsVisible(false);
      setIsError(false);
    }, 300);
  };

  // Esponi le funzioni tramite ref
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
          isError={isError()}
        >
          {message()}
        </ToastContainer>
      </ToastOverlay>
    </Show>
  );
}

export default Toast;

// ========================================
// ESEMPI D'USO
// ========================================

/*
import Toast from "./Toast";

function App() {
  let toastRef;

  // Toast normale (sfondo scuro)
  const mostraSuccesso = () => {
    toastRef.show("Operazione completata!", { duration: 3000 });
  };

  // Toast di errore (sfondo rosso)
  const mostraErrore = () => {
    toastRef.show("Errore: operazione fallita!", { 
      duration: 4000, 
      isError: true 
    });
  };

  // Chiamate multiple rapide - gestite correttamente!
  const testMultiplo = () => {
    toastRef.show("Primo messaggio");
    setTimeout(() => toastRef.show("Secondo messaggio"), 500);
    setTimeout(() => toastRef.show("Terzo messaggio"), 1000);
  };

  // Sintassi semplificata (senza opzioni)
  const messaggioVeloce = () => {
    toastRef.show("Messaggio veloce"); // usa defaults
  };

  return (
    <div>
      <h1>La mia App</h1>
      <button onClick={mostraSuccesso}>Successo</button>
      <button onClick={mostraErrore}>Errore</button>
      <button onClick={testMultiplo}>Test Multiplo</button>
      <button onClick={messaggioVeloce}>Messaggio Veloce</button>
      
      <Toast ref={toastRef} />
    </div>
  );
}
*/