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
    this.state.currentQueue = props.params.queue;
    this.state.currentState = props.params.state;

    this.$listens.push(
      router.listen('ChangeStart', (action, toState) => {
        this.setState({
          currentQueue: toState.params.queue,
          currentState: toState.params.state || jobState.ACTIVE
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
        queue: event.target.value,
        state: this.state.currentState
      }
    });
  };

  render() {
    const {queues} = this.props;

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
                    queues.map(queue => (
                      <Link
                        key={queue.name}
                        className={classNames(
                          'list-group-item list-group-item-action text-truncate',
                          {'list-group-item-secondary active': this.state.currentQueue === queue.name}
                        )}
                        title={queue.name}
                        to={{
                          name: 'web.jobs',
                          params: {queue: queue.name, state: this.state.currentState}
                        }}
                      >
                        {queue.name}
                      </Link>
                    ))
                  }
                </div>
              </div>
              <div className="col-12 col-md-9">
                <div className="d-md-none form-group">
                  <select className="form-control" value={this.state.currentQueue} onChange={this.onChangeJobTypeSelect}>
                    {
                      queues.map(
                        queue => <option key={queue.name} value={queue.name}>{queue.name}</option>
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
