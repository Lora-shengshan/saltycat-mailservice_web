# 🌐 Saltycat Mailservice - 前端 L10N（方案一：單一 HTML + 用戶端動態 JS 渲染）實作計畫書

本計畫書已選定 **「方案 A：單一 `index.html` + 用戶端動態 JS 渲染」** 作為唯一的 L10N 實作架構，並完全將程式碼與翻譯資料分離。本設計符合 100% DRY 原則，具備零代碼冗餘、無痛即時切換與極致效能體驗。

---

## 一、 核心設計：English-Key-First & 檔案分離

我們將 L10N 的架構定義為以下兩個部分：
1. **`i18n.js`**：極輕量的語系解析、自動瀏覽器語系偵測、LocalStorage 儲存及動態 DOM 置換引擎。
2. **`translations.json`**：存放所有語系（繁體中文、日本語、한국어）的翻譯對照字典。

### 1. 以英文 Key 為唯一識別碼 (English-Key-First)
所有的 `data-i18n` 屬性與 JS 調用皆以 **「英文片語」** 作為唯一的 Key（例如 `data-i18n="Register for free"`）。
* **英文無痛降級 (English Fallback)**：當語系設為 `en_US` 時，L10n 引擎會直接回傳 Key 本身，不需在 JSON 中重複維護英文翻譯。
* **安全性防禦**：如果任何翻譯語系（如 `jp_JP`）遺漏了某個 Key 的對照值，系統會自動安全地回退顯示該英文 Key，絕對不顯示中文，確保國際化外觀的穩定。

---

## 二、 檔案架構設計 (File Structure Spec)

### 1. 獨立翻譯字典檔 ─ `translations.json`
這將是一個純淨的 JSON 檔案，存放各語系與英文 Key 的對應：

```json
{
  "zh_TW": {
    "Promo Banner": "🎉 優惠期間:註冊即免費體驗Lite方案",
    "Slogan Title": "台灣CP值最高的<br>自訂網域郵件轉寄服務",
    "Slogan Desc": "為什麼要為企業信箱支付昂貴的月費？使用 Saltycat Mailservice，您可以將自己的網域（如 ceo@yourdomain.tw）100% 完美轉寄至您現有的免費 Gmail，免除每個月數百元按帳號收費的負擔！",
    "Home": "首頁",
    "Pricing": "方案定價",
    "FAQ": "常見問題",
    "Back to Dashboard": "返回個人儀表板",
    "Back to Home": "返回首頁",
    "Sign In": "登入",
    "Register for free": "註冊免費體驗",
    "Sign Out": "登出帳戶",
    "Company Name": "陞和姍科技商號",
    "Tax ID": "統編: 61263535",
    "Terms of Service": "使用與服務條款 (Terms of Service)",
    "Privacy Policy": "隱私權政策 (Privacy Policy)",
    "Refund Policy": "退款方式 (Refund Policy)",
    "Contact Support Text": "如有任何商務合作或帳號疑問，請發信至 cs@saltycat.tw"
  },
  "jp_JP": {
    "Promo Banner": "🎉 特典期間：登録後すぐにLiteプランを無料で体験できます",
    "Slogan Title": "台灣で最もコスパが高い<br>カスタムドメイン電子メール転送サービス",
    "Home": "ホーム",
    "Pricing": "料金プラン",
    "FAQ": "よくある質問",
    "Back to Dashboard": "ダッシュボードに戻る",
    "Back to Home": "ホームに戻る",
    "Sign In": "ログイン",
    "Register for free": "無料で体験登録",
    "Sign Out": "ログアウト",
    "Company Name": "陞和姍科技商號",
    "Tax ID": "登録番号: 61263535",
    "Terms of Service": "利用規約 (Terms of Service)",
    "Privacy Policy": "プライバシーポリシー (Privacy Policy)",
    "Refund Policy": "返金・キャンセルポリシー (Refund Policy)",
    "Contact Support Text": "ビジネス提携やアカウントに関するご質問は、cs@saltycat.tw までメールでお問い合わせください"
  },
  "kr_KR": {
    "Promo Banner": "🎉 이벤트 기간: 가입 즉시 Lite 요금제 무료 체험 제공",
    "Slogan Title": "대만에서 가성비가 가장 뛰어난<br>맞춤 도메인 이메일 포워딩 서비스",
    "Home": "홈",
    "Pricing": "요금제",
    "FAQ": "자주 묻는 질문",
    "Back to Dashboard": "개인 대시보드로 돌아가기",
    "Back to Home": "홈으로 돌아가기",
    "Sign In": "로그인",
    "Register for free": "회원가입",
    "Sign Out": "로그아웃",
    "Company Name": "Sheng & Shan Tech Firm",
    "Tax ID": "Tax ID: 61263535",
    "Terms of Service": "이용약관 (Terms of Service)",
    "Privacy Policy": "개인정보처리방침 (Privacy Policy)",
    "Refund Policy": "환불 및 구독 취소 정책 (Refund Policy)",
    "Contact Support Text": "비즈니스 제휴 또는 계정 관련 문의사항은 cs@saltycat.tw 로 이메일을 보내주세요"
  }
}
```

