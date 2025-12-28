
// Cancel meditate on any key or mouse input, including Q, E, and mouse clicks
if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
        if (window.curPlayer && window.curPlayer.meditateActive) {
            window.curPlayer.meditateCancelFlag = true;
        }
    });
    window.addEventListener('mousedown', (e) => {
        if (window.curPlayer && window.curPlayer.meditateActive) {
            window.curPlayer.meditateCancelFlag = true;
        }
    });
    window.addEventListener('touchstart', (e) => {
        if (window.curPlayer && window.curPlayer.meditateActive) {
            window.curPlayer.meditateCancelFlag = true;
        }
    });
}
