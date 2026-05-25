/**
 * ExportMenu.tsx - BachatKaro Enterprise Edition
 * UI: High-Contrast Light Mode with Signature Purple/Pink & Gold Pro Gradients.
 * 🛡️ LOGIC LOCK: CSV Quoting, HTML Escaping untouched.
 * ✅ FIX: PDF via window.print() (no html2pdf.js dependency), CSV blob fallback.
 */

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileText, Printer, Settings2, Crown, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { isValidDate } from "@/utils/dateFilters";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currencyFormatter";
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { forensicEngine } from '@/test/forensic/validationSuite';

interface ExportMenuProps {
  data: any[];
  reportTitle?: string;
}

export const translations = {
  en: { export: "Export", csv: "Excel / CSV", csvDesc: "Spreadsheet with Summary", pdf: "Print / PDF", pdfDesc: "High-Fidelity Report", noData: "No data for this month", noDataDesc: "Add data to export", total: "Total Amount", customize: "Customize (Pro)", customizeDesc: "Add your branding" },
  hinglish: { export: "Export karo", csv: "Excel / CSV", csvDesc: "Summary ke saath", pdf: "Print / PDF", pdfDesc: "High-Fidelity Report", noData: "Is month koi data nahi hai", noDataDesc: "Export karne ke liye add karo", total: "Total Amount", customize: "Customize (Pro)", customizeDesc: "Apna naam aur tagline dalein" },
  hi: { export: "निर्यात करें", csv: "एक्सेल / सीएसवी", csvDesc: "सारांश के साथ", pdf: "प्रिंट / पीडीएफ", pdfDesc: "हाई-फिडेलिटी रिपोर्ट", noData: "इस महीने कोई डेटा नहीं", noDataDesc: "निर्यात के लिए जोड़ें", total: "कुल राशि", customize: "कस्टमाइज़ (Pro)", customizeDesc: "अपना नाम जोड़ें" },
};

const parseAmount = (value: any): number => {
  if (value == null) return 0;
  const num = parseFloat(String(value).replace(/,/g, ''));
  return isNaN(num) ? 0 : num;
};

const escapeHtml = (text: string): string => {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
};

const applePhysics = "transition-all duration-300 ease-in-out active:scale-[0.965] touch-action-manipulation";

