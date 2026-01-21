'use strict';

const Translator = require('../components/translator.js');

module.exports = function (app) {
  
  const translator = new Translator();

  app.route('/api/translate')
    .post((req, res) => {
      const { text, locale } = req.body || {};

      // Required fields check
      if (text === undefined || locale === undefined) {
        return res.json({ error: 'Required field(s) missing' });
      }

      // Empty text check
      if (typeof text === 'string' && text.trim() === '') {
        return res.json({ error: 'No text to translate' });
      }

      // Locale validation
      if (locale !== 'american-to-british' && locale !== 'british-to-american') {
        return res.json({ error: 'Invalid value for locale field' });
      }

      const translated = translator.translate(text, locale);

      if (translated === text) {
        return res.json({ text, translation: 'Everything looks good to me!' });
      }

      return res.json({ text, translation: translated });
    });
};
