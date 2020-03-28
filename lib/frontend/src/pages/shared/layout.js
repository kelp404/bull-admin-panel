const classNames = require('classnames');
const React = require('react');
const PropTypes = require('prop-types');
const {RouterView, Link, getRouter} = require('capybara-router');
const {jobStates, eventTypes} = require('../../constants');
const Loading = require('../../components/loading');
const Base = require('./base');
const api = require('../../api');
const utils = require('../../utils');

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
    this.countJobsTimeout = {};
    this.state.currentQueue = props.params.queue;
    this.state.currentState = props.params.state;
    this.state.jobCounts = {};

    this.$listens.push(
      getRouter().listen('ChangeStart', (action, toState) => {
        this.setState({
          currentQueue: toState.params.queue,
          currentState: toState.params.state || jobStates.ACTIVE
        });
      })
    );
    // Job notifications ----------------------------------
    this.$listens.push(
      api.subscribe(eventTypes.WAITING, data => {
        this.countJobs(data.queueName);
      })
    );
    this.$listens.push(
      api.subscribe(eventTypes.ACTIVE, data => {
        this.countJobs(data.queueName);
      })
    );
    this.$listens.push(
      api.subscribe(eventTypes.COMPLETED, data => {
        this.countJobs(data.queueName);
      })
    );
    this.$listens.push(
      api.subscribe(eventTypes.FAILED, data => {
        this.countJobs(data.queueName);
      })
    );
    this.$listens.push(
      api.subscribe(eventTypes.PAUSED, data => {
        this.countJobs(data.queueName);
      })
    );
    this.$listens.push(
      api.subscribe(eventTypes.REMOVED, data => {
        this.countJobs(data.queueName);
      })
    );
    // ----------------------------------------------------
  }

  componentDidMount() {
    super.componentDidMount();
    const {queues} = this.props;
    const {currentQueue} = this.state;

    if (!currentQueue) {
      getRouter().go({name: 'web.jobs', params: {queue: queues[0].name}});
    } else {
      queues.forEach(queue => this.countJobs(queue.name, 0));
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    Object.keys(this.countJobsTimeout).forEach(key => {
      if (this.countJobsTimeout[key] != null) {
        clearTimeout(this.countJobsTimeout[key]);
        this.countJobsTimeout[key] = null;
      }
    });
  }

  countJobs = (queueName, delay = 1000) => {
    if (this.countJobsTimeout[queueName] != null) {
      return;
    }

    this.countJobsTimeout[queueName] = setTimeout(() => {
      api.job.countAllStateJobs(queueName).then(counts => {
        if (this.countJobsTimeout[queueName] == null) {
          return;
        }

        this.setState(
          prevState => {
            const jobCounts = {...prevState.jobCounts};
            jobCounts[queueName] = counts;
            return {jobCounts};
          },
          () => {
            this.countJobsTimeout[queueName] = null;
          }
        );
      });
    }, delay);
  };

  onClickHomePageLink = event => {
    event.preventDefault();
    getRouter().go({name: 'web', params: {}}, {reload: true});
  };

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
    const {jobCounts} = this.state;

    return (
      <>
        <nav className="navbar navbar-expand-md navbar-dark bg-dark">
          <div className="container">
            <a className="navbar-brand" href={window.config.basePath} onClick={this.onClickHomePageLink}>
              Bull Admin Panel
            </a>
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
                          'list-group-item list-group-item-action text-truncate d-flex flex-column',
                          {'list-group-item-secondary active': this.state.currentQueue === queue.name}
                        )}
                        title={queue.name}
                        to={{
                          name: 'web.jobs',
                          params: {queue: queue.name, state: this.state.currentState}
                        }}
                      >
                        <span>{queue.name}</span>
                        <span className="d-flex">
                          <span className="text-muted d-flex flex-column flex-fill">
                            <small>
                              Active: {jobCounts[queue.name] == null ? '-' : utils.formatNumber(jobCounts[queue.name].active)}
                            </small>
                            <small>
                              Waiting: {jobCounts[queue.name] == null ? '-' : utils.formatNumber(jobCounts[queue.name].waiting)}
                            </small>
                          </span>
                          <span className="text-muted d-flex flex-column flex-fill">
                            <small>
                              Completed: {jobCounts[queue.name] == null ? '-' : utils.formatNumber(jobCounts[queue.name].completed)}
                            </small>
                            <small>
                              Failed: {jobCounts[queue.name] == null ? '-' : utils.formatNumber(jobCounts[queue.name].failed)}
                            </small>
                          </span>
                        </span>
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
