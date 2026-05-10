export const DEFAULT_CENTER = [12.9716, 77.5946]

export const CORPORATION_COLORS = {
    'Bengaluru Central': '#d97706',
    'Bengaluru East': '#2563eb',
    'Bengaluru West': '#0f766e',
    'Bengaluru North': '#7c3aed',
    'Bengaluru South': '#059669',
}

export function colorForCorporation(corporation) {
    return CORPORATION_COLORS[corporation] ?? '#334155'
}

export function normalizeText(value) {
    return value.trim().toLowerCase()
}
