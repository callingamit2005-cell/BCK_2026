import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Printer, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface ExportMenuProps {
  data: any[];
}

export const translations = {
   
  en: {
    export: "Export",
    csv: "Excel / CSV",
    csvDesc: "For Spreadsheet",
    pdf: "Print / PDF",
    pdfDesc: "Save as PDF",
    noData: "No data for this month",
    noDataDesc: "Add expenses to export",
  },

  hinglish: {
    export: "Export karo",
    csv: "Excel / CSV",
    csvDesc: "Spreadsheet ke liye",
    pdf: "Print / PDF",
    pdfDesc: "PDF me save karo",
    noData: "Is month koi data nahi hai",
    noDataDesc: "Export karne ke liye expenses add karo",
  },

  hi: {
    export: "निर्यात करें",
    csv: "एक्सेल / सीएसवी",
    csvDesc: "स्प्रेडशीट के लिए",
    pdf: "प्रिंट / पीडीएफ",
    pdfDesc: "पीडीएफ के रूप में सहेजें",
    noData: "इस महीने कोई डेटा नहीं",
    noDataDesc: "निर्यात के लिए खर्च जोड़ें",
  },

  pa: {
    export: "ਐਕਸਪੋਰਟ ਕਰੋ",
    csv: "ਐਕਸਲ / CSV",
    csvDesc: "ਸਪ੍ਰੈੱਡਸ਼ੀਟ ਲਈ",
    pdf: "ਪ੍ਰਿੰਟ / PDF",
    pdfDesc: "PDF ਵਜੋਂ ਸੇਵ ਕਰੋ",
    noData: "ਇਸ ਮਹੀਨੇ ਕੋਈ ਡਾਟਾ ਨਹੀਂ",
    noDataDesc: "ਐਕਸਪੋਰਟ ਲਈ ਖਰਚ ਜੋੜੋ",
  },

  gu: {
    export: "નિકાસ કરો",
    csv: "એક્સેલ / CSV",
    csvDesc: "સ્પ્રેડશીટ માટે",
    pdf: "પ્રિન્ટ / PDF",
    pdfDesc: "PDF તરીકે સેવ કરો",
    noData: "આ મહિને કોઈ ડેટા નથી",
    noDataDesc: "નિકાસ માટે ખર્ચ ઉમેરો",
  },

  mr: {
    export: "निर्यात करा",
    csv: "एक्सेल / CSV",
    csvDesc: "स्प्रेडशीटसाठी",
    pdf: "प्रिंट / PDF",
    pdfDesc: "PDF म्हणून सेव्ह करा",
    noData: "या महिन्यात डेटा नाही",
    noDataDesc: "निर्यातीसाठी खर्च जोडा",
  },

  bn: {
    export: "এক্সপোর্ট করুন",
    csv: "এক্সেল / CSV",
    csvDesc: "স্প্রেডশিটের জন্য",
    pdf: "প্রিন্ট / PDF",
    pdfDesc: "PDF হিসেবে সংরক্ষণ করুন",
    noData: "এই মাসে কোনো ডেটা নেই",
    noDataDesc: "এক্সপোর্টের জন্য খরচ যোগ করুন",
  },

  ta: {
    export: "ஏற்றுமதி",
    csv: "எக்செல் / CSV",
    csvDesc: "ஸ்பிரெட்ஷீட்டிற்காக",
    pdf: "அச்சிடு / PDF",
    pdfDesc: "PDF ஆக சேமிக்கவும்",
    noData: "இந்த மாதம் தரவு இல்லை",
    noDataDesc: "ஏற்றுமதிக்காக செலவுகள் சேர்க்கவும்",
  },

  te: {
    export: "ఎగుమతి",
    csv: "ఎక్సెల్ / CSV",
    csvDesc: "స్ప్రెడ్షీట్ కోసం",
    pdf: "ప్రింట్ / PDF",
    pdfDesc: "PDF గా సేవ్ చేయండి",
    noData: "ఈ నెల డేటా లేదు",
    noDataDesc: "ఎగుమతి కోసం ఖర్చులు జోడించండి",
  },

  kn: {
    export: "ರಫ್ತು",
    csv: "ಎಕ್ಸೆಲ್ / CSV",
    csvDesc: "ಸ್ಪ್ರೆಡ್‌ಶೀಟ್‌ಗಾಗಿ",
    pdf: "ಮುದ್ರಿಸಿ / PDF",
    pdfDesc: "PDF ಆಗಿ ಉಳಿಸಿ",
    noData: "ಈ ತಿಂಗಳು ಡೇಟಾ ಇಲ್ಲ",
    noDataDesc: "ರಫ್ತಿಗೆ ಖರ್ಚು ಸೇರಿಸಿ",
  },

  ml: {
    export: "കയറ്റുമതി",
    csv: "എക്സൽ / CSV",
    csvDesc: "സ്പ്രെഡ്ഷീറ്റിനായി",
    pdf: "പ്രിന്റ് / PDF",
    pdfDesc: "PDF ആയി സേവ് ചെയ്യുക",
    noData: "ഈ മാസം ഡാറ്റ ഇല്ല",
    noDataDesc: "കയറ്റുമതിക്കായി ചെലവുകൾ ചേർക്കുക",
  },

  or: {
    export: "ରପ୍ତାନି",
    csv: "ଏକ୍ସେଲ / CSV",
    csvDesc: "ସ୍ପ୍ରେଡଶିଟ୍ ପାଇଁ",
    pdf: "ପ୍ରିଣ୍ଟ / PDF",
    pdfDesc: "PDF ଭାବେ ସେଭ୍ କରନ୍ତୁ",
    noData: "ଏହି ମାସରେ ଡାଟା ନାହିଁ",
    noDataDesc: "ରପ୍ତାନି ପାଇଁ ଖର୍ଚ୍ଚ ଯୋଡନ୍ତୁ",
  },

  bho: {
    export: "एक्सपोर्ट करीं",
    csv: "एक्सेल / CSV",
    csvDesc: "स्प्रेडशीट खातिर",
    pdf: "प्रिंट / PDF",
    pdfDesc: "PDF में सेव करीं",
    noData: "ए महीना कवनो डेटा नइखे",
    noDataDesc: "एक्सपोर्ट खातिर खर्चा जोड़ल जाव",
  },

  mai: {
    export: "एक्सपोर्ट करू",
    csv: "एक्सेल / CSV",
    csvDesc: "स्प्रेडशीट लेल",
    pdf: "प्रिंट / PDF",
    pdfDesc: "PDF रूप में सेव करू",
    noData: "ई महीना किछु डेटा नहि",
    noDataDesc: "एक्सपोर्ट लेल खर्च जोड़ू",
  },

  sa: {
    export: "निर्यातयतु",
    csv: "एक्सेल / CSV",
    csvDesc: "स्प्रेडशीटाय",
    pdf: "मुद्रणम् / PDF",
    pdfDesc: "PDF रूपेण रक्षतु",
    noData: "अस्मिन् मासे किञ्चित् दत्तांशः नास्ति",
    noDataDesc: "निर्याताय व्ययम् योजयतु",
  },

  sat: {
    export: "ᱮᱠᱥᱯᱚᱨᱴ",
    csv: "Excel / CSV",
    csvDesc: "Spreadsheet ᱠᱟᱱ",
    pdf: "Print / PDF",
    pdfDesc: "PDF ᱨᱮ ᱥᱮᱵ",
    noData: "ᱮᱛᱟ ᱢᱟᱹᱦᱤᱛ ᱰᱟᱴᱟ ᱵᱟᱹᱱᱩᱜ ᱟ",
    noDataDesc: "ᱮᱠᱥᱯᱚᱨᱴ ᱠᱟᱱ ᱠᱚᱥᱛ ᱡᱚᱲᱟᱭ",
  },

};

