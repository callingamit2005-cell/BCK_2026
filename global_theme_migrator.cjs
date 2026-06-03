
const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

console.log("Starting Global Theme Migration...");

let filesModified = 0;

walkDir('./src', (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // 1. Eradicate Hardcoded Radii
    content = content.replace(/rounded-\[24px\]/g, 'rounded-premium');
    content = content.replace(/rounded-\[28px\]/g, 'rounded-premium');
    content = content.replace(/rounded-\[32px\]/g, 'rounded-modal');
    content = content.replace(/rounded-\[40px\]/g, 'rounded-modal');
    
    // 2. Eradicate Hardcoded Backgrounds
    content = content.replace(/bg-\[#1a1a1a\]/gi, 'bg-surface');
    content = content.replace(/bg-\[#111111\]/gi, 'bg-foreground');
    content = content.replace(/bg-\[#0D0D0E\]/gi, 'bg-background');
    content = content.replace(/bg-\[#0a0014\]/gi, 'bg-background');
    content = content.replace(/bg-\[#0D0B14\]/gi, 'bg-background');
    content = content.replace(/!bg-\[#0a0014\]/gi, 'bg-background');
    content = content.replace(/bg-white\b/g, 'bg-surface');
    content = content.replace(/bg-slate-50\b/g, 'bg-background');
    
    // 3. Eradicate Hardcoded Text Colors
    content = content.replace(/text-\[#666666\]/gi, 'text-text-muted');
    content = content.replace(/text-\[#999999\]/gi, 'text-text-muted');
    content = content.replace(/text-\[#b3b3b3\]/gi, 'text-text-secondary');
    content = content.replace(/text-\[#111111\]/gi, 'text-foreground');
    content = content.replace(/text-\[#525252\]/gi, 'text-text-muted');
    content = content.replace(/text-slate-900\b/g, 'text-foreground');
    content = content.replace(/text-slate-600\b/g, 'text-text-secondary');
    content = content.replace(/text-slate-500\b/g, 'text-text-muted');
    content = content.replace(/text-slate-400\b/g, 'text-text-muted');
    
    // 4. Eradicate Neon / Legacy Accents -> Institutional
    content = content.replace(/text-\[#ff0f7b\]/gi, 'text-institutional-blue');
    content = content.replace(/!text-\[#ff0f7b\]/gi, 'text-institutional-blue');
    content = content.replace(/bg-\[#ff0f7b\]/gi, 'bg-institutional-blue');
    content = content.replace(/border-\[#ff0f7b\]\/[0-9]+/gi, 'border-institutional-blue/20');
    content = content.replace(/border-\[#ff0f7b\]/gi, 'border-institutional-blue');
    content = content.replace(/from-\[#ff0f7b\]/gi, 'from-institutional-blue');
    content = content.replace(/to-\[#ff0f7b\]/gi, 'to-institutional-blue');
    content = content.replace(/to-\[#5f0a87\]/gi, 'to-institutional-indigo');
    content = content.replace(/from-\[#6C4DFF\]/gi, 'from-institutional-indigo');
    content = content.replace(/to-\[#E14DFF\]/gi, 'to-institutional-indigo');
    
    // Standardize Tailwind generic colors
    content = content.replace(/text-pink-500/gi, 'text-institutional-blue');
    content = content.replace(/text-purple-500/gi, 'text-institutional-indigo');
    content = content.replace(/bg-pink-500/gi, 'bg-institutional-blue');
    content = content.replace(/bg-purple-500/gi, 'bg-institutional-indigo');
    content = content.replace(/border-pink-500/gi, 'border-institutional-blue');
    content = content.replace(/border-purple-500/gi, 'border-institutional-indigo');
    
    // 5. Eradicate Hardcoded Shadows
    content = content.replace(/shadow-\[0_8px_30px_rgb\(0,0,0,0\.02\)\]/g, 'shadow-premium');
    content = content.replace(/shadow-\[0_4px_20px_rgb\(0,0,0,0\.01\)\]/g, 'shadow-premium');
    content = content.replace(/shadow-\[0_8px_30px_rgb\(0,0,0,0\.03\)\]/g, 'shadow-premium');
    content = content.replace(/shadow-\[0_8px_30px_rgb\(0,0,0,0\.04\)\]/g, 'shadow-premium');
    content = content.replace(/shadow-\[0_20px_50px_rgba\(0,0,0,0\.1\)\]/g, 'shadow-institutional');
    content = content.replace(/shadow-\[0_20px_50px_rgba\(0,0,0,0\.15\)\]/g, 'shadow-institutional');
    content = content.replace(/shadow-\[0_0_40px_rgba\(255,15,123,0\.4\)\]/g, 'shadow-institutional');
    content = content.replace(/shadow-\[0_0_20px_rgba\(255,15,123,0\.4\)\]/g, 'shadow-institutional');
    content = content.replace(/shadow-\[0_0_30px_rgba\(59,130,246,0\.1\)\]/g, 'shadow-institutional');

    if (original !== content) {
        fs.writeFileSync(filePath, content, 'utf-8');
        filesModified++;
        console.log(`Migrated: ${filePath}`);
    }
});

console.log(`\nMigration Complete! Modified ${filesModified} files.`);
