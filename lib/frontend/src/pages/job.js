const $ = require('jquery');
const classNames = require('classnames');
const nprogress = require('nprogress');
const React = require('react');
const {getRouter} = require('capybara-router');
const {jobStates} = require('../constants');
const utils = require('../utils');
const Base = require('./shared/base');
const api = require('../api');

module.exports = class Job extends Base {
  constructor(props) {
    super(props);
    this.isDeleted = false; // It will be true after the user delete the job.
    this.modalRef = React.createRef();
    this.onRestartJob = this.onRestartJob.bind(this);
    this.onDeleteJob = this.onDeleteJob.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();
    const $modal = $(this.modalRef.current);
    $modal.modal('show');
    $modal.one('hidden.bs.modal', () => {
      if (this.isComponentWillUnmount) {
        // Don't push the history state again.
        return;
      }

      const router = getRouter();
      router.go(
        {
          name: 'web.jobs',
          params: this.props.params
        },
        {replace: this.isDeleted}
      );
    });
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.isComponentWillUnmount = true;
    $('body').removeClass('modal-open');
    $('.modal').modal('hide');
    $('.modal-backdrop').remove();
  }

  onRestartJob(e) {
    /*
    The user click the restart button.
     */
    e.preventDefault();
    nprogress.start();
    api.job.restartJob(this.props.job.id)
      .then(() => {
        $(this.modalRef.current).modal('hide');
      })
      .catch(error => {
        nprogress.done();
        getRouter().renderError(error);
      });
  }

  onDeleteJob(e) {
    /*
    The user click the delete button.
     */
    e.preventDefault();
    nprogress.start();
    api.job.deleteJob(this.props.job.id)
      .then(() => {
        this.isDeleted = true;
        $(this.modalRef.current).modal('hide');
      })
      .catch(error => {
        nprogress.done();
        getRouter().renderError(error);
      });
  }

  render() {
    const job = this.props.job;
    const classTable = {
      stateBadge: classNames(['badge', {
        'badge-secondary': [jobStates.WAITING, jobStates.DELAYED].indexOf(job.state) >= 0,
        'badge-primary': job.state === jobStates.ACTIVE,
        'badge-success': job.state === jobStates.COMPLETED,
        'badge-danger': job.state === jobStates.FAILED
      }])
    };

    return (
      <div ref={this.modalRef} className="modal fade" tabIndex="-1">
        <form className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                #{job.id}
                &nbsp;
                <small className="text-secondary">
                  {job.type} <span className={classTable.stateBadge}>{job.state}</span>
                </small>
              </h5>
              <button type="button" className="close" data-dismiss="modal">
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group row">
                <label className="col-sm-2 col-form-label">Priority</label>
                <div className="col-sm-10">
                  <input readOnly value={job.priority} type="text" className="form-control-plaintext"/>
                </div>
              </div>
              <div className="form-group row">
                <label className="col-sm-2 col-form-label">Created</label>
                <div className="col-sm-10">
                  <input
                    readOnly
                    value={utils.formatDate(job.createdAt)}
                    type="text" className="form-control-plaintext"/>
                </div>
              </div>
              {
                job.startedAt && (
                  <div className="form-group row">
                    <label className="col-sm-2 col-form-label">Started</label>
                    <div className="col-sm-10">
                      <input
                        readOnly
                        value={utils.formatDate(job.startedAt)}
                        type="text" className="form-control-plaintext"/>
                    </div>
                  </div>
                )
              }
              {
                job.failedAt && (
                  <div className="form-group row">
                    <label className="col-sm-2 col-form-label">Failed</label>
                    <div className="col-sm-10">
                      <input
                        readOnly
                        value={utils.formatDate(job.failedAt)}
                        type="text" className="form-control-plaintext"/>
                    </div>
                  </div>
                )
              }
              <div className="form-group row">
                <label className="col-sm-2 col-form-label">Updated</label>
                <div className="col-sm-10">
                  <input
                    readOnly
                    value={utils.formatDate(job.updatedAt)}
                    type="text" className="form-control-plaintext"/>
                </div>
              </div>
              {
                job.data && (
                  <>
                    {
                      typeof job.data === 'object' && Object.keys(job.data).length > 0 && (
                        <>
                          <p className="h5">Data</p>
                          <hr className="mt-1 mb-2"/>
                          <pre className="bg-light p-2">
                            <code>{JSON.stringify(job.data, null, 2)}</code>
                          </pre>
                        </>
                      )
                    }
                    {
                      typeof job.data !== 'object' && (
                        <>
                          <p className="h5">Data</p>
                          <hr className="mt-1 mb-2"/>
                          <pre className="bg-light p-2">
                            <code>{job.data}</code>
                          </pre>
                        </>
                      )
                    }
                  </>
                )
              }
              {
                job.result && (
                  <>
                    {
                      typeof job.result === 'object' && Object.keys(job.result).length > 0 && (
                        <>
                          <p className="h5">Result</p>
                          <hr className="mt-1 mb-2"/>
                          <pre className="bg-light p-2">
                            <code>{JSON.stringify(job.result, null, 2)}</code>
                          </pre>
                        </>
                      )
                    }
                    {
                      typeof job.result !== 'object' && (
                        <>
                          <p className="h5">Result</p>
                          <hr className="mt-1 mb-2"/>
                          <pre className="bg-light p-2">
                            <code>{job.result}</code>
                          </pre>
                        </>
                      )
                    }
                  </>
                )
              }
              {
                job.error && (
                  <>
                    <p className="h5">Error</p>
                    <hr className="mt-1 mb-2"/>
                    <pre className="bg-light p-2">
                      <code>{job.error}</code>
                    </pre>
                  </>
                )
              }
            </div>
            <div className="modal-footer">
              <button
                type="button" className="btn btn-outline-danger"
                disabled={this.state.$isApiProcessing} onClick={this.onDeleteJob}
              >
                <i className="far fa-fw fa-trash-alt"/> Delete
              </button>
              <button
                type="button" className="btn btn-outline-primary"
                disabled={this.state.$isApiProcessing} onClick={this.onRestartJob}
              >
                <i className="fas fa-fw fa-redo"/> Restart
              </button>
              <button type="submit" className="btn btn-outline-secondary" data-dismiss="modal">Close</button>
            </div>
          </div>
        </form>
      </div>
    );
  }
};
