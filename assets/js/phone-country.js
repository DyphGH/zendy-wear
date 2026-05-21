/**
 * phone-country.js — indicativo internacional + deteção por IP (fallback PT).
 */
import { getLang, onLangChange } from './i18n.js';

/** @type {{ code: string, iso: string, namePt: string, nameEn: string }[]} */
export const DIAL_CODES = [
  { code: '+351', iso: 'PT', namePt: 'Portugal', nameEn: 'Portugal' },
  { code: '+34', iso: 'ES', namePt: 'Espanha', nameEn: 'Spain' },
  { code: '+33', iso: 'FR', namePt: 'França', nameEn: 'France' },
  { code: '+44', iso: 'GB', namePt: 'Reino Unido', nameEn: 'United Kingdom' },
  { code: '+49', iso: 'DE', namePt: 'Alemanha', nameEn: 'Germany' },
  { code: '+39', iso: 'IT', namePt: 'Itália', nameEn: 'Italy' },
  { code: '+31', iso: 'NL', namePt: 'Países Baixos', nameEn: 'Netherlands' },
  { code: '+32', iso: 'BE', namePt: 'Bélgica', nameEn: 'Belgium' },
  { code: '+41', iso: 'CH', namePt: 'Suíça', nameEn: 'Switzerland' },
  { code: '+43', iso: 'AT', namePt: 'Áustria', nameEn: 'Austria' },
  { code: '+353', iso: 'IE', namePt: 'Irlanda', nameEn: 'Ireland' },
  { code: '+352', iso: 'LU', namePt: 'Luxemburgo', nameEn: 'Luxembourg' },
  { code: '+45', iso: 'DK', namePt: 'Dinamarca', nameEn: 'Denmark' },
  { code: '+46', iso: 'SE', namePt: 'Suécia', nameEn: 'Sweden' },
  { code: '+47', iso: 'NO', namePt: 'Noruega', nameEn: 'Norway' },
  { code: '+48', iso: 'PL', namePt: 'Polónia', nameEn: 'Poland' },
  { code: '+30', iso: 'GR', namePt: 'Grécia', nameEn: 'Greece' },
  { code: '+1', iso: 'US', namePt: 'EUA / Canadá', nameEn: 'USA / Canada' },
  { code: '+55', iso: 'BR', namePt: 'Brasil', nameEn: 'Brazil' },
  { code: '+61', iso: 'AU', namePt: 'Austrália', nameEn: 'Australia' },
  { code: '+81', iso: 'JP', namePt: 'Japão', nameEn: 'Japan' },
  { code: '+86', iso: 'CN', namePt: 'China', nameEn: 'China' },
  { code: '+91', iso: 'IN', namePt: 'Índia', nameEn: 'India' },
  { code: '+971', iso: 'AE', namePt: 'Emirados Árabes', nameEn: 'UAE' },
  { code: '+212', iso: 'MA', namePt: 'Marrocos', nameEn: 'Morocco' },
  { code: '+90', iso: 'TR', namePt: 'Turquia', nameEn: 'Turkey' },
  { code: '+27', iso: 'ZA', namePt: 'África do Sul', nameEn: 'South Africa' },
];

const DEFAULT_ISO = 'PT';
let cachedIso = null;
let detectPromise = null;

function countryLabel(entry) {
  const name = getLang() === 'en' ? entry.nameEn : entry.namePt;
  return `${entry.code} (${name})`;
}

function buildOptions(select, iso) {
  const prev = select.value;
  select.innerHTML = '';
  for (const entry of DIAL_CODES) {
    const opt = document.createElement('option');
    opt.value = entry.code;
    opt.dataset.iso = entry.iso;
    opt.textContent = countryLabel(entry);
    if (entry.iso === iso) opt.selected = true;
    select.appendChild(opt);
  }
  if (prev) {
    const match = [...select.options].find((o) => o.value === prev);
    if (match) match.selected = true;
  }
}

export function setDialByIso(select, iso) {
  const entry = DIAL_CODES.find((c) => c.iso === iso) || DIAL_CODES.find((c) => c.iso === DEFAULT_ISO);
  if (!entry) return;
  select.value = entry.code;
}

export async function detectCountryIso() {
  if (cachedIso) return cachedIso;
  if (!detectPromise) detectPromise = runDetect();
  cachedIso = await detectPromise;
  return cachedIso;
}

async function runDetect() {
  const timeout = (ms) => {
    const c = new AbortController();
    setTimeout(() => c.abort(), ms);
    return c.signal;
  };

  try {
    const r = await fetch('https://ipapi.co/country_code/', { signal: timeout(4500) });
    if (r.ok) {
      const iso = (await r.text()).trim().toUpperCase();
      const resolved = resolveIso(iso);
      if (resolved) return resolved;
    }
  } catch { /* fallback */ }

  try {
    const r = await fetch('https://ipwho.is/', { signal: timeout(4500) });
    if (r.ok) {
      const data = await r.json();
      const iso = String(data?.country_code || '').toUpperCase();
      if (data?.success !== false) {
        const resolved = resolveIso(iso);
        if (resolved) return resolved;
      }
    }
  } catch { /* fallback */ }

  return DEFAULT_ISO;
}

function resolveIso(iso) {
  if (!iso || iso.length !== 2) return null;
  if (DIAL_CODES.some((c) => c.iso === iso)) return iso;
  if (iso === 'CA') return 'US';
  return null;
}

/**
 * @param {HTMLSelectElement} select
 */
export async function initPhoneCountry(select) {
  if (!select) return;
  buildOptions(select, DEFAULT_ISO);
  setDialByIso(select, DEFAULT_ISO);

  const iso = await detectCountryIso();
  setDialByIso(select, iso);

  onLangChange(() => {
    const current = select.selectedOptions[0]?.dataset.iso || DEFAULT_ISO;
    buildOptions(select, current);
    setDialByIso(select, current);
  });
}

export function getFullPhone(select, nationalInput) {
  const code = select?.value?.trim() || '';
  const raw = (nationalInput?.value || '').trim();
  if (!raw) return '';
  return `${code} ${raw}`;
}
