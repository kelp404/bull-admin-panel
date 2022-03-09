const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

handlebars.registerHelper(
  'archive',
  object => new handlebars.SafeString(Buffer.from(JSON.stringify(object)).toString('base64')),
);

/**
 * @returns {function(args: Object)} - The template generator.
 */
exports.getBaseTemplate = () => {
  if (exports.baseTemplate) {
    return exports.baseTemplate;
  }

  const baseHtml = fs.readFileSync(
    path.join(__dirname, '..', 'frontend', 'src', 'express-templates', 'base.html'),
  );
  exports.baseTemplate = handlebars.compile(baseHtml.toString());
  return exports.baseTemplate;
};
