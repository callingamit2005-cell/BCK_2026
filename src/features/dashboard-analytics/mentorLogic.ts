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
  SAVING_HIGH: string;
  SAVING_LOW: string;
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
    SAVING_HIGH: "Excellent work! You saved significantly more than last month. Keep it up! 🌟",
    SAVING_LOW: "Good job. Your savings are growing steadily. 👍",
    SPENDING_HIGH: "Careful! Your spending has increased a lot. Try to cut back. ⚠️",
    SPENDING_LOW: "You spent a bit more this month. Let's try to be more mindful next week. 😊",
    VS_LAST_MONTH: "vs. last month",
    REDUCED: "Reduced",
    INCREASED: "Increased",
  },
  hinglish: {
    TITLE: "Papa's Financial Advice",
    START: "Shuruat achi hai! Let's start tracking your Bachat today.",
    SAVING_HIGH: "Wah! Shabaash beta. Pichle mahine se kaafi bachat ki hai tumne. Keep it up! 🌟",
    SAVING_LOW: "Sahi raaste pe ho. Savings badh rahi hain, aise hi chaltay raho. 👍",
    SPENDING_HIGH: "Beta, pichle mahine ke muqable kharch kaafi badh gaya hai. Thoda hath rok kar chalo! ⚠️",
    SPENDING_LOW: "Is mahine thoda zyada kharch hua hai. Agle hafte thoda control karne ki koshish karo. 😊",
    VS_LAST_MONTH: "pichle mahine ke muqable",
    REDUCED: "Kam hua",
    INCREASED: "Badh gaya",
  },
  hi: {
    TITLE: "पिताजी की सलाह",
    START: "अच्छी शुरुआत है! आइए आज से अपनी बचत ट्रैक करें।",
    SAVING_HIGH: "शानदार! आपने पिछले महीने की तुलना में बहुत बचत की है। ऐसे ही जारी रखें! 🌟",
    SAVING_LOW: "अच्छा काम है। आपकी बचत बढ़ रही है। 👍",
    SPENDING_HIGH: "सावधान! आपका खर्च बहुत बढ़ गया है। थोड़ा कम करने की कोशिश करें। ⚠️",
    SPENDING_LOW: "इस महीने थोड़ा अधिक खर्च हुआ है। अगले सप्ताह सावधान रहें। 😊",
    VS_LAST_MONTH: "पिछले महीने की तुलना में",
    REDUCED: "कम हुआ",
    INCREASED: "बढ़ गया",
  },
  pa: {
    TITLE: "ਪਿਤਾ ਜੀ ਦੀ ਸਲਾਹ",
    START: "ਵਧੀਆ ਸ਼ੁਰੂਆਤ! ਆਓ ਅੱਜ ਤੋਂ ਆਪਣੀ ਬੱਚਤ ਨੂੰ ਟ੍ਰੈਕ ਕਰੀਏ।",
    SAVING_HIGH: "ਵਾਹ! ਸ਼ਾਬਾਸ਼ ਬੇਟਾ। ਪਿਛਲੇ ਮਹੀਨੇ ਨਾਲੋਂ ਬਹੁਤ ਬੱਚਤ ਕੀਤੀ ਹੈ। ਇੰਝ ਹੀ ਕਰਦੇ ਰਹੋ! 🌟",
    SAVING_LOW: "ਸਹੀ ਰਾਹ ਤੇ ਹੋ। ਬੱਚਤ ਵੱਧ ਰਹੀ ਹੈ। 👍",
    SPENDING_HIGH: "ਬੇਟਾ, ਖਰਚਾ ਬਹੁਤ ਵੱਧ ਗਿਆ ਹੈ। ਥੋੜਾ ਹੱਥ ਰੋਕ ਕੇ ਚੱਲੋ! ⚠️",
    SPENDING_LOW: "ਇਸ ਮਹੀਨੇ ਥੋੜਾ ਜਿਆਦਾ ਖਰਚਾ ਹੋਇਆ ਹੈ। ਅਗਲੇ ਹਫਤੇ ਧਿਆਨ ਰੱਖਣਾ। 😊",
    VS_LAST_MONTH: "ਪਿਛਲੇ ਮਹੀਨੇ ਦੇ ਮੁਕਾਬਲੇ",
    REDUCED: "ਘਟਿਆ",
    INCREASED: "ਵਧਿਆ",
  },
  gu: {
    TITLE: "પિતાની સલાહ",
    START: "સરસ શરૂઆત! ચાલો આજે તમારી બચતને ટ્રેક કરીએ.",
    SAVING_HIGH: "વાહ! શાબાશ બેટા. ગયા મહિના કરતા તે ઘણી બચત કરી છે. આમ જ ચાલુ રાખ! 🌟",
    SAVING_LOW: "સરસ કામ છે. તારી બચત વધી રહી છે. 👍",
    SPENDING_HIGH: "બેટા, ધ્યાન રાખ! ગયા મહિનાની સરખામણીમાં તારો ખર્ચ ઘણો વધી ગયો છે. થોડો હાથ રોકીને ચાલ! ⚠️",
    SPENDING_LOW: "આ મહિને થોડો વધારે ખર્ચ થયો છે. આવતા અઠવાડિયે થોડું ધ્યાન રાખજે. 😊",
    VS_LAST_MONTH: "ગયા મહિનાની તુલનામાં",
    REDUCED: "ઘટાડો",
    INCREASED: "વધારો",
  },
  bho: {
    TITLE: "बाबूजी के सलाह",
    START: "बढ़िया शुरुआत बा! आजु से बचत ट्रैक कइल जाव।",
    SAVING_HIGH: "वाह! शाबाश बेटा। पिछला महीना से बहुत बचत कइले बाड़ऽ। अइसहीं चलत रहऽ! 🌟",
    SAVING_LOW: "सही रास्ता पर बाड़ऽ। बचत बढ़त बा। 👍",
    SPENDING_HIGH: "बेटा, पिछला महीना के तुलना में खर्चा बहुत बढ़ गइल बा। तनी हाथ रोक के चलऽ! ⚠️",
    SPENDING_LOW: "ए मउगा तनी जादे खर्चा हो गइल बा। अगिला हफ्ता ध्यान दीहऽ। 😊",
    VS_LAST_MONTH: "पिछला महीना के तुलना में",
    REDUCED: "कम भइल",
    INCREASED: "बढ़ गइल",
  },
  mai: {
    TITLE: "पिताजीक सलाह",
    START: "नीक शुरुवात! आउ आइ सँ अपन बचत ट्रैक करी।",
    SAVING_HIGH: "वाह! शाबाশ बेटा। पिछला महीना क तुलना में बहुत बचत कयलह अछि। एहिना जारी राखू! 🌟",
    SAVING_LOW: "नीक काज अछि। अहाँक बचत बढ़ि रहल अछि। 👍",
    SPENDING_HIGH: "सावधान बेटा! पिछला महीना क तुलना में अहाँक खर्च बहुत बढ़ि गेल अछि। तनी हाथ रोकि कए चलू! ⚠️",
    SPENDING_LOW: "एहि महीना तनी बेसी खर्च भऽ गेल अछि। अगला हफ्ता सावधान रहब। 😊",
    VS_LAST_MONTH: "पिछला महीना क तुलना में",
    REDUCED: "कम भेल",
    INCREASED: "बढ़ि गेल",
  },
  mr: {
    TITLE: "बाबांचा सल्ला",
    START: "चांगली सुरुवात! आजपासून तुमची बचत ट्रॅक करूया.",
    SAVING_HIGH: "वाह! शाब्बास बेटा. गेल्या महिन्यापेक्षा तू खूप बचत केली आहेस. असेच चालू ठेव! 🌟",
    SAVING_LOW: "छान काम आहे. तुमची बचत वाढत आहे. 👍",
    SPENDING_HIGH: "बेटा, सावध राहा! गेल्या महिन्याच्या तुलनेत तुझा खर्च खूप वाढला आहे. जरा हात राखून खर्च कर! ⚠️",
    SPENDING_LOW: "या महिन्यात थोडा जास्त खर्च झाला आहे. पुढच्या आठवड्यात थोडे नियंत्रण ठेवण्याचा प्रयत्न कर. 😊",
    VS_LAST_MONTH: "गेल्या महिन्याच्या तुलनेत",
    REDUCED: "कमी झाले",
    INCREASED: "वाढले",
  },
  bn: {
    TITLE: "বাবার পরামর্শ",
    START: "চমৎকার শুরু! আসুন আজ থেকে আপনার সঞ্চয় ট্র্যাক করি।",
    SAVING_HIGH: "বাহ! সাবাশ বেটা। গত মাসের তুলনায় আপনি অনেক সঞ্চয় করেছেন। এভাবেই চালিয়ে যান! 🌟",
    SAVING_LOW: "ভালো কাজ। আপনার সঞ্চয় বাড়ছে। 👍",
    SPENDING_HIGH: "সাবধান! গত মাসের তুলনায় আপনার খরচ অনেক বেড়ে গেছে। একটু হাত টান দিন! ⚠️",
    SPENDING_LOW: "এই মাসে একটু বেশি খরচ হয়েছে। আগামী সপ্তাহে একটু সতর্ক থাকার চেষ্টা করুন। 😊",
    VS_LAST_MONTH: "গত মাসের তুলনায়",
    REDUCED: "কমেছে",
    INCREASED: "বেড়েছে",
  },
  sa: {
    TITLE: "पितुः परामर्शः",
    START: "उत्तमः आरम्भः! अद्यैव स्वस्य रक्षणं पश्यामः।",
    SAVING_HIGH: "अतिशोभनम्! पूर्वमासापेक्षया अधिकं धनं रक्षितम्। एवं एव कुर्वन्तु! 🌟",
    SAVING_LOW: "साधु। तव रक्षणं वर्धते। 👍",
    SPENDING_HIGH: "सावधानम्! व्ययः अतीव वर्धितः। व्ययं न्यूनीकुरु। ⚠️",
    SPENDING_LOW: "अस्मिन् मासे व्ययः किञ्चित् अधिकः जातः। सावधानः भव। 😊",
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
      ? dictionary.SPENDING_HIGH  // New spending started – treat as high spending
      : dictionary.START;          // No spending at all
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

  let advice = dictionary.START;
  if (percentChange > 0) {
    if (isSaving) {
      advice = percentChange > 20 ? dictionary.SAVING_HIGH : dictionary.SAVING_LOW;
    } else {
      advice = percentChange > 20 ? dictionary.SPENDING_HIGH : dictionary.SPENDING_LOW;
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