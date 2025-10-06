import { createEffect, on } from 'solid-js';

export default function useOnce(enabledSignal, callback) {
  let hasBeenEnabled = false;
  
  createEffect(on(enabledSignal, (enabled) => {
    if (enabled && !hasBeenEnabled) {
      hasBeenEnabled = true;
      callback();
    }
  }));
}