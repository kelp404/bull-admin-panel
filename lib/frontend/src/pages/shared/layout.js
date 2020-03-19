const classNames = require('classnames');
const React = require('react');
const PropTypes = require('prop-types');
const {RouterView, Link, getRouter} = require('capybara-router');
const {jobState} = require('../../constants');
const Loading = require('../../components/loading');
const Base = require('./base');
const api = require('../../api');

module.exports = class Layout extends Base {
  static get propTypes() {
    return {
      queues: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired
      }).isRequired).isRequired
    };
  }

  constructor(props) {
    super(props);
    const router = getRouter();
    this.state.currentState = props.params.state;
    this.state.currentType = props.params.type;
    this.state.currentSort = props.params.sort;

    this.$listens.push(
      router.listen('ChangeStart', (action, toState) => {
        this.setState({
          currentState: toState.params.state || jobState.ACTIVE,
          currentType: toState.params.type,
          currentSort: toState.params.sort
        });
      })
    );
    // Job notifications ----------------------------------
    this.$listens.push(
      api.subscribe(api.eventTypes.JOB_WAITING, data => {
        console.log(data);
      })
    );
    this.$listens.push(
      api.subscribe(api.eventTypes.JOB_ACTIVE, data => {
        console.log(data);
      })
    );
    this.$listens.push(
      api.subscribe(api.eventTypes.JOB_COMPLETED, data => {
        console.log(data);
      })
    );
    this.$listens.push(
      api.subscribe(api.eventTypes.JOB_FAILED, data => {
        console.log(data);
      })
    );
    this.$listens.push(
      api.subscribe(api.eventTypes.JOB_REMOVED, data => {
        console.log(data);
      })
    );
    // ----------------------------------------------------
  }

  onChangeJobTypeSelect = event => {
    getRouter().go({
      name: 'web.jobs',
      params: {
        state: this.state.currentState,
        type: event.target.value,
        sort: this.state.currentSort
      }
    });
  };

  render() {
    const classTable = {
      allTypesLink: classNames([
        'list-group-item list-group-item-action text-truncate',
        {'list-group-item-secondary active': !this.state.currentType}
      ])
    };
    [].forEach(type => {
      classTable[`${type}TypeLink`] = classNames([
        'list-group-item list-group-item-action text-truncate',
        {'list-group-item-secondary active': this.state.currentType === type}
      ]);
    });

    return (
      <>
        <nav className="navbar navbar-expand-md sticky-top navbar-dark bg-dark">
          <div className="container">
            <Link className="navbar-brand" to={{name: 'web.jobs'}}>Bull Admin Panel</Link>
            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavDropdown">
              <span className="navbar-toggler-icon"/>
            </button>
          </div>
        </nav>

        <div className="pt-3">
          <div className="container">
            <div className="row">
              <div className="d-none d-md-block col-3">
                <div className="list-group">
                  {
                    [].map(
                      type => (
                        <Link
                          key={`type-${type}`}
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
                    {
                      [].map(
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
                &copy; Bull Admin Panel
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
};
