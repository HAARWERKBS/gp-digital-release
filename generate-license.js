#!/usr/bin/env node
/**
 * GP Digital - Lizenzschlüssel Generator
 *
 * Verwendung:
 *   node generate-license.js              # Generiert unbegrenzte Lizenz (9999)
 *   node generate-license.js 2612         # Generiert Lizenz bis Dez 2026 (YYMM)
 *   node generate-license.js 10 2512      # Generiert 10 Lizenzen bis Dez 2025
 */

const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generatePart() {
    let part = '';
    for (let i = 0; i < 5; i++) {
        part += chars[Math.floor(Math.random() * chars.length)];
    }
    return part;
}

// Gleiche Checksummen-Berechnung wie in types.ts
function calculateChecksum(part1, part2) {
    const combined = part1 + part2;
    let sum = 0;

    for (let i = 0; i < combined.length; i++) {
        const charCode = combined.charCodeAt(i);
        sum += charCode * (i + 1);
    }

    let result = '';
    for (let i = 0; i < 5; i++) {
        const index = (sum + i * 7) % chars.length;
        result += chars[index];
        sum = Math.floor(sum / chars.length) + sum;
    }

    return result;
}

function generateLicenseKey(expiryYYMM = '9999') {
    const randomPart = generatePart();
    const checksum = calculateChecksum(expiryYYMM, randomPart);
    return `GPDIG-${expiryYYMM}-${randomPart}-${checksum}`;
}

// Argumente parsen
let count = 1;
let expiry = '9999'; // Unbegrenzt

if (process.argv.length >= 3) {
    const arg1 = process.argv[2];
    if (arg1.length === 4 && /^[0-9]{4}$/.test(arg1)) {
        // Nur Ablaufdatum angegeben
        expiry = arg1;
    } else {
        // Anzahl angegeben
        count = parseInt(arg1) || 1;
        if (process.argv.length >= 4) {
            expiry = process.argv[3];
        }
    }
}

const expiryText = expiry === '9999' ? 'UNBEGRENZT' : `bis ${expiry.slice(2)}/${expiry.slice(0, 2)}`;

console.log('\n=== GP DIGITAL LIZENZSCHLÜSSEL ===');
console.log(`Gültigkeit: ${expiryText}\n`);

for (let i = 0; i < count; i++) {
    console.log(generateLicenseKey(expiry));
}
console.log('\n');
