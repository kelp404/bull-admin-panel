const binarySearch = require('binary-search');
const classNames = require('classnames');
const React = require('react');
const PropTypes = require('prop-types');
const dayjs = require('dayjs');
const nprogress = require('nprogress');
const {AutoSizer, List, WindowScroller} = require('react-virtualized');
const TimeAgo = require('react-timeago').default;
const {RouterView, Link, getRouter} = require('capybara-router');
const {jobState} = require('../constants');
const Base = require('./shared/base');
const api = require('../api');
const store = require('../store');

const ANIMATE_DURATION = 500; // CSS class: faster.

module.exports = class Jobs extends Base {
  static get propTypes() {
    return {
      jobs: PropTypes.array.isRequired,
      jobQuantity: PropTypes.object.isRequired
    };
  }

  constructor(props) {
    super(props);
    this.state.jobs = props.jobs;
    this.state.scrollToIndex = -1;
    this.state.rowHeight = props.params.state === jobState.FAILED ? 106 : 81;
    this.listRef = null;
    this.rowRenderer = this.rowRenderer.bind(this);
    this.removeJob = this.removeJob.bind(this);
    this.generateDeleteJobHandler = this.generateDeleteJobHandler.bind(this);
    this.generateRestartJobHandler = this.generateRestartJobHandler.bind(this);

    // Job notifications ----------------------------------
    this.$listens.push(
      api.subscribe(api.eventTypes.JOB_ENQUEUE, job => {
        if (props.params.state === jobState.INACTIVE) {
          if (job.state !== jobState.INACTIVE || (props.params.type && props.params.type !== job.type)) {
            // The job state was become active or not match the type filter.
            return;
          }

          // Insert the new job into the grid.
          this.insertJob(job);
        } else {
          // The enqueue job maybe from other states. We should remote it in the grid.
          this.removeJob(job);
        }
      })
    );
    this.$listens.push(
      api.subscribe(api.eventTypes.JOB_START, job => {
        if (job.state === (props.params.state || jobState.ACTIVE)) {
          if (job.state !== jobState.ACTIVE || (props.params.type && props.params.type !== job.type)) {
            // The job state was done or not match the type filter.
            return;
          }

          this.insertJob(job);
        } else {
          this.removeJob(job);
        }
      })
    );
    this.$listens.push(
      api.subscribe(api.eventTypes.JOB_COMPLETE, job => {
        if (job.state === props.params.state) {
          if (props.params.type && props.params.type !== job.type) {
            return;
          }

          this.insertJob(job);
        } else {
          this.removeJob(job);
        }
      })
    );
    this.$listens.push(
      api.subscribe(api.eventTypes.JOB_FAILED, job => {
        if (job.state === props.params.state) {
          if (props.params.type && props.params.type !== job.type) {
            return;
          }

          this.insertJob(job);
        } else {
          this.removeJob(job);
        }
      })
    );
    this.$listens.push(
      api.subscribe(api.eventTypes.JOB_REMOVE, job => {
        if (this.removeJob(job)) {
          // Decrease the job quantity at the navigation.
          const jobQuantity = store.get('$jobQuantity');
          jobQuantity[(props.params.state || jobState.ACTIVE)] -= 1;
          store.set('$jobQuantity', jobQuantity);
        }
      })
    );
    // ----------------------------------------------------
  }

  insertJob(job) {
    /*
    @param job {JobModel}
     */
    let jobIndex;

    if (this.props.params.sort === 'asc') {
      jobIndex = binarySearch(this.state.jobs, job, (a, b) => a.id - b.id);
    } else {
      jobIndex = binarySearch(this.state.jobs, job, (a, b) => b.id - a.id);
    }

    if (jobIndex >= 0) {
      // The job is already exists.
      return this.updateJob(jobIndex, job);
    }

    jobIndex = -jobIndex - 1;

    this.setState(prevState => {
      const nextState = Object.assign({}, prevState);
      job.animateInsert = true;
      nextState.jobs.splice(jobIndex, 0, job);
      return nextState;
    });
    this.listRef.forceUpdateGrid();
    setTimeout(() => {
      delete job.animateInsert;
      this.listRef.forceUpdateGrid();
    }, ANIMATE_DURATION);
  }

  updateJob(index, job) {
    /*
    Update the job in the grid.
    @param index {Number}
    @param job {JobModel}
     */
    window.listRef = this.listRef;
    this.setState(prevState => {
      const nextState = Object.assign({}, prevState);
      job.animateUpdate = true;
      nextState.jobs[index] = job;
      return nextState;
    });
    this.listRef.forceUpdateGrid();
    setTimeout(() => {
      delete job.animateUpdate;
      this.listRef.forceUpdateGrid();
    }, ANIMATE_DURATION);
  }

  removeJob(job) {
    /*
    Remove the job in the grid with the animation.
    @param job {JobModel}
     */
    let comparator;
    if (this.props.params.sort === 'asc') {
      comparator = (a, b) => a.id - b.id;
    } else {
      comparator = (a, b) => b.id - a.id;
    }

    const jobIndex = binarySearch(this.state.jobs, job, comparator);
    if (jobIndex < 0) {
      return false;
    }

    this.setState(prevState => {
      const nextState = Object.assign({}, prevState);
      job = nextState.jobs[jobIndex];
      job.animateDelete = true;
      return nextState;
    });
    this.listRef.forceUpdateGrid();
    setTimeout(() => {
      const jobIndex = this.state.jobs.findIndex(x => x.animateDelete);
      if (jobIndex < 0) {
        return;
      }

      this.setState(prevState => {
        const nextState = Object.assign({}, prevState);
        nextState.jobs.splice(jobIndex, 1);
        return nextState;
      });
    }, ANIMATE_DURATION);
    return true;
  }

  generateDeleteJobHandler(index) {
    /*
    @param index {Number}
    @returns {Function}
     */
    return () => {
      const job = this.state.jobs[index];

      nprogress.start();
      api.job.deleteJob(job.id)
        .catch(error => {
          getRouter().renderError(error);
        })
        .finally(nprogress.done);
    };
  }

  generateRestartJobHandler(index) {
    return () => {
      const job = this.state.jobs[index];

      nprogress.start();
      api.job.restartJob(job.id)
        .then(() => {
          // Decrease the job quantity at the navigation.
          const jobQuantity = store.get('$jobQuantity');
          jobQuantity[job.state] -= 1;
          store.set('$jobQuantity', jobQuantity);
        })
        .catch(error => {
          getRouter().renderError(error);
        })
        .finally(nprogress.done);
    };
  }

  rowRenderer({index, key, style}) {
    window.listRef = this.listRef;

    const job = this.state.jobs[index];
    const detailLinkParams = Object.assign({}, {jobId: job.id}, this.props.params);
    const updatedAtText = dayjs(job.updatedAt).format('LLL');
    const className = classNames([
      'list-group-item',
      {
        'animated faster zoomOutDown': job.animateDelete,
        'animated faster fadeIn': job.animateUpdate,
        'animated faster zoomIn': job.animateInsert
      }
    ]);
    let shortErrorMessage;

    if (this.props.params.state === jobState.FAILED && job.error) {
      shortErrorMessage = job.error.match(/^(.*)\n/)[1];
    }

    return (
      <div key={key} className={className} style={{
        ...style,
        height: index < this.state.jobs.length - 1 ? style.height + 1 : style.height
      }}
      >
        <div className="d-flex justify-content-between">
          <div className="text-truncate">
            <h5 className="mb-1 text-truncate">
              <Link to={{name: 'web.jobs.details', params: detailLinkParams}}>#{job.id}</Link> <small className="text-secondary">{job.type}</small>
            </h5>
            {
              shortErrorMessage && (<p className="mb-1 text-dark text-truncate">{shortErrorMessage}</p>)
            }
          </div>

          {/* Action buttons */}
          <div className="ml-auto text-right" style={{width: '110px', minWidth: '110px'}}>
            <Link to={{name: 'web.jobs.details', params: detailLinkParams}} className="btn btn-outline-secondary btn-sm"><i className="fas fa-info-circle"/></Link>
            &nbsp;
            <button className="btn btn-outline-primary btn-sm"
              type="button" title="Restart" style={{boxShadow: 'none'}}
              onClick={this.generateRestartJobHandler(index)}
            >
              <i className="fas fa-redo"/>
            </button>
            &nbsp;
            <button className="btn btn-outline-danger btn-sm"
              type="button" title="Delete" style={{boxShadow: 'none'}}
              onClick={this.generateDeleteJobHandler(index)}
            >
              <i className="far fa-trash-alt"/>
            </button>
          </div>
        </div>
        <small className="text-secondary">
          <TimeAgo date={job.updatedAt} title={updatedAtText}/>
        </small>
      </div>
    );
  }

  render() {
    const classTable = {
      ascLink: classNames([
        'btn btn-secondary',
        {active: this.props.params.sort === 'asc'}
      ]),
      descLink: classNames([
        'btn btn-secondary',
        {active: !this.props.params.sort || this.props.params.sort === 'desc'}
      ])
    };

    return (
      <>
        <div className="d-flex justify-content-between mb-2">
          <div className="btn-group">
            <Link to={{
              name: 'web.jobs',
              params: {state: this.props.params.state, type: this.props.params.type, sort: 'asc'}
            }} className={classTable.ascLink}
            >ASC
            </Link>
            <Link to={{
              name: 'web.jobs',
              params: {state: this.props.params.state, type: this.props.params.type, sort: 'desc'}
            }} className={classTable.descLink}
            >DESC
            </Link>
          </div>
        </div>
        <WindowScroller scrollElement={window}>
          {({height, isScrolling, registerChild, onChildScroll, scrollTop}) => (
            <div>
              <AutoSizer disableHeight>
                {({width}) => (
                  <div ref={registerChild}>
                    <List
                      ref={el => {
                        this.listRef = el;
                      }}
                      autoHeight
                      height={height}
                      className="list-group"
                      isScrolling={isScrolling}
                      overscanRowCount={2}
                      rowCount={this.state.jobs.length}
                      tabIndex={null}
                      rowRenderer={this.rowRenderer}
                      scrollToIndex={this.state.scrollToIndex}
                      scrollTop={scrollTop}
                      width={width}
                      rowHeight={this.state.rowHeight}
                      onScroll={onChildScroll}
                    />
                  </div>
                )}
              </AutoSizer>
            </div>
          )}
        </WindowScroller>
        {
          !this.state.jobs.length && (<p className="text-center text-secondary p-5 h3">Empty</p>)
        }
        <RouterView/>
      </>
    );
  }
};
