import { createSignal, onMount, onCleanup, For } from 'solid-js';
import { styled } from 'solid-styled-components';

const ConsoleContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 40vh;
  background: rgba(0, 0, 0, 0.95);
  color: #fff;
  z-index: 100000;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  overflow-y: auto;
  border-top: 2px solid #333;
`;

const LogEntryStyled = styled.div`
  padding: 6px 10px;
  border-bottom: 1px solid #222;
  
  ${props => {
    switch (props.type) {
      case 'error':
        return 'background: #3d0000; color: #ff6b6b;';
      case 'warn':
        return 'background: #3d2600; color: #ffd93d;';
      case 'info':
        return 'background: #00263d; color: #6bcfff;';
      case 'debug':
        return 'background: #1a1a2e; color: #b19cd9;';
      default:
        return 'background: #0a0a0a; color: #e0e0e0;';
    }
  }}
`;

const Timestamp = styled.span`
  color: #888;
  margin-right: 8px;
`;

const ClearButton = styled.button`
  position: sticky;
  top: 0;
  width: 100%;
  padding: 8px;
  background: #1a1a1a;
  color: #fff;
  border: none;
  border-bottom: 1px solid #333;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  
  &:hover {
    background: #2a2a2a;
  }
  
  &:active {
    background: #3a3a3a;
  }
`;

export const LogOnScreen = () => {
  const [logs, setLogs] = createSignal([]);
  let containerRef;
  let logIdCounter = 0;

  const addLog = (type, args) => {
    const message = args
      .map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');

    const timestamp = new Date().toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });

    setLogs(prev => [...prev, {
      id: logIdCounter++,
      type,
      message,
      timestamp
    }]);

    // Auto-scroll verso il basso
    setTimeout(() => {
      if (containerRef) {
        containerRef.scrollTop = containerRef.scrollHeight;
      }
    }, 0);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  onMount(() => {
    // Salva i metodi originali
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    const originalDebug = console.debug;

    // Intercetta console.log
    console.log = (...args) => {
      originalLog(...args);
      addLog('log', args);
    };

    // Intercetta console.error
    console.error = (...args) => {
      originalError(...args);
      addLog('error', args);
    };

    // Intercetta console.warn
    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', args);
    };

    // Intercetta console.info
    console.info = (...args) => {
      originalInfo(...args);
      addLog('info', args);
    };

    // Intercetta console.debug
    console.debug = (...args) => {
      originalDebug(...args);
      addLog('debug', args);
    };

    // Intercetta errori non gestiti di runtime
    const handleError = (event) => {
      event.preventDefault(); // Previene la propagazione
      const errorInfo = [
        `❌ Uncaught Error: ${event.message}`,
        event.filename ? `📄 File: ${event.filename}` : null,
        event.lineno ? `📍 Line: ${event.lineno}:${event.colno}` : null,
        event.error?.stack ? `\n${event.error.stack}` : null
      ].filter(Boolean);
      addLog('error', errorInfo);
    };

    // Intercetta promise rejections non gestite
    const handleUnhandledRejection = (event) => {
      event.preventDefault(); // Previene la propagazione
      const reason = event.reason;
      const errorInfo = [
        `⚠️ Unhandled Promise Rejection:`,
        reason instanceof Error ? reason.message : String(reason),
        reason instanceof Error && reason.stack ? `\n${reason.stack}` : null
      ].filter(Boolean);
      addLog('error', errorInfo);
    };

    // Intercetta errori di caricamento risorse (immagini, script, ecc.)
    const handleResourceError = (event) => {
      const target = event.target;
      if (target && (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
        const src = target.src || target.href;
        addLog('error', [`🔗 Resource Load Error: ${target.tagName}`, `URL: ${src}`]);
      }
    };

    // Intercetta errori di SecurityError e altri errori del browser
    const handleSecurityError = () => {
      addLog('error', ['🔒 Security Error detected']);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleResourceError, true); // useCapture per catturare errori di risorse
    window.addEventListener('securitypolicyviolation', handleSecurityError);

    // Cleanup: ripristina i metodi originali e rimuovi listener
    onCleanup(() => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
      console.debug = originalDebug;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleResourceError, true);
      window.removeEventListener('securitypolicyviolation', handleSecurityError);
    });
  });

  return (
    <ConsoleContainer ref={containerRef}>
      <ClearButton onClick={clearLogs}>
        🗑️ Clear Console ({logs().length})
      </ClearButton>
      <For each={logs()}>
        {(log) => (
          <LogEntryStyled type={log.type}>
            <Timestamp>{log.timestamp}</Timestamp>
            <strong>[{log.type.toUpperCase()}]</strong> {log.message}
          </LogEntryStyled>
        )}
      </For>
    </ConsoleContainer>
  );
};

// Esempio di utilizzo:
// Importa e aggiungi nel tuo App.jsx:
// import { DebugConsole } from './DebugConsole';
// 
// function App() {
//   return (
//     <>
//       {/* Il tuo contenuto */}
//       <DebugConsole />
//     </>
//   );
// }