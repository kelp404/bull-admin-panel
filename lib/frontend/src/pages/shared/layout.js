const classNames = require('classnames');
const React = require('react');
const PropTypes = require('prop-types');
const {RouterView, Link, getRouter} = require('capybara-router');
const utils = require('../../utils');
const Base = require('./base');
const store = require('../../store');
const api = require('../../api');

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
    this.state.currentState = props.params.state;
    this.state.currentType = props.params.type;
    this.state.jobQuantity = props.jobQuantity;
    store.set('$jobQuantity', props.jobQuantity);

    this.$listens.push(
      router.listen('ChangeStart', (action, toState) => {
        this.setState({
          currentState: toState.params.state || 'active',
          currentType: toState.params.type
        });
      })
    );
    this.$listens.push(
      store.subscribe('$jobQuantity', (_, jobQuantity) => {
        this.setState({jobQuantity: Object.assign({}, jobQuantity)});
      })
    );
    this.$listens.push(
      api.subscribe(api.eventTypes.JOB_ENQUEUE, job => {
        // Increase the job quantity at the navigation.
        const jobQuantity = store.get('$jobQuantity');
        jobQuantity[job.state] += 1;
        store.set('$jobQuantity', jobQuantity);
      })
    );
  }

  render() {
    const classTable = {
      inactiveLink: classNames(['nav-item', {active: this.state.currentState === 'inactive'}]),
      activeLink: classNames(['nav-item', {active: this.state.currentState === 'active'}]),
      completeLink: classNames(['nav-item', {active: this.state.currentState === 'complete'}]),
      failedLink: classNames(['nav-item', {active: this.state.currentState === 'failed'}]),
      delayedLink: classNames(['nav-item', {active: this.state.currentState === 'delayed'}]),
      allTypesLink: classNames([
        'list-group-item list-group-item-action text-truncate',
        {'list-group-item-secondary active': !this.state.currentType}
      ])
    };
    this.props.types.forEach(type => {
      classTable[`${type}TypeLink`] = classNames([
        'list-group-item list-group-item-action text-truncate',
        {'list-group-item-secondary active': this.state.currentType === type}
      ]);
    });
    const quantity = {
      inactive: utils.numberFilter(this.state.jobQuantity.inactive),
      active: utils.numberFilter(this.state.jobQuantity.active),
      complete: utils.numberFilter(this.state.jobQuantity.complete),
      failed: utils.numberFilter(this.state.jobQuantity.failed),
      delayed: utils.numberFilter(this.state.jobQuantity.delayed)
    };

    return (
      <>
        <nav className="navbar navbar-expand-md sticky-top navbar-dark bg-dark">
          <div className="container">
            <Link className="navbar-brand" to={{name: 'web.jobs'}}>Kue Admin Panel</Link>
            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavDropdown">
              <span className="navbar-toggler-icon"/>
            </button>
            <div className="collapse navbar-collapse" id="navbarNavDropdown">
              <ul className="navbar-nav mr-auto">
                <li className={classTable.inactiveLink}>
                  <Link className="nav-link" to={{name: 'web.jobs', params: {state: 'inactive'}}}>
                    Inactive <span className="badge badge-secondary badge-pill">{quantity.inactive}</span>
                  </Link>
                </li>
                <li className={classTable.activeLink}>
                  <Link className="nav-link" to={{name: 'web.jobs', params: {state: 'active'}}}>
                    Active <span className="badge badge-secondary badge-pill">{quantity.active}</span>
                  </Link>
                </li>
                <li className={classTable.completeLink}>
                  <Link className="nav-link" to={{name: 'web.jobs', params: {state: 'complete'}}}>
                    Complete <span className="badge badge-secondary badge-pill">{quantity.complete}</span>
                  </Link>
                </li>
                <li className={classTable.failedLink}>
                  <Link className="nav-link" to={{name: 'web.jobs', params: {state: 'failed'}}}>
                    Failed <span className="badge badge-secondary badge-pill">{quantity.failed}</span>
                  </Link>
                </li>
                <li className={classTable.delayedLink}>
                  <Link className="nav-link" to={{name: 'web.jobs', params: {state: 'delayed'}}}>
                    Delayed <span className="badge badge-secondary badge-pill">{quantity.delayed}</span>
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
                <div className="list-group">
                  <Link key="type-all"
                    className={classTable.allTypesLink}
                    title="All types"
                    to={{name: 'web.jobs', params: {state: this.state.currentState, sort: this.props.params.sort}}}
                  >
                    All types
                  </Link>
                  {
                    this.props.types.map(
                      type => (
                        <Link key={`type-${type}`}
                          className={classTable[`${type}TypeLink`]}
                          title={type}
                          to={{
                            name: 'web.jobs',
                            params: {state: this.state.currentState, type: type, sort: this.props.params.sort}
                          }}
                        >
                          {type}
                        </Link>
                      )
                    )
                  }
                </div>
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
          <div className="container-fluid">
            <div className="row">
              <div className="col-12 text-center text-secondary pt-5 pb-5">
                &copy; Keu Admin Panel
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
};
