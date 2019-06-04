const dayjs = require('dayjs');

exports.numberFilter = value =>
  /*
  Format number.
  @param value {Number|String}
  @returns {String} eg: "10,000"
   */
  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

exports.formatDate = date =>
  /*
  Format date.
  @param date {String|Date}
  @returns {String} eg: "April 7, 2019 7:59:03 PM"
   */
  `${dayjs(date).format('LL')} ${dayjs(date).format('LTS')}`;
