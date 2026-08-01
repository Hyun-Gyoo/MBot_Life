// --- Initialize Default Presets ---
function initializeDefaultPresets() {
    const CURRENT_VERSION = 'v6_sample_scenario_provided';
    const version = localStorage.getItem('mbot_life_presets_version');
    
    if (version !== CURRENT_VERSION) {
        localStorage.removeItem('mbot_life_presets');
        localStorage.setItem('mbot_life_presets_version', CURRENT_VERSION);
    }
    
    let presets = JSON.parse(localStorage.getItem('mbot_life_presets') || '{}');
    if (Object.keys(presets).length === 0) {
        const sampleState = typeof getSampleScenario === 'function' ? getSampleScenario() : JSON.parse(JSON.stringify(DEFAULT_SCENARIO));
        presets["기본 샘플 시나리오"] = sampleState;
        localStorage.setItem('mbot_life_presets', JSON.stringify(presets));
    }
}
