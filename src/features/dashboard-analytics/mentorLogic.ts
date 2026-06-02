export type SupportedLanguage =
  | 'en'
  | 'hi'
  | 'hinglish'
  | 'pa'
  | 'gu'
  | 'bho'
  | 'sa'
  | 'mai'
  | 'mr'
  | 'bn';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  'en',
  'hi',
  'hinglish',
  'pa',
  'gu',
  'bho',
  'sa',
  'mai',
  'mr',
  'bn',
];

interface AdviceSet {
  TITLE: string;
  START: string;
  FIRST_SPEND: string;
  FLAT_MONTH: string;
  SAVING_MILESTONE: string;
  SAVING_HIGH: string;
  SAVING_LOW: string;
  SPENDING_CRITICAL: string;
  SPENDING_HIGH: string;
  SPENDING_LOW: string;
  VS_LAST_MONTH: string;
  REDUCED: string;
  INCREASED: string;
}

const ADVICE_DICTIONARY: Record<SupportedLanguage, AdviceSet> = {
  en: {
    TITLE: "Papa's Financial Advice",
    START: "Great start! Let's track your savings today.",
    FIRST_SPEND: "Welcome! You've logged your first expenses. Every rupee you track is a step toward financial freedom. Let's build this habit together! 🙌",
    FLAT_MONTH: "You spent exactly the same as last month — very consistent! Now let's see if we can trim just a little more next month. Even ₹200 saved is a win. 💪",
    SAVING_MILESTONE: "Extraordinary! You've cut spending by more than half compared to last month. This is the kind of discipline that builds real wealth. Papa is very proud! 🏆🌟",
    SAVING_HIGH: "Excellent! You saved significantly more than last month. Think of it like this — every ₹1,000 saved today is ₹1,200 next year if invested. Keep it up! 🌟",
    SAVING_LOW: "Good job. Your savings are growing steadily. Small consistent cuts — like skipping one restaurant meal a week — add up to thousands by year end. 👍",
    SPENDING_CRITICAL: "Beta, this is a red alert! Your spending has more than doubled compared to last month. Like a leaking bucket, money is draining fast. Sit down today and find the 2-3 biggest expenses — cut those first. ⚠️🔴",
    SPENDING_HIGH: "Careful! Your spending has increased a lot. Try to find one category — dining, travel, or shopping — where you can cut back. Small changes add up fast. ⚠️",
    SPENDING_LOW: "You spent a bit more this month — it happens. Try packing lunch twice next week instead of eating out. That one habit alone can save ₹800–₹1,200 a month. 😊",
    VS_LAST_MONTH: "vs. last month",
    REDUCED: "Reduced",
    INCREASED: "Increased",
  },
  hinglish: {
    TITLE: "Papa's Financial Advice",
    START: "Shuruat achi hai! Let's start tracking your Bachat today.",
    FIRST_SPEND: "Welcome beta! Pehli baar kharch track kiya — yahi pehla kadam hai apni financial life ko samajhne ka. Aise hi chalte raho, papa saath hai! 🙌",
    FLAT_MONTH: "Is mahine bilkul same kharch hua jaise pichle mahine — consistency achhi baat hai! Ab dekho kya agle mahine ₹200-300 aur bachaa sakte ho? Chhoti bachat bhi badi hoti hai. 💪",
    SAVING_MILESTONE: "Wah beta wah! Pichle mahine se aadhe se bhi kam kharch kiya tune! Yeh sirf bachat nahi — yeh teri zindagi badalne wali aadat hai. Papa ko sachchi maan hai tujhpe! 🏆🌟",
    SAVING_HIGH: "Wah! Shabaash beta. Pichle mahine se kaafi bachat ki hai tumne. Socho agar yeh paise invest karo toh ek saal mein 20% zyada ho sakte hain. Keep it up! 🌟",
    SAVING_LOW: "Sahi raaste pe ho. Savings badh rahi hain. Ek kaam karo — hafte mein ek baar bahar khana band karo, mahine mein ₹1,000 tak bach sakta hai. Aise hi chaltay raho. 👍",
    SPENDING_CRITICAL: "Beta, yeh toh red alert hai! Pichle mahine se double se bhi zyada kharch ho gaya. Jaise paani ki tanki mein ched ho — paise tez beh rahe hain. Aaj hi baithke top 3 bade kharche dhundo aur unhe kato. ⚠️🔴",
    SPENDING_HIGH: "Beta, pichle mahine ke muqable kharch kaafi badh gaya hai. Ek kaam karo — sirf ek cheez kato, chahe dining ho ya shopping. Thoda hath rok kar chalo! ⚠️",
    SPENDING_LOW: "Is mahine thoda zyada kharch hua hai — koi baat nahi. Agle hafte do din ghar ka khana le jao bahar ki jagah. Bas yahi aadat ₹800-₹1,200 mahine mein bachaa sakti hai. 😊",
    VS_LAST_MONTH: "pichle mahine ke muqable",
    REDUCED: "Kam hua",
    INCREASED: "Badh gaya",
  },
  hi: {
    TITLE: "पिताजी की सलाह",
    START: "अच्छी शुरुआत है! आइए आज से अपनी बचत ट्रैक करें।",
    FIRST_SPEND: "स्वागत है बेटा! पहली बार खर्च ट्रैक किया — यही पहला कदम है। पैसों की समझ यहीं से शुरू होती है। पिताजी हमेशा साथ हैं! 🙌",
    FLAT_MONTH: "इस महीने बिल्कुल उतना ही खर्च हुआ जितना पिछले महीने — यह अनुशासन की निशानी है! अब देखो, क्या अगले महीने ₹200-300 और बचा सकते हो? छोटी बचत भी बड़ी बनती है। 💪",
    SAVING_MILESTONE: "शाबाश बेटा! पिछले महीने से आधे से भी कम खर्च किया तुमने! यह सिर्फ बचत नहीं — यह असली समझदारी है। पिताजी को गर्व है तुम पर! 🏆🌟",
    SAVING_HIGH: "शानदार! आपने पिछले महीने की तुलना में बहुत बचत की है। सोचो — यही पैसे निवेश करो तो एक साल में 20% और बढ़ सकते हैं। ऐसे ही जारी रखें! 🌟",
    SAVING_LOW: "अच्छा काम है। आपकी बचत बढ़ रही है। एक छोटा काम करो — हफ्ते में एक बार बाहर खाना बंद करो, महीने में ₹1,000 तक बच सकता है। 👍",
    SPENDING_CRITICAL: "बेटा, यह तो खतरे की घंटी है! पिछले महीने से दोगुने से भी ज्यादा खर्च हो गया। जैसे टूटी बाल्टी में पानी — पैसे तेज़ी से निकल रहे हैं। आज ही बैठकर 3 सबसे बड़े खर्चे ढूंढो और उन्हें काटो। ⚠️🔴",
    SPENDING_HIGH: "सावधान! आपका खर्च बहुत बढ़ गया है। बस एक काम करो — खाना, मनोरंजन या शॉपिंग में से एक चीज़ कम करो। थोड़ा कम करने की कोशिश करें। ⚠️",
    SPENDING_LOW: "इस महीने थोड़ा अधिक खर्च हुआ है — कोई बात नहीं। अगले हफ्ते दो दिन घर का खाना बाहर ले जाओ। बस यही आदत ₹800-₹1,200 महीना बचा सकती है। 😊",
    VS_LAST_MONTH: "पिछले महीने की तुलना में",
    REDUCED: "कम हुआ",
    INCREASED: "बढ़ गया",
  },
  pa: {
    TITLE: "ਪਿਤਾ ਜੀ ਦੀ ਸਲਾਹ",
    START: "ਵਧੀਆ ਸ਼ੁਰੂਆਤ! ਆਓ ਅੱਜ ਤੋਂ ਆਪਣੀ ਬੱਚਤ ਨੂੰ ਟ੍ਰੈਕ ਕਰੀਏ।",
    FIRST_SPEND: "ਸੁਆਗਤ ਹੈ ਬੇਟਾ! ਪਹਿਲੀ ਵਾਰ ਖਰਚਾ ਟ੍ਰੈਕ ਕੀਤਾ — ਇਹੀ ਪਹਿਲਾ ਕਦਮ ਹੈ। ਪਿਤਾ ਜੀ ਹਮੇਸ਼ਾ ਤੇਰੇ ਨਾਲ ਹਨ! 🙌",
    FLAT_MONTH: "ਇਸ ਮਹੀਨੇ ਬਿਲਕੁਲ ਓਨਾ ਹੀ ਖਰਚਾ ਹੋਇਆ ਜਿੰਨਾ ਪਿਛਲੇ ਮਹੀਨੇ — ਇਹ ਅਨੁਸ਼ਾਸਨ ਦੀ ਨਿਸ਼ਾਨੀ ਹੈ! ਦੇਖੋ ਅਗਲੇ ਮਹੀਨੇ ਕੀ ₹200-300 ਹੋਰ ਬਚਾ ਸਕਦੇ ਹੋ? 💪",
    SAVING_MILESTONE: "ਵਾਹ ਬੇਟਾ! ਪਿਛਲੇ ਮਹੀਨੇ ਤੋਂ ਅੱਧੇ ਤੋਂ ਵੀ ਘੱਟ ਖਰਚਾ ਕੀਤਾ! ਇਹ ਸੱਚੀ ਸਮਝਦਾਰੀ ਹੈ। ਪਿਤਾ ਜੀ ਨੂੰ ਮਾਣ ਹੈ! 🏆🌟",
    SAVING_HIGH: "ਵਾਹ! ਸ਼ਾਬਾਸ਼ ਬੇਟਾ। ਪਿਛਲੇ ਮਹੀਨੇ ਨਾਲੋਂ ਬਹੁਤ ਬੱਚਤ ਕੀਤੀ ਹੈ। ਇਹ ਪੈਸੇ ਜੇ ਨਿਵੇਸ਼ ਕਰੋ ਤਾਂ ਇੱਕ ਸਾਲ ਵਿੱਚ 20% ਵੱਧ ਸਕਦੇ ਹਨ। ਇੰਝ ਹੀ ਕਰਦੇ ਰਹੋ! 🌟",
    SAVING_LOW: "ਸਹੀ ਰਾਹ ਤੇ ਹੋ। ਬੱਚਤ ਵੱਧ ਰਹੀ ਹੈ। ਹਫਤੇ ਵਿੱਚ ਇੱਕ ਵਾਰ ਬਾਹਰ ਖਾਣਾ ਬੰਦ ਕਰੋ — ਮਹੀਨੇ ਵਿੱਚ ₹1,000 ਬੱਚ ਸਕਦੇ ਹਨ। 👍",
    SPENDING_CRITICAL: "ਬੇਟਾ, ਇਹ ਤਾਂ ਖਤਰੇ ਦੀ ਘੰਟੀ ਹੈ! ਪਿਛਲੇ ਮਹੀਨੇ ਤੋਂ ਦੁੱਗਣੇ ਤੋਂ ਵੀ ਵੱਧ ਖਰਚਾ ਹੋ ਗਿਆ। ਅੱਜ ਹੀ ਬੈਠ ਕੇ 3 ਸਭ ਤੋਂ ਵੱਡੇ ਖਰਚੇ ਲੱਭੋ ਅਤੇ ਉਹਨਾਂ ਨੂੰ ਕੱਟੋ। ⚠️🔴",
    SPENDING_HIGH: "ਬੇਟਾ, ਖਰਚਾ ਬਹੁਤ ਵੱਧ ਗਿਆ ਹੈ। ਬੱਸ ਇੱਕ ਕੰਮ ਕਰੋ — ਖਾਣਾ, ਮਨੋਰੰਜਨ ਜਾਂ ਖਰੀਦਦਾਰੀ ਵਿੱਚੋਂ ਇੱਕ ਚੀਜ਼ ਘਟਾਓ। ਥੋੜਾ ਹੱਥ ਰੋਕ ਕੇ ਚੱਲੋ! ⚠️",
    SPENDING_LOW: "ਇਸ ਮਹੀਨੇ ਥੋੜਾ ਜਿਆਦਾ ਖਰਚਾ ਹੋਇਆ ਹੈ। ਅਗਲੇ ਹਫਤੇ ਦੋ ਦਿਨ ਘਰ ਦਾ ਖਾਣਾ ਲੈ ਜਾਓ — ਮਹੀਨੇ ਵਿੱਚ ₹800-₹1,200 ਬੱਚ ਸਕਦੇ ਹਨ। 😊",
    VS_LAST_MONTH: "ਪਿਛਲੇ ਮਹੀਨੇ ਦੇ ਮੁਕਾਬਲੇ",
    REDUCED: "ਘਟਿਆ",
    INCREASED: "ਵਧਿਆ",
  },
  gu: {
    TITLE: "પિતાની સલાહ",
    START: "સરસ શરૂઆત! ચાલો આજે તમારી બચતને ટ્રેક કરીએ.",
    FIRST_SPEND: "સ્વાગત છે બેટા! પહેલી વાર ખર્ચ ટ્રેક કર્યો — આ જ પહેલું પગલું છે. પૈસાની સમજ અહીંથી જ શરૂ થાય છે. પિતા હંમેશા સાથે છે! 🙌",
    FLAT_MONTH: "આ મહિને બરાબર એટલો જ ખર્ચ થયો જેટલો ગયા મહિને — આ અનુશાસનની નિશાની છે! હવે જો, આવતા મહિને ₹200-300 વધુ બચાવી શકો? નાની બચત પણ મોટી બને છે. 💪",
    SAVING_MILESTONE: "વાહ બેટા! ગયા મહિના કરતા અડધાથી ઓછો ખર્ચ કર્યો! આ સાચી સમજદારી છે. પિતાને ગર્વ છે! 🏆🌟",
    SAVING_HIGH: "વાહ! શાબાશ બેટા. ગયા મહિના કરતા તે ઘણી બચત કરી છે. આ પૈસા રોકાણ કરો તો એક વર્ષમાં 20% વધી શકે. આમ જ ચાલુ રાખ! 🌟",
    SAVING_LOW: "સરસ કામ છે. તારી બચત વધી રહી છે. અઠવાડિયામાં એક વખત બહારનું ખાવાનું બંધ કર — મહિનામાં ₹1,000 બચી શકે. 👍",
    SPENDING_CRITICAL: "બેટા, આ તો ખતરાની ઘંટડી છે! ગયા મહિના કરતા બમણાથી વધુ ખર્ચ થઈ ગયો. આજે જ બેસીને 3 સૌથી મોટા ખર્ચ શોધો અને તે ઘટાડો. ⚠️🔴",
    SPENDING_HIGH: "બેટા, ધ્યાન રાખ! ગયા મહિના કરતા ખર્ચ ઘણો વધ્યો છે. ફક્ત એક કામ કર — ખાવાનું, મનોરંજન કે શોપિંગ — એક ઘટાડ. થોડો હાથ રોકીને ચાલ! ⚠️",
    SPENDING_LOW: "આ મહિને થોડો વધારે ખર્ચ થયો છે — વાંધો નહિ. આવતા અઠવાડિયે બે દિવસ ઘરનું ખાવાનું સાથે લઈ જા — ₹800-₹1,200 મહિને બચી શકે. 😊",
    VS_LAST_MONTH: "ગયા મહિનાની તુલનામાં",
    REDUCED: "ઘટાડો",
    INCREASED: "વધારો",
  },
  bho: {
    TITLE: "बाबूजी के सलाह",
    START: "बढ़िया शुरुआत बा! आजु से बचत ट्रैक कइल जाव।",
    FIRST_SPEND: "स्वागत बा बेटा! पहिल बेर खर्चा ट्रैक कइलऽ — इहे पहिला कदम बा। बाबूजी हमेशा तोहरे साथे बाड़न! 🙌",
    FLAT_MONTH: "ए मउगा, बिल्कुल ओतने खर्चा भइल जतना पिछला महीना — इ अनुशासन के निशानी बा! देखऽ अगिला महीना ₹200-300 अउर बचा सकत बाड़ऽ का? 💪",
    SAVING_MILESTONE: "वाह बेटा वाह! पिछला महीना से आधा से कम खर्चा कइलऽ! इ असली समझदारी बा। बाबूजी के बहुत गर्व बा! 🏆🌟",
    SAVING_HIGH: "वाह! शाबाश बेटा। पिछला महीना से बहुत बचत कइले बाड़ऽ। इ पइसा निवेश कर तऽ एक साल में 20% बढ़ सकेला। अइसहीं चलत रहऽ! 🌟",
    SAVING_LOW: "सही रास्ता पर बाड़ऽ। बचत बढ़त बा। हफ्ता में एक बेर बाहर खाना बंद करऽ — महीना में ₹1,000 बच सकेला। 👍",
    SPENDING_CRITICAL: "बेटा, इ तऽ खतरा के घंटी बा! पिछला महीना से दोगुना से ज्यादा खर्चा हो गइल। आजे बइठके 3 सबसे बड़ खर्चा खोजऽ आउर ओकरा काटऽ। ⚠️🔴",
    SPENDING_HIGH: "बेटा, पिछला महीना के तुलना में खर्चा बहुत बढ़ गइल बा। बस एक काम करऽ — खाना, मनोरंजन या खरीदारी में से एक घटावऽ। तनी हाथ रोक के चलऽ! ⚠️",
    SPENDING_LOW: "ए मउगा तनी जादे खर्चा हो गइल बा — कवनो बात नइखे। अगिला हफ्ता दू दिन घर के खाना लेके जा — ₹800-₹1,200 महीना बच सकेला। 😊",
    VS_LAST_MONTH: "पिछला महीना के तुलना में",
    REDUCED: "कम भइल",
    INCREASED: "बढ़ गइल",
  },
  mai: {
    TITLE: "पिताजीक सलाह",
    START: "नीक शुरुवात! आउ आइ सँ अपन बचत ट्रैक करी।",
    FIRST_SPEND: "स्वागत अछि बेटा! पहिल बेर खर्च ट्रैक कयलह — इएह पहिल कदम थिक। पिताजी सदैव संगे छथि! 🙌",
    FLAT_MONTH: "एहि महीना बिल्कुल ओतबे खर्च भेल जेतबा पिछला महीना — ई अनुशासनक निशानी थिक! देखू, अगला महीना ₹200-300 आओर बचा सकैत छी? 💪",
    SAVING_MILESTONE: "वाह बेटा! पिछला महीना सँ आधा सँ कम खर्च कयलह! ई सच्ची समझदारी थिक। पिताजी केँ गर्व अछि! 🏆🌟",
    SAVING_HIGH: "वाह! शाबाश बेटा। पिछला महीना क तुलना में बहुत बचत कयलह अछि। ई पैसा निवेश करू तऽ एक साल मे 20% बढ़त। एहिना जारी राखू! 🌟",
    SAVING_LOW: "नीक काज अछि। अहाँक बचत बढ़ि रहल अछि। सप्ताहमे एक बेर बाहर खेनाइ बंद करू — महीनामे ₹1,000 बचत। 👍",
    SPENDING_CRITICAL: "बेटा, ई तऽ खतराक घंटी थिक! पिछला महीना सँ दोगुना सँ बेसी खर्च भऽ गेल। आइए बैसि कऽ 3 सबसँ पैघ खर्च ताकू आ ओकरा काटू। ⚠️🔴",
    SPENDING_HIGH: "सावधान बेटा! पिछला महीना क तुलना में अहाँक खर्च बहुत बढ़ि गेल अछि। बस एक काज करू — खेनाइ, मनोरंजन वा खरीदारीमे सँ एक घटाउ। तनी हाथ रोकि कए चलू! ⚠️",
    SPENDING_LOW: "एहि महीना तनी बेसी खर्च भऽ गेल अछि — कोनो बात नहि। अगला सप्ताह दू दिन घरक खेनाइ लऽ जाउ — ₹800-₹1,200 महीने बचत। 😊",
    VS_LAST_MONTH: "पिछला महीना क तुलना में",
    REDUCED: "कम भेल",
    INCREASED: "बढ़ि गेल",
  },
  mr: {
    TITLE: "बाबांचा सल्ला",
    START: "चांगली सुरुवात! आजपासून तुमची बचत ट्रॅक करूया.",
    FIRST_SPEND: "स्वागत आहे बेटा! पहिल्यांदा खर्च ट्रॅक केलास — हाच पहिला पाऊल आहे. बाबा नेहमी तुझ्यासोबत आहेत! 🙌",
    FLAT_MONTH: "या महिन्यात मागच्या महिन्याइतकाच खर्च झाला — हे शिस्तीचे लक्षण आहे! आता बघ, पुढच्या महिन्यात ₹200-300 अजून बचवता येतील का? 💪",
    SAVING_MILESTONE: "वाह बेटा! मागच्या महिन्यापेक्षा निम्म्याहूनही कमी खर्च केलास! ही खरी समजदारी आहे. बाबांना अभिमान वाटतो! 🏆🌟",
    SAVING_HIGH: "वाह! शाब्बास बेटा. गेल्या महिन्यापेक्षा तू खूप बचत केली आहेस. हे पैसे गुंतवलेस तर एका वर्षात 20% वाढू शकतात. असेच चालू ठेव! 🌟",
    SAVING_LOW: "छान काम आहे. तुमची बचत वाढत आहे. आठवड्यातून एकदा बाहेर जेवण बंद कर — महिन्याला ₹1,000 बचू शकतात. 👍",
    SPENDING_CRITICAL: "बेटा, हा धोक्याचा इशारा आहे! मागच्या महिन्यापेक्षा दुप्पटहून जास्त खर्च झाला. आजच बसून 3 सर्वात मोठे खर्च शोध आणि ते कापून टाक. ⚠️🔴",
    SPENDING_HIGH: "बेटा, सावध राहा! गेल्या महिन्याच्या तुलनेत तुझा खर्च खूप वाढला आहे. फक्त एक गोष्ट कर — जेवण, मनोरंजन किंवा शॉपिंग यातून एक कमी कर. जरा हात राखून खर्च कर! ⚠️",
    SPENDING_LOW: "या महिन्यात थोडा जास्त खर्च झाला आहे — काळजी नको. पुढच्या आठवड्यात दोन दिवस घरचे जेवण न्यायचे — ₹800-₹1,200 महिन्यात बचू शकतात. 😊",
    VS_LAST_MONTH: "गेल्या महिन्याच्या तुलनेत",
    REDUCED: "कमी झाले",
    INCREASED: "वाढले",
  },
  bn: {
    TITLE: "বাবার পরামর্শ",
    START: "চমৎকার শুরু! আসুন আজ থেকে আপনার সঞ্চয় ট্র্যাক করি।",
    FIRST_SPEND: "স্বাগতম বেটা! প্রথমবার খরচ ট্র্যাক করলে — এটাই প্রথম পদক্ষেপ। বাবা সবসময় তোমার পাশে আছেন! 🙌",
    FLAT_MONTH: "এই মাসে ঠিক আগের মাসের মতোই খরচ হয়েছে — এটা শৃঙ্খলার লক্ষণ! এখন দেখো, আগামী মাসে ₹200-300 আরও বাঁচাতে পারবে? ছোট সঞ্চয়ও বড় হয়। 💪",
    SAVING_MILESTONE: "বাহ বেটা! গত মাসের তুলনায় অর্ধেকেরও কম খরচ করেছ! এটাই সত্যিকারের বুদ্ধিমানি। বাবা গর্বিত! 🏆🌟",
    SAVING_HIGH: "বাহ! সাবাশ বেটা। গত মাসের তুলনায় আপনি অনেক সঞ্চয় করেছেন। এই টাকা বিনিয়োগ করলে এক বছরে 20% বাড়তে পারে। এভাবেই চালিয়ে যান! 🌟",
    SAVING_LOW: "ভালো কাজ। আপনার সঞ্চয় বাড়ছে। সপ্তাহে একবার বাইরে খাওয়া বন্ধ করুন — মাসে ₹1,000 বাঁচতে পারে। 👍",
    SPENDING_CRITICAL: "বেটা, এটা বিপদের সংকেত! গত মাসের দ্বিগুণেরও বেশি খরচ হয়ে গেছে। আজই বসে 3টি সবচেয়ে বড় খরচ খুঁজে বের করো এবং সেগুলো কমাও। ⚠️🔴",
    SPENDING_HIGH: "সাবধান! গত মাসের তুলনায় আপনার খরচ অনেক বেড়ে গেছে। শুধু একটা কাজ করুন — খাওয়া, বিনোদন বা কেনাকাটা থেকে একটা কমান। একটু হাত টান দিন! ⚠️",
    SPENDING_LOW: "এই মাসে একটু বেশি খরচ হয়েছে — কোনো সমস্যা নেই। আগামী সপ্তাহে দুদিন বাড়ির খাবার নিয়ে যাও — মাসে ₹800-₹1,200 বাঁচতে পারে। 😊",
    VS_LAST_MONTH: "গত মাসের তুলনায়",
    REDUCED: "কমেছে",
    INCREASED: "বেড়েছে",
  },
  sa: {
    TITLE: "पितुः परामर्शः",
    START: "उत्तमः आरम्भः! अद्यैव स्वस्य रक्षणं पश्यामः।",
    FIRST_SPEND: "स्वागतम् पुत्र! प्रथमवारं व्ययः अनुरक्षितः — एषः प्रथमः पदक्षेपः अस्ति। पिता सर्वदा त्वया सह अस्ति! 🙌",
    FLAT_MONTH: "अस्मिन् मासे गतमासतुल्यः एव व्ययः जातः — एतत् अनुशासनस्य चिह्नम्। पश्य, अग्रिमे मासे ₹200-300 अधिकं रक्षितुं शक्यते किम्? 💪",
    SAVING_MILESTONE: "अतिशोभनम् पुत्र! गतमासापेक्षया अर्धात् न्यूनः व्ययः कृतः! एतत् सत्यं विवेकमस्ति। पिता गर्वितः! 🏆🌟",
    SAVING_HIGH: "अतिशोभनम्! पूर्वमासापेक्षया अधिकं धनं रक्षितम्। एतत् धनं निवेशे कृते एकवर्षे 20% वर्धते। एवं एव कुर्वन्तु! 🌟",
    SAVING_LOW: "साधु। तव रक्षणं वर्धते। सप्ताहे एकवारं बहिः भोजनं त्यज — मासे ₹1,000 रक्षितुं शक्यते। 👍",
    SPENDING_CRITICAL: "पुत्र, एषः संकटस्य संकेतः! गतमासापेक्षया द्विगुणात् अधिकः व्ययः जातः। अद्यैव उपविश्य त्रीणि बृहत्तमानि व्ययस्थानानि अन्विष्य तानि न्यूनीकुरु। ⚠️🔴",
    SPENDING_HIGH: "सावधानम्! व्ययः अतीव वर्धितः। एकमेव कार्यं कुरु — भोजनं, मनोरञ्जनं वा क्रयणं — एकं न्यूनीकुरु। व्ययं न्यूनीकुरु। ⚠️",
    SPENDING_LOW: "अस्मिन् मासे व्ययः किञ्चित् अधिकः जातः — चिन्ता मास्तु। अग्रिमे सप्ताहे द्विवारं गृहभोजनं नय — ₹800-₹1,200 मासे रक्षितुं शक्यते। 😊",
    VS_LAST_MONTH: "गतमासापेक्षया",
    REDUCED: "न्यूनम्",
    INCREASED: "वर्धितम्",
  },
};

