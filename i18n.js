/**
 * Saltycat Mailservice - L10N Dynamic Engine
 */

window.TRANSLATIONS = null;

// Helper to clean language code format (e.g., 'zh-TW' -> 'zh_TW', 'en-US' -> 'en_US')
function formatLangCode(langCode) {
    if (!langCode) return 'en_US';
    const clean = langCode.replace('-', '_');
    if (clean.startsWith('zh_')) return 'zh_TW';
    if (clean.startsWith('ja_') || clean.startsWith('jp_')) return 'jp_JP';
    if (clean.startsWith('ko_') || clean.startsWith('kr_')) return 'kr_KR';
    return 'en_US';
}

// Get best default language based on browser setting
function getBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    return formatLangCode(browserLang);
}

// Initialise L10N dictionary loading
async function initI18n() {
    try {
        const response = await fetch('translations.json?v=3');
        window.TRANSLATIONS = await response.json();
        
        const isLoggedIn = !!localStorage.getItem('bearer_jwt');
        const isManuallyAssigned = localStorage.getItem('manually_assigned_language') === 'true';
        
        let currentLang = null;
        if (isLoggedIn || isManuallyAssigned) {
            currentLang = localStorage.getItem('preferred_language');
        }
        
        if (!currentLang) {
            currentLang = getBrowserLanguage();
        }
        
        localStorage.setItem('preferred_language', currentLang);
        applyTranslations();
    } catch (e) {
        console.error("Failed to load L10N translations dictionary:", e);
    }
}

// Translation translation lookup core
function t(key, variables = {}) {
    const lang = localStorage.getItem('preferred_language') || 'en_US';
    
    // If dictionary exists and has the translation for the selected language
    if (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang][key]) {
        return replaceVariables(window.TRANSLATIONS[lang][key], variables);
    }
    
    // Lookup translated string; fallbacks gracefully to the English key
    return replaceVariables(key, variables);
}

function replaceVariables(text, variables) {
    let result = text;
    Object.keys(variables).forEach(v => {
        result = result.replace(new RegExp(`{${v}}`, 'g'), variables[v]);
    });
    return result;
}

// Scan whole DOM and apply translation replacements
function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.innerHTML = t(key);
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });
    
    // Broadcast custom event so index.html and other templates can refresh dynamic components
    window.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: localStorage.getItem('preferred_language') || 'en_US' 
    }));
}

// Update local language preference and push to server if logged in
async function changeLanguage(selectedLang) {
    const formatted = formatLangCode(selectedLang);
    localStorage.setItem('preferred_language', formatted);
    localStorage.setItem('manually_assigned_language', 'true');
    applyTranslations();
    
    // Synchronize to Firestore if userToken exists
    if (window.userToken && window.BACKEND_URL) {
        try {
            await fetch(`${window.BACKEND_URL}/api/users/language`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${window.userToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ preferred_language: formatted })
            });
        } catch (e) {
            console.error("Failed to sync language to Firestore backend:", e);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initI18n);
