// Patch to suppress Canvas2D willReadFrequently warnings from p5.js
// This must be loaded before p5.js preload() runs
(function() {
    'use strict';
    
    // Store the original getContext method
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    
    // Override getContext to automatically set willReadFrequently
    HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
        if (contextType === '2d' || contextType === 'bitmaprenderer') {
            contextAttributes = contextAttributes || {};
            // Set willReadFrequently to true for all 2D contexts
            contextAttributes.willReadFrequently = true;
        }
        return originalGetContext.call(this, contextType, contextAttributes);
    };
    
    console.log('Canvas2D willReadFrequently patch applied');
})();