export const getMentorData = (
  currentMonthTotal: number,
  lastMonthTotal: number,
  lang: SupportedLanguage = 'hinglish'
) => {
  const dictionary = ADVICE_DICTIONARY[lang] || ADVICE_DICTIONARY.hinglish;

  // Edge case: last month had no expenses
  if (lastMonthTotal === 0) {
    const advice = currentMonthTotal > 0
      ? dictionary.FIRST_SPEND  // New user with first spending — welcoming, not a warning
      : dictionary.START;        // No spending at all
    return {
      title: dictionary.TITLE,
      advice,
      diffText: `₹${Math.abs(currentMonthTotal).toLocaleString('en-IN')}`,
      statusText: currentMonthTotal > 0 ? dictionary.INCREASED : dictionary.REDUCED,
      subText: `${dictionary.VS_LAST_MONTH} (₹0)`,
      isSaving: currentMonthTotal === 0,
      percentChange: '0',
    };
  }

  const diff = currentMonthTotal - lastMonthTotal;
  const isSaving = diff <= 0;
  const percentChange = Math.abs((diff / lastMonthTotal) * 100);

  let advice: string;
  if (percentChange === 0) {
    advice = dictionary.FLAT_MONTH;  // Flat month — not START
  } else if (isSaving) {
    if (percentChange > 50) {
      advice = dictionary.SAVING_MILESTONE;  // >50% reduction — new milestone tier
    } else if (percentChange > 20) {
      advice = dictionary.SAVING_HIGH;
    } else {
      advice = dictionary.SAVING_LOW;
    }
  } else {
    if (percentChange > 50) {
      advice = dictionary.SPENDING_CRITICAL;  // >50% overspend — new critical tier
    } else if (percentChange > 20) {
      advice = dictionary.SPENDING_HIGH;
    } else {
      advice = dictionary.SPENDING_LOW;
    }
  }

  return {
    title: dictionary.TITLE,
    advice,
    diffText: `₹${Math.abs(diff).toLocaleString('en-IN')}`,
    statusText: isSaving ? dictionary.REDUCED : dictionary.INCREASED,
    subText: `${dictionary.VS_LAST_MONTH} (₹${lastMonthTotal.toLocaleString('en-IN')})`,
    isSaving,
    percentChange: percentChange.toFixed(0),
  };
};
