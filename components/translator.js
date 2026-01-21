const americanOnly = require('./american-only.js');
const americanToBritishSpelling = require('./american-to-british-spelling.js');
const americanToBritishTitles = require("./american-to-british-titles.js")
const britishOnly = require('./british-only.js')

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
		if (locale === this.locales.AMERICAN_TO_BRITISH) {
			return this._translateAmericanToBritish(text);
		} else if (locale === this.locales.BRITISH_TO_AMERICAN) {
			return this._translateBritishToAmerican(text);
		}
		return text;
	}

	_translateAmericanToBritish(text) {
		let result = text;
		// 1) Titles (Mr. -> Mr, etc.)
		result = this._replaceTitles(result, americanToBritishTitles);
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
		result = this._replaceTitles(result, this.britishToAmericanTitles);
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
		for (const [k, v] of Object.entries(obj)) {
			out[v] = k;
		}
		return out;
	}

	_escapeRegExp(str) {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	_capitalize(word) {
		if (!word) return word;
		return word.charAt(0).toUpperCase() + word.slice(1);
	}

	_preserveCase(original, replacement) {
		if (!original || !replacement) return replacement;
		// All caps
		if (original === original.toUpperCase()) {
			return replacement.toUpperCase();
		}
		// First letter capitalized (e.g., sentence start)
		if (original[0] === original[0].toUpperCase()) {
			// Capitalize only first letter of replacement
			return this._capitalize(replacement);
		}
		return replacement;
	}

	_replaceTitles(text, map) {
		let result = text;
		// Replace titles using map, preserving capitalization of first letter, and wrap replaced title with highlight
		// Keys and values are expected to be lowercase in the maps
		for (const [from, to] of Object.entries(map)) {
			// Titles with dot (e.g., 'mr.') need special handling as trailing \b won't match after '.'
			const escaped = this._escapeRegExp(from);
			const pattern = from.includes('.')
				? new RegExp(`(^|\\s)${escaped}(?=\\s)`, 'gi')
				: new RegExp(`\\b${escaped}\\b`, 'gi');
			result = result.replace(pattern, (match) => {
				// Preserve capitalization of first letter only
				const replacement = this._preserveCase(match, to);
				// If we matched with leading whitespace, keep it
				if (from.includes('.')) {
					// match may include leading space when using (^|\s)
					const hasLeadingSpace = /^\s/.test(match);
					const prefix = hasLeadingSpace ? ' ' : '';
					return `${prefix}<span class=\"highlight\">${replacement}</span>`;
				}
				return `<span class=\"highlight\">${replacement}</span>`;
			});
		}
		return result;
	}

	_replaceTerms(text, map) {
		let result = text;
		// Sort keys by length to prefer longer phrases first
		const keys = Object.keys(map).sort((a, b) => b.length - a.length);
		for (const key of keys) {
			const value = map[key];
			// Use word boundaries; for multi-word phrases, \b at ends is sufficient
			const pattern = new RegExp(`\\b${this._escapeRegExp(key)}\\b`, 'gi');
			result = result.replace(pattern, (match) => {
				const replaced = this._preserveCase(match, value);
				return `<span class="highlight">${replaced}</span>`;
			});
		}
		return result;
	}
}

module.exports = Translator;