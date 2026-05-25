import json
import os
from deep_translator import GoogleTranslator

# 📂 Folder jahan files save hongi
folder_path = "src/i18n/locales"

# 🎯 Aapka provide kiya hua Hindi data (Source of Truth)
# 🎯 Ise copy karke apni script mein paste karein
hindi_base = {
    "nav_blog": "ब्लॉग",
    "nav_faq": "सवाल-जवाब",
    "nav_get_started": "शुरू करें",
    "nav_features": "खासियतें",
    "nav_how_it_works": "यह कैसे काम करता है?",
    "nav_security": "सुरक्षा",
    "hero_badge": "100+ बीटा टेस्टर्स का भरोसा ❤️",
    "hero_title": "सपने पूरे करो। ✨",
    "hero_sub": "खर्चों को ट्रैक करने और बचत करने का भारत का सबसे स्मार्ट तरीका।",
    "btn_open_web": "वेब ऐप खोलें",
    "btn_download_apk": "Android App डाउनलोड करें",
    "common.selectLanguage": "भाषा चुनें",
    "common.chooseLanguage": "अपनी पसंदीदा भाषा चुनें",
    "common.cancel": "रद्द करें",
    "common.apply": "लागू करें",
    "faq_main_title_1": "अक्सर पूछे जाने वाले",
    "faq_main_title_2": "सवाल",
    "faq_main_sub": "BachatKaro के बारे में वो सब कुछ जो आपको जानना चाहिए।",
    "faq_q1": "क्या BachatKaro पूरी तरह से मुफ़्त है?",
    "faq_a1": "हाँ! मुख्य खर्च ट्रैकिंग और फैमिली बजटिंग फीचर्स 100% मुफ़्त हैं, इसमें कोई छिपा हुआ चार्ज नहीं है।",
    "faq_q2": "यह अभी Google Play Store पर क्यों नहीं है?",
    "faq_a2": "आपकी मेहनत की कमाई का 30% हिस्सा हम किसी बिचौलिया कमीशन में क्यों दें? इसीलिए BachatKaro को हमने PWA के रूप में बनाया है, ताकि शुरुआत में यह आपके लिए 100% फ्री रहे। हमारा मिशन आपकी बचत है, किसी और का मुनाफा नहीं। आप भी इसे दोस्तों और रिश्तेदारों को शेयर करें, क्योंकि आप ही हमारी फैमिली हो। बचत करेगा इंडिया, तभी तो सपने पूरे करेगा इंडिया! Android App भी जल्द ही आपकी सुविधा के लिए सीधे डाउनलोड के लिए उपलब्ध होगा।",
    "faq_q3": "मेरा वित्तीय डेटा कैसे सुरक्षित है?",
    "faq_a3": "हम बैंक-ग्रेड एन्क्रिप्शन का उपयोग करते हैं। आपका एसएमएस डेटा आपके डिवाइस पर हमारे उन्नत एसएमएस इंजन द्वारा स्थानीय रूप से प्रोसेस किया जाता है और हमारे सर्वर द्वारा कभी नहीं पढ़ा जाता है।",
    "faq_q4": "आप रिवॉर्ड पॉइंट या कैशबैक क्यों नहीं देते?",
    "faq_a4": "क्योंकि हम असली बचत पर ध्यान देते हैं, मार्केटिंग के हथकंडों पर नहीं। कैशबैक मनोवैज्ञानिक रूप से आपको अधिक खर्च करने के लिए धोखा देते हैं। हमारा लक्ष्य आपको हर महीने ₹5,000+ बचाने में मदद करना है।",
    "faq_q5": "BachatKaro अन्य ऐप से कैसे अलग है?",
    "faq_a5": "कोई फालतू का कबाड़ नहीं, कोई परेशान करने वाले विज्ञापन नहीं जो आपको पर्सनल लोन लेने के लिए मजबूर करें। आपके परिवार के बजट, ट्रिप स्प्लिटिंग और स्मार्ट EMI ट्रैकिंग के लिए बस एक साफ़-सुथरा, ऑटोमेटेड डैशबोर्ड।",
    "footer_privacy": "गोपनीयता नीति",
    "footer_terms": "नियम और शर्तें",
    "footer_made_with_love": "भारत के लिए प्यार से बनाया गया, By ORV Technology ❤️",
    "about_title": "हमारे बारे में",
    "about_mission_title": "हमारा मिशन",
    "about_mission_desc": "हमारा लक्ष्य हर हिंदुस्तानी को उसकी मेहनत की कमाई का सही हिसाब देना और उसे फिजूलखर्ची से बचाना है। बचत करेगा इंडिया, तभी तो सपने पूरे करेगा इंडिया!",
    "about_why_us": "हमें क्यों चुनें?",
    "about_why_desc": "हम कोई बैंक नहीं हैं, हम आपकी फैमिली के डिजिटल मेंटर हैं जो बिना किसी बिचौलिया कमीशन के आपको बचत की राह दिखाते हैं।",
    "contact_title": "संपर्क करें",
    "contact_sub": "हम आपकी मदद के लिए हमेशा यहाँ हैं। आप ही हमारी फैमिली हो, तो बेझिझक बात करें।",
    "contact_form_name": "आपका नाम",
    "contact_form_email": "ईमेल आईडी",
    "contact_form_msg": "आपका संदेश",
    "contact_btn": "संदेश भेजें",
    "contact_whatsapp": "WhatsApp पर जुड़ें"
}

# 🌍 Aapki batayi hui saari languages
languages = {
    "en": "en", "mr": "mr", "gu": "gu", "bn": "bn", "pa": "pa",
    "ta": "ta", "te": "te", "kn": "kn", "ml": "ml", "or": "or",
    "ur": "ur", "as": "as", "sa": "sa", "mai": "mai", "ne": "ne",
    "awa": "hi", "bho": "hi", "hinglish": "hi" # Hindi base for local touch
}

def translate_all():
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)

    for lang_file, target_code in languages.items():
        print(f"🚀 Processing {lang_file}.json...")
        translated_content = {}
        
        for key, text in hindi_base.items():
            try:
                if lang_file == 'hi':
                    translated_content[key] = text
                else:
                    # Hindi se target language mein translation
                    translated = GoogleTranslator(source='hi', target=target_code).translate(text)
                    translated_content[key] = translated
            except Exception as e:
                translated_content[key] = text # Fallback to original

        # Save logic (Merging with existing content)
        file_path = os.path.join(folder_path, f"{lang_file}.json")
        existing_data = {}
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                try: existing_data = json.load(f)
                except: pass
        
        existing_data.update(translated_content)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    translate_all()
    print("\n🔥 All 18+ files are updated!")