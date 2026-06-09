/* =========================================================
UI UPGRADE: REF-SPINWHEEL-UI-PHASE2 ✅
- [FIX] Hot-pink neon FULLY removed — replaced with design system teal
- [FIX] launch-pulse animation removed (was undefined / neon-only)
- [FIX] Android safe-area: env(safe-area-inset-bottom) retained
- [FIX] Hardcoded dark backgrounds → CSS vars (bg-background, bg-surface)
- [UI]  Teal primary: #0F766E (light) / #14B8A6 (dark)
- [UI]  Wheel hub + pointer → teal
- [UI]  Spin button → clean teal gradient, no glow pulse
- [UI]  Winner overlay → teal accent, no hot-pink
- [UI]  Confetti → warm amber/teal/blue palette (no pink)
- [UI]  Input + add button → teal focus/border
- [UI]  Typography: reduced uppercase tracking on body copy
- ZERO changes to: business logic, spin logic, handleSpin,
  rotation state, FUNNY_MESSAGES_DATA, t() calls,
  member/names logic, props interface, formatDisplayName.
========================================================= */

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dices, Trophy, Trash2, Plus, Users, Camera, X, Sparkles } from "lucide-react";
import { tSafe } from '@/i18n';
import { useI18nNamespaces } from '@/hooks/useI18nNamespaces';
import { useLanguage } from '@/contexts/LanguageContext';

// ── COLOR PALETTE ──────────────────────────────────────────
// Kept identical to original — chart CSS vars unchanged.
const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))"
];

// Soft shimmer highlights — warm, no neon pink.
// Used in SVG radial gradient overlays on each wheel slice.
const SLICE_HIGHLIGHTS = [
  "rgba(255, 255, 255, 0.18)",
  "rgba(255, 255, 255, 0.14)",
  "rgba(255, 255, 255, 0.20)",
  "rgba(255, 255, 255, 0.16)",
  "rgba(255, 255, 255, 0.18)",
  "rgba(255, 255, 255, 0.14)",
];

