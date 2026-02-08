#!/usr/bin/env node
/**
 * GP Digital - Lizenzschlüssel Generator
 *
 * Verwendung:
 *   node generate-license.js        # Generiert 1 Schlüssel
 *   node generate-license.js 10     # Generiert 10 Schlüssel
 */

const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generatePart() {
    let part = '';
    for (let i = 0; i < 5; i++) {
        part += chars[Math.floor(Math.random() * chars.length)];
    }
    return part;
}

function calculateChecksum(part1, part2) {
    const combined = part1 + part2;
    let sum = 0;
    for (let i = 0; i < combined.length; i++) {
        sum += combined.charCodeAt(i) * (i + 1);
    }
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += chars[(sum + i * 7) % chars.length];
        sum = Math.floor(sum / chars.length) + sum;
    }
    return result;
}

function generateLicenseKey() {
    const part1 = generatePart();
    const part2 = generatePart();
    const checksum = calculateChecksum(part1, part2);
    return `GPDIG-${part1}-${part2}-${checksum}`;
}

// Anzahl aus Argument oder Standard 1
const count = parseInt(process.argv[2]) || 1;

console.log('\n=== GP DIGITAL LIZENZSCHLÜSSEL ===\n');
for (let i = 0; i < count; i++) {
    console.log(generateLicenseKey());
}
console.log('\n');
