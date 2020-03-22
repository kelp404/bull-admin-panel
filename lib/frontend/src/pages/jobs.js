const classNames = require('classnames');
const React = require('react');
const PropTypes = require('prop-types');
const {RouterView, Link} = require('capybara-router');
const Base = require('./shared/base');
const Loading = require('../components/loading');
const utils = require('../utils');
const {jobStates} = require('../constants');

module.exports = class Jobs extends Base {
  static get propTypes() {
    return {
      params: PropTypes.shape({
        queue: PropTypes.string
      }).isRequired,
      jobCounts: PropTypes.shape({
        waiting: PropTypes.number.isRequired,
        active: PropTypes.number.isRequired,
        completed: PropTypes.number.isRequired,
        failed: PropTypes.number.isRequired,
        delayed: PropTypes.number.isRequired
      }),
      jobs: PropTypes.shape({
        items: PropTypes.arrayOf(PropTypes.shape({
          id: PropTypes.string.isRequired
        }).isRequired).isRequired
      })
    };
  }

  render() {
    const {params, jobCounts, jobs} = this.props;

    if (!jobs) {
      return <Loading/>;
    }

    return (
      <>
        <ul className="nav nav-tabs mb-2">
          <li className="nav-item">
            <Link
              className={classNames('nav-link', {active: params.state === jobStates.ACTIVE})}
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
          <div className="list-group">
            <a href="#" className="list-group-item list-group-item-action">
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">List group item heading</h5>
                <small>3 days ago</small>
              </div>
            </a>
          </div>
        </div>
        <RouterView/>
      </>
    );
  }
};
