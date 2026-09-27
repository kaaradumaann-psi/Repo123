/**
 * Gizli-değer kalıpları ve false-positive kontrolleri (rapor §12, §25, §43).
 *
 *  - Eşleşen DEĞER hiçbir zaman döndürülmez/saklanmaz; yalnızca kalıp adı ve
 *    konum (dosya:satır) raporlanır.
 *  - Public tasarım gereği gizli OLMAYAN değerler ayrıştırılır:
 *      · Supabase anon/publishable anahtarı (JWT payload role === 'anon')
 *      · sb_publishable_* anahtarları
 *      · Açık placeholder'lar (YOUR_..., örnek değerler)
 *      · Kaynak kodda kalıp TANIMLAYAN regex literal'ları
 */

export const SECRET_PATTERNS = [
  { name: 'JWT taşıyan değer', regex: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
  { name: 'Supabase secret key (sb_secret_)', regex: /sb_secret_[A-Za-z0-9]{16,}/g },
  { name: 'OpenAI-style secret (sk-)', regex: /sk-[A-Za-z0-9]{20,}/g },
  { name: 'Google API key (AIza)', regex: /AIza[A-Za-z0-9_-]{30,}/g },
  { name: 'Google auth key (AQ.)', regex: /AQ\.[A-Za-z0-9_-]{30,}/g },
  { name: 'AWS access key (AKIA)', regex: /AKIA[0-9A-Z]{16}/g },
  { name: 'Private key bloğu', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { name: 'service_role ataması', regex: /service_role[\w-]*["']?\s*[:=]\s*["'][A-Za-z0-9._-]{24,}["']/gi },
  { name: 'AI/API key ataması', regex: /(?:AI_API_KEY|GEMINI_API_KEY|OPENAI_API_KEY|api[_-]?key)["']?\s*[:=]\s*["'][A-Za-z0-9._-]{20,}["']/gi },
];

const PLACEHOLDER = /^(your[_-]|<|\$\{|xxx|change[_-]?me|example|placeholder|dummy|sample|redacted|•+|\*+|\.{3,})/i;

/** Satır bir regex TANIMI içeriyorsa eşleşme büyük olasılıkla kalıp literal'ıdır. */
function isPatternDefinitionLine(line) {
  return /RegExp\(|regex:|doesNotMatch|assert\.match|match\(\/\^|\{20,\}|\{30,\}|\{16,\}/.test(line);
}

/** JWT payload'ını çözüp role alanını döndürür (doğrulama yapmaz; sınıflandırma amaçlı). */
function jwtRole(token) {
  try {
    const payload = JSON.parse(Buffer.from(String(token).split('.')[1], 'base64url').toString('utf8'));
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

export function scanText(text, regexes) {
  let count = 0;
  for (const regex of regexes) {
    const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);
    if (re.test(text)) count += (text.match(re) ?? []).length;
  }
  return count;
}

/**
 * Dosya metnini tarar; bulgu değerleri asla rapora girmez.
 * @returns {{file:string,line:number,pattern:string,classification:'secret'|'public-config'|'maybe'}[]}
 */
export function scanFileForSecrets(file, text) {
  const findings = [];
  const lines = text.split(/\r?\n/);
  for (let lineNo = 0; lineNo < lines.length; lineNo += 1) {
    const line = lines[lineNo];
    for (const pattern of SECRET_PATTERNS) {
      const re = new RegExp(pattern.regex.source, pattern.regex.flags.includes('g') ? pattern.regex.flags : `${pattern.regex.flags}g`);
      let match;
      while ((match = re.exec(line)) !== null) {
        const value = match[0];
        if (PLACEHOLDER.test(value)) continue;
        if (isPatternDefinitionLine(line)) continue;
        if (pattern.name.startsWith('JWT')) {
          const role = jwtRole(value);
          if (role === 'anon') {
            findings.push({ file, line: lineNo + 1, pattern: pattern.name, classification: 'public-config', note: 'Supabase anon JWT — public tasarım (service_role DEĞİL)' });
            continue;
          }
          if (role === 'service_role') {
            findings.push({ file, line: lineNo + 1, pattern: pattern.name, classification: 'secret', note: 'service_role JWT — KRİTİK' });
            continue;
          }
          findings.push({ file, line: lineNo + 1, pattern: pattern.name, classification: 'maybe', note: 'tanımsız JWT — elle doğrulayın' });
          continue;
        }
        findings.push({ file, line: lineNo + 1, pattern: pattern.name, classification: 'secret' });
      }
    }
  }
  return findings;
}
