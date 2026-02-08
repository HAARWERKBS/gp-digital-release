export function parseGermanDate(dateStr: string | number | null | undefined): string | null {
    if (!dateStr) return null;

    // Konvertiere zu String falls Zahl (Excel-Seriennummer)
    const str = String(dateStr).trim();
    if (!str) return null;

    // Handle ISO-Date (YYYY-MM-DD)
    if (str.match(/^\d{4}-\d{2}-\d{2}$/)) return str;

    // Handle ISO-Datetime (YYYY-MM-DD HH:MM:SS oder YYYY-MM-DDTHH:MM:SS)
    const isoDatetimeMatch = str.match(/^(\d{4}-\d{2}-\d{2})[T\s]/);
    if (isoDatetimeMatch) return isoDatetimeMatch[1];

    // Handle Excel-Seriennummer (Zahl wie 45000)
    const numValue = parseFloat(str);
    if (!isNaN(numValue) && numValue > 30000 && numValue < 60000) {
        // Excel-Datum: Tage seit 1.1.1900 (mit Korrektur für Excel-Bug)
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + numValue * 24 * 60 * 60 * 1000);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Handle German date (TT.MM.JJJJ, TT-MM-JJJJ, TT/MM/JJJJ)
    const parts = str.replace(/[/-]/g, '.').split('.');
    if (parts.length !== 3) return null;

    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];

    if (year.length !== 4) return null; // Enforce 4 digit year

    const iso = `${year}-${month}-${day}`;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;

    return iso;
}