const ExportMenu = ({ data }: ExportMenuProps) => {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const hasData = data && data.length > 0;
  const monthForFile = format(new Date(), "MMM-yyyy").toLowerCase();

  const handleExportCSV = () => {
    if (!hasData) {
      toast({ title: t.noData, description: t.noDataDesc, variant: "destructive" });
      return;
    }
    try {
      const headers = ["Date,Category,Amount,Mode,Note"];
      const rows = data.map(item => 
        `${format(new Date(item.date), "dd-MM-yyyy")},${item.category},${item.amount},${item.payment_mode},${item.note || "-"}`
      );
      const csvContent = [headers, ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `BachatKaro_${monthForFile}_Report.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const handlePrintPDF = () => {
    if (!hasData) {
      toast({ title: t.noData, description: t.noDataDesc, variant: "destructive" });
      return;
    }
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const tableRows = data.map(item => `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 12px; text-align: left;">${format(new Date(item.date), "dd/MM/yyyy")}</td>
          <td style="padding: 12px; text-align: left;">${item.category}</td>
          <td style="padding: 12px; text-align: left;">${item.payment_mode}</td>
          <td style="padding: 12px; text-align: left;">${item.note || "-"}</td>
          <td style="padding: 12px; text-align: right; font-weight: bold;">₹${item.amount}</td>
        </tr>
      `).join('');

      const content = `
        <html>
          <head>
            <title>BachatKaro Report</title>
            <style>
              body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; }
              h1 { color: #6d28d9; text-align: center; margin-bottom: 5px; }
              h2 { text-align: center; color: #4b5563; font-size: 18px; margin-top: 0; }
              p { text-align: center; color: #666; font-size: 14px; margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
              th { background-color: #f3f4f6; color: #111; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-weight: bold; }
              .amount-header { text-align: right; }
              .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
          </head>
          <body>
            <h1>BachatKaro Expense Report</h1>
            <h2>${format(new Date(), "MMMM yyyy")}</h2>
            <p>Generated on: ${format(new Date(), "dd MMM yyyy, h:mm a")}</p>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Mode</th>
                  <th>Note</th>
                  <th class="amount-header">Amount</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
            <div class="footer">Generated by BachatKaro App • Track your expenses smartly.</div>
          </body>
        </html>
      `;

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(content);
        doc.close();
        iframe.contentWindow?.focus();
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 2000);
        }, 500);
      }
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2 rounded-full border-purple-200 text-purple-700 hover:bg-purple-50 shadow-sm">
          <Download className="h-3.5 w-3.5" />
          <span className="font-bold text-xs">{t.export}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-white border-purple-100 shadow-xl rounded-xl p-1">
        <DropdownMenuItem 
          onClick={handleExportCSV} 
          className={`cursor-pointer rounded-lg py-2 px-3 mb-1 ${!hasData ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-50'}`}
          disabled={!hasData}
        >
          <FileText className="mr-2 h-4 w-4 text-green-600" />
          <div className="flex flex-col">
            <span className="font-bold text-sm">{t.csv}</span>
            <span className="text-[10px] text-gray-400">{t.csvDesc}</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handlePrintPDF} 
          className={`cursor-pointer rounded-lg py-2 px-3 ${!hasData ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-50'}`}
          disabled={!hasData}
        >
          <Printer className="mr-2 h-4 w-4 text-red-600" />
          <div className="flex flex-col">
            <span className="font-bold text-sm">{t.pdf}</span>
            <span className="text-[10px] text-gray-400">{t.pdfDesc}</span>
          </div>
        </DropdownMenuItem>
        {!hasData && (
          <div className="text-xs text-gray-400 px-3 py-2 flex items-center gap-1 border-t border-gray-100 mt-1">
            <AlertCircle className="h-3 w-3" />
            <span>{t.noDataDesc}</span>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportMenu;