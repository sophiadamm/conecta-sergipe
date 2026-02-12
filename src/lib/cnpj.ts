export function validateCNPJ(cnpj: string): boolean {
    // Remove non-numeric characters
    const cleanCNPJ = cnpj.replace(/\D/g, '');

    // Must have 14 digits
    if (cleanCNPJ.length !== 14) return false;

    // Check for known invalid CNPJs (all same digits)
    if (/^(\d)\1+$/.test(cleanCNPJ)) return false;

    // Validate first check digit
    let size = cleanCNPJ.length - 2;
    let numbers = cleanCNPJ.substring(0, size);
    const digits = cleanCNPJ.substring(size);
    let sum = 0;
    let pos = size - 7;
    for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    // Validate second check digit
    size = size + 1;
    numbers = cleanCNPJ.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
}

export function formatCNPJ(cnpj: string): string {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    return cleanCNPJ.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function cleanCNPJ(cnpj: string): string {
    return cnpj.replace(/\D/g, '');
}

export function maskCNPJ(cnpj: string): string {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length === 14) {
        return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/****-**`;
    }
    return cnpj;
}