### 2. 極輕量 L10N 解析引擎 ─ `i18n.js`
只負責在載入網頁時載入 `translations.json` 並更新 DOM：

```javascript
/**
 * Saltycat Mailservice - L10N Dynamic Engine
 */

window.TRANSLATIONS = null;

// 初始化載入翻譯字典檔
async function initI18n() {
    try {
        const response = await fetch('translations.json');
        window.TRANSLATIONS = await response.json();
        
        // 偵測並套用語系
        let lang = localStorage.getItem('preferred_language');
        if (!lang) {
            // 自動偵測瀏覽器預設語系
            const navLang = navigator.language.replace('-', '_');
            lang = ['zh_TW', 'jp_JP', 'kr_KR'].includes(navLang) ? navLang : 'en_US';
            localStorage.setItem('preferred_language', lang);
        }
        
        applyTranslations();
    } catch (e) {
        console.error("Failed to load L10N translations dictionary:", e);
    }
}

// 語系解析核心
function t(key, variables = {}) {
    const lang = localStorage.getItem('preferred_language') || 'en_US';
    
    // en_US 或無載入字典時，安全回退英文 Key 本身
    if (lang === 'en_US' || !window.TRANSLATIONS) {
        return replaceVariables(key, variables);
    }
    
    const translated = (window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang][key]) || key;
    return replaceVariables(translated, variables);
}

function replaceVariables(text, variables) {
    let result = text;
    Object.keys(variables).forEach(v => {
        result = result.replace(new RegExp(`{${v}}`, 'g'), variables[v]);
    });
    return result;
}

// 執行 DOM 置換
function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.innerHTML = t(key);
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });
    
    // 自訂事件廣播（供 index.html 內動態組件監聽重繪）
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: localStorage.getItem('preferred_language') }));
}

// 當 DOM 載入完畢後自動初始化
document.addEventListener('DOMContentLoaded', initI18n);
```

---

## 三、 前端 UI 整合方案

### 1. 靜態網頁 DOM 置換 (與無縫英文降級)
在 `index.html`、`terms.html`、`privacy_policy.html`、`faq.html` 中，將中文內容包裹並加入 `data-i18n`。預設文字填寫英文 Key：
```html
<button data-i18n="Register for free" class="...">Register for free</button>
```
*這能保證即便 JavaScript 被阻擋，網頁也會直接顯示完美的英文版，不漏中文、不破圖。*

### 2. 導覽列新增「語系選擇下拉選單」
* 在 `header` 新增一個 Globe 切換選單。點選切換事件為：
  ```javascript
  function changeLanguage(lang) {
      localStorage.setItem('preferred_language', lang);
      applyTranslations();
      // 向後端同步此語系設定值
      syncLanguageToCloud(lang);
  }
  ```

---

## 四、 後端 API 與 資料庫同步 (Backend & Database Sync)

1. **Firestore 使用者 Schema 變更**：
   在 `/users/{uid}` 文件中，新增欄位：`preferred_language: string`（預設為 `"en_US"`）。
2. **調整 `/api/users/init` 端點 (`app/routers/users.py`)**：
   * 註冊時，同步寫入前端偵測/選取的 `preferred_language`。
   * 登入時，讀取並回傳使用者的語系設定，使前端 LocalStorage 與之對齊。
3. **新增 `/api/users/language` 端點**：
   * 讓使用者可以於控制台隨時變更預設語系並寫入資料庫：
     ```python
     @router.post("/language")
     async def update_user_language(request: UpdateLanguageRequest, current_user: dict = Depends(get_current_user)):
         # 更新該用戶的 preferred_language 欄位
     ```

---

## 五、 DNS 設定值彈出視窗（`dns-modal`）特別處理

1. **純技術值（絕對不翻譯）**：
   `Host`、`Type`、`Value`、`Points To` 等標準欄位，以及 `inbound-smtp.us-east-1.amazonaws.com.` 等解析值，確保複製設定時完美不破壞。
2. **操作指引與 UI 標題（100% 翻譯）**：
   包含「安全金鑰記錄」、「第一步」、「第二步」等文字在 `showDnsModalDetails()` 中動態套用 `t()`。
