const classNames = require('classnames');
const React = require('react');
const PropTypes = require('prop-types');
const {RouterView, Link} = require('capybara-router');
const InfiniteScroll = require('react-infinite-scroll');
const FlipMove = require('react-flip-move').default;
const Base = require('./shared/base');
const Loading = require('../components/loading');
const utils = require('../utils');
const {jobStates, eventTypes} = require('../constants');
const api = require('../api');

module.exports = class Jobs extends Base {
  static get propTypes() {
    return {
      params: PropTypes.shape({
        queue: PropTypes.string,
        state: PropTypes.string
      }).isRequired,
      jobCounts: PropTypes.shape({
        waiting: PropTypes.number.isRequired,
        active: PropTypes.number.isRequired,
        completed: PropTypes.number.isRequired,
        failed: PropTypes.number.isRequired,
        delayed: PropTypes.number.isRequired
      }),
      jobs: PropTypes.shape({
        total: PropTypes.number.isRequired,
        items: PropTypes.arrayOf(PropTypes.shape({
          id: PropTypes.string.isRequired,
          data: PropTypes.object,
          timestamp: PropTypes.number.isRequired
        }).isRequired).isRequired
      })
    };
  }

  constructor(props) {
    super(props);
    this.countJobsTimeout = null;
    this.state.jobs = props.jobs;
    this.state.jobCounts = props.jobCounts;
    // Job notifications ----------------------------------
    this.$listens.push(
      api.subscribe(eventTypes.JOB_WAITING, data => {
        this.notificationHandler(eventTypes.JOB_WAITING, data.queueName, data.id);
      })
    );
    this.$listens.push(
      api.subscribe(eventTypes.JOB_ACTIVE, data => {
        this.notificationHandler(eventTypes.JOB_ACTIVE, data.queueName, data.id);
      })
    );
    this.$listens.push(
      api.subscribe(eventTypes.JOB_COMPLETED, data => {
        this.notificationHandler(eventTypes.JOB_COMPLETED, data.queueName, data.id);
      })
    );
    this.$listens.push(
      api.subscribe(eventTypes.JOB_FAILED, data => {
        this.notificationHandler(eventTypes.JOB_FAILED, data.queueName, data.id);
      })
    );
    this.$listens.push(
      api.subscribe(eventTypes.JOB_REMOVED, data => {
        this.notificationHandler(eventTypes.JOB_REMOVED, data.queueName, data.id);
      })
    );
    // ----------------------------------------------------
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    if (this.countJobsTimeout != null) {
      clearTimeout(this.countJobsTimeout);
      this.countJobsTimeout = null;
    }
  }

  countJobs = () => {
    const {params} = this.props;
    if (this.countJobsTimeout != null) {
      return;
    }

    this.countJobsTimeout = setTimeout(() => {
      api.job.countAllStateJobs(params.queue)
        .then(jobCounts => {
          if (this.countJobsTimeout == null) {
            return;
          }

          this.setState({jobCounts}, () => {
            this.countJobsTimeout = null;
          });
        });
    }, 1000);
  };

  notificationHandler = (eventType, queueName, jobId) => {
    const {params} = this.props;
    if (params.queue !== queueName) {
      // The notification queue isn't equal current queue.
      return;
    }

    const removeJobFromState = jobId => this.setState(prevState => {
      const jobIndex = prevState.jobs.items.findIndex(x => x.id === jobId);
      const jobs = {total: prevState.jobs.total, items: [...prevState.jobs.items]};

      if (jobIndex >= 0) {
        jobs.total -= 1;
        jobs.items.splice(jobIndex, 1);
        return {jobs};
      }
    });

    this.countJobs();
    if (eventType === eventTypes.JOB_REMOVED) {
      // The job was removed.
      removeJobFromState(jobId);
      return;
    }

    api.job.getJob(queueName, jobId)
      .then(job => this.setState(prevState => {
        if (job.state !== params.state) {
          // The notification job state isn't equal current state.
          removeJobFromState(jobId);
          return;
        }

        const lastJobIndex = prevState.jobs.items.findIndex(x => Number(x.id) < Number(jobId));
        const jobs = {total: prevState.jobs.total + 1, items: [...prevState.jobs.items]};

        if (lastJobIndex < 0) {
          jobs.items.unshift(job);
        } else {
          jobs.items.splice(lastJobIndex, 0, job);
        }

        return {jobs};
      }));
  };

  loadNextPage = index => {
    const {params} = this.props;

    return api.job.getJobs(
      params.queue,
      {index, state: params.state || jobStates.ACTIVE}
    )
      .then(jobs => {
        this.setState(prevState => {
          const items = [...prevState.jobs.items];

          jobs.items.forEach(job => {
            items.push(job);
          });
          return {jobs: {items, total: jobs.total}};
        });
      });
  };

  infiniteScrollLoadingRender() {
    return <div key={0}><Loading/></div>;
  }

  render() {
    const {params} = this.props;
    const {jobCounts, jobs} = this.state;

    if (!jobs) {
      return <Loading/>;
    }

    return (
      <>
        <ul className="nav nav-tabs mb-2">
          <li className="nav-item">
            <Link
              className={classNames('nav-link', {active: (params.state || jobStates.ACTIVE) === jobStates.ACTIVE})}
              to={{name: 'web.jobs', params: {queue: params.queue, state: jobStates.ACTIVE}}}
            >
              Active <span className="badge badge-pill badge-secondary">{utils.formatNumber(jobCounts.active)}</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              className={classNames('nav-link', {active: params.state === jobStates.WAITING})}
              to={{name: 'web.jobs', params: {queue: params.queue, state: jobStates.WAITING}}}
            >
              Waiting <span className="badge badge-pill badge-secondary">{utils.formatNumber(jobCounts.waiting)}</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              className={classNames('nav-link', {active: params.state === jobStates.COMPLETED})}
              to={{name: 'web.jobs', params: {queue: params.queue, state: jobStates.COMPLETED}}}
            >
              Completed <span className="badge badge-pill badge-secondary">{utils.formatNumber(jobCounts.completed)}</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              className={classNames('nav-link', {active: params.state === jobStates.FAILED})}
              to={{name: 'web.jobs', params: {queue: params.queue, state: jobStates.FAILED}}}
            >
              Failed <span className="badge badge-pill badge-secondary">{utils.formatNumber(jobCounts.failed)}</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              className={classNames('nav-link', {active: params.state === jobStates.DELAYED})}
              to={{name: 'web.jobs', params: {queue: params.queue, state: jobStates.DELAYED}}}
            >
              Delayed <span className="badge badge-pill badge-secondary">{utils.formatNumber(jobCounts.delayed)}</span>
            </Link>
          </li>
        </ul>

        <div className="tab-content" style={{minHeight: '60vh'}}>
          <InfiniteScroll
            pageStart={0}
            loadMore={this.loadNextPage}
            hasMore={jobs.items.length < jobs.total}
            loader={this.infiniteScrollLoadingRender()}
          >
            <FlipMove
              typeName="div" className="list-group"
              enterAnimation="fade" leaveAnimation="fade"
            >
              {
                jobs.items.map(job => (
                  <div key={job.id} className="list-group-item">
                    <div className="d-flex justify-content-between">
                      <h5 className="mb-1 text-truncate">
                        <Link to={{name: 'web.jobs.details', params: {...params, jobId: job.id}}}>
                          #{job.id}
                        </Link>
                        <small className="ml-2 text-muted text-truncate">
                          {JSON.stringify(job.data).substr(0, 512)}
                        </small>
                      </h5>
                    </div>
                    <small className="text-muted">{utils.formatDate(job.timestamp)}</small>
                  </div>
                ))
              }
            </FlipMove>
          </InfiniteScroll>
          {
            jobs.items.length === 0 && (
              <p className="text-center text-muted py-5 h4">Empty</p>
            )
          }
        </div>
        <RouterView/>
      </>
    );
  }
};
