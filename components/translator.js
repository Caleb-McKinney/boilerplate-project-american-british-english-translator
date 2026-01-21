const americanOnly = require('./american-only.js');
const americanToBritishSpelling = require('./american-to-british-spelling.js');
const americanToBritishTitles = require('./american-to-british-titles.js');
const britishOnly = require('./british-only.js');

class Translator {
  constructor() {
    this.locales = {
      AMERICAN_TO_BRITISH: 'american-to-british',
      BRITISH_TO_AMERICAN: 'british-to-american',
    };

    // Precompute inverse maps for british -> american
    this.britishToAmericanSpelling = this._invertMap(americanToBritishSpelling);
    this.britishToAmericanTitles = this._invertMap(americanToBritishTitles);
  }

  translate(text, locale) {
    if (typeof text !== 'string') return '';

    let out = text;

    if (locale === this.locales.AMERICAN_TO_BRITISH) {
      out = this._translateAmericanToBritish(text);
    } else if (locale === this.locales.BRITISH_TO_AMERICAN) {
      out = this._translateBritishToAmerican(text);
    } else {
      out = text;
    }

    // If nothing changed, FCC expects this exact message
    if (out === text) {
      return 'Everything looks good to me!';
    }

    return out;
  }

  _translateAmericanToBritish(text) {
    let result = text;

    // 1) Titles (Mr. -> Mr, etc.)
    result = this._replaceTitles(result, americanToBritishTitles, {
      fromHasDot: true,  // american titles include a dot like "mr."
      toHasDot: false
    });

    // 2) Time (12:15 -> 12.15)
    result = result.replace(/\b(\d{1,2}):(\d{2})\b/g, (m, h, min) => {
      return `<span class="highlight">${h}.${min}</span>`;
    });

    // 3) Terms and spellings
    const combinedMap = { ...americanOnly, ...americanToBritishSpelling };
    result = this._replaceTerms(result, combinedMap);

    return result;
  }

  _translateBritishToAmerican(text) {
    let result = text;

    // 1) Titles (Mr -> Mr., etc.)
    result = this._replaceTitles(result, this.britishToAmericanTitles, {
      fromHasDot: false, // british titles are typically without dot like "mr"
      toHasDot: true
    });

    // 2) Time (4.30 -> 4:30)
    result = result.replace(/\b(\d{1,2})\.(\d{2})\b/g, (m, h, min) => {
      return `<span class="highlight">${h}:${min}</span>`;
    });

    // 3) Terms and spellings
    const combinedMap = { ...britishOnly, ...this.britishToAmericanSpelling };
    result = this._replaceTerms(result, combinedMap);

    return result;
  }

  _invertMap(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[v] = k;
    return out;
  }

  _escapeRegExp(str) {
