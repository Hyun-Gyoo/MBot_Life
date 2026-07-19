// --- App Initialization ---
window.addEventListener('DOMContentLoaded', () => {
    // Initialize default presets if local storage is empty
    initializeDefaultPresets();
    
    // Fill scenario grid on the landing view
    renderLandingView();
    
    // Listen to Enter/FocusOut on basic inputs to refresh
    const inputs = ['initial-investment', 'annual-rate', 'inflation-rate', 'use-real-value', 'simulation-period', 'birth-year-month', 'start-year-month'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener('change', () => {
            runSimulation();
        });
    });
});
