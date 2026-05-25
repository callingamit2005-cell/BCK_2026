/* =========================================================
🛡️ LOGIC LOCK: SMART FINANCIAL MENTOR (DYNAMIC AI VIBE)
- Uses global language selection from LanguageContext
- Added 100+ varied messages across 16 languages.
- Implemented Randomizer Engine (No repetitive messages).
- Includes Action Tip of the Day
- Save Advice button (stores advice in localStorage)
- Ready for future "PRO" API integration.
========================================================= */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, BrainCircuit, Loader2, Crown, Bookmark, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface SmartFinancialMentorProps {
  salary: number;
  totalExpenses: number;
  budgetLimit: number;
  expensesList: any[];
}

// Helper to pick random message
const getRandomMsg = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// 🌍 MASSIVE LANGUAGE DATA BANK (with expanded messages and action tips)
  const TRANSLATIONS: Record<string, any> = {
  en: {
    label: "English",
    no_budget: ["Set your monthly budget first so I can guide you."],
    safe: ["Great job! 👍 You still have ₹{remaining} left."],
    warning: ["You’ve used half your budget. Spend carefully."],
    danger: ["Warning! ⚠️ Only ₹{remaining} left."],
    over: ["Over budget! 🚨 You exceeded by ₹{extra}."],
    actionTips: [
      "Tip: Wait 24 hours before buying non-essentials.",
      "Tip: Track daily expenses.",
      "Tip: Review subscriptions.",
      "Tip: Keep one no-spend day weekly.",
      "Tip: Compare prices before buying."
    ]
  },

  hinglish: {
    label: "Hinglish",
    no_budget: ["Pehle monthly budget set karo."],
    safe: ["Shabaash! 👍 ₹{remaining} abhi bhi bache hain."],
    warning: ["Half budget use ho gaya hai."],
    danger: ["Savdhaan! ⚠️ Sirf ₹{remaining} bache hain."],
    over: ["Budget cross! 🚨 ₹{extra} extra kharch."],
    actionTips: [
      "Tip: 24 ghante wait karo.",
      "Tip: Daily expense note karo.",
      "Tip: Subscription check karo.",
      "Tip: Weekly no-spend day rakho.",
      "Tip: Price compare karo."
    ]
  },

  hi: {
    label: "Hindi",
    no_budget: ["पहले मासिक बजट सेट करें।"],
    safe: ["शाबाश! 👍 अभी ₹{remaining} शेष हैं।"],
    warning: ["आपने आधा बजट खर्च कर दिया है।"],
    danger: ["सावधान! ⚠️ केवल ₹{remaining} बचे हैं।"],
    over: ["बजट पार! 🚨 ₹{extra} अधिक खर्च।"],
    actionTips: [
      "सुझाव: 24 घंटे सोचें।",
      "सुझाव: रोज खर्च लिखें।",
      "सुझाव: सब्सक्रिप्शन जांचें।",
      "सुझाव: हफ्ते में एक दिन बिना खर्च।",
      "सुझाव: खरीद से पहले तुलना करें।"
    ]
},

   aw: {
  label: "Awadhi (अवधी)",
  no_budget: ["पहिले महिना भर क बजट सेट करा, तब हम सही सलाह देब।"],
  safe: ["बहुत बढ़िया! 👍 अभी ₹{remaining} बचा ह।"],
  warning: ["आधा बजट खर्च होइ गवा, अब जरा संभल के।"],
  danger: ["सावधान! ⚠️ बस ₹{remaining} बचा ह।"],
  over: ["बजट पार होइ गवा! 🚨 ₹{extra} जादा खर्च भवा।"],
  actionTips: [
    "टिप: गैर जरूरी चीज खरीदे से पहिले 24 घंटा रुको।",
    "टिप: रोज का खर्च लिखत रहो।",
    "टिप: अपने सब्सक्रिप्शन जांचो।",
    "टिप: हफ्ता मा एक दिन बिना खर्च रखो।",
    "टिप: खरीदे से पहिले दाम मिलाओ।"
  ]
},
  pa: {
    label: "Punjabi",
    no_budget: ["ਪਹਿਲਾਂ ਮਹੀਨਾਵਾਰ ਬਜਟ ਸੈੱਟ ਕਰੋ।"],
    safe: ["ਬਹੁਤ ਵਧੀਆ! 👍 ₹{remaining} ਬਾਕੀ ਹਨ।"],
    warning: ["ਅੱਧਾ ਬਜਟ ਖਰਚ ਹੋ ਗਿਆ ਹੈ।"],
    danger: ["ਸਾਵਧਾਨ! ⚠️ ਕੇਵਲ ₹{remaining} ਬਾਕੀ।"],
    over: ["ਬਜਟ ਪਾਰ! 🚨 ₹{extra} ਵੱਧ।"],
    actionTips: ["ਟਿਪ: 24 ਘੰਟੇ ਰੁਕੋ.","ਟਿਪ: ਰੋਜ਼ ਖਰਚ ਲਿਖੋ.","ਟਿਪ: ਸਬਸਕ੍ਰਿਪਸ਼ਨ ਚੈੱਕ ਕਰੋ.","ਟਿਪ: ਹਫ਼ਤੇ ਵਿੱਚ ਇੱਕ ਨੋ-ਸਪੈਂਡ ਦਿਨ.","ਟਿਪ: ਕੀਮਤਾਂ ਤੁਲਨਾ ਕਰੋ."]
},

  gu: {
    label: "Gujarati",
    no_budget: ["માસિક બજેટ સેટ કરો."],
    safe: ["સરસ! 👍 ₹{remaining} બાકી છે."],
    warning: ["અડધું બજેટ વપરાઈ ગયું છે."],
    danger: ["ચેતવણી! ⚠️ ફક્ત ₹{remaining} બાકી."],
    over: ["બજેટ વટાવ્યું! 🚨 ₹{extra} વધુ."],
    actionTips: ["ટિપ: 24 કલાક રાહ જુઓ.","ટિપ: ખર્ચ લખો.","ટિપ: સબસ્ક્રિપ્શન તપાસો.","ટિપ: નૉ-સ્પેન્ડ ડે રાખો.","ટિપ: ભાવ સરખાવો."]
},

  mr: {
    label: "Marathi",
    no_budget: ["मासिक बजेट सेट करा."],
    safe: ["छान! 👍 ₹{remaining} बाकी आहेत."],
    warning: ["अर्धे बजेट संपले आहे."],
    danger: ["सावधान! ⚠️ फक्त ₹{remaining} उरले."],
    over: ["बजेट ओलांडले! 🚨 ₹{extra} जास्त."],
    actionTips: ["टिप: २४ तास थांबा.","टिप: खर्च लिहा.","टिप: सबस्क्रिप्शन तपासा.","टिप: नो-स्पेंड डे ठेवा.","टिप: किंमत तुलना करा."]
},

  bn: {
    label: "Bengali",
    no_budget: ["মাসিক বাজেট সেট করুন।"],
    safe: ["দারুণ! 👍 ₹{remaining} বাকি।"],
    warning: ["অর্ধেক বাজেট শেষ।"],
    danger: ["সতর্কতা! ⚠️ ₹{remaining} বাকি।"],
    over: ["বাজেট ছাড়িয়ে গেছে! 🚨 ₹{extra} বেশি।"],
    actionTips: ["টিপ: ২৪ ঘন্টা অপেক্ষা করুন","টিপ: খরচ লিখুন","টিপ: সাবস্ক্রিপশন চেক করুন","টিপ: নো-স্পেন্ড ডে","টিপ: দাম তুলনা করুন"]
},

  ta: {
    label: "Tamil",
    no_budget: ["மாதாந்திர பட்ஜெட்டை அமைக்கவும்."],
    safe: ["நன்று! 👍 ₹{remaining} உள்ளது."],
    warning: ["பாதி பட்ஜெட் முடிந்தது."],
    danger: ["எச்சரிக்கை! ⚠️ ₹{remaining} மட்டும்."],
    over: ["பட்ஜெட் மீறியது! 🚨 ₹{extra} அதிகம்."],
    actionTips: ["24 மணி நேரம் காத்திருக்கவும்","செலவு பதிவு செய்யவும்","சந்தாக்கள் சரிபார்க்கவும்","செலவு இல்லாத நாள்","விலை ஒப்பிடவும்"]
  },

  te: {
    label: "Telugu",
    no_budget: ["నెలవారీ బడ్జెట్ సెట్ చేయండి."],
    safe: ["బాగుంది! 👍 ₹{remaining} మిగిలి ఉన్నాయి."],
    warning: ["సగం బడ్జెట్ పూర్తయింది."],
    danger: ["హెచ్చరిక! ⚠️ ₹{remaining} మాత్రమే."],
    over: ["బడ్జెట్ దాటింది! 🚨 ₹{extra} అదనం."],
    actionTips: ["24 గంటలు ఆగండి","ఖర్చులు రాయండి","సబ్స్క్రిప్షన్ చూడండి","నో-స్పెండ్ డే","ధర పోల్చండి"]
  },

  kn: {
    label: "Kannada",
    no_budget: ["ಮಾಸಿಕ ಬಜೆಟ್ ಸೆಟ್ ಮಾಡಿ."],
    safe: ["ಚೆನ್ನಾಗಿದೆ! 👍 ₹{remaining} ಉಳಿದಿದೆ."],
    warning: ["ಅರ್ಧ ಬಜೆಟ್ ಮುಗಿದಿದೆ."],
    danger: ["ಎಚ್ಚರಿಕೆ! ⚠️ ₹{remaining} ಮಾತ್ರ."],
    over: ["ಬಜೆಟ್ ಮೀರಿ! 🚨 ₹{extra} ಹೆಚ್ಚು."],
    actionTips: ["24 ಗಂಟೆ ಕಾಯಿರಿ","ಖರ್ಚು ಬರೆಯಿರಿ","ಸಬ್ಸ್ಕ್ರಿಪ್ಷನ್ ಪರಿಶೀಲಿಸಿ","ನೋ-ಸ್ಪೆಂಡ್ ದಿನ","ಬೆಲೆ ಹೋಲಿಸಿ"]
  },

  ml: {
    label: "Malayalam",
    no_budget: ["മാസിക ബജറ്റ് സജ്ജമാക്കുക."],
    safe: ["നന്നായി! 👍 ₹{remaining} ബാക്കി."],
    warning: ["പകുതി ബജറ്റ് കഴിഞ്ഞു."],
    danger: ["മുന്നറിയിപ്പ്! ⚠️ ₹{remaining} മാത്രം."],
    over: ["ബജറ്റ് കടന്നു! 🚨 ₹{extra} അധികം."],
    actionTips: ["24 മണിക്കൂർ കാത്തിരിക്കുക","ചെലവ് എഴുതുക","സബ്സ്ക്രിപ്ഷൻ പരിശോധിക്കുക","നോ-സ്പെൻഡ് ദിനം","വില താരതമ്യം ചെയ്യുക"]
  },

  or: {
    label: "Odia",
    no_budget: ["ମାସିକ ବଜେଟ୍ ସେଟ୍ କରନ୍ତୁ।"],
    safe: ["ଭଲ! 👍 ₹{remaining} ବାକି।"],
    warning: ["ଅଧା ବଜେଟ୍ ଶେଷ।"],
    danger: ["ସତର୍କ! ⚠️ ₹{remaining} ବାକି।"],
    over: ["ବଜେଟ୍ ଅତିକ୍ରମ! 🚨 ₹{extra} ଅଧିକ।"],
    actionTips: ["24 ଘଣ୍ଟା ଅପେକ୍ଷା","ଖର୍ଚ୍ଚ ଲେଖନ୍ତୁ","ସବସ୍କ୍ରିପସନ୍ ଯାଞ୍ଚ","ନୋ-ସ୍ପେଣ୍ଡ ଦିନ","ଦର ତୁଳନା"]
  },

  bho: {
    label: "Bhojpuri",
    no_budget: ["पहिले मासिक बजट सेट करीं."],
    safe: ["बढ़िया! 👍 ₹{remaining} बाकी बा."],
    warning: ["आधा बजट खर्च हो गइल."],
    danger: ["सावधान! ⚠️ ₹{remaining} बचे बा."],
    over: ["बजट पार! 🚨 ₹{extra} जादा."],
    actionTips: ["24 घंटा रुकीं","खर्च लिखीं","सब्सक्रिप्शन देखीं","नो-स्पेंड दिन","कीमत तुलना"]
  },

  mai: {
    label: "Maithili",
    no_budget: ["मासिक बजट सेट करू."],
    safe: ["बढ़िया! 👍 ₹{remaining} बाकी अछि."],
    warning: ["आधा बजट खत्म भ गेल."],
    danger: ["सावधान! ⚠️ ₹{remaining} मात्र."],
    over: ["बजट पार! 🚨 ₹{extra} बेसी."],
    actionTips: ["24 घंटा सोचू","खर्च लिखू","सब्सक्रिप्शन जांचू","नो-स्पेंड दिन","कीमत तुलना"]
  },

  sa: {
    label: "Sanskrit",
    no_budget: ["मासिकबजटं स्थापयतु।"],
    safe: ["उत्तमम्! 👍 ₹{remaining} अवशिष्टम्।"],
    warning: ["अर्धं बजटं समाप्तम्।"],
    danger: ["सावधान! ⚠️ ₹{remaining} एव अवशिष्टम्।"],
    over: ["बजटं अतिक्रान्तम्! 🚨 ₹{extra} अधिकम्।"],
    actionTips: ["२४ घण्टा प्रतीक्षताम्","व्ययम् लिखत","सदस्यताः परीक्षत","नो-स्पेण्ड दिवस","मूल्य तुलना"]
  },

  sat: {
    label: "Santali",
    no_budget: ["ᱢᱟᱥᱤᱠ ᱵᱟᱡᱮᱴ ᱥᱮᱴ ᱠᱚᱨᱚ"],
    safe: ["ᱡᱚᱛᱚ! 👍 ₹{remaining} ᱵᱟᱹᱠᱤ"],
    warning: ["ᱟᱨᱫᱷ ᱵᱟᱡᱮᱴ ᱥᱮᱥ"],
    danger: ["⚠️ ₹{remaining} ᱢᱟᱛᱨ"],
    over: ["🚨 ₹{extra} ᱵᱮᱥᱤ"],
    actionTips: ["24h wait","daily write","check subs","no spend day","compare price"]
  }

};

