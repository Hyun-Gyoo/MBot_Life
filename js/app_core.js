// --- Initialize Default Presets ---
function initializeDefaultPresets() {
    const CURRENT_VERSION = 'v5_clean_no_legacy_fields';
    const version = localStorage.getItem('mbot_life_presets_version');
    
    if (version !== CURRENT_VERSION) {
        localStorage.removeItem('mbot_life_presets');
        localStorage.setItem('mbot_life_presets_version', CURRENT_VERSION);
    }
    
    let presets = JSON.parse(localStorage.getItem('mbot_life_presets') || '{}');
    let modified = false;
    Object.keys(presets).forEach(key => {
        if (presets[key]) {
            if ('currentDate' in presets[key]) { delete presets[key].currentDate; modified = true; }
            if ('currentBalance' in presets[key]) { delete presets[key].currentBalance; modified = true; }
        }
    });
    if (modified || Object.keys(presets).length === 0) {
        localStorage.setItem('mbot_life_presets', JSON.stringify(presets));
    }
}
