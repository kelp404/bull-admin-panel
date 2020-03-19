const fs = require('fs');
const path = require('path');
const util = require('util');
const handlebars = require('handlebars');
const kue = require('kue');

handlebars.registerHelper(
  'archive',
  object => new handlebars.SafeString(Buffer.from(JSON.stringify(object)).toString('base64')),
);

let _baseTemplate;
/**
 * @returns {function(args: Object)} - The template generator.
 */
exports.getBaseTemplate = () => {
  if (_baseTemplate) {
    return _baseTemplate;
  }

  const baseHtml = fs.readFileSync(
    path.join(__dirname, '..', 'frontend', 'src', 'express-templates', 'base.html')
  );
  _baseTemplate = handlebars.compile(baseHtml.toString());
  return _baseTemplate;
};

exports.getJob = util.promisify(kue.Job.get);
