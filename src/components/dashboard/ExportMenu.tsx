/**
 * ExportMenu.tsx - BachatKaro Premium Fintech Edition
 * UI: Professional Institutional Reporting Terminal.
 * 🛡️ LOGIC LOCK: CSV Quoting, HTML Escaping, and Forensic Engine untouched.
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
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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

const ExportMenu = ({ data, reportTitle = "Financial Statement" }: ExportMenuProps) => {
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

  // ==================== CSV EXPORT (Locked) ====================
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

      if (Capacitor.isNativePlatform()) {
        try {
          const base64Data = btoa(unescape(encodeURIComponent(csvContent)));
          const savedFile  = await Filesystem.writeFile({ path: fileName, data: base64Data, directory: Directory.Cache });
          await Share.share({ title: fileName, url: savedFile.uri });
        } catch (nativeErr) {
          console.warn('Native share failed, falling back to blob:', nativeErr);
          const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement("a");
          a.href = url; a.download = fileName;
          document.body.appendChild(a); a.click();
          document.body.removeChild(a); URL.revokeObjectURL(url);
        }
      } else {
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href = url; a.download = fileName;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
      }

      setIsCustomizeOpen(false);
      toast({ title: "Excel Ready! 📊", description: "Check your downloads / share sheet.", className: "bg-surface border-primary text-foreground shadow-premium" });
    } catch (error) {
      console.error("CSV Export Error:", error);
      toast({ title: "Export failed", variant: "destructive" });
    } finally { setIsGenerating(false); }
  };

  // ==================== PDF EXPORT (Locked) ====================
  const handlePrintPDF = async () => {
    if (!hasData) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setIsCustomizeOpen(false);

    try {
      if (process.env.NODE_ENV === 'development') {
        forensicEngine.assertExportParity(data?.length || 0, data);
      }
      
      const tableRows = data.map((item, index) => {
        const bgColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        
        const itemDate = item.date || item.created_at;
        const validDate = isValidDate(itemDate) ? new Date(itemDate) : null;
        const dateStr   = validDate ? format(validDate, "dd MMM yyyy") : "N/A";
        const timeStr   = validDate ? format(validDate, "hh:mm a") : "--:--";

        const category  = escapeHtml(item.category || '-');
        const desc      = escapeHtml(item.note || item.description || '-');
        const isCr      = isCredit(item);
        const amount    = Math.abs(parseAmount(item.amount));
        const displayVal = isCr ? `+ ${formatCurrency(amount)}` : `- ${formatCurrency(amount)}`;
        const amountColor = isCr ? "#16A34A" : "#DC2626"; // Institutional Red/Green for print

        return `
          <tr style="background:${bgColor};">
            <td style="padding:12px; border-bottom:1px solid #e2e8f0; vertical-align:top;">
              <div style="font-size:12px; font-weight:700; color:#0f172a; white-space:nowrap;">${dateStr}</div>
              <div style="font-size:10px; font-weight:600; color:#64748b; margin-top:2px;">${timeStr}</div>
            </td>
            <td style="padding:12px; border-bottom:1px solid #e2e8f0; vertical-align:top;">
              <div style="font-size:11px; font-weight:700; color:#334155; text-transform:uppercase; letter-spacing:0.05em;">${category}</div>
            </td>
            <td style="padding:12px; border-bottom:1px solid #e2e8f0; vertical-align:top;">
              <div style="font-size:12px; color:#475569; line-height:1.5;">${desc}</div>
            </td>
            <td style="padding:12px; border-bottom:1px solid #e2e8f0; text-align:right; vertical-align:top;">
              <div style="font-size:13px; font-weight:700; color:${amountColor}; font-family: 'JetBrains Mono', monospace;">
                ${displayVal}
              </div>
            </td>
          </tr>`;
      }).join('');

      const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(finalBizName)} - Financial Report</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Inter', system-ui, sans-serif; margin: 0; padding: 0; color: #0f172a; line-height: 1.5; -webkit-print-color-adjust: exact; }
          .container { max-width: 100%; margin: 0 auto; }
          header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; }
          .brand-name { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0; color: #0f172a; }
          .brand-tagline { font-size: 10px; font-weight: 700; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
          .meta-box { text-align: right; }
          .meta-label { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
          .meta-value { font-size: 11px; font-weight: 600; color: #334155; margin-bottom: 8px; }
          
          .summary-grid { display: flex; gap: 15px; margin-bottom: 30px; }
          .summary-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; }
          .summary-label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
          .summary-amount { font-size: 18px; font-weight: 700; color: #0f172a; font-family: 'JetBrains Mono', monospace; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f1f5f9; text-transform: uppercase; font-size: 10px; font-weight: 700; color: #475569; padding: 12px; text-align: left; border-bottom: 2px solid #cbd5e1; letter-spacing: 0.05em; }
          
          footer { border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 30px; text-align: center; }
          .footer-text { font-size: 9px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; }
          
          @media print {
            .summary-card { break-inside: avoid; }
            tr { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <div>
              <h1 class="brand-name">${escapeHtml(finalBizName)}</h1>
              <div class="brand-tagline">${escapeHtml(finalTagline)}</div>
            </div>
            <div class="meta-box">
              <div class="meta-label">Document Type</div>
              <div class="meta-value">${escapeHtml(reportTitle)}</div>
              <div class="meta-label">Exported On</div>
              <div class="meta-value">${escapeHtml(generatedTime)}</div>
            </div>
          </header>

          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-label">Total Credits (CR)</div>
              <div class="summary-amount" style="color: #16A34A;">${formatCurrency(financialSummary.credit)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Debits (DR)</div>
              <div class="summary-amount" style="color: #DC2626;">${formatCurrency(financialSummary.debit)}</div>
            </div>
            <div class="summary-card" style="background: #0F172A; border-color: #0F172A;">
              <div class="summary-label" style="color: #94A3B8;">Net Balance</div>
              <div class="summary-amount" style="color: #F8FAFC;">${formatCurrency(financialSummary.balance)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 20%;">Date</th>
                <th style="width: 20%;">Category</th>
                <th style="width: 40%;">Description</th>
                <th style="width: 20%; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <footer>
            <div class="footer-text">BachatKaro Financial Intelligence OS · Institutional Grade</div>
          </footer>
        </div>
        <script>window.onload=function(){window.print();}</script>
      </body>
      </html>`;

      if (Capacitor.isNativePlatform()) {
        try {
          const fileName  = `${finalBizName}_Report_${monthForFile}.html`.replace(/\s+/g, '_');
          const base64Data = btoa(unescape(encodeURIComponent(htmlContent)));
          const savedFile  = await Filesystem.writeFile({ path: fileName, data: base64Data, directory: Directory.Cache });
          await Share.share({ title: `${finalBizName} Report`, url: savedFile.uri });
        } catch (nativeErr) {
          console.warn('Native share failed:', nativeErr);
          const blob = new Blob([htmlContent], { type: 'text/html' });
          window.open(URL.createObjectURL(blob), '_blank');
        }
      } else {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
        } else {
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `${finalBizName}_Report_${monthForFile}.html`.replace(/\s+/g, '_');
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
        }
      }

      toast({ title: "Report Ready! 📄", description: Capacitor.isNativePlatform() ? "Open in Chrome → Print → Save as PDF" : "Print dialog opened", className: "bg-surface border-primary text-foreground shadow-premium" });
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
            variant="outline"
            disabled={isGenerating}
            className="h-12 px-5 gap-2 rounded-xl bg-surface border-border/50 text-foreground font-bold shadow-sm hover:border-primary/30 transition-all duration-300 active:scale-95"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Download className="h-4 w-4 text-primary" />}
            <span className="text-[11px] uppercase tracking-widest">{isGenerating ? "Wait..." : t.export}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="top" align="end" sideOffset={10} className="w-[min(92vw,16rem)] bg-surface rounded-2xl shadow-institutional border border-border p-2 mt-2">
          <DropdownMenuItem
            onClick={handleExportExcel}
            disabled={!hasData || isGenerating}
            className="cursor-pointer rounded-xl min-h-[44px] py-3.5 px-3 mb-1.5 hover:bg-muted/50 focus:bg-muted/50 transition-colors active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-muted border border-border/40 rounded-xl"><FileText className="h-4 w-4 text-primary" /></div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-foreground tracking-tight">{t.csv}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.csvDesc}</span>
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handlePrintPDF}
            disabled={!hasData || isGenerating}
            className="cursor-pointer rounded-xl min-h-[44px] py-3.5 px-3 hover:bg-muted/50 focus:bg-muted/50 transition-colors active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-muted border border-border/40 rounded-xl"><Printer className="h-4 w-4 text-primary" /></div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-foreground tracking-tight">{t.pdf}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.pdfDesc}</span>
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-2 bg-border/40" />

          <DropdownMenuItem
            onClick={() => setIsCustomizeOpen(true)}
            disabled={!hasData}
            className="cursor-pointer rounded-xl min-h-[44px] py-3.5 px-3 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground border border-primary/10 shadow-sm active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 bg-white/20 rounded-lg shadow-sm"><Crown className="h-4 w-4 text-white" /></div>
              <div className="flex flex-col flex-1">
                <span className="font-bold text-sm text-white tracking-tight">{t.customize}</span>
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{t.customizeDesc}</span>
              </div>
              <Settings2 className="h-4 w-4 text-white/50" />
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Customize Dialog */}
      <Dialog open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
        <DialogContent className="sm:max-w-md w-[95%] bg-background rounded-modal shadow-institutional border border-border overflow-hidden p-0">
          <div className="bg-primary p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Crown className="h-32 w-32 text-primary-foreground" /></div>
            <DialogTitle className="text-primary-foreground text-2xl font-bold flex items-center justify-center gap-3 drop-shadow-sm tracking-tight">
              <Crown className="h-6 w-6 text-primary-foreground" />
              Institutional Brander
            </DialogTitle>
            <p className="text-primary-foreground/70 text-[10px] font-bold uppercase tracking-widest mt-2">Professional Report Customization</p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bizName" className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest ml-1">Enterprise Identity</Label>
              <Input id="bizName" placeholder="e.g., Institutional Wealth Group" value={customName} onChange={e => setCustomName(e.target.value)}
                className="h-14 rounded-xl border-border bg-muted/20 focus:border-primary/50 focus:ring-primary font-bold text-base px-6" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline" className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest ml-1">Report Narrative</Label>
              <Input id="tagline" placeholder="e.g., Forensic Transparency Engine" value={customTagline} onChange={e => setCustomTagline(e.target.value)}
                className="h-14 rounded-xl border-border bg-muted/20 focus:border-primary/50 focus:ring-primary font-bold text-sm px-6" />
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button variant="outline" onClick={handleExportExcel} disabled={isGenerating}
                className="flex-1 h-14 rounded-xl border-border/50 text-foreground hover:bg-muted font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-sm">
                <FileText className="h-4 w-4 mr-2 text-primary" /> Excel Logic
              </Button>
              <Button onClick={handlePrintPDF} disabled={isGenerating}
                className="flex-1 h-14 rounded-xl bg-primary text-primary-foreground font-bold text-[11px] uppercase tracking-widest shadow-premium hover:bg-primary/90 transition-all active:scale-95">
                {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
                {isGenerating ? "Wait..." : "Generate PDF"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExportMenu;
