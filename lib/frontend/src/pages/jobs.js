const classNames = require('classnames');
const React = require('react');
const PropTypes = require('prop-types');
const progress = require('nprogress');
const {RouterView, Link, getRouter} = require('capybara-router');
const InfiniteScroll = require('@kelp404/react-infinite-scroller');
const FlipMove = require('react-flip-move').default;
const Base = require('./shared/base');
const Loading = require('../components/loading');
const utils = require('../utils');
const {jobStates, eventTypes} = require('../constants');
const api = require('../api');
const store = require('../store');

module.exports = class Jobs extends Base {
  static get propTypes() {
    return {
      params: PropTypes.shape({
        queue: PropTypes.string,
        state: PropTypes.string,
      }).isRequired,
      queues: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
      }).isRequired).isRequired,
      jobs: PropTypes.shape({
        index: PropTypes.number.isRequired,
        total: PropTypes.number.isRequired,
        items: PropTypes.arrayOf(PropTypes.shape({
          id: PropTypes.string.isRequired,
          data: PropTypes.object,
          timestamp: PropTypes.number.isRequired,
        }).isRequired).isRequired,
      }),
    };
  }

  constructor(props) {
    super(props);
    if (!props.jobs) {
      // The Layout component will redirect to the jobs page with a queue name.
      return;
    }

    this.state.jobs = props.jobs;
  }

  componentDidMount() {
    super.componentDidMount();
    const {params, queues} = this.props;

    if (!params.queue) {
      getRouter().go({name: 'web.jobs', params: {queue: queues[0].name}});
      return;
    }

    // Job notifications ----------------------------------
    this.$listens.push(
      api.subscribe(eventTypes.WAITING, ({body}) => {
        this.notificationHandler(eventTypes.WAITING, body.queueName, body.job);
      }),
    );
    this.$listens.push(
      api.subscribe(eventTypes.ACTIVE, ({body}) => {
        this.notificationHandler(eventTypes.ACTIVE, body.queueName, body.job);
      }),
    );
    this.$listens.push(
      api.subscribe(eventTypes.COMPLETED, ({body}) => {
        this.notificationHandler(eventTypes.COMPLETED, body.queueName, body.job);
      }),
    );
    this.$listens.push(
      api.subscribe(eventTypes.FAILED, ({body}) => {
        this.notificationHandler(eventTypes.FAILED, body.queueName, body.job);
      }),
    );
    this.$listens.push(
      api.subscribe(eventTypes.REMOVED, ({body}) => {
        this.notificationHandler(eventTypes.REMOVED, body.queueName, body.job);
      }),
    );
    // ----------------------------------------------------
  }

  notificationHandler = (eventType, queueName, job) => {
    const {params} = this.props;

    if (params.queue !== queueName) {
      // The notification queue isn't equal current queue.
      return;
    }

    if (eventType === eventTypes.REMOVED) {
      this.removeJob(job.id);
      return;
    }

    const jobEventStateMapping = {
      [eventTypes.ACTIVE]: jobStates.ACTIVE,
      [eventTypes.WAITING]: jobStates.WAITING,
      [eventTypes.COMPLETED]: jobStates.COMPLETED,
      [eventTypes.FAILED]: jobStates.FAILED,
    };
    const newJobState = jobEventStateMapping[eventType];

    if (newJobState === params.state) {
      // Add the job in the current page.
      this.setState(
        prevState => {
          const jobIds = new Set(prevState.jobs.items.map(x => x.id));

          if (jobIds.has(job.id)) {
            return;
          }

          const jobs = {
            index: prevState.jobs.index,
            total: prevState.jobs.total + 1,
            items: [
              job,
              ...prevState.jobs.items,
            ],
          };

          return {jobs};
        },
        () => {
          store.set('currentStateJobQuantity', this.state.jobs.total);
        },
      );
    } else {
      this.removeJob(job.id);
    }
  };

  /**
   * Remove the job from the state.
   * @param {string} jobId
   */
  removeJob = jobId => this.setState(
    prevState => {
      const jobIndex = prevState.jobs.items.findIndex(x => x.id === jobId);

      if (jobIndex >= 0) {
        const jobs = {
          index: prevState.jobs.index,
          total: prevState.jobs.total - 1,
          items: [
            ...prevState.jobs.items.slice(0, jobIndex),
            ...prevState.jobs.items.slice(jobIndex + 1),
          ],
        };
        return {jobs};
      }
    },
    () => {
      store.set('currentStateJobQuantity', this.state.jobs.total);
      this.loadNextPage(this.state.jobs.index); // Reload the current page.
    },
  );

  loadNextPage = index => {
    const {params} = this.props;

    return api.job.getJobs(
      params.queue,
      {index, state: params.state || jobStates.ACTIVE},
      {isBackground: true},
    )
      .then(({body}) => this.setState(
        prevState => {
          const jobs = body;
          const items = [...prevState.jobs.items];
          const jobIds = new Set(items.map(x => x.id));

          jobs.items.forEach(job => {
            // Make sure the new job isn't exist.
            if (!jobIds.has(job.id)) {
              items.push(job);
            }
          });
          return {jobs: {index: jobs.index, items, total: jobs.total}};
        },
        () => {
          store.set('currentStateJobQuantity', this.state.jobs.total);
        },
      ))
      .catch(utils.renderError);
  };

  generateClickRemoveJobLinkHandler = jobId => event => {
    const {params} = this.props;

    event.preventDefault();
    progress.start();
    api.job.deleteJob(params.queue, jobId)
      .catch(utils.renderError)
      .finally(progress.done);
  };

  onClickCleanJobsButton = event => {
    const {params} = this.props;

    event.preventDefault();
    progress.start();
    api.job.cleanJobs(params.queue, params.state || eventTypes.ACTIVE)
      .then(getRouter().reload)
      .catch(error => {
        progress.done();
        utils.renderError(error);
      });
  };

  infiniteScrollLoadingRender() {
    return <div key={0}><Loading/></div>;
  }

  render() {
    const {params} = this.props;
    const {$isApiProcessing, jobs} = this.state;

    if (!jobs) {
      // The Layout component will redirect to the jobs page with a queue name.
      return <Loading/>;
    }

    const currentState = params.state || jobStates.ACTIVE;
    const isDisableCleanButton = $isApiProcessing || jobs.items.length === 0
      || [jobStates.COMPLETED, jobStates.FAILED].indexOf(currentState) < 0;
    const isShowRemoveButton = currentState !== jobStates.ACTIVE;

    return (
      <>
        <div className="tab-content" style={{minHeight: '60vh'}}>
          <div className="text-right mb-2">
            <button
              disabled={isDisableCleanButton}
              className="btn btn-outline-secondary" type="button"
              onClick={this.onClickCleanJobsButton}
            >
              Clean all jobs
            </button>
          </div>

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
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-truncate">
                        <h5 className="mb-1 text-truncate">
                          <Link to={{name: 'web.jobs.details', params: {...params, jobId: job.id}}}>
                            #{job.id}
                          </Link>
                          <small className="ml-2 text-muted text-truncate">
                            {JSON.stringify(job.data).slice(0, 512)}
                          </small>
                        </h5>
                        <small className="text-muted">{utils.formatDate(job.timestamp)}</small>
                      </div>
                      {
                        isShowRemoveButton && (
                          <div>
                            <a
                              href="#delete"
                              className={classNames('btn btn-link text-danger', {disabled: $isApiProcessing})}
                              onClick={this.generateClickRemoveJobLinkHandler(job.id)}
                            >
                              <i className="far fa-trash-alt"/>
                            </a>
                          </div>
                        )
                      }
                    </div>
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
