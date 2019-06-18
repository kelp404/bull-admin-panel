const classNames = require('classnames');
const React = require('react');
const PropTypes = require('prop-types');
const {RouterView, Link, getRouter} = require('capybara-router');
const {jobState} = require('../../constants');
const Loading = require('../../components/loading');
const utils = require('../../utils');
const Base = require('./base');
const store = require('../../store');
const api = require('../../api');

module.exports = class Layout extends Base {
  static get propTypes() {
    return {
      types: PropTypes.array.isRequired
    };
  }

  constructor(props) {
    super(props);
    const router = getRouter();
    this.state.currentState = props.params.state;
    this.state.currentType = props.params.type;
    this.state.currentSort = props.params.sort;
    this.onChangeJobTypeSelect = this.onChangeJobTypeSelect.bind(this);

    this.$listens.push(
      router.listen('ChangeStart', (action, toState) => {
        this.setState({
          currentState: toState.params.state || jobState.ACTIVE,
          currentType: toState.params.type,
          currentSort: toState.params.sort
        });
      })
    );
    this.$listens.push(
      store.subscribe('$jobQuantity', (_, jobQuantity) => {
        this.setState({jobQuantity: Object.assign({}, jobQuantity)});
      })
    );
    // Job notifications ----------------------------------
    this.$listens.push(
      api.subscribe(api.eventTypes.JOB_ENQUEUE, () => {
        const jobQuantity = store.get('$jobQuantity');
        jobQuantity.inactive += 1;
        store.set('$jobQuantity', jobQuantity);
      })
    );
    this.$listens.push(
      api.subscribe(api.eventTypes.JOB_START, () => {
        const jobQuantity = store.get('$jobQuantity');
        jobQuantity.inactive -= 1;
        jobQuantity.active += 1;
        store.set('$jobQuantity', jobQuantity);
      })
    );
    this.$listens.push(
      api.subscribe(api.eventTypes.JOB_COMPLETE, () => {
        const jobQuantity = store.get('$jobQuantity');
        jobQuantity.active -= 1;
        jobQuantity.complete += 1;
        store.set('$jobQuantity', jobQuantity);
      })
    );
    this.$listens.push(
      api.subscribe(api.eventTypes.JOB_FAILED, () => {
        const jobQuantity = store.get('$jobQuantity');
        jobQuantity.active -= 1;
        jobQuantity.failed += 1;
        store.set('$jobQuantity', jobQuantity);
      })
    );
    // ----------------------------------------------------
  }

  onChangeJobTypeSelect(event) {
    getRouter().go({
      name: 'web.jobs',
      params: {
        state: this.state.currentState,
        type: event.target.value,
        sort: this.state.currentSort
      }
    });
  }

  render() {
    const classTable = {
      inactiveLink: classNames(['nav-item', {active: this.state.currentState === jobState.INACTIVE}]),
      activeLink: classNames(['nav-item', {active: this.state.currentState === jobState.ACTIVE}]),
      completeLink: classNames(['nav-item', {active: this.state.currentState === jobState.COMPLETE}]),
      failedLink: classNames(['nav-item', {active: this.state.currentState === jobState.FAILED}]),
      delayedLink: classNames(['nav-item', {active: this.state.currentState === jobState.DELAYED}]),
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
    let quantity;
    if (this.state.jobQuantity) {
      quantity = {
        inactive: utils.numberFilter(this.state.jobQuantity.inactive),
        active: utils.numberFilter(this.state.jobQuantity.active),
        complete: utils.numberFilter(this.state.jobQuantity.complete),
        failed: utils.numberFilter(this.state.jobQuantity.failed),
        delayed: utils.numberFilter(this.state.jobQuantity.delayed)
      };
    }

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
                  <Link className="nav-link" to={{name: 'web.jobs', params: {state: jobState.INACTIVE, sort: this.state.currentSort}}}>
                    Inactive {quantity && <span className="badge badge-secondary badge-pill">{quantity.inactive}</span>}
                  </Link>
                </li>
                <li className={classTable.activeLink}>
                  <Link className="nav-link" to={{name: 'web.jobs', params: {state: jobState.ACTIVE, sort: this.state.currentSort}}}>
                    Active {quantity && <span className="badge badge-secondary badge-pill">{quantity.active}</span>}
                  </Link>
                </li>
                <li className={classTable.completeLink}>
                  <Link className="nav-link" to={{name: 'web.jobs', params: {state: jobState.COMPLETE, sort: this.state.currentSort}}}>
                    Complete {quantity && <span className="badge badge-secondary badge-pill">{quantity.complete}</span>}
                  </Link>
                </li>
                <li className={classTable.failedLink}>
                  <Link className="nav-link" to={{name: 'web.jobs', params: {state: jobState.FAILED, sort: this.state.currentSort}}}>
                    Failed {quantity && <span className="badge badge-secondary badge-pill">{quantity.failed}</span>}
                  </Link>
                </li>
                <li className={classTable.delayedLink}>
                  <Link className="nav-link" to={{name: 'web.jobs', params: {state: jobState.DELAYED, sort: this.state.currentSort}}}>
                    Delayed {quantity && <span className="badge badge-secondary badge-pill">{quantity.delayed}</span>}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <div className="pt-3">
          <div className="container">
            <div className="row">
              <div className="d-none d-md-block col-3">
                <div className="list-group">
                  <Link key="type-all"
                    className={classTable.allTypesLink}
                    title="All types"
                    to={{name: 'web.jobs', params: {state: this.state.currentState, sort: this.state.currentSort}}}
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
                            params: {state: this.state.currentState, type: type, sort: this.state.currentSort}
                          }}
                        >
                          {type}
                        </Link>
                      )
                    )
                  }
                </div>
              </div>
              <div className="col-12 col-md-9">
                <div className="d-md-none form-group">
                  <select className="form-control" value={this.state.currentType} onChange={this.onChangeJobTypeSelect}>
                    <option value="">All types</option>
                    {
                      this.props.types.map(
                        type => <option key={`option-${type}`} value={type}>{type}</option>
                      )
                    }
                  </select>
                </div>
                <RouterView><Loading/></RouterView>
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