// ── FUNNY MESSAGES (UNTOUCHED) ─────────────────────────────
const FUNNY_MESSAGES_DATA = [
  { id: 1, text: "Filmein sirf teen cheezon se chalti hain: Bill, Bill, Bill! 🎬" },
  { id: 2, text: "Mere paas Bangla hai, Gaadi hai... Tere paas kya hai? Mere paas Bill hai! 📄" },
  { id: 3, text: "Mogambo khush hua... kyunki Bill tune bhara! 😈" },
  { id: 4, text: "Rishte mein toh hum tumhare Baap lagte hain, naam hai 'Bill Payer'. 🕶️" },
  { id: 5, text: "Pushpa, I hate tears... par Bill dekh ke rona aata hai. 😭" },
  { id: 6, text: "Jaa Simran Jaa... jee le apni zindagi (Bill bharne ke baad). 🚂" },
  { id: 7, text: "Kitne Bill the? ...Sardar, poore 2 hazar ke! 😱" },
  { id: 8, text: "Thappad se darr nahi lagta sahab... Bill se lagta hai! 👋" },
  { id: 9, text: "Ek chutki Bill ki keemat, tum kya jaano Ramesh Babu? 🔴" },
  { id: 10, text: "Don ka Bill toh 11 mulkon ki police dhoond rahi hai. 🚓" },
  { id: 11, text: "Taareekh pe Taareekh milti hai... par Bill maafi nahi milti! ⚖️" },
  { id: 12, text: "Ye Dhai Kilo ka Bill jab padta hai na... toh aadmi uthta nahi, lut jaata hai! 💪" },
  { id: 13, text: "Parampara, Pratishtha, Anushasan... aur Bill Payment. 🏫" },
  { id: 14, text: "Babumoshai, Bill bada hona chahiye, lamba nahi! 🎈" },
  { id: 15, text: "Rahul, naam toh suna hoga? (Bill pe likha hai). 👂" },
  { id: 16, text: "Main apni favorite hoon... par Bill mera favorite nahi hai. 💁‍♀️" },
  { id: 17, text: "Picture abhi baaki hai mere dost... Tax judna baaki hai! 📽️" },
  { id: 18, text: "Sara sheher mujhe 'Bill Payer' ke naam se jaanta hai. 🦁" },
  { id: 19, text: "Kutte, kameene, main tera khoon pee jaunga... agar tune Bill nahi diya! 🐕" },
  { id: 20, text: "Teja main hoon, Mark idhar hai... Bill udhar hai! ❌" },
  { id: 21, text: "Crime Master Gogo naam hai mera, aankhen nikal ke gotiyan khelta hoon... Bill dekh ke! 👀" },
  { id: 22, text: "Haar kar jeetne wale ko Baazigar kehte hain... aur Bill bharne wale ko Bakra! 🐐" },
  { id: 23, text: "Bade bade deshon mein, aise chhote chhote Bill aate rehte hain. 🌍" },
  { id: 24, text: "All is Well... jab tak Bill nahi aata. ❤️" },
  { id: 25, text: "Aata majhi satakli... Bill dekh ke! 🤯" },
  { id: 26, text: "Khada hu aaj bhi wahi... Bill ke intezaar mein. 🎵" },
  { id: 27, text: "Moye Moye! (Bill amount dekh ke). 🎶" },
  { id: 28, text: "Aayein? Bill mujhe bharna hai? 🍆" },
  { id: 29, text: "Gaddari Karbe! Bill mere naam pe? 😠" },
  { id: 30, text: "System Phad Denge... par pehle Bill clear karo! 🔥" },
  { id: 31, text: "Abba Nahi Maanenge... Bill bharne ke liye! 😤" },
  { id: 32, text: "Chhoti bacchi ho kya? Bill bharo chupchap! 👧" },
  { id: 33, text: "Rasode mein kaun tha? Tum the! Toh Bill bhi tum bharoge. 🍳" },
  { id: 34, text: "Ye dukh kaahe khatam nahi hota be? (Har baar Bill mera). 😩" },
  { id: 35, text: "Control Uday, Control! Paisa ja raha hai. 🧘‍♂️" },
  { id: 36, text: "Tera ghar jayega ismein... is Bill mein! 🏠" },
  { id: 37, text: "Ambani ke chacha, aage aao... Bill bharo! 🤝" },
  { id: 38, text: "Kismat hi kharab hai teri bhai... Bill phir tere naam. 💔" },
  { id: 39, text: "Chuna laga diya doston ne... Bill thama diya! 🤡" },
  { id: 40, text: "QR Code scan kar, natak mat kar. 📱" },
  { id: 41, text: "Dil se bura lagta hai bhai... jab Bill akele bharna pade. 🥺" },
  { id: 42, text: "Ab bol na... 'Main Dunga, Main Dunga'! 😤" },
  { id: 43, text: "Lag gaye... 440 Volt ke jhatke (Bill dekh ke)! ⚡" },
  { id: 44, text: "Bhai, kidney bechne ka waqt aa gaya hai Bill ke liye. 🏥" },
  { id: 45, text: "Swagat nahi karoge hamara? (Bill ke sath). 😎" },
  { id: 46, text: "Phone silent pe mat daalna ab... OTP aayega Bill ka. 📵" },
  { id: 47, text: "Jiska dar tha, wahi hua... Bill aa gaya! 😱" },
  { id: 48, text: "Muskuraiye, aapka kat chuka hai (Bill mein). 📸" },
  { id: 49, text: "Itne paise mein itnaich milega... par Bill poora lagega. 🤏" },
  { id: 50, text: "Ghar pe kya bolega? 'Lut gaya Bill mein'? 😂" },
  { id: 51, text: "Card decline mat karwana bas... izzat ka sawal hai. 💳" },
  { id: 52, text: "Tension mat le, salary aane wali hai... Bill bhar de. 🗓️" },
  { id: 53, text: "Party abhi baaki hai mere dost... Bill bhi baaki hai! 🍻" },
  { id: 54, text: "21 topon ki salami is bahadur Bill Payer ko! 🫡" },
  { id: 55, text: "Hasi toh phasi... Bill ke jaal mein! 🤭" },
  { id: 56, text: "Checkmate! Bill tera hua. ♟️" },
  { id: 57, text: "Tumhare lakshan bilkul theek nahi lag rahe... Bill ke maamle mein. 🧐" },
  { id: 58, text: "Ab toh loan lena padega Bill ke liye. 🏦" },
  { id: 59, text: "Sadak se utha ke... Star bana diya (Bill Payer). ⭐" },
  { id: 60, text: "Chup chaap pay kar, shana mat ban. 🤫" },
  { id: 61, text: "Om Bhatt Swaha! (Paison ka Bill mein). 🔥" },
  { id: 62, text: "Next time pakka main dunga (Jhooth). 🤥" },
  { id: 63, text: "Bade log, bade Bill. 🎩" },
  { id: 64, text: "ATM machine yahi hai... Bill bharo! 🏧" },
  { id: 65, text: "Katappa ne Bahubali ko kyu mara? Bill bachane ke liye! ⚔️" },
  { id: 66, text: "Zor ka jhatka, haye zoron se laga (Bill amount). 🤕" },
  { id: 67, text: "Aaj nagad, kal udhaar... Bill abhi. 💵" },
  { id: 68, text: "Khuda ka khauf kar, aur Bill pay kar. 🙌" },
  { id: 69, text: "Ye scheme tere liye hi thi... Bill bharne ki. 📉" },
  { id: 70, text: "Congratulations! You are the Chosen One for the Bill. 🏆" },
  { id: 71, text: "Mummy ko mat batana ki itna Bill aaya hai. 🤫" },
  { id: 72, text: "Tata, Bye Bye, Khatam, Gaya (Paisa Bill mein)! 👋" },
  { id: 73, text: "Sab milke isko loot rahe hain (Bill ke zariye). 🕵️‍♂️" },
  { id: 74, text: "Melody khao, khud jaan jao... ki Bill kyu bharna hai. 🍬" },
  { id: 75, text: "Wah Bete! Mauj kardi Bill bhar ke. 👏" },
  { id: 76, text: "Thukra ke mera pyaar, mera Bill dekhegi! 💔" },
  { id: 77, text: "Ye bik gayi hai gormint, ab tu hi bacha sakta hai Bill bhar ke. 🤬" },
  { id: 78, text: "Hum first, hum first! (Bill dene mein koi nahi bolta). 🥇" },
  { id: 79, text: "Beta, tumse na ho payega... Bill bachana. 👴" },
  { id: 80, text: "Main kya karu phir? Job chhod du Bill ke chakkar mein? 🤷‍♂️" },
  { id: 81, text: "Utha le re baba, mereko nahi... is Bill ko! 🦴" },
  { id: 82, text: "Ye baburao ka style hai... Bill na bharne ka! 👓" },
  { id: 83, text: "Paisa bolta hai, aur aaj tera Bill bolega. 🗣️" },
  { id: 84, text: "Seh lenge thoda... Bill ka bojh. 😣" },
  { id: 85, text: "Zindagi jhand ba, phir bhi ghamand ba (Bill bharne ka). 🚩" },
  { id: 86, text: "Aisa dhak-dhak horela hai na Bill dekh ke? 💓" },
  { id: 87, text: "Bhai paisa ho to kya kuch nahi ho sakta (Bill clear ho sakta hai)! 🤑" },
  { id: 88, text: "Chitt bhi meri, patt bhi meri, Bill tera. 🪙" },
  { id: 89, text: "Tum bohot mast kaam karta hai Maqsood bhai (Bill bhar ke)! 🫂" },
  { id: 90, text: "Kya gunda banega re tu? Pehle Bill toh bhar! 🔫" },
  { id: 91, text: "Ek baar jo maine commitment kar di (Bill bharne ki)... toh main apni bhi nahi sunta. 👊" },
  { id: 92, text: "Itni shiddat se maine tumhe paane ki koshish ki hai (Bill ne kaha). ✨" },
  { id: 93, text: "Deva re Deva! Itna bada Bill? 🙌" },
  { id: 94, text: "25 din mein paisa double... tab tak Bill rukega? 💰" },
  { id: 95, text: "Golmaal hai bhai sab golmaal hai... Bill mein! ⚽" },
  { id: 96, text: "Jal lijiye... thak gaye honge Bill bharte bharte. 💧" },
  { id: 97, text: "Ab ghodo ki race mein gadhe bhi Bill bharne daudenge? 🐎" },
  { id: 98, text: "Humko maaro, humko zinda mat chhodna... bas Bill mat do! 💀" },
  { id: 99, text: "Mann mein laddoo phoota... Bill clear hua! 🍬" },
  { id: 100, text: "Samjh rahe ho? Bill tumhe hi dena hai! 😜" },
  { id: 101, text: "Dil garden garden ho gaya... jab tune Bill bhara! 🌳" },
  { id: 102, text: "Maza aaya! (Dusron ko, jab tumne Bill bhara). 😆" },
  { id: 103, text: "Ye badhiya tha guru... Bill tera! 👌" },
  { id: 104, text: "Chhoti ganga bolke naale mein kuda diya (Bill ke saath)! 🌊" },
  { id: 105, text: "Sardar maine aapka namak khaya hai... ab Bill khao! 🧂" },
  { id: 106, text: "Holi kab hai? ...Jab salary aayegi tab Bill bharenge. 🎨" },
  { id: 107, text: "Thakur ye haath mujhe dede... Bill sign karne ke liye. 🤲" },
  { id: 108, text: "Basanti in kutton ke samne mat naachna... bas Bill bhar dena. 💃" },
  { id: 109, text: "Itna sannata kyu hai bhai? Bill dekh liya kya? 🤫" },
  { id: 110, text: "Soja nahi toh Gabbar aa jayega... Bill leke! 👹" }
];

