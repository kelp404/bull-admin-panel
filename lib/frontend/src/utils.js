const dayjs = require('dayjs');

exports.numberFilter = value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

exports.formatDate = date => `${dayjs(date).format('LL')} ${dayjs(date).format('LTS')}`;
