export default function functionName() {
    try {
        const stack = new Error().stack;
        // Prende la seconda riga dello stack (la funzione chiamante)
        const caller = stack.split('\n')[2];
        const match = caller.match(/at (\w+)/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}