// ── INTERFACES (UNTOUCHED) ─────────────────────────────────
interface Member {
  id: string;
  name: string;
}

interface BillRouletteProps {
  members?: Member[];
}

// ── CONFETTI PARTICLE CONFIG ───────────────────────────────
// Warm amber + teal + sky palette — no hot-pink.
const CONFETTI_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  color: ["#F59E0B", "#14B8A6", "#3B82F6", "#22C55E", "#8B5CF6", "#F97316"][i % 6],
  x: 50 + Math.cos((i / 18) * 2 * Math.PI) * 38,
  y: 50 + Math.sin((i / 18) * 2 * Math.PI) * 38,
  delay: `${(i * 0.06).toFixed(2)}s`,
  size: [6, 8, 5, 7, 6, 9][i % 6],
}));

// ── COMPONENT ──────────────────────────────────────────────
const BillRoulette = ({ members = [] }: BillRouletteProps) => {
  // ── All hooks IDENTICAL to original ──
  useI18nNamespaces(["split", "common", "dashboard", "savings"]);
  const { t } = useLanguage();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [names, setNames] = useState<string[]>([]);
  const [inputName, setInputName] = useState('');
  const [winner, setWinner] = useState<string | null>(null);
  const [funnyNote, setFunnyNote] = useState<string>("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  // ── All effects IDENTICAL to original ──
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // 🚀 TRIGGER: Open on query param (e.g. from BottomNav)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'spin') {
      setOpen(true);
    }
  }, [location.search]);

  useEffect(() => {
    if (members && members.length > 0) {
      const memberNames = members.map(m => m.name.trim()).filter(n => n.length > 0);
      setNames([...new Set(memberNames)]);
    }
  }, [members]);

  // ── All math / logic IDENTICAL to original ──
  const size = 300;
  const center = size / 2;
  const radius = size / 2 - 10;

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const addName = () => {
    if (inputName.trim() !== '') {
      setNames([...names, inputName.trim()]);
      setInputName('');
      setWinner(null);
      setRotation(0);
    }
  };

  const removeName = (index: number) => {
    const newNames = [...names];
    newNames.splice(index, 1);
    setNames(newNames);
    setWinner(null);
    setRotation(0);
  };

  const formatDisplayName = (fullName: string) => {
    if (fullName.includes('@')) return fullName.split('@')[0];
    return fullName;
  };

  // ── handleSpin IDENTICAL to original ──
  const handleSpin = () => {
    if (names.length < 2 || isSpinning) return;
    setWinner(null);
    setFunnyNote("");
    setIsSpinning(true);
    const sliceAngle = 360 / names.length;
    const randomRotation = 1800 + Math.floor(Math.random() * 1000);
    const finalRotation = rotation + randomRotation;
    setRotation(finalRotation);
    setTimeout(() => {
      setIsSpinning(false);
      const actualRotation = finalRotation % 360;
      let angleAtPointer = (270 - actualRotation) % 360;
      if (angleAtPointer < 0) angleAtPointer += 360;
      const winIndex = Math.floor(angleAtPointer / sliceAngle);
      setWinner(names[winIndex]);
      const randomMsgObj = FUNNY_MESSAGES_DATA[Math.floor(Math.random() * FUNNY_MESSAGES_DATA.length)];
      setFunnyNote(randomMsgObj.text);
    }, 3000);
  };

  // ── RENDER WHEEL — UI UPGRADED ─────────────────────────
  // Logic (path math, rotation, text) = IDENTICAL to original.
  // Changed: NEON_HIGHLIGHTS → SLICE_HIGHLIGHTS (soft white shimmer)
  //          Hub circle stroke: teal (#14B8A6) instead of hot-pink
  //          Drop-shadow: uses teal rgba instead of pink rgba
  const renderWheel = () => {
    const total = names.length;
    return (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        style={{
          // [UNTOUCHED] rotation + transition logic identical
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning ? 'transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
          // [UI] Teal drop-shadow while spinning
          filter: isSpinning
            ? 'drop-shadow(0px 0px 14px rgba(20,184,166,0.4)) drop-shadow(0px 4px 12px rgba(0,0,0,0.5))'
            : 'drop-shadow(0px 4px 10px rgba(0,0,0,0.4))',
          maxWidth: 'min(100%, 300px)',
          maxHeight: 'min(100%, 300px)',
        }}
      >
        {/* Per-slice gradient defs — soft white shimmer, no pink */}
        <defs>
          {names.map((_, i) => (
            <radialGradient
              key={`grad-${i}`}
              id={`slice-grad-${i}`}
              cx="30%"
              cy="30%"
              r="70%"
            >
              <stop offset="0%" stopColor={SLICE_HIGHLIGHTS[i % SLICE_HIGHLIGHTS.length]} />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          ))}
        </defs>

        {names.map((name, i) => {
          // [UNTOUCHED] All path math identical to original
          const startAngle = i * (1 / total);
          const endAngle = (i + 1) * (1 / total);
          const [startX, startY] = getCoordinatesForPercent(startAngle);
          const [endX, endY] = getCoordinatesForPercent(endAngle);
          const largeArcFlag = 1 / total > 0.5 ? 1 : 0;
          const pathData = `M ${center} ${center} L ${center + radius * startX} ${center + radius * startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${center + radius * endX} ${center + radius * endY} Z`;
          const midAngle = startAngle + (endAngle - startAngle) / 2;
          const [textX, textY] = getCoordinatesForPercent(midAngle);
          const textRadius = radius * 0.75;
          const tx = center + textRadius * textX;
          const ty = center + textRadius * textY;
          const rotateAngle = (midAngle * 360);
          const fontSize = name.length > 8 ? 11 : 14;
          const displayName = formatDisplayName(name);

          return (
            <g key={i}>
              {/* [UNTOUCHED] Base slice fill */}
              <path
                d={pathData}
                fill={COLORS[i % COLORS.length]}
                stroke="rgba(0,0,0,0.25)"
                strokeWidth="1.5"
              />
              {/* Soft shimmer overlay */}
              <path
                d={pathData}
                fill={`url(#slice-grad-${i})`}
                stroke="none"
                style={{ pointerEvents: 'none' }}
              />
              {/* [UNTOUCHED] Slice label text */}
              <text
                x={tx} y={ty}
                fill="white"
                fontSize={fontSize}
                fontFamily="Arial, sans-serif"
                fontWeight="bold"
                textAnchor="middle"
                alignmentBaseline="middle"
                transform={`rotate(${rotateAngle}, ${tx}, ${ty})`}
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))" }}
              >
                {displayName.length > 10 ? displayName.substring(0, 8) + '..' : displayName}
              </text>
            </g>
          );
        })}

        {/* Outer rim highlight */}
        <circle
          cx={center}
          cy={center}
          r={radius + 4}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="3"
        />
        {/* Inner hub — teal, no pink */}
        <circle
          cx={center}
          cy={center}
          r={14}
          fill="rgba(10,20,20,0.9)"
          stroke="rgba(20,184,166,0.6)"
          strokeWidth="2"
        />
        <circle cx={center} cy={center} r={6} fill="rgba(20,184,166,0.9)" />
      </svg>
    );
  };

  // ── RENDER ─────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={setOpen}>

      {/* ── TRIGGER BUTTON ─────────────────────────────────
          [UI] Teal accent instead of hot-pink gradient.
               Removed launch-pulse (was neon-only animation).
          [UNTOUCHED] onClick, variant logic, i18n key. */}
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-11 px-6 gap-2.5 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, rgba(15,118,110,0.12) 0%, rgba(37,99,235,0.10) 100%)',
            border: '1px solid rgba(15,118,110,0.35)',
            color: 'hsl(var(--foreground))',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <Dices
            className="h-4 w-4"
            style={{ color: '#0F766E' }}
          />
          <span>{t('spin_wheel')}</span>
          <Sparkles className="h-3 w-3 opacity-50" style={{ color: '#F59E0B' }} />
        </Button>
      </DialogTrigger>

      {/* ── DIALOG CONTENT ─────────────────────────────────
          [FIX-ANDROID] Safe-area-aware max height retained.
          [UI] bg-background CSS var instead of hardcoded dark hex.
               Teal border instead of hot-pink. */}
      <DialogContent
        className="mobile-scroll w-[95vw] sm:max-w-md rounded-modal border p-0 overflow-hidden outline-none bg-background fixed left-[50%] translate-x-[-50%] translate-y-0"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 70px)',
          maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 140px)',
          borderColor: 'rgba(15,118,110,0.25)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        }}
      >
        {/* ── TOP BAR: funny title + close ── */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <Dices className="h-4 w-4" style={{ color: '#0F766E' }} />
            <div>
              <p className="text-xs font-bold text-foreground leading-none">किस्मत का फ़ैसला 🎲</p>
              <p className="text-[9px] text-muted-foreground mt-0.5 leading-none">पैसा भरेगा वो जिसे भाग्य ने चुना 😈</p>
            </div>
          </div>
          <DialogClose
            className="p-1.5 rounded-full transition-all active:scale-95 shrink-0"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* ── SCROLL CONTAINER ── */}
        <div
          className="overflow-y-auto p-4 max-h-full custom-scrollbar"
          style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 16px))' }}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{t('wheel_of_fortune')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">

            {/* ── SPIN BUTTON — moved above wheel ── */}
            <Button
              type="button"
              onClick={handleSpin}
              disabled={isSpinning || names.length < 2}
              className="relative w-full h-14 text-sm font-semibold rounded-xl overflow-hidden transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed text-white"
              style={{
                background: isSpinning
                  ? 'linear-gradient(135deg, #0F766E 0%, #0EA5E9 100%)'
                  : 'linear-gradient(135deg, #0F766E 0%, #0D9488 50%, #0EA5E9 100%)',
                boxShadow: names.length >= 2 && !isSpinning
                  ? '0 4px 16px rgba(15,118,110,0.3)'
                  : 'none',
                border: 'none',
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2.5">
                {isSpinning ? (
                  <>
                    <Dices className="h-5 w-5 animate-spin" />
                    {t('spinning')}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {t('spin_action')}
                  </>
                )}
              </span>
            </Button>

            {/* ── WHEEL AREA ─────────────────────────────────
                [UI] Clean border, teal spinning state accent.
                [UNTOUCHED] min-h, overflow, renderWheel() call, empty state logic. */}
            <div
              className="relative min-h-[280px] sm:min-h-[320px] w-full flex items-center justify-center rounded-2xl overflow-hidden mb-2 px-2"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: isSpinning
                  ? '1px solid rgba(20,184,166,0.5)'
                  : '1px solid rgba(255,255,255,0.08)',
                transition: 'border-color 0.4s ease',
              }}
            >
              {/* [UNTOUCHED] Wheel or empty-state conditional */}
              {names.length > 1 ? renderWheel() : (
                <div className="text-center p-8 flex flex-col items-center gap-4">
                  {/* Empty state: teal dashed ring */}
                  <div
                    className="h-20 w-20 rounded-full flex items-center justify-center"
                    style={{
                      border: '2px dashed rgba(15,118,110,0.35)',
                      background: 'rgba(15,118,110,0.05)',
                    }}
                  >
                    <Users className="h-9 w-9" style={{ color: 'rgba(15,118,110,0.5)' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground">
                      {t('waiting_for_members')}
                    </p>
                    <p className="text-xs mt-1 text-muted-foreground opacity-60">
                      {t('add_min_members')}
                    </p>
                  </div>
                </div>
              )}

              {/* ── POINTER — teal, no pink ── */}
              {names.length > 1 && (
                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <div
                    className="w-0 h-0"
                    style={{
                      borderLeft: '12px solid transparent',
                      borderRight: '12px solid transparent',
                      borderTop: '24px solid #14B8A6',
                      filter: 'drop-shadow(0 2px 4px rgba(20,184,166,0.5))',
                    }}
                  />
                </div>
              )}

              {/* ── WINNER OVERLAY ────────────────────────────
                  [UI] bg-background CSS var, teal accents, no pink.
                  [UNTOUCHED] winner conditional, setWinner/setFunnyNote/setRotation calls,
                              Trophy icon, funnyNote display, t() keys, button logic. */}
              {winner && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center z-20 px-6 text-center bg-background"
                  style={{
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    animation: 'fadeInScale 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
                  }}
                >
                  {/* Confetti burst — teal/amber/sky palette */}
                  <svg
                    width="200" height="200"
                    viewBox="0 0 100 100"
                    className="absolute pointer-events-none"
                    style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                  >
                    {CONFETTI_PARTICLES.map(p => (
                      <circle
                        key={p.id}
                        cx={p.x} cy={p.y} r={p.size / 2}
                        fill={p.color}
                        style={{
                          animation: `confettiPop 0.6s ${p.delay} cubic-bezier(0.34,1.56,0.64,1) forwards`,
                          opacity: 0,
                          transformOrigin: '50px 50px',
                        }}
                      />
                    ))}
                  </svg>

                  {/* Trophy — amber gold */}
                  <Trophy
                    className="h-12 w-12 mb-4 stagger-fade"
                    style={{
                      color: '#F59E0B',
                      filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.5))',
                      animationDelay: '0.1s',
                    }}
                  />

                  {/* Winner label */}
                  <p
                    className="text-xs font-semibold tracking-widest uppercase mb-1.5 stagger-fade text-muted-foreground"
                    style={{ animationDelay: '0.15s' }}
                  >
                    {t('winner_label')}
                  </p>

                  {/* Winner name */}
                  <h2
                    className="text-4xl font-black tracking-tight mb-5 break-words max-w-full px-2 leading-none stagger-fade text-foreground"
                    style={{ animationDelay: '0.2s' }}
                  >
                    {formatDisplayName(winner)}
                  </h2>

                  {/* Funny quote card */}
                  <div className="relative w-full max-w-[90%] mb-5 stagger-fade" style={{ animationDelay: '0.28s' }}>
                    <div
                      className="relative p-4 rounded-xl"
                      style={{
                        background: 'rgba(15,118,110,0.07)',
                        border: '1px solid rgba(15,118,110,0.18)',
                      }}
                    >
                      <p className="text-sm font-medium italic text-center leading-snug text-foreground">
                        "{funnyNote}"
                      </p>
                    </div>
                  </div>

                  {/* Screenshot hint */}
                  <div
                    className="flex items-center justify-center gap-2 rounded-full px-4 py-1.5 mb-7 stagger-fade"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      animationDelay: '0.35s',
                    }}
                  >
                    <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {t('screenshot_hint')}
                    </span>
                  </div>

                  {/* [UNTOUCHED] Spin Again button — logic unchanged */}
                  <div className="flex gap-4 w-full justify-center stagger-fade" style={{ animationDelay: '0.42s' }}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl font-semibold text-sm px-10 h-12 transition-all active:scale-95 border-border text-foreground hover:bg-accent"
                      onClick={() => {
                        // [UNTOUCHED] Original reset logic
                        setWinner(null);
                        setFunnyNote("");
                        setRotation(0);
                      }}
                    >
                      {t('spin_again')}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* ── ADD NAME INPUT ROW ──────────────────────────
                [UI] Teal focus border, clean add button.
                [UNTOUCHED] value, onChange, onKeyDown, addName() call. */}
            <div className="flex gap-3">
              <Input
                placeholder={t('add_name_placeholder')}
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addName()}
                className="h-12 rounded-xl text-foreground px-5 text-sm focus-visible:ring-1"
                style={{
                  borderColor: 'rgba(15,118,110,0.3)',
                }}
              />
              <Button
                onClick={addName}
                size="icon"
                className="h-12 w-12 rounded-xl transition-all shrink-0 active:scale-95 text-white"
                style={{
                  background: '#0F766E',
                  border: 'none',
                }}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            {/* ── NAME CHIPS ─────────────────────────────────
                [UI] Cleaner chips — colored left-border from chart colors, no neon glow.
                [UNTOUCHED] names.map, removeName, formatDisplayName, aria-label. */}
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto px-1 py-1 custom-scrollbar">
              {names.map((name, index) => (
                <div
                  key={index}
                  className="text-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2.5 group/name transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderLeftColor: COLORS[index % COLORS.length],
                    borderLeftWidth: '3px',
                  }}
                >
                  {formatDisplayName(name)}
                  {/* [UNTOUCHED] Remove button logic */}
                  <button
                    type="button"
                    onClick={() => removeName(index)}
                    aria-label={`Remove ${formatDisplayName(name)}`}
                    className="flex h-5 w-5 items-center justify-center rounded-md transition-all opacity-30 group-hover/name:opacity-80"
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>


          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillRoulette;
