
// Cancel all magic (including meditate) on any key or mouse input, including Q, E, and mouse clicks
if (typeof window !== 'undefined') {
    const cancelMagic = () => {
        window.dispatchEvent(new Event('cancel_magic'));
    };
    window.addEventListener('keydown', cancelMagic);
    window.addEventListener('mousedown', cancelMagic);
    window.addEventListener('touchstart', cancelMagic);
}
