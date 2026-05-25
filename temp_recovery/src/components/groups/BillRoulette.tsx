/* =========================================================
UI + LOGIC LOCK: VIRAL SHARE FIXED 🛠️
- Fixed "Share Button" not working on Desktop (Added Copy Fallback).
- Highlighted "Take Screenshot" text with Glow & Animation.
- Kept 100+ "Bill-ified" messages.
========================================================= */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dices, Trophy, Trash2, Plus, Users, Share2, Camera, Copy } from "lucide-react";

// Enterprise Color Palette
const COLORS = [
  "#E11D48", "#2563EB", "#D97706", "#059669", "#7C3AED", "#DB2777", "#475569", "#0891B2"
];

// 😂 100+ "BILL-IFIED" FUNNY MESSAGES
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

interface Member {
  id: string;
  name: string;
}

interface BillRouletteProps {
  members?: Member[];
}

const BillRoulette = ({ members = [] }: BillRouletteProps) => {
  const [names, setNames] = useState<string[]>([]);
  const [inputName, setInputName] = useState('');
  const [winner, setWinner] = useState<string | null>(null);
  const [funnyNote, setFunnyNote] = useState<string>(""); 
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  // Auto-Populate Logic
  useEffect(() => {
    if (members && members.length > 0) {
      const memberNames = members.map(m => m.name.trim()).filter(n => n.length > 0);
      setNames([...new Set(memberNames)]);
    }
  }, [members]);

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
    if (fullName.includes('@')) {
      return fullName.split('@')[0];
    }
    return fullName;
  };

  // ✅ IMPROVED SOCIAL SHARE LOGIC (Desktop + Mobile Support)
  const handleShare = async () => {
    const shareText = `🎡 *BachatKaro Bill Roulette* 🎡\n\n🏆 Aaj ka Bakra: *${winner}* 🐐\n💬 Message: _"${funnyNote}"_\n\nBachna hai toh download karo *BachatKaro App*! 👇\n[YOUR_APP_LINK_HERE]`;
    
    if (navigator.share) {
      // Mobile / Supported Browsers
      try {
        await navigator.share({
          title: 'BachatKaro Bill Winner',
          text: shareText,
          url: window.location.href 
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Desktop Fallback (Clipboard Copy)
      try {
        await navigator.clipboard.writeText(shareText);
        alert("📋 Text copied! WhatsApp/Instagram par paste karein.");
      } catch (err) {
        alert("Failed to copy. Please take a screenshot manually.");
      }
    }
  };

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

  const renderWheel = () => {
    const total = names.length;
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`} 
        style={{ 
          transform: `rotate(${rotation}deg)`, 
          transition: isSpinning ? 'transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
          filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))'
        }}
      >
        {names.map((name, i) => {
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
              <path d={pathData} fill={COLORS[i % COLORS.length]} stroke="white" strokeWidth="2" />
              <text 
                x={tx} y={ty} 
                fill="white" fontSize={fontSize} fontFamily="Arial, sans-serif" fontWeight="bold"
                textAnchor="middle" alignmentBaseline="middle" transform={`rotate(${rotateAngle}, ${tx}, ${ty})`}
                style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.4)" }}
              >
                {displayName.length > 10 ? displayName.substring(0, 8) + '..' : displayName}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full sm:w-auto bg-white border-pink-200 text-pink-700 hover:bg-pink-50 hover:text-pink-800 gap-2 font-bold shadow-sm rounded-full h-10"
        >
          <Dices className="h-5 w-5" /> 
          <span>Spin Wheel</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="w-[95%] sm:max-w-md bg-white rounded-2xl border-0 shadow-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
            🎡 Kismat Ka Wheel
          </DialogTitle>
          <p className="text-center text-gray-500 text-xs">Members auto-loaded from group</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          
          {/* WHEEL AREA */}
          <div className="relative h-[300px] w-full flex items-center justify-center bg-gray-50/50 rounded-xl overflow-hidden mb-2">
            
            {names.length > 1 ? renderWheel() : (
              <div className="text-center text-gray-400 p-8 flex flex-col items-center">
                 <Users className="h-12 w-12 mb-2 opacity-20" />
                 <p className="font-medium">Waiting for members...</p>
                 <p className="text-xs mt-1">Add at least 2 members to the group first!</p>
              </div>
            )}

            {names.length > 1 && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 filter drop-shadow-lg">
                <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-gray-800"></div>
              </div>
            )}

            {/* WINNER OVERLAY */}
            {winner && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center animate-in fade-in duration-500 z-20 backdrop-blur-sm px-4 text-center">
                <Trophy className="h-12 w-12 text-yellow-400 mb-2 animate-bounce drop-shadow-lg" />
                
                <p className="text-gray-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-1">And the bakra is</p>
                
                <h2 className="text-4xl font-black text-white tracking-wider drop-shadow-[0_2px_4px_rgba(255,255,255,0.4)] mb-4 break-words max-w-full px-2">
                  {formatDisplayName(winner)}
                </h2>

                {/* 🎨 GRADIENT TEXT */}
                <div className="relative w-full max-w-[90%] mb-4">
                   <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 blur-xl opacity-50 animate-pulse"></div>
                   <div className="relative bg-gray-900/80 p-4 rounded-xl border border-white/10 backdrop-blur-xl shadow-2xl">
                     <p className="text-xl md:text-2xl font-black italic text-center leading-tight bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 text-transparent bg-clip-text drop-shadow-sm">
                       "{funnyNote}"
                     </p>
                   </div>
                </div>

                {/* 📸 HIGHLIGHTED SCREENSHOT HINT */}
                <div className="flex items-center justify-center gap-2 bg-yellow-500/20 border border-yellow-500/50 rounded-full px-4 py-2 mb-6 shadow-[0_0_10px_rgba(234,179,8,0.3)] animate-pulse">
                   <Camera className="h-5 w-5 text-yellow-300" />
                   <span className="text-yellow-100 font-bold text-sm tracking-wide drop-shadow-sm">Take a screenshot & share!</span>
                </div>

                {/* ACTIONS ROW */}
                <div className="flex gap-3 w-full justify-center">
                    <Button 
                      size="sm" 
                      onClick={handleShare}
                      className="rounded-full bg-green-600 hover:bg-green-700 text-white font-bold gap-2 px-6 shadow-lg hover:scale-105 transition-transform"
                    >
                      <Share2 className="h-4 w-4" /> Share
                    </Button>

                    <Button 
                      size="sm" 
                      variant="outline"
                      className="rounded-full bg-white/10 text-white hover:bg-white/20 border-white/20 font-bold px-6" 
                      onClick={() => setWinner(null)}
                    >
                      Spin Again
                    </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Input 
              placeholder="Add extra name..." 
              value={inputName} 
              onChange={(e) => setInputName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addName()}
              className="rounded-full border-gray-200 focus:ring-pink-500 font-medium"
            />
            <Button onClick={addName} size="icon" className="bg-pink-600 hover:bg-pink-700 rounded-full shrink-0 shadow-md">
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto px-1 py-1">
            {names.map((name, index) => (
              <div key={index} 
                className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm"
                style={{ borderLeftColor: COLORS[index % COLORS.length], borderLeftWidth: '4px' }}
              >
                {formatDisplayName(name)}
                <button onClick={() => removeName(index)} className="text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <Button 
            onClick={handleSpin} 
            disabled={isSpinning || names.length < 2}
            className="w-full py-5 text-lg font-black tracking-wide bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 text-white rounded-xl shadow-xl transition-all active:scale-95 disabled:opacity-50"
          >
            {isSpinning ? "Spinning..." : "SPIN THE WHEEL 🎲"}
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillRoulette;