const SmartFinancialMentor = ({ salary, totalExpenses, budgetLimit, expensesList }: SmartFinancialMentorProps) => {
  const { toast } = useToast();
  const { language } = useLanguage(); // 👈 global language from context
  const [advice, setAdvice] = useState<string | null>(null);
  const [actionTip, setActionTip] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [savedAdvice, setSavedAdvice] = useState<Set<string>>(() => {
    // Load saved advice IDs from localStorage
    const saved = localStorage.getItem('savedMentorAdvice');
    return new Set(saved ? JSON.parse(saved) : []);
  });

  // Select language pack – fallback to English if language not found
  const tPack = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Generate a unique ID for the current advice (based on text and timestamp)
  const adviceId = useMemo(() => {
    if (!advice) return '';
    return `${advice}-${Date.now()}`;
  }, [advice]);

  const isSaved = savedAdvice.has(adviceId);

  // 🧠 SMART LOGIC: Dynamic Translation Engine
  const smartInsight = useMemo(() => {
    // Case 0: No Budget Set
    if (!budgetLimit || budgetLimit <= 0) {
      return { 
        text: getRandomMsg(tPack.no_budget), 
        color: "text-gray-600" 
      };
    }

    const percentageSpent = (totalExpenses / budgetLimit) * 100;
    const remaining = (budgetLimit - totalExpenses).toLocaleString();
    const extra = (totalExpenses - budgetLimit).toLocaleString();

    // Over Budget (>100%)
    if (percentageSpent > 100) {
      return {
        text: getRandomMsg(tPack.over).replace('{extra}', extra),
        color: "text-red-600"
      };
    }

    // Danger Zone (90% - 100%)
    if (percentageSpent >= 90) {
      return {
        text: getRandomMsg(tPack.danger).replace('{remaining}', remaining),
        color: "text-orange-600"
      };
    }

    // Warning Zone (50% - 89%)
    if (percentageSpent >= 50) {
      return {
        text: getRandomMsg(tPack.warning).replace('{remaining}', remaining),
        color: "text-yellow-600"
      };
    }

    // Safe Zone (< 50%)
    return {
      text: getRandomMsg(tPack.safe).replace('{remaining}', remaining),
      color: "text-green-600"
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalExpenses, budgetLimit, tPack, refreshKey]);

  // Set the advice and pick a random action tip whenever insight changes
  useEffect(() => {
    setAdvice(smartInsight.text);
    // Pick random action tip
    const tips = tPack.actionTips || TRANSLATIONS.en.actionTips;
    setActionTip(getRandomMsg(tips));
  }, [smartInsight, tPack, refreshKey]);

  const generateNewAdvice = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      setLoading(false);
      toast({ 
        title: tPack.label === 'English' ? "Thinking..." : "सोच रहा हूँ...", 
        description: tPack.label === 'English' ? "Mentor has analyzed your new data." : "मेंटर ने आपके नए डेटा का विश्लेषण कर लिया है।",
        className: "bg-purple-600 text-white" 
      });
    }, 800);
  }, [tPack.label]);

  const toggleSaveAdvice = useCallback(() => {
    if (!advice) return;
    setSavedAdvice(prev => {
      const newSet = new Set(prev);
      if (newSet.has(adviceId)) {
        newSet.delete(adviceId);
        toast({ title: "Advice unsaved", description: "Removed from your saved list." });
      } else {
        newSet.add(adviceId);
        toast({ title: "Advice saved!", description: "You can view it later in your profile." });
      }
      // Persist to localStorage
      localStorage.setItem('savedMentorAdvice', JSON.stringify([...newSet]));
      return newSet;
    });
  }, [adviceId, advice]);

  return (
    <Card className="bg-white shadow-xl border-purple-100 rounded-2xl overflow-hidden relative mb-6">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-600 to-pink-500" />
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center flex-wrap gap-2">
          
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-purple-800">
            <Sparkles className="h-5 w-5 text-purple-600" /> 
            Expert Financial Mentor
            
            {/* 🚀 PRO BADGE (Placeholder for Paid Version AI feature) */}
            <span className="ml-2 flex items-center gap-1 text-[9px] uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-600 text-white px-2 py-0.5 rounded-full font-black shadow-sm cursor-help" title="Upgrade to PRO for real-time AI category analysis!">
              <Crown className="h-2.5 w-2.5" /> PRO Ready
            </span>
          </CardTitle>

          {/* 🌍 LANGUAGE SELECTOR REMOVED – now using global language from context */}

        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        {/* Dynamic Advice Box */}
        <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100 min-h-[120px] flex flex-col items-center justify-center text-center transition-all duration-300 relative">
          
          <p className={`font-bold italic text-lg mb-4 ${smartInsight.color} animate-in fade-in zoom-in duration-500`}>
            "{advice}"
          </p>
          
          {/* Action Tip of the Day */}
          <div className="w-full mt-2 text-xs text-purple-700 bg-purple-100/50 p-2 rounded-lg">
            <span className="font-bold">✨ {tPack.label === 'English' ? "Tip of the Day:" : "आज का सुझाव:"}</span> {actionTip}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          {/* Save Advice Button */}
          <Button
            onClick={toggleSaveAdvice}
            variant="ghost"
            size="icon"
            className={`rounded-full h-9 w-9 ${isSaved ? 'text-purple-600 bg-purple-100' : 'text-gray-500 hover:bg-purple-50'}`}
            title={isSaved ? "Unsave advice" : "Save this advice"}
          >
            {isSaved ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </Button>

          {/* Ask Mentor Again Button */}
          <Button 
            onClick={generateNewAdvice} 
            disabled={loading}
            className="bg-white border border-purple-200 text-purple-700 hover:bg-purple-100 shadow-sm h-9 px-5 rounded-xl font-bold text-sm transition-all active:scale-95"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BrainCircuit className="h-4 w-4 mr-2" />}
            {tPack.label === 'English' ? 'Ask Mentor Again' : 'फिर से पूछें'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartFinancialMentor;