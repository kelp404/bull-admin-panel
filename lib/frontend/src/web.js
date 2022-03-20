// Stylesheets
require('./stylesheets/_web.scss');

// Vendor
require('@babel/polyfill');
require('bootstrap/dist/js/bootstrap.bundle.js');

const $ = require('jquery/dist/jquery');
const dayjs = require('dayjs');
const LocalizedFormat = require('dayjs/plugin/localizedFormat');
const {RouterView} = require('capybara-router');
const nprogress = require('nprogress');
const React = require('react');
const ReactDOM = require('react-dom');
const api = require('./api');
const router = require('./router');
const Loading = require('./components/loading');

dayjs.extend(LocalizedFormat);
nprogress.configure({showSpinner: false});
api.socket.connect((() => {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${location.host}${window.config.basePath}`;
})());

router.listen('ChangeStart', (action, toState, fromState, next) => {
  nprogress.start();
  $('.navbar-toggler[aria-expanded=true]').click();
  next();
});
router.listen('ChangeSuccess', (action, toState, fromState) => {
  nprogress.done();
  if (action === 'PUSH') {
    const skipRouteNames = ['web.jobs.details'];
    if (
      skipRouteNames.indexOf(toState.name) >= 0
      || skipRouteNames.indexOf(fromState.name) >= 0
    ) {
      return;
    }

    try {
      window.scrollTo(0, 0);
    } catch (_) {}
  }
});
router.listen('ChangeError', nprogress.done);

ReactDOM.render(
  <RouterView><Loading/></RouterView>,
  document.getElementById('root'),
);
