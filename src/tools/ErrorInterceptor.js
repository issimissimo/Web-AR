export default function ErrorInterceptor(toastRef) {
    const originalConsoleError = console.error;

    console.error = (...args) => {
        originalConsoleError(...args);

        const errorMessage = args
            .map(arg => {
                if (arg instanceof Error) {
                    return arg.message;
                }
                return String(arg);
            })
            .join(' ');

        if (toastRef?.show) {
            toastRef.show(errorMessage, {
                duration: 5000,
                isError: true
            });
        }
    };

    // Ritorna funzione per ripristinare
    return () => {
        console.error = originalConsoleError;
    };
}

// Uso nell'App.jsx
/*
import { onMount } from "solid-js";
import { ErrorInterceptor } from "./ErrorInterceptor";
import Toast from "./Toast";

function App() {
  let toastRef;

  onMount(() => {
    const cleanup = ErrorInterceptor(toastRef);
    return cleanup; // Ripristina al cleanup
  });

  return (
    <div>
      <Toast ref={toastRef} />
    </div>
  );
}
*/