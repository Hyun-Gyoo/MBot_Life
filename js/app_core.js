// --- Initialize Default Presets ---
function initializeDefaultPresets() {
    const CURRENT_VERSION = 'v4_empty_no_samples';
    const version = localStorage.getItem('mbot_life_presets_version');
    
    if (version !== CURRENT_VERSION) {
        localStorage.removeItem('mbot_life_presets');
        localStorage.setItem('mbot_life_presets_version', CURRENT_VERSION);
    }
    
    let presets = JSON.parse(localStorage.getItem('mbot_life_presets') || '{}');
    if (Object.keys(presets).length === 0) {
        // 사용자의 요청에 따라 시작 시 주어지는 샘플 시나리오를 모두 제거했습니다.
        // 완전히 빈 화면에서 사용자가 직접 "+ 새 시나리오 생성"을 통해 시작하게 됩니다.
        localStorage.setItem('mbot_life_presets', JSON.stringify(presets));
    }
}
