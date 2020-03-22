const React = require('react');
const PropTypes = require('prop-types');
const Base = require('./shared/base');
const Loading = require('../components/loading');

module.exports = class Jobs extends Base {
  static get propTypes() {
    return {
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
    const {jobs} = this.props;

    if (!jobs) {
      return <Loading/>;
    }

    return (
      <div className="list-group mt-2">
        <a href="#" className="list-group-item list-group-item-action">
          <div className="d-flex w-100 justify-content-between">
            <h5 className="mb-1">List group item heading</h5>
            <small>3 days ago</small>
          </div>
        </a>
      </div>
    );
  }
};
