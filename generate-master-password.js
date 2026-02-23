#!/usr/bin/env node

/**
 * GP Digital – Master-Passwort Generator
 * Erzeugt Einmal-Support-Passwörter im Format GPDM-XXXXX-XXXXX
 *
 * Verwendung:
 *   node generate-master-password.js          → 1 Passwort
 *   node generate-master-password.js --count 5  → 5 Passwörter
 */

const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Ohne I, O, 0, 1

// Gleicher Seed und Algorithmus wie in src/lib/types.ts → calculateMasterChecksum()
function calculateMasterChecksum(randomPart) {
    const seed = 'GpD!g1t4l_M4st3r';
    const combined = seed + randomPart;
    let sum = 0;

    for (let i = 0; i < combined.length; i++) {
        const charCode = combined.charCodeAt(i);
        sum += charCode * (i + 3);
    }

    let result = '';
    for (let i = 0; i < 5; i++) {
        const index = (sum + i * 11) % chars.length;
        result += chars[index];
        sum = Math.floor(sum / chars.length) + sum;
    }

    return result;
}

function generateMasterPassword() {
    let randomPart = '';
    for (let i = 0; i < 5; i++) {
        randomPart += chars[Math.floor(Math.random() * chars.length)];
    }
    const checksum = calculateMasterChecksum(randomPart);
    return `GPDM-${randomPart}-${checksum}`;
}

// CLI
const countArg = process.argv.indexOf('--count');
const count = countArg !== -1 ? parseInt(process.argv[countArg + 1]) || 1 : 1;

console.log('\n🔑 GP Digital – Master-Passwort Generator\n');
console.log('Format: GPDM-XXXXX-XXXXX (Einmal-Verwendung)\n');

for (let i = 0; i < count; i++) {
    console.log(`  ${generateMasterPassword()}`);
}

console.log('\n⚠️  Jedes Passwort kann nur EINMAL verwendet werden.');
console.log('    Nach Verwendung wird es in der App als verbraucht markiert.\n');
