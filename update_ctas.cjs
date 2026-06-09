const fs = require('fs');
let content = fs.readFileSync('src/pages/SetupWizard.tsx', 'utf8');

content = content.split('className="flex gap-4 pt-2"').join('className="flex flex-col gap-3 pt-2"');

const oldPrimaryBtn1 = 'className="flex-[2] h-14 bg-primary text-primary-foreground rounded-xl font-bold shadow-premium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 uppercase text-[10px] tracking-widest"';
const oldPrimaryBtn2 = 'className="flex-[2] h-14 bg-primary text-primary-foreground rounded-xl font-bold shadow-premium hover:opacity-90 transition-all active:scale-95 uppercase text-[10px] tracking-widest"';
const newPrimaryBtn = 'className="w-full h-[52px] mt-2 bg-primary text-primary-foreground rounded-xl font-bold uppercase text-[11px] tracking-widest shadow-premium active:scale-[0.98] transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"';

content = content.split(oldPrimaryBtn1).join(newPrimaryBtn);
content = content.split(oldPrimaryBtn2).join(newPrimaryBtn);

const oldBackBtn = 'className="flex-1 h-14 rounded-xl font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all uppercase text-[10px] tracking-widest border border-border/50 shadow-sm active:scale-95"';
const newBackBtn = 'className="w-full h-[52px] rounded-xl font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all uppercase text-[11px] tracking-widest border border-border/50 shadow-sm active:scale-[0.98]"';

content = content.split(oldBackBtn).join(newBackBtn);

fs.writeFileSync('src/pages/SetupWizard.tsx', content);
console.log('Done replacing CTAs');
