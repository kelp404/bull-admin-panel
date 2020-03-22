const dayjs = require('dayjs');

/**
 * Format number.
 * @param {number|string} value
 * @returns {string} eg: "10,000"
 */
exports.formatNumber = value =>
  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

exports.formatDate = date =>
  /*
  Format date.
  @param date {String|Date}
  @returns {String} eg: "April 7, 2019 7:59:03 PM"
   */
  `${dayjs(date).format('LL')} ${dayjs(date).format('LTS')}`;
