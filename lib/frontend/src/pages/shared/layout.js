const classNames = require('classnames');
const React = require('react');
const PropTypes = require('prop-types');
const {RouterView, Link, getRouter} = require('capybara-router');
const Base = require('./base');

module.exports = class Layout extends Base {
  static get propTypes() {
    return {types: PropTypes.array.isRequired};
  }

  constructor(props) {
    super(props);
    console.log(props.types);
    const router = getRouter();
    this.state = {
      currentRouteName: ''
    };
    this.listens = [
      router.listen('ChangeSuccess', (action, toState) => {
        this.setState({currentRouteName: toState.name});
      })
    ];
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.listens.forEach(x => x());
  }

  render() {
    const classTable = {
      ordersLink: classNames([
        'nav-item',
        {active: this.state.currentRouteName === 'web.jobs'}
      ])
    };

    return (
      <>
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
          <div className="container">
            <Link className="navbar-brand" to={{name: 'web'}}>Kue Admin Panel</Link>
            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavDropdown">
              <span className="navbar-toggler-icon"/>
            </button>
            <div className="collapse navbar-collapse" id="navbarNavDropdown">
              <ul className="navbar-nav mr-auto">
                <li className={classTable.ordersLink}>
                  <Link className="nav-link" to={{name: 'web'}}>Jobs</Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <div className="pt-3">
          <RouterView>
            <p className="text-center text-muted h3 pt-5">
              <i className="fa fa-spinner fa-pulse fa-fw"/> Loading...
            </p>
          </RouterView>
        </div>
      </>
    );
  }
};
