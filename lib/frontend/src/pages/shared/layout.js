const classNames = require('classnames');
const React = require('react');
const PropTypes = require('prop-types');
const {RouterView, Link, getRouter} = require('capybara-router');
const Base = require('./base');

module.exports = class Layout extends Base {
  static get propTypes() {
    return {
      types: PropTypes.array.isRequired,
      jobQuantity: PropTypes.object.isRequired
    };
  }

  constructor(props) {
    super(props);
    const router = getRouter();
    this.state.currentState = '';
    this.listens = [
      router.listen('ChangeSuccess', (action, toState) => {
        this.setState({currentState: toState.params.state || 'active'});
      })
    ];
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.listens.forEach(x => x());
  }

  render() {
    const classTable = {
      inactiveLink: classNames([
        'nav-item',
        {active: this.state.currentState === 'inactive'}
      ]),
      activeLink: classNames([
        'nav-item',
        {active: this.state.currentState === 'active'}
      ]),
      completeLink: classNames([
        'nav-item',
        {active: this.state.currentState === 'complete'}
      ]),
      failedLink: classNames([
        'nav-item',
        {active: this.state.currentState === 'failed'}
      ]),
      delayedLink: classNames([
        'nav-item',
        {active: this.state.currentState === 'delayed'}
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
                <li className={classTable.inactiveLink}>
                  <Link className="nav-link" to={{name: 'web', params: {state: 'inactive'}}}>
                    Inactive <span className="badge badge-secondary badge-pill">{this.props.jobQuantity.inactive}</span>
                  </Link>
                </li>
                <li className={classTable.activeLink}>
                  <Link className="nav-link" to={{name: 'web', params: {state: 'active'}}}>
                    Active <span className="badge badge-secondary badge-pill">{this.props.jobQuantity.active}</span>
                  </Link>
                </li>
                <li className={classTable.completeLink}>
                  <Link className="nav-link" to={{name: 'web', params: {state: 'complete'}}}>
                    Complete <span className="badge badge-secondary badge-pill">{this.props.jobQuantity.complete}</span>
                  </Link>
                </li>
                <li className={classTable.failedLink}>
                  <Link className="nav-link" to={{name: 'web', params: {state: 'failed'}}}>
                    Failed <span className="badge badge-secondary badge-pill">{this.props.jobQuantity.failed}</span>
                  </Link>
                </li>
                <li className={classTable.delayedLink}>
                  <Link className="nav-link" to={{name: 'web', params: {state: 'delayed'}}}>
                    Delayed <span className="badge badge-secondary badge-pill">{this.props.jobQuantity.delayed}</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <div className="pt-3">
          <div className="container">
            <div className="row">
              <div className="col-3">
                <ul className="list-group">
                  {
                    this.props.types.map(
                      type => (
                        <li key={`type-${type}`} className="list-group-item d-flex justify-content-between align-items-center">
                          {type}
                        </li>
                      )
                    )
                  }
                </ul>
              </div>
              <div className="col-9">
                <RouterView>
                  <p className="text-center text-muted h3 pt-5">
                    <i className="fa fa-spinner fa-pulse fa-fw"/> Loading...
                  </p>
                </RouterView>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
};
