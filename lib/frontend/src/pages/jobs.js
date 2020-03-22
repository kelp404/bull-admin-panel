const classNames = require('classnames');
const React = require('react');
const PropTypes = require('prop-types');
const {RouterView, Link} = require('capybara-router');
const InfiniteScroll = require('react-infinite-scroll');
const Base = require('./shared/base');
const Loading = require('../components/loading');
const utils = require('../utils');
const {jobStates} = require('../constants');
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
        index: PropTypes.number.isRequired,
        size: PropTypes.number.isRequired,
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
    this.state.jobs = props.jobs;
  }

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
    const {params, jobCounts} = this.props;
    const {jobs} = this.state;

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
          {
            jobs.items.length === 0 && (
              <p className="text-center text-muted py-5 h4">Empty</p>
            )
          }
          {
            jobs.items.length > 0 && (
              <InfiniteScroll
                pageStart={0}
                loadMore={this.loadNextPage}
                hasMore={jobs.items.length < jobs.total}
                loader={this.infiniteScrollLoadingRender()}
              >
                <div className="list-group">
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
                </div>
              </InfiniteScroll>
            )
          }
        </div>
        <RouterView/>
      </>
    );
  }
};
