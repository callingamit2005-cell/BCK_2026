/**
 * AddExpense Component - BachatKaro Fintech
 * Enterprise UI + Smart Voice + Full Regional Language Support
 * 🛡️ LOGIC LOCK: Yes/No Removed, 10s Strict Timeout, Instant Auto-Save Added.
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, AlertCircle, Mic, MicOff } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDashboardAIVoice } from "@/voice/integrations/useDashboardAIVoice";

const PAYMENT_MODES = ["UPI", "Cash", "Net Banking", "Card"] as const;
const CATEGORIES = ["Food", "Shopping", "Bills", "Travel", "Others"] as const;

// ===== 100% COMPLETE TRANSLATIONS =====
const translations = {
  en: {
    pageTitle: "Add Expense", smartEntry: "Smart Entry", smartHint: 'Say: "500 for petrol" or "Dinner 1000 cash"',
    amount: "Amount", payment: "Payment Mode", category: "Category", note: "Note (Optional)", noteHint: "What was this for?", date: "Date",
    saveBtn: "Save Expense", savingBtn: "Saving...", select: "Select", reqFields: "Required fields",
    toastParsed: "Expense detected!", toastSaved: "Expense Added! ✅", errAmount: "Amount is required", errValidAmount: "Please enter a valid amount",
    errPayment: "Payment mode is required", errCategory: "Category is required", toastMissing: "Missing fields", toastMissingDesc: "Voice missed some details. Please complete them manually.",
    voiceButton: "Speak", listening: "Listening...", micDenied: "Microphone Access Denied", micDeniedDesc: "Please allow microphone permissions.",
    catFood: "Food", catShopping: "Shopping", catBills: "Bills", catTravel: "Travel", catOthers: "Others",
    payUPI: "UPI", payCash: "Cash", payNet: "Net Banking", payCard: "Card"
  },
  hinglish: {
    pageTitle: "खर्चा जोड़ें", smartEntry: "स्मार्ट एंट्री", smartHint: 'बोलें: "500 पेट्रोल के लिए" या "डिनर 1000 कैश"',
    amount: "राशि", payment: "भुगतान का तरीका", category: "श्रेणी", note: "नोट (वैकल्पिक)", noteHint: "यह किस लिए था?", date: "तारीख",
    saveBtn: "खर्च सेव करें", savingBtn: "सेव हो रहा है...", select: "चुनें", reqFields: "आवश्यक फ़ील्ड",
    toastParsed: "खर्च मिला!", toastSaved: "खर्च जोड़ दिया गया! ✅", errAmount: "राशि आवश्यक है", errValidAmount: "कृपया सही राशि दर्ज करें",
    errPayment: "भुगतान का तरीका आवश्यक है", errCategory: "श्रेणी आवश्यक है", toastMissing: "कुछ छूट गया", toastMissingDesc: "कृपया बचे हुए फ़ील्ड मैन्युअली भरें।",
    voiceButton: "बोलें", listening: "सुन रहा हूँ…", micDenied: "माइक की अनुमति नहीं है", micDeniedDesc: "कृपया माइक का उपयोग करने की अनुमति दें।",
    catFood: "खाना (Food)", catShopping: "शॉपिंग (Shopping)", catBills: "बिल (Bills)", catTravel: "यात्रा (Travel)", catOthers: "अन्य (Others)",
    payUPI: "UPI", payCash: "कैश", payNet: "नेट बैंकिंग", payCard: "कार्ड"
  },
  hi: {
    pageTitle: "खर्च जोड़ें", smartEntry: "स्मार्ट एंट्री", smartHint: 'बोलें: "500 पेट्रोल के लिए" या "डिनर 1000 कैश"',
    amount: "राशि", payment: "भुगतान का प्रकार", category: "श्रेणी", note: "टिप्पणी", noteHint: "किसके लिए था?", date: "तारीख",
    saveBtn: "खर्च सेव करें", savingBtn: "सेव हो रहा है...", select: "चुनें", reqFields: "आवश्यक फ़ील्ड",
    toastParsed: "खर्च मिला!", toastSaved: "खर्च जोड़ दिया गया! ✅", errAmount: "राशि आवश्यक है", errValidAmount: "कृपया सही राशि दर्ज करें",
    errPayment: "भुगतान का प्रकार आवश्यक है", errCategory: "श्रेणी आवश्यक है", toastMissing: "कुछ छूट गया", toastMissingDesc: "कृपया बचे हुए फ़ील्ड मैन्युअली भरें।",
    voiceButton: "बोलें", listening: "सुन रहा हूँ…", micDenied: "माइक की अनुमति नहीं है", micDeniedDesc: "कृपया माइक का उपयोग करने की अनुमति दें।",
    catFood: "भोजन", catShopping: "खरीदारी", catBills: "बिल", catTravel: "यात्रा", catOthers: "अन्य",
    payUPI: "UPI", payCash: "नकद (Cash)", payNet: "नेट बैंकिंग", payCard: "कार्ड"
  },
  pa: {
    pageTitle: "ਖਰਚਾ ਸ਼ਾਮਲ ਕਰੋ", smartEntry: "ਸਮਾਰਟ ਐਂਟਰੀ", smartHint: 'ਬੋਲੋ: "500 ਪੈਟਰੋਲ ਲਈ" ਜਾਂ "ਡਿਨਰ 1000 ਕੈਸ਼"',
    amount: "ਰਕਮ", payment: "ਭੁਗਤਾਨ ਦਾ ਢੰਗ", category: "ਸ਼੍ਰੇਣੀ", note: "ਨੋਟ (ਵਿਕਲਪਿਕ)", noteHint: "ਇਹ ਕਿਸ ਲਈ ਸੀ?", date: "ਮਿਤੀ",
    saveBtn: "ਖਰਚਾ ਸੇਵ ਕਰੋ", savingBtn: "ਸੇਵ ਹੋ ਰਿਹਾ ਹੈ...", select: "ਚੁਣੋ", reqFields: "ਲੋੜੀਂਦੇ ਖੇਤਰ",
    toastParsed: "ਖਰਚਾ ਮਿਲਿਆ!", toastSaved: "ਖਰਚਾ ਜੋੜ ਦਿੱਤਾ! ✅", errAmount: "ਰਕਮ ਲੋੜੀਂਦੀ ਹੈ", errValidAmount: "ਕ੍ਰਿਪਾ ਕਰਕੇ ਸਹੀ ਰਕਮ ਦਰਜ ਕਰੋ",
    errPayment: "ਭੁਗਤਾਨ ਦਾ ਢੰਗ ਲੋੜੀਂਦਾ ਹੈ", errCategory: "ਸ਼੍ਰੇਣੀ ਲੋੜੀਂਦੀ ਹੈ", toastMissing: "ਕੁਝ ਖਾਲੀ ਹੈ", toastMissingDesc: "ਕ੍ਰਿਪਾ ਕਰਕੇ ਬਚੇ ਹੋਏ ਖੇਤਰ ਭਰੋ।",
    voiceButton: "ਬੋਲੋ", listening: "ਸੁਣ ਰਿਹਾ ਹਾਂ...", micDenied: "ਮਾਈਕ ਦੀ ਇਜਾਜ਼ਤ ਨਹੀਂ ਹੈ", micDeniedDesc: "ਕਿਰਪਾ ਕਰਕੇ ਮਾਈਕ੍ਰੋਫੋਨ ਦੀ ਵਰਤੋਂ ਕਰਨ ਦਿਓ।",
    catFood: "ਭੋਜਨ", catShopping: "ਖਰੀਦਦਾਰੀ", catBills: "ਬਿੱਲ", catTravel: "ਯਾਤਰਾ", catOthers: "ਹੋਰ",
    payUPI: "UPI", payCash: "ਕੈਸ਼", payNet: "ਨੈੱਟ ਬੈਂਕਿੰਗ", payCard: "ਕਾਰਡ"
  },
  gu: {
    pageTitle: "ખર્ચ ઉમેરો", smartEntry: "સ્માર્ટ એન્ટ્રી", smartHint: 'બોલો: "500 પેટ્રોલ માટે" અથવા "ડિનર 1000 કેશ"',
    amount: "રકમ", payment: "ચુકવણીનો પ્રકાર", category: "શ્રેણી", note: "નોંધ (વૈકલ્પિક)", noteHint: "આ શું માટે હતું?", date: "તારીખ",
    saveBtn: "ખર્ચ સેવ કરો", savingBtn: "સેવ થઈ રહ્યું છે...", select: "પસંદ કરો", reqFields: "જરૂરી ફીલ્ડ",
    toastParsed: "ખર્ચ મળ્યો!", toastSaved: "ખર્ચ ઉમેરાયો! ✅", errAmount: "રકમ જરૂરી છે", errValidAmount: "કૃપા કરીને સાચી રકમ દાખલ કરો",
    errPayment: "ચુકવણીનો પ્રકાર જરૂરી છે", errCategory: "શ્રેણી જરૂરી છે", toastMissing: "કેટલાક ફીલ્ડ ખાલી છે", toastMissingDesc: "કૃપા કરીને બાકીના ફીલ્ડ ભરો.",
    voiceButton: "બોલો", listening: "સાંભળી રહ્યા છીએ...", micDenied: "માઇક્રોફોનની પરવાનગી નથી", micDeniedDesc: "કૃપા કરીને માઇકનો ઉપયોગ કરવાની મંજૂરી આપો.",
    catFood: "ખોરાક", catShopping: "ખરીદી", catBills: "બિલ", catTravel: "મુસાફરી", catOthers: "અન્ય",
    payUPI: "UPI", payCash: "રોકડ (Cash)", payNet: "નેટ બેન્કિંગ", payCard: "કાર્ડ"
  },
  mr: {
    pageTitle: "खर्च जोडा", smartEntry: "स्मार्ट एंट्री", smartHint: 'बोला: "500 पेट्रोलसाठी" किंवा "डिनर 1000 कॅश"',
    amount: "रक्कम", payment: "पेमेंट प्रकार", category: "श्रेणी", note: "टीप (वैकल्पिक)", noteHint: "हे कशासाठी होते?", date: "तारीख",
    saveBtn: "खर्च जतन करा", savingBtn: "जतन होत आहे...", select: "निवडा", reqFields: "आवश्यक फील्ड",
    toastParsed: "खर्च आढळला!", toastSaved: "खर्च जोडला! ✅", errAmount: "रक्कम आवश्यक आहे", errValidAmount: "कृपया योग्य रक्कम प्रविष्ट करा",
    errPayment: "पेमेंट प्रकार आवश्यक आहे", errCategory: "श्रेणी आवश्यक आहे", toastMissing: "काही फील्ड रिकामी आहेत", toastMissingDesc: "कृपया उर्वरित फील्ड भरा.",
    voiceButton: "बोला", listening: "ऐकत आहे...", micDenied: "मायक्रोफोनला परवानगी नाही", micDeniedDesc: "कृपया माइक वापरण्याची परवानगी द्या.",
    catFood: "अन्न", catShopping: "खरेदी", catBills: "बिले", catTravel: "प्रवास", catOthers: "इतर",
    payUPI: "UPI", payCash: "रोख (Cash)", payNet: "नेट बँकिंग", payCard: "कार्ड"
  },
  bn: {
    pageTitle: "খরচ যোগ করুন", smartEntry: "স্মার্ট এন্ট্রি", smartHint: 'বলুন: "500 পেট্রোলের জন্য" বা "ডিনার 1000 ক্যাশ"',
    amount: "পরিমাণ", payment: "পেমেন্ট মোড", category: "বিভাগ", note: "নোট (ঐচ্ছিক)", noteHint: "এটি কিসের জন্য ছিল?", date: "তারিখ",
    saveBtn: "খরচ সংরক্ষণ করুন", savingBtn: "সংরক্ষণ হচ্ছে...", select: "নির্বাচন করুন", reqFields: "প্রয়োজনীয় ফিল্ড",
    toastParsed: "খরচ পাওয়া গেছে!", toastSaved: "খরচ যোগ করা হয়েছে! ✅", errAmount: "পরিমাণ প্রয়োজন", errValidAmount: "অনুগ্রহ করে সঠিক পরিমাণ দিন",
    errPayment: "পেমেন্ট মোড প্রয়োজন", errCategory: "বিভাগ প্রয়োজন", toastMissing: "কিছু ফিল্ড খালি আছে", toastMissingDesc: "অনুগ্রহ করে বাকি ফিল্ডগুলো পূরণ করুন।",
    voiceButton: "বলুন", listening: "শুনছি...", micDenied: "মাইক্রোফোনের অনুমতি নেই", micDeniedDesc: "অনুগ্রহ করে মাইক ব্যবহারের অনুমতি দিন।",
    catFood: "খাবার", catShopping: "কেনাকাটা", catBills: "বিল", catTravel: "ভ্রমণ", catOthers: "অন্যান্য",
    payUPI: "UPI", payCash: "নগদ (Cash)", payNet: "নেট ব্যাঙ্কিং", payCard: "কার্ড"
  },
  ta: {
    pageTitle: "செலவைச் சேர்க்கவும்", smartEntry: "ஸ்மார்ட் உள்ளீடு", smartHint: '"500 பெட்ரோலுக்கு" அல்லது "டின்னர் 1000 கேஷ்" என்று சொல்லுங்கள்',
    amount: "தொகை", payment: "கட்டண முறை", category: "வகை", note: "குறிப்பு (விருப்பம்)", noteHint: "இது எதற்காக?", date: "தேதி",
    saveBtn: "செலவை சேமிக்கவும்", savingBtn: "சேமிக்கிறது...", select: "தேர்ந்தெடுக்கவும்", reqFields: "தேவையான புலங்கள்",
    toastParsed: "செலவு கண்டறியப்பட்டது!", toastSaved: "செலவு சேர்க்கப்பட்டது! ✅", errAmount: "தொகை தேவை", errValidAmount: "சரியான தொகையை உள்ளிடவும்",
    errPayment: "கட்டண முறை தேவை", errCategory: "வகை தேவை", toastMissing: "சில புலங்கள் காலியாக உள்ளன", toastMissingDesc: "மீதமுள்ள புலங்களை நிரப்பவும்.",
    voiceButton: "பேசுங்கள்", listening: "கேட்கிறது...", micDenied: "மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது", micDeniedDesc: "மைக்ரோஃபோனைப் பயன்படுத்த அனுமதிக்கவும்.",
    catFood: "உணவு", catShopping: "ஷாப்பிங்", catBills: "பில்கள்", catTravel: "பயணம்", catOthers: "மற்றவை",
    payUPI: "UPI", payCash: "பணம் (Cash)", payNet: "நெட் பேங்கிங்", payCard: "கார்டு"
  },
  te: {
    pageTitle: "ఖర్చును జోడించండి", smartEntry: "స్మార్ట్ ఎంట్రీ", smartHint: '"500 పెట్రోల్ కోసం" లేదా "డిన్నర్ 1000 క్యాష్" అని చెప్పండి',
    amount: "మొత్తం", payment: "చెల్లింపు విధానం", category: "వర్గం", note: "గమనిక (ఐచ్ఛికం)", noteHint: "ఇది దేనికి?", date: "తేదీ",
    saveBtn: "ఖర్చును సేవ్ చేయండి", savingBtn: "సేవ్ చేస్తోంది...", select: "ఎంచుకోండి", reqFields: "అవసరమైన ఫీల్డ్లు",
    toastParsed: "ఖర్చు కనుగొనబడింది!", toastSaved: "ఖర్చు జోడించబడింది! ✅", errAmount: "మొత్తం అవసరం", errValidAmount: "దయచేసి సరైన మొత్తాన్ని నమోదు చేయండి",
    errPayment: "చెల్లింపు విధానం అవసరం", errCategory: "వర్గం అవసరం", toastMissing: "కొన్ని ఫీల్డ్లు ఖాళీగా ఉన్నాయి", toastMissingDesc: "దయచేసి మిగిలిన ఫీల్డ్‌లను పూరించండి.",
    voiceButton: "మాట్లాడండి", listening: "వింటోంది...", micDenied: "మైక్రోఫోన్ అనుమతి నిరాకరించబడింది", micDeniedDesc: "దయచేసి మైక్ ఉపయోగించడానికి అనుమతించండి.",
    catFood: "ఆహారం", catShopping: "షాపింగ్", catBills: "బిల్లులు", catTravel: "ప్రయాణం", catOthers: "ఇతర",
    payUPI: "UPI", payCash: "నగదు (Cash)", payNet: "నెట్ బ్యాంకింగ్", payCard: "కార్డు"
  },
  kn: {
    pageTitle: "ವೆಚ್ಚ ಸೇರಿಸಿ", smartEntry: "ಸ್ಮಾರ್ಟ್ ಎಂಟ್ರಿ", smartHint: '"500 ಪೆಟ್ರೋಲ್‌ಗೆ" ಅಥವಾ "ಡಿನ್ನರ್ 1000 ಕ್ಯಾಶ್" ಎಂದು ಹೇಳಿ',
    amount: "ಮೊತ್ತ", payment: "ಪಾವತಿ ವಿಧಾನ", category: "ವರ್ಗ", note: "ಟಿಪ್ಪಣಿ (ಐಚ್ಛಿಕ)", noteHint: "ಇದು ಯಾವುದಕ್ಕಾಗಿತ್ತು?", date: "ದಿನಾಂಕ",
    saveBtn: "ವೆಚ್ಚ ಉಳಿಸಿ", savingBtn: "ಉಳಿಸಲಾಗುತ್ತಿದೆ...", select: "ಆಯ್ಕೆಮಾಡಿ", reqFields: "ಅಗತ್ಯ ಕ್ಷೇತ್ರಗಳು",
    toastParsed: "ವೆಚ್ಚ ಪತ್ತೆಯಾಗಿದೆ!", toastSaved: "ವೆಚ್ಚ ಸೇರಿಸಲಾಗಿದೆ! ✅", errAmount: "ಮೊತ್ತ ಅಗತ್ಯವಿದೆ", errValidAmount: "ದಯವಿಟ್ಟು ಸರಿಯಾದ ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ",
    errPayment: "ಪಾವತಿ ವಿಧಾನ ಅಗತ್ಯವಿದೆ", errCategory: "ವರ್ಗ ಅಗತ್ಯವಿದೆ", toastMissing: "ಕೆಲವು ಕ್ಷೇತ್ರಗಳು ಖಾಲಿಯಾಗಿವೆ", toastMissingDesc: "ದಯವಿಟ್ಟು ಉಳಿದ ಕ್ಷೇತ್ರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.",
    voiceButton: "ಮಾತನಾಡಿ", listening: "ಕೇಳಿಸುತ್ತಿದೆ...", micDenied: "ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ", micDeniedDesc: "ದಯವಿಟ್ಟು ಮೈಕ್ ಬಳಸಲು ಅನುಮತಿಸಿ.",
    catFood: "ಆಹಾರ", catShopping: "ಶಾಪಿಂಗ್", catBills: "ಬಿಲ್‌ಗಳು", catTravel: "ಪ್ರಯಾಣ", catOthers: "ಇತರೆ",
    payUPI: "UPI", payCash: "ನಗದು (Cash)", payNet: "ನೆಟ್ ಬ್ಯಾಂಕಿಂಗ್", payCard: "ಕಾರ್ಡ್"
  },
  ml: {
    pageTitle: "ചെലവ് ചേർക്കുക", smartEntry: "സ്മാർട്ട് എൻട്രി", smartHint: '"500 പെട്രോളിന്" അല്ലെങ്കിൽ "ഡിന്നർ 1000 ക്യാഷ്" എന്ന് പറയുക',
    amount: "തുക", payment: "പേയ്‌മെന്റ് മോഡ്", category: "വിഭാഗം", note: "കുറിപ്പ് (ഓപ്ഷണൽ)", noteHint: "ഇത് എന്തിനുവേണ്ടിയായിരുന്നു?", date: "തീയതി",
    saveBtn: "ചെലവ് സംരക്ഷിക്കുക", savingBtn: "സംരക്ഷിക്കുന്നു...", select: "തിരഞ്ഞെടുക്കുക", reqFields: "ആവശ്യമായ ഫീൽഡുകൾ",
    toastParsed: "ചെലവ് കണ്ടെത്തി!", toastSaved: "ചെലവ് ചേർത്തു! ✅", errAmount: "തുക ആവശ്യമാണ്", errValidAmount: "ദയവായി ശരിയായ തുക നൽകുക",
    errPayment: "പേയ്‌മെന്റ് മോഡ് ആവശ്യമാണ്", errCategory: "വിഭാഗം ആവശ്യമാണ്", toastMissing: "ചില ഫീൽഡുകൾ ശൂന്യമാണ്", toastMissingDesc: "ശേഷിക്കുന്ന ഫീൽഡുകൾ പൂരിപ്പിക്കുക.",
    voiceButton: "സംസാരിക്കുക", listening: "കേൾക്കുന്നു...", micDenied: "മൈക്രോഫോൺ അനുമതി നിഷേധിച്ചു", micDeniedDesc: "മൈക്ക് ഉപയോഗിക്കാൻ അനുവദിക്കുക.",
    catFood: "ഭക്ഷണം", catShopping: "ഷോപ്പിംഗ്", catBills: "ബില്ലുകൾ", catTravel: "യാത്ര", catOthers: "മറ്റുള്ളവ",
    payUPI: "UPI", payCash: "പണം (Cash)", payNet: "നെറ്റ് ബാങ്കിംഗ്", payCard: "കാർഡ്"
  },
  or: {
    pageTitle: "ଖର୍ଚ ଯୋଡନ୍ତୁ", smartEntry: "ସ୍ମାର୍ଟ ଏଣ୍ଟ୍ରି", smartHint: '"500 ପେଟ୍ରୋଲ ପାଇଁ" କିମ୍ବା "ଡିନର 1000 କ୍ୟାସ" କୁହନ୍ତୁ',
    amount: "ରାଶି", payment: "ପେମେଣ୍ଟ ମୋଡ୍", category: "ବର୍ଗ", note: "ନୋଟ୍ (ବିକଳ୍ପ)", noteHint: "ଏହା କାହିଁ ପାଇଁ ଥିଲା?", date: "ତାରିଖ",
    saveBtn: "ଖର୍ଚ ସେଭ୍ କରନ୍ତୁ", savingBtn: "ସେଭ୍ ହେଉଛି...", select: "ଚୟନ କରନ୍ତୁ", reqFields: "ଆବଶ୍ୟକ ଫିଲ୍ଡ",
    toastParsed: "ଖର୍ଚ ମିଳିଲା!", toastSaved: "ଖର୍ଚ ଯୋଡାଗଲା! ✅", errAmount: "ରାଶି ଆବଶ୍ୟକ", errValidAmount: "ଦୟାକରି ସଠିକ୍ ରାଶି ଦିଅନ୍ତୁ",
    errPayment: "ପେମେଣ୍ଟ ମୋଡ୍ ଆବଶ୍ୟକ", errCategory: "ବର୍ଗ ଆବଶ୍ୟକ", toastMissing: "କିଛି ଫିଲ୍ଡ ଖାଲି ଅଛି", toastMissingDesc: "ଦୟାକରି ବାକି ଫିଲ୍ଡ ପୂରଣ କରନ୍ତୁ।",
    voiceButton: "କୁହନ୍ତୁ", listening: "ଶୁଣୁଛି...", micDenied: "ମାଇକ୍ରୋଫୋନ୍ ଅନୁମତି ନାହିଁ", micDeniedDesc: "ଦୟାକରି ମାଇକ୍ ବ୍ୟବହାର କରିବାକୁ ଅନୁମତି ଦିଅନ୍ତୁ |",
    catFood: "ଖାଦ୍ୟ", catShopping: "କିଣାକିଣି", catBills: "ବିଲ୍", catTravel: "ଭ୍ରମଣ", catOthers: "ଅନ୍ୟାନ୍ୟ",
    payUPI: "UPI", payCash: "ନଗଦ (Cash)", payNet: "ନେଟ୍ ବ୍ୟାଙ୍କିଙ୍ଗ୍", payCard: "କାର୍ଡ"
  },
  bho: {
    pageTitle: "खर्चा जोड़ीं", smartEntry: "स्मार्ट एंट्री", smartHint: 'बोलीं: "500 पेट्रोल खातिर" या "डिनर 1000 कैश"',
    amount: "रकम", payment: "भुगतान के तरीका", category: "श्रेणी", note: "नोट (वैकल्पिक)", noteHint: "ई का खातिर रहल?", date: "तारीख",
    saveBtn: "खर्चा सेव करीं", savingBtn: "सेव हो रहल बा...", select: "चुनीं", reqFields: "जरूरी फील्ड",
    toastParsed: "खर्चा मिल गइल!", toastSaved: "खर्चा जुड़ गइल! ✅", errAmount: "रकम जरूरी बा", errValidAmount: "कृपया सही रकम दर्ज करीं",
    errPayment: "भुगतान के तरीका जरूरी बा", errCategory: "श्रेणी जरूरी बा", toastMissing: "कुछ फील्ड खाली बा", toastMissingDesc: "कृपया बाकी फील्ड मैन्युअली भरीं।",
    voiceButton: "बोलीं", listening: "सुन रहल बानी...", micDenied: "माइक के अनुमति नइखे", micDeniedDesc: "कृपया माइक के उपयोग करे के अनुमति दीं।",
    catFood: "खाना", catShopping: "शॉपिंग", catBills: "बिल", catTravel: "यात्रा", catOthers: "अन्य",
    payUPI: "UPI", payCash: "कैश", payNet: "नेट बैंकिंग", payCard: "कार्ड"
  },
  mai: {
    pageTitle: "खर्चा जोड़ू", smartEntry: "स्मार्ट एंट्री", smartHint: 'बोलू: "500 पेट्रोल लेल" या "डिनर 1000 कैश"',
    amount: "रकम", payment: "भुगतान के तरीका", category: "श्रेणी", note: "नोट (वैकल्पिक)", noteHint: "ई की लेल छल?", date: "तारीख",
    saveBtn: "खर्चा सेव करू", savingBtn: "सेव हो रहल अछि...", select: "चुनू", reqFields: "जरूरी फील्ड",
    toastParsed: "खर्चा भेटल!", toastSaved: "खर्चा जुड़ल! ✅", errAmount: "रकम जरूरी अछि", errValidAmount: "कृपया सही रकम दर्ज करू",
    errPayment: "भुगतान के तरीका जरूरी अछि", errCategory: "श्रेणी जरूरी अछि", toastMissing: "किछु फील्ड खाली अछि", toastMissingDesc: "कृपया बाकी फील्ड भरू।",
    voiceButton: "बोलू", listening: "सुनि रहल छी...", micDenied: "माइक के अनुमति नहि अछि", micDeniedDesc: "कृपया माइक के उपयोग करय के अनुमति दियौ।",
    catFood: "भोजन", catShopping: "खरीदारी", catBills: "बिल", catTravel: "यात्रा", catOthers: "अन्य",
    payUPI: "UPI", payCash: "नगद (Cash)", payNet: "नेट बैंकिंग", payCard: "कार्ड"
  },
  sa: {
    pageTitle: "व्ययः योजयतु", smartEntry: "स्मार्ट प्रविष्टिः", smartHint: '"500 पेट्रोलाय" वा "भोजनाय 1000 नगदम्" इति वदतु',
    amount: "राशिः", payment: "भुगतानप्रकारः", category: "वर्गः", note: "टिप्पणी (वैकल्पिक)", noteHint: "एतत् कस्मै आसीत्?", date: "दिनाङ्कः",
    saveBtn: "व्ययं रक्षतु", savingBtn: "रक्षति...", select: "चिनोतु", reqFields: "अपेक्षितानि क्षेत्राणि",
    toastParsed: "व्ययः प्राप्तः!", toastSaved: "व्ययः योजितः! ✅", errAmount: "राशिः अपेक्षिता", errValidAmount: "कृपया सम्यक् राशिं ददातु",
    errPayment: "भुगतानप्रकारः अपेक्षितः", errCategory: "वर्गः अपेक्षितः", toastMissing: "कानिचित् क्षेत्राणि रिक्तानि", toastMissingDesc: "कृपया अवशिष्टानि क्षेत्राणि पूरयतु।",
    voiceButton: "वदतु", listening: "शृणोति...", micDenied: "ध्वनिग्राहकस्य अनुमतिः नास्ति", micDeniedDesc: "कृपया ध्वनिग्राहकस्य उपयोगं कर्तुं अनुमतिं ददातु।",
    catFood: "भोजनम्", catShopping: "क्रयणम्", catBills: "देयकम्", catTravel: "यात्रा", catOthers: "अन्यत्",
    payUPI: "UPI", payCash: "नगदम् (Cash)", payNet: "जाल-अधिकोषणम्", payCard: "पत्रकम्"
  },
  sat: {
    pageTitle: "ᱠᱷᱚᱨᱚᱪ ᱥᱮᱞᱮᱫ ᱢᱮ", smartEntry: "ᱥᱢᱟᱨᱴ ᱮᱱᱴᱨᱤ", smartHint: '"500 ᱯᱮᱴᱨᱚᱞ ᱞᱟᱹᱜᱤᱫ" ᱟᱨᱵᱟᱝ "ᱰᱤᱱᱟᱨ 1000 ᱠᱮᱥ" ᱢᱮᱱ ᱢᱮ',
    amount: "ᱨᱚᱠᱚᱢ", payment: "ᱯᱮᱢᱮᱱᱴ ᱢᱳᱰ", category: "ᱛᱷᱚᱠ", note: "ᱱᱳᱴ (ᱵᱟᱪᱷᱱᱟᱣ)", noteHint: "ᱱᱚᱶᱟ ᱪᱮᱞᱟᱜ ᱛᱟᱦᱮᱸ ᱠᱟᱱᱟ?", date: "ᱢᱟᱹᱦᱤᱛ",
    saveBtn: "ᱠᱷᱚᱨᱚᱪ ᱥᱮᱵᱽ ᱢᱮ", savingBtn: "ᱥᱮᱵᱽ ᱦᱩᱭᱩᱜ ᱠᱟᱱᱟ...", select: "ᱵᱟᱪᱷᱟᱣ ᱢᱮ", reqFields: "ᱞᱟᱹᱠᱛᱤᱭᱟᱱ ᱯᱷᱤᱞᱰ",
    toastParsed: "ᱠᱷᱚᱨᱚᱪ ᱧᱟᱢ ᱮᱱᱟ!", toastSaved: "ᱠᱷᱚᱨᱚᱪ ᱥᱮᱞᱮᱫ ᱮᱱᱟ! ✅", errAmount: "ᱨᱚᱠᱚᱢ ᱞᱟᱹᱠᱛᱤ ᱠᱟᱱᱟ", errValidAmount: "ᱫᱟᱭᱟᱠᱟᱛᱮ ᱥᱟᱦᱴᱟ ᱨᱚᱠᱚᱢ ᱞᱤᱠᱷ ᱢᱮ",
    errPayment: "ᱯᱮᱢᱮᱱᱴ ᱢᱳᱰ ᱞᱟᱹᱠᱛᱤ ᱠᱟᱱᱟ", errCategory: "ᱛᱷᱚᱠ ᱞᱟᱹᱠᱛᱤ ᱠᱟᱱᱟ", toastMissing: "ᱠᱤᱪᱷᱩ ᱯᱷᱤᱞᱰ ᱠᱷᱟᱹᱞᱤ ᱢᱮᱱᱟᱜ-ᱟ", toastMissingDesc: "ᱫᱟᱭᱟᱠᱟᱛᱮ ᱵᱟᱹᱠᱤ ᱯᱷᱤᱞᱰ ᱯᱩᱨᱟᱹᱣ ᱢᱮ।",
    voiceButton: "ᱨᱚᱲ ᱢᱮ", listening: "ᱥᱩᱱ ᱮᱫᱟᱹ...", micDenied: "ᱢᱟᱭᱤᱠ ᱨᱮᱭᱟᱜ ᱚᱱᱩᱢᱚᱛᱤ ᱵᱟᱱᱩᱜ-ᱟ", micDeniedDesc: "ᱫᱟᱭᱟᱠᱟᱛᱮ ᱢᱟᱭᱤᱠ ᱵᱮᱵᱷᱟᱨ ᱨᱮᱭᱟᱜ ᱚᱱᱩᱢᱚᱛᱤ ᱮᱢ ᱢᱮ।",
    catFood: "ᱡᱚᱢᱟᱜ", catShopping: "ᱠᱤᱨᱤᱧ", catBills: "ᱵᱤᱞ", catTravel: "ᱫᱟᱬᱟᱱ", catOthers: "ᱮᱴᱟᱜ",
    payUPI: "UPI", payCash: "ᱠᱮᱥ", payNet: "ᱱᱮᱴ ᱵᱮᱝᱠᱤᱝ", payCard: "ᱠᱟᱨᱰ"
  },
  aw: {
    pageTitle: "खर्चा जोड़ा जाय", smartEntry: "स्मार्ट एंट्री", smartHint: 'बोला: "500 पेट्रोल खातिर" या "डिनर 1000 कैश"',
    amount: "रकम", payment: "भुगतान के तरीका", category: "श्रेणी", note: "टिप्पणी (वैकल्पिक)", noteHint: "एह का खातिर रहा?", date: "तारीख",
    saveBtn: "खर्चा सेव करा जाय", savingBtn: "सेव होत है...", select: "चुना जाय", reqFields: "जरूरी फील्ड",
    toastParsed: "खर्चा मिल गवा!", toastSaved: "खर्चा जुड़ गवा! ✅", errAmount: "रकम जरूरी है", errValidAmount: "कृपया सही रकम दर्ज करा जाय",
    errPayment: "भुगतान के तरीका जरूरी है", errCategory: "श्रेणी जरूरी है", toastMissing: "कुछ फील्ड खाली बाटे", toastMissingDesc: "कृपया बाकी फील्ड मैन्युअली भरा जाय।",
    voiceButton: "बोला", listening: "सुनत हैं...", micDenied: "माइक के अनुमति नाही अहै", micDeniedDesc: "कृपया माइक के उपयोग करै के अनुमति दीन जाय।",
    catFood: "खाना", catShopping: "शॉपिंग", catBills: "बिल", catTravel: "यात्रा", catOthers: "अउर",
    payUPI: "UPI", payCash: "कैश", payNet: "नेट बैंकिंग", payCard: "कार्ड"
  }
} as const;

const AddExpense = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  const formRef = useRef<HTMLFormElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null); // Hidden ref for auto-submit
  const today = format(new Date(), "yyyy-MM-dd");

  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const t = translations[language as keyof typeof translations] || translations.hi;

  // AI Voice Hook
  const voice = useDashboardAIVoice({
    language,
    setAmount,
    setCategory,
    setPaymentMode,
    setNote,
    autoSave: (text) => {
      // 🚀 ISSUE 4 FIX: Instantly trigger save when AI finishes parsing
      setTimeout(() => {
        submitBtnRef.current?.click();
      }, 500); // 500ms delay ensures React state (setAmount etc) is updated first
    },
  });

  // 🚀 ISSUE 2 FIX: Strict 10 Second Silence Timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (voice.listening) {
      timeoutId = setTimeout(() => {
        voice.stop(); // Stops the mic exactly 10s after the user stops talking
      }, 10000);
    }
    return () => clearTimeout(timeoutId);
  }, [voice.listening, voice.transcript]); // Resets timer if they speak

  // MIC PERMISSION CHECK
  const handleVoiceStart = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      voice.start();
    } catch (err) {
      toast({ title: t.micDenied, description: t.micDeniedDesc, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setAmount("");
    setPaymentMode("");
    setCategory("");
    setNote("");
    setDate(today);
    setValidationErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!amount) errors.amount = t.errAmount;
    else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) errors.amount = t.errValidAmount;
    if (!paymentMode) errors.paymentMode = t.errPayment;
    if (!category) errors.category = t.errCategory;
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearValidationError = (field: string) => {
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({ title: t.toastMissing, description: t.toastMissingDesc, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("expenses").insert({
        user_id: user?.id,
        amount: parseFloat(amount),
        payment_mode: paymentMode, 
        category, 
        note: note || null,
        expense_date: new Date(date).toISOString(),
      });

      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: t.toastSaved, className: "bg-green-600 text-white border-none shadow-xl" });
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "Food": return t.catFood;
      case "Shopping": return t.catShopping;
      case "Bills": return t.catBills;
      case "Travel": return t.catTravel;
      case "Others": return t.catOthers;
      default: return cat;
    }
  };

  const getPaymentLabel = (pay: string) => {
    switch (pay) {
      case "UPI": return t.payUPI;
      case "Cash": return t.payCash;
      case "Net Banking": return t.payNet;
      case "Card": return t.payCard;
      default: return pay;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <header className="bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#ec4899] text-white py-4 px-6 shadow-md sticky top-0 z-50">
        <div className="max-w-xl mx-auto w-full flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-white hover:bg-white/20 rounded-full h-10 w-10 shrink-0">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold tracking-tight truncate uppercase">{t.pageTitle}</h1>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-xl mx-auto w-full">
        <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 sm:p-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-900 text-xl font-extrabold">{t.smartEntry}</CardTitle>
                  <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">{t.smartHint}</p>
                </div>
                
                <Button
                  onClick={handleVoiceStart}
                  disabled={loading || voice.listening}
                  className={`relative h-14 w-14 rounded-full shadow-lg transition-all duration-300 flex-shrink-0 ${
                    voice.listening ? "bg-red-500 hover:bg-red-600 scale-110" : "bg-gradient-to-tr from-[#a855f7] to-[#ec4899] hover:shadow-purple-200"
                  }`}
                >
                  {voice.listening && <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25"></span>}
                  {voice.listening ? <MicOff className="h-6 w-6 text-white" /> : <Mic className="h-6 w-6 text-white" />}
                </Button>
              </div>

              {voice.listening && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full w-fit">
                  <div className="h-2 w-2 bg-purple-600 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">{t.listening}</span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-10">
            {voice.listening && voice.transcript && (
              <div className="mb-6 p-4 bg-slate-900 text-white rounded-2xl text-sm font-medium italic shadow-inner animate-in fade-in slide-in-from-top-2">
                "{voice.transcript}"
              </div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 sm:space-y-8" noValidate>
              <div className="space-y-3">
                <Label htmlFor="amount" className="font-bold text-slate-500 text-xs uppercase tracking-[0.2em]">
                  {t.amount} <span className="text-pink-500">*</span>
                </Label>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400 group-focus-within:text-[#a855f7] transition-colors">₹</span>
                  <Input
                    id="amount" type="number" value={amount}
                    onChange={(e) => { setAmount(e.target.value); clearValidationError("amount"); }}
                    onBlur={() => validateForm()}
                    className={`h-16 pl-12 text-3xl font-black rounded-2xl border-2 transition-all ${validationErrors.amount ? "border-red-200 bg-red-50 focus:border-red-500 focus:ring-red-100" : "border-slate-100 bg-slate-50/50 focus:border-[#a855f7] focus:bg-white focus:ring-4 focus:ring-purple-50"}`}
                    placeholder="0.00"
                  />
                  {validationErrors.amount && <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="font-bold text-slate-500 text-xs uppercase tracking-[0.2em]">{t.payment}</Label>
                  <Select value={paymentMode} onValueChange={(v) => { setPaymentMode(v); clearValidationError("paymentMode"); }}>
                    <SelectTrigger className={`h-14 rounded-2xl border-2 bg-slate-50/50 ${validationErrors.paymentMode ? "border-red-200" : "border-slate-100 focus:border-[#a855f7]"}`}>
                      <SelectValue placeholder={t.select}>{paymentMode ? getPaymentLabel(paymentMode) : ""}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                      {PAYMENT_MODES.map((m) => (<SelectItem key={m} value={m} className="h-12 focus:bg-purple-50 cursor-pointer">{getPaymentLabel(m)}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="font-bold text-slate-500 text-xs uppercase tracking-[0.2em]">{t.category}</Label>
                  <Select value={category} onValueChange={(v) => { setCategory(v); clearValidationError("category"); }}>
                    <SelectTrigger className={`h-14 rounded-2xl border-2 bg-slate-50/50 ${validationErrors.category ? "border-red-200" : "border-slate-100 focus:border-[#a855f7]"}`}>
                      <SelectValue placeholder={t.select}>{category ? getCategoryLabel(category) : ""}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                      {CATEGORIES.map((c) => (<SelectItem key={c} value={c} className="h-12 focus:bg-purple-50 cursor-pointer">{getCategoryLabel(c)}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-bold text-slate-500 text-xs uppercase tracking-[0.2em]">{t.note}</Label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.noteHint} className="rounded-2xl border-2 border-slate-100 bg-slate-50/50 min-h-[100px] focus:border-[#a855f7] transition-all p-4 text-base" />
              </div>

              <div className="space-y-3">
                <Label className="font-bold text-slate-500 text-xs uppercase tracking-[0.2em]">{t.date}</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={today} className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:border-[#a855f7] font-medium" />
              </div>

              {/* HIDDEN REF ADDED HERE */}
              <button ref={submitBtnRef} type="submit" className="hidden" />

              <Button type="submit" disabled={loading} className="w-full h-16 bg-gradient-to-r from-[#6366f1] to-[#ec4899] hover:opacity-90 text-white rounded-2xl text-lg font-bold shadow-xl shadow-purple-100 transition-all active:scale-[0.98] disabled:opacity-50 touch-manipulation">
                {loading ? <Loader2 className="animate-spin h-6 w-6" /> : t.saveBtn}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AddExpense;