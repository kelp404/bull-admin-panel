const classNames = require('classnames');
const React = require('react');
const PropTypes = require('prop-types');
const {RouterView, Link, getRouter} = require('capybara-router');
const {jobStates, eventTypes} = require('../../constants');
const Loading = require('../../components/loading');
const Base = require('./base');
const api = require('../../api');
const utils = require('../../utils');
const store = require('../../store');

module.exports = class Layout extends Base {
  static get propTypes() {
    return {
      queues: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
      }).isRequired).isRequired,
    };
  }

  constructor(props) {
    super(props);
    this.countJobsTimeout = {};
    this.state.currentQueue = props.params.queue;
    this.state.currentState = props.params.state;
    this.state.jobCounts = {};
  }

  componentDidMount() {
    super.componentDidMount();
    const {queues} = this.props;

    queues.forEach(queue => this.countJobs(queue.name, 0));

    this.$listens.push(
      getRouter().listen('ChangeSuccess', (action, toState) => {
        this.setState({
          currentQueue: toState.params.queue,
          currentState: toState.params.state || jobStates.ACTIVE,
        });
      }),
    );
    this.$listens.push(
      store.subscribe('currentStateJobQuantity', (_, data) => {
        this.setState(prevState => ({
          jobCounts: {
            ...prevState.jobCounts,
            [prevState.currentQueue]: {
              ...prevState.jobCounts[prevState.currentQueue],
              [prevState.currentState]: data,
            },
          },
        }));
      }),
    );
    // Job notifications ----------------------------------
    this.$listens.push(
      api.subscribe(eventTypes.WAITING, ({body}) => {
        this.countJobs(body.queueName);
      }),
    );
    this.$listens.push(
      api.subscribe(eventTypes.ACTIVE, ({body}) => {
        this.countJobs(body.queueName);
      }),
    );
    this.$listens.push(
      api.subscribe(eventTypes.COMPLETED, ({body}) => {
        this.countJobs(body.queueName);
      }),
    );
    this.$listens.push(
      api.subscribe(eventTypes.FAILED, ({body}) => {
        this.countJobs(body.queueName);
      }),
    );
    this.$listens.push(
      api.subscribe(eventTypes.REMOVED, ({body}) => {
        this.countJobs(body.queueName);
      }),
    );
    // ----------------------------------------------------
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
      api.job.countAllStateJobs(queueName, {isBackground: true}).then(({body}) => {
        const counts = body;

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
          },
        );
      });
    }, delay);
  };

  onClickHomePageLink = event => {
    if (event.metaKey) {
      return;
    }

    event.preventDefault();
    getRouter().go(window.config.basePath, {reload: true});
  };

  onChangeJobTypeSelect = event => {
    getRouter().go({
      name: 'web.jobs',
      params: {
        queue: event.target.value,
        state: this.state.currentState,
      },
    });
  };

  jobStateNavigationRender = () => {
    const {currentQueue, currentState} = this.state;
    const jobCounts = this.state.jobCounts[currentQueue];

    return (
      <ul className="nav nav-tabs mb-2">
        <li className="nav-item">
          <Link
            className={classNames('nav-link', {active: currentState === jobStates.ACTIVE})}
            to={{name: 'web.jobs', params: {queue: currentQueue, state: jobStates.ACTIVE}}}
          >
            Active
            {jobCounts?.active != null && <span className="badge badge-pill badge-secondary ml-1">{utils.formatNumber(jobCounts.active)}</span>}
          </Link>
        </li>
        <li className="nav-item">
          <Link
            className={classNames('nav-link', {active: currentState === jobStates.WAITING})}
            to={{name: 'web.jobs', params: {queue: currentQueue, state: jobStates.WAITING}}}
          >
            Waiting
            {jobCounts?.waiting != null && <span className="badge badge-pill badge-secondary ml-1">{utils.formatNumber(jobCounts.waiting)}</span>}
          </Link>
        </li>
        <li className="nav-item">
          <Link
            className={classNames('nav-link', {active: currentState === jobStates.COMPLETED})}
            to={{name: 'web.jobs', params: {queue: currentQueue, state: jobStates.COMPLETED}}}
          >
            Completed
            {jobCounts?.completed != null && <span className="badge badge-pill badge-secondary ml-1">{utils.formatNumber(jobCounts.completed)}</span>}
          </Link>
        </li>
        <li className="nav-item">
          <Link
            className={classNames('nav-link', {active: currentState === jobStates.FAILED})}
            to={{name: 'web.jobs', params: {queue: currentQueue, state: jobStates.FAILED}}}
          >
            Failed
            {jobCounts?.failed != null && <span className="badge badge-pill badge-secondary ml-1">{utils.formatNumber(jobCounts.failed)}</span>}
          </Link>
        </li>
      </ul>
    );
  };

  render() {
    const {queues} = this.props;
    const {jobCounts, currentQueue, currentState} = this.state;

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
                          {'list-group-item-secondary active': currentQueue === queue.name},
                        )}
                        title={queue.name}
                        to={{
                          name: 'web.jobs',
                          params: {queue: queue.name, state: currentState},
                        }}
                      >
                        <span className="text-truncate">{queue.name}</span>
                        <span className="d-flex flex-column flex-lg-row">
                          <span className="text-truncate text-muted d-flex flex-column flex-fill">
                            <small className="text-truncate">
                              Active: {jobCounts[queue.name]?.active == null ? '-' : utils.formatNumber(jobCounts[queue.name].active)}
                            </small>
                            <small className="text-truncate">
                              Waiting: {jobCounts[queue.name]?.waiting == null ? '-' : utils.formatNumber(jobCounts[queue.name].waiting)}
                            </small>
                          </span>
                          <span className="text-truncate text-muted d-flex flex-column flex-fill">
                            <small className="text-truncate">
                              Completed: {jobCounts[queue.name]?.completed == null ? '-' : utils.formatNumber(jobCounts[queue.name].completed)}
                            </small>
                            <small className="text-truncate">
                              Failed: {jobCounts[queue.name]?.failed == null ? '-' : utils.formatNumber(jobCounts[queue.name].failed)}
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
                  <select className="form-control" value={currentQueue} onChange={this.onChangeJobTypeSelect}>
                    {
                      queues.map(
                        queue => <option key={queue.name} value={queue.name}>{queue.name}</option>,
                      )
                    }
                  </select>
                </div>
                {this.jobStateNavigationRender()}
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