const ExportMenu = ({ data, reportTitle = "Financial Statement" }: ExportMenuProps) => {
  console.log('[ExportMenu_Received_Count]', data?.length);
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isGenerating, setIsGenerating]       = useState(false);
  const [customName, setCustomName]           = useState("");
  const [customTagline, setCustomTagline]     = useState("");

  const hasData      = data && data.length > 0;
  const monthForFile = format(new Date(), "MMM-yyyy").toLowerCase();

  const INCOME_CATEGORIES = ["Salary", "Income", "Bonus", "Refund"];
  const isCredit = (item: any) => {
    if (item?.direction) return item.direction === 'credit';
    if (item?.type) return item.type === 'income';
    return INCOME_CATEGORIES.includes(item?.category);
  };

  const financialSummary = useMemo(() => {
    if (!Array.isArray(data)) return { credit: 0, debit: 0, balance: 0 };
    const credit = data.filter(i => i && isCredit(i)).reduce((s, i) => s + Math.abs(parseAmount(i.amount)), 0);
    const debit  = data.filter(i => i && !isCredit(i)).reduce((s, i) => s + Math.abs(parseAmount(i.amount)), 0);
    return { credit, debit, balance: credit - debit };
  }, [data]);

  const totalTransactions = data?.length ?? 0;
  const generatedTime     = format(new Date(), "dd MMM yyyy, hh:mm a");
  const finalBizName      = customName.trim()    || "BachatKaro";
  const finalTagline      = customTagline.trim() || "बचत करो, सपने पूरे करो ✨";

  // ==================== CSV EXPORT ====================
  const handleExportExcel = async () => {
    if (!hasData) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const fileName = `${finalBizName}_Summary_${monthForFile}.csv`.replace(/\s+/g, '_');

      const summaryBlock = [
        `"${finalBizName} ${reportTitle}"`,
        `"${finalTagline}"`,
        `""`,
        `"Generated On:","${generatedTime}"`,
        `"Total Transactions:","${totalTransactions}"`,
        `""`
      ].join("\n");

      const headers = ["Date & Time", "Category", "Description", "Type", "Amount (INR)"].join(",");

      const dataStartRow = 8;
      const dataEndRow   = dataStartRow + totalTransactions - 1;

      const rows = data.map(item => {
        const itemDate = item.date || item.created_at;
        const dateTime = isValidDate(itemDate) 
          ? `"${format(new Date(itemDate), "dd-MM-yyyy hh:mm a")}"`
          : "\"N/A\"";
        const category  = `"${item.category || '-'}"`;
        const note      = `"${(item.note || item.description || '-').replace(/"/g, '""')}"`;
        const isCr      = isCredit(item);
        const type      = `"${isCr ? 'CR' : 'DR'}"`;
        const amount    = Math.abs(parseAmount(item.amount));
        const rawAmount = Number.isInteger(amount) ? (amount / 100).toFixed(2) : Number(amount).toFixed(2);
        return `${dateTime},${category},${note},${type},${rawAmount}`;
      });

      const excelSummary = [
        `""`,
        `"--- FINANCIAL RECAP ---"`,
        `"TOTAL CREDIT (CR)","=SUMIF(D${dataStartRow}:D${dataEndRow},""CR"",E${dataStartRow}:E${dataEndRow})"`,
        `"TOTAL DEBIT (DR)","=SUMIF(D${dataStartRow}:D${dataEndRow},""DR"",E${dataStartRow}:E${dataEndRow})"`,
        `"NET BALANCE","=B${dataEndRow + 3}-B${dataEndRow + 4}"`
      ].join("\n");

      const csvContent = [summaryBlock, headers, ...rows, excelSummary].join("\n");

      // ✅ Android native: write to cache + share
      if (Capacitor.isNativePlatform()) {
        try {
          const base64Data = btoa(unescape(encodeURIComponent(csvContent)));
          const savedFile  = await Filesystem.writeFile({ path: fileName, data: base64Data, directory: Directory.Cache });
          await Share.share({ title: fileName, url: savedFile.uri });
        } catch (nativeErr) {
          console.warn('Native share failed, falling back to blob:', nativeErr);
          // Fallback: blob download
          const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement("a");
          a.href = url; a.download = fileName;
          document.body.appendChild(a); a.click();
          document.body.removeChild(a); URL.revokeObjectURL(url);
        }
      } else {
        // Web: blob download
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href = url; a.download = fileName;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
      }

      setIsCustomizeOpen(false);
      toast({ title: "Excel Ready! 📊", description: "Check your downloads / share sheet.", className: "bg-emerald-600 text-white" });
    } catch (error) {
      console.error("CSV Export Error:", error);
      toast({ title: "Export failed", variant: "destructive" });
    } finally { setIsGenerating(false); }
  };

  // ==================== PDF EXPORT ====================
  // ✅ FIX: No html2pdf.js dependency.
  // Web: opens print window (user saves as PDF).
  // Android: writes HTML file to cache and shares it (user opens in browser → print → PDF).
  const handlePrintPDF = async () => {
    if (!hasData) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setIsCustomizeOpen(false);

    try {
      // 🛡️ [EXPORT_FORENSIC] Verify dataset completeness before generation
      if (process.env.NODE_ENV === 'development') {
        forensicEngine.assertExportParity(data?.length || 0, data);
      }
      
      console.log(
        '[EXPORT_FORENSIC]',
        JSON.stringify(
          {
            exportCount: data?.length,
            firstRowDate: data?.[0]?.date,
            lastRowDate: data?.[data.length - 1]?.date,
            firstRowCategory: data?.[0]?.category,
            lastRowCategory: data?.[data.length - 1]?.category,
          },
          null,
          2
        )
      );

      const tableRows = data.map((item, index) => {
        const bgColor   = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        
        // 🛡️ [RUNTIME_STABILIZATION] Safe Date Formatting
        // Prevents RangeError from aborting the mapping of subsequent rows
        const itemDate = item.date || item.created_at;
        const validDate = isValidDate(itemDate) ? new Date(itemDate) : null;
        const dateStr   = validDate ? format(validDate, "dd MMM yyyy") : "Date Unavailable";
        const timeStr   = validDate ? format(validDate, "hh:mm a") : "--:--";

        const category  = escapeHtml(item.category || '-');
        const desc      = escapeHtml(item.note || item.description || '-');
        const isCr      = isCredit(item);
        const amount    = Math.abs(parseAmount(item.amount));
        const displayVal = isCr ? `+ ${formatCurrency(amount)}` : `- ${formatCurrency(amount)}`;
        const color     = isCr ? "#16a34a" : "#dc2626";
        return `<tr style="background:${bgColor}">
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-family:monospace">${dateStr}<br/><span style="color:#64748b;font-size:10px">${timeStr}</span></td>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-weight:600">${category}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:11px">${desc}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:800;color:${color}">${displayVal}</td>
        </tr>`;
      }).join('');

      const htmlContent = `<!DOCTYPE html><html><head>
        <meta charset="UTF-8"/>
        <title>${escapeHtml(finalBizName)} Report</title>
        <style>
          body{font-family:Arial,sans-serif;margin:0;padding:20px;color:#334155}
          table{width:100%;border-collapse:collapse}
          th{background:#f1f5f9;text-transform:uppercase;font-size:11px;font-weight:800;color:#475569;padding:12px 14px;text-align:left;border-bottom:2px solid #cbd5e1}
          @media print{body{padding:0} .no-print{display:none}}
        </style>
      </head><body>
        <div style="background:linear-gradient(135deg,#7c3aed,#ec4899);color:white;padding:24px;border-radius:16px;text-align:center;margin-bottom:24px">
          <h1 style="margin:0;font-size:24px;font-weight:900">${escapeHtml(finalBizName)} ${escapeHtml(reportTitle)}</h1>
          <div style="font-size:13px;opacity:0.9;margin-top:6px">"${escapeHtml(finalTagline)}"</div>
          <div style="font-size:11px;opacity:0.7;margin-top:4px">Generated: ${escapeHtml(generatedTime)}</div>
        </div>
        <table>
          <thead><tr><th>Date</th><th>Category</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        <div style="margin-top:24px;padding:20px;border-radius:16px;background:#fdf2f8;border:2px solid #fce7f3">
          <div style="font-size:11px;font-weight:900;color:#ec4899;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px">📊 Final Summary</div>
          <div style="display:flex;justify-content:space-between;border-bottom:1px dashed #f9a8d4;padding-bottom:8px;margin-bottom:8px">
            <span style="color:#64748b;font-weight:600">Total In (Credit)</span>
            <span style="font-weight:800;color:#059669">${formatCurrency(financialSummary.credit)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;border-bottom:1px dashed #f9a8d4;padding-bottom:8px;margin-bottom:8px">
            <span style="color:#64748b;font-weight:600">Total Out (Debit)</span>
            <span style="font-weight:800;color:#be123c">${formatCurrency(financialSummary.debit)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding-top:8px">
            <span style="font-weight:900;color:#1e1b4b">Net Balance</span>
            <span style="font-weight:900;color:#1e1b4b;font-size:18px">${formatCurrency(financialSummary.balance)}</span>
          </div>
        </div>
        <div style="margin-top:40px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px">
          Generated via BachatKaro Intelligence
        </div>
        <script>window.onload=function(){window.print()}</script>
      </body></html>`;

      if (Capacitor.isNativePlatform()) {
        // Android: write HTML to cache, share — user opens in Chrome → Print → Save as PDF
        try {
          const fileName  = `${finalBizName}_Report_${monthForFile}.html`.replace(/\s+/g, '_');
          const base64Data = btoa(unescape(encodeURIComponent(htmlContent)));
          const savedFile  = await Filesystem.writeFile({ path: fileName, data: base64Data, directory: Directory.Cache });
          await Share.share({ title: `${finalBizName} Report`, url: savedFile.uri });
        } catch (nativeErr) {
          console.warn('Native share failed:', nativeErr);
          // Final fallback: open blob in new tab
          const blob = new Blob([htmlContent], { type: 'text/html' });
          window.open(URL.createObjectURL(blob), '_blank');
        }
      } else {
        // Web: open print window directly
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
        } else {
          // Popup blocked fallback
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `${finalBizName}_Report_${monthForFile}.html`.replace(/\s+/g, '_');
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
        }
      }

      toast({ title: "Report Ready! 📄", description: Capacitor.isNativePlatform() ? "Open in Chrome → Print → Save as PDF" : "Print dialog opened", className: "bg-emerald-600 text-white" });
    } catch (error) {
      console.error("PDF Export Failed:", error);
      toast({ title: "Failed to generate report", variant: "destructive" });
    } finally { setIsGenerating(false); }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isGenerating}
            className={cn(
              "h-11 min-w-[44px] px-5 gap-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-black shadow-lg hover:shadow-xl hover:scale-[1.03] uppercase tracking-widest text-[10px] touch-manipulation",
              applePhysics
            )}
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span>{isGenerating ? "Wait..." : t.export}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="top" align="end" sideOffset={10} className="w-[min(92vw,16rem)] bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 mt-2">
          <DropdownMenuItem
            onClick={handleExportExcel}
            disabled={!hasData || isGenerating}
            className={cn("cursor-pointer rounded-xl min-h-[44px] py-3.5 px-3 mb-1.5 hover:bg-purple-50 focus:bg-purple-50", applePhysics)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl"><FileText className="h-4 w-4 text-emerald-600" /></div>
              <div className="flex flex-col">
                <span className="font-black text-sm text-slate-800 tracking-tight">{t.csv}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t.csvDesc}</span>
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handlePrintPDF}
            disabled={!hasData || isGenerating}
            className={cn("cursor-pointer rounded-xl min-h-[44px] py-3.5 px-3 hover:bg-pink-50 focus:bg-pink-50", applePhysics)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 rounded-xl"><Printer className="h-4 w-4 text-rose-600" /></div>
              <div className="flex flex-col">
                <span className="font-black text-sm text-slate-800 tracking-tight">{t.pdf}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t.pdfDesc}</span>
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-2 bg-slate-100" />

          <DropdownMenuItem
            onClick={() => setIsCustomizeOpen(true)}
            disabled={!hasData}
            className={cn("cursor-pointer rounded-xl min-h-[44px] py-4 px-3 bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-100", applePhysics)}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 bg-amber-500 text-white rounded-lg shadow-sm"><Crown className="h-4 w-4" /></div>
              <div className="flex flex-col flex-1">
                <span className="font-black text-[13px] text-amber-900 tracking-tight">{t.customize}</span>
                <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">{t.customizeDesc}</span>
              </div>
              <Settings2 className="h-4 w-4 text-amber-500" />
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Customize Dialog */}
      <Dialog open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
        <DialogContent className="sm:max-w-md w-[95%] bg-white rounded-[32px] shadow-2xl border-0 overflow-hidden p-0">
          <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Crown className="h-32 w-32 text-white" /></div>
            <DialogTitle className="text-white text-2xl font-black flex items-center justify-center gap-3 drop-shadow-md">
              <Crown className="h-7 w-7 text-yellow-200" />
              PRO BRANDER
            </DialogTitle>
            <p className="text-amber-50 text-xs font-black uppercase tracking-[0.2em] mt-3 opacity-90">Custom Report Engine</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="bizName" className="text-slate-500 font-black text-[10px] uppercase tracking-widest ml-1">Business Name</Label>
              <Input id="bizName" placeholder="e.g., Amit's Wealth Agency" value={customName} onChange={e => setCustomName(e.target.value)}
                className="h-14 rounded-2xl border-slate-200 focus:border-amber-500 font-bold text-lg" />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="tagline" className="text-slate-500 font-black text-[10px] uppercase tracking-widest ml-1">Report Tagline</Label>
              <Input id="tagline" placeholder="e.g., Building wealth, one step at a time!" value={customTagline} onChange={e => setCustomTagline(e.target.value)}
                className="h-14 rounded-2xl border-slate-200 focus:border-amber-500 font-bold" />
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button variant="outline" onClick={handleExportExcel} disabled={isGenerating}
                className={cn("flex-1 h-14 rounded-2xl border-amber-200 text-amber-700 hover:bg-amber-50 font-black text-xs uppercase tracking-widest", applePhysics)}>
                <FileText className="h-4 w-4 mr-2" /> Excel Pro
              </Button>
              <Button onClick={handlePrintPDF} disabled={isGenerating}
                className={cn("flex-1 h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs uppercase tracking-widest shadow-lg", applePhysics)}>
                {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
                {isGenerating ? "Wait..." : "Print PDF"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExportMenu;
