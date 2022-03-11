const PropTypes = require('prop-types');
const React = require('react');
const {getRouter} = require('capybara-router');
const progress = require('nprogress');
const Modal = require('react-bootstrap/Modal').default;
const {jobStates} = require('../constants');
const Base = require('./shared/base');
const utils = require('../utils');
const api = require('../api');

module.exports = class Job extends Base {
  static get propTypes() {
    return {
      job: PropTypes.shape({
        id: PropTypes.string.isRequired,
        queue: PropTypes.shape({
          name: PropTypes.string.isRequired,
        }).isRequired,
        state: PropTypes.oneOf([
          jobStates.WAITING,
          jobStates.ACTIVE,
          jobStates.COMPLETED,
          jobStates.FAILED,
        ]).isRequired,
        timestamp: PropTypes.number.isRequired,
        processedOn: PropTypes.number,
        finishedOn: PropTypes.number,
        opts: PropTypes.object.isRequired,
        data: PropTypes.object.isRequired,
        stacktrace: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
      }).isRequired,
    };
  }

  constructor(props) {
    super(props);
    this.state.isShowModal = true;
    this.$listens.push(
      getRouter().listen('ChangeStart', (action, toState, fromState, next) => {
        const isShowModal = toState.name === 'web.jobs.details';
        this.setState({isShowModal});
        next();
      }),
    );
  }

  onClickRemoveButton = () => {
    const {job} = this.props;

    progress.start();
    api.job.deleteJob(job.queue.name, job.id)
      .then(this.onHideModal)
      .catch(error => {
        progress.done();
        utils.renderError(error);
      });
  };

  onClickRetryButton = () => {
    const {job} = this.props;

    progress.start();
    api.job.retryJob(job.queue.name, job.id)
      .then(this.onHideModal)
      .catch(error => {
        progress.done();
        utils.renderError(error);
      });
  };

  onHideModal = () => {
    getRouter().go({
      name: 'web.jobs',
      params: this.props.params,
    });
  };

  /**
   * @param {string} fieldName
   * @param {Object|Array<string>|string} data
   * @returns {React.node}
   */
  fieldRender = (fieldName, data) => {
    const stringValueRender = value => (
      <div className="form-group">
        <label className="text-muted h5 mb-0">{fieldName}</label>
        <span className="form-text">{value}</span>
      </div>
    );

    const arrayValueRender = values => (
      <>
        <p className="text-muted h5 mb-0">{fieldName}</p>
        <hr className="my-2"/>
        {
          values.map((item, index) => {
            const key = `${index}`;
            return (
              <pre key={key} className="rounded bg-light p-2">
                <code>{item}</code>
              </pre>
            );
          })
        }
      </>
    );

    const objectValueRender = value => (
      <>
        <p className="text-muted h5 mb-0">{fieldName}</p>
        <hr className="my-2"/>
        <pre className="rounded bg-light p-2">
          <code>{JSON.stringify(value, null, 2)}</code>
        </pre>
      </>
    );

    if (Array.isArray(data)) {
      return arrayValueRender(data);
    }

    if (typeof data === 'object') {
      return objectValueRender(data);
    }

    return stringValueRender(data);
  };

  stateBadgeRender = job => {
    switch (job.state) {
      case jobStates.COMPLETED:
        return <span className="badge badge-success">completed</span>;
      case jobStates.FAILED:
        return <span className="badge badge-danger">failed</span>;
      default:
        return <small className="badge badge-secondary">{job.state}</small>;
    }
  };

  render() {
    const {job} = this.props;
    const {$isApiProcessing, isShowModal} = this.state;

    return (
      <Modal
        size="lg"
        show={isShowModal}
        autoFocus={false}
        onHide={this.onHideModal}
      >
        <Modal.Header closeButton className="d-flex justify-content-between align-items-center">
          <Modal.Title as="h4">
            #{job.id} <small className="text-muted">{job.queue.name} {this.stateBadgeRender(job)}</small>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.fieldRender('Created', utils.formatDate(job.timestamp))}
          {job.processedOn && this.fieldRender('Processed', utils.formatDate(job.processedOn))}
          {job.finishedOn && this.fieldRender('Finished', utils.formatDate(job.finishedOn))}
          {this.fieldRender('Options', job.opts)}
          {this.fieldRender('Data', job.data)}
          {job.returnvalue && this.fieldRender('Result', job.returnvalue)}
          {job.stacktrace.length > 0 && this.fieldRender('Stack', job.stacktrace)}
        </Modal.Body>
        <Modal.Footer>
          {
            job.state !== jobStates.ACTIVE && (
              <button
                disabled={$isApiProcessing}
                className="btn btn-outline-danger" type="button"
                onClick={this.onClickRemoveButton}
              >
                Remove
              </button>
            )
          }
          {
            job.state === jobStates.FAILED && (
              <button
                disabled={$isApiProcessing}
                className="btn btn-outline-primary" type="button"
                onClick={this.onClickRetryButton}
              >
                Retry
              </button>
            )
          }
          <button className="btn btn-outline-secondary" type="button" onClick={this.onHideModal}>
            Close
          </button>
        </Modal.Footer>
      </Modal>
    );
  }
};
