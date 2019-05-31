const $ = require('jquery');
const classNames = require('classnames');
const dayjs = require('dayjs');
const React = require('react');
const {getRouter} = require('capybara-router');
const Base = require('./shared/base');

window.$ = $;
module.exports = class Job extends Base {
  constructor(props) {
    super(props);
    this.modalRef = React.createRef();
  }

  componentDidMount() {
    const $modal = $(this.modalRef.current);
    $modal.modal('show');
    $modal.one('hidden.bs.modal', () => {
      if (this.isComponentWillUnmount) {
        // Don't push the history state again.
        return;
      }

      const router = getRouter();
      router.go({
        name: 'web.jobs',
        params: this.props.params
      });
    });
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.isComponentWillUnmount = true;
    $('body').removeClass('modal-open');
    $('.modal').modal('hide');
    $('.modal-backdrop').remove();
  }

  render() {
    const classTable = {
      stateBadge: classNames(['badge', {
        'badge-secondary': ['inactive', 'delayed'].indexOf(this.props.job.state) >= 0,
        'badge-primary': this.props.job.state === 'active',
        'badge-success': this.props.job.state === 'complete',
        'badge-danger': this.props.job.state === 'failed'
      }])
    };

    return (
      <div ref={this.modalRef} className="modal fade" tabIndex="-1">
        <form className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                #{this.props.job.id}
                &nbsp;
                <small className="text-secondary">
                  {this.props.job.type} <span className={classTable.stateBadge}>{this.props.job.state}</span>
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
                  <input readOnly value={this.props.job.priority} type="text" className="form-control-plaintext"/>
                </div>
              </div>
              <div className="form-group row">
                <label className="col-sm-2 col-form-label">Created</label>
                <div className="col-sm-10">
                  <input readOnly value={dayjs(this.props.job.createdAt).format('LLL')} type="text" className="form-control-plaintext"/>
                </div>
              </div>
              {
                this.props.job.startedAt && (
                  <div className="form-group row">
                    <label className="col-sm-2 col-form-label">Started</label>
                    <div className="col-sm-10">
                      <input readOnly value={dayjs(this.props.job.startedAt).format('LLL')} type="text" className="form-control-plaintext"/>
                    </div>
                  </div>
                )
              }
              {
                this.props.job.failedAt && (
                  <div className="form-group row">
                    <label className="col-sm-2 col-form-label">Failed</label>
                    <div className="col-sm-10">
                      <input readOnly value={dayjs(this.props.job.failedAt).format('LLL')} type="text" className="form-control-plaintext"/>
                    </div>
                  </div>
                )
              }
              <div className="form-group row">
                <label className="col-sm-2 col-form-label">Updated</label>
                <div className="col-sm-10">
                  <input readOnly value={dayjs(this.props.job.updatedAt).format('LLL')} type="text" className="form-control-plaintext"/>
                </div>
              </div>
              {
                this.props.job.data && (
                  <>
                    {
                      typeof this.props.job.data === 'object' && Object.keys(this.props.job.data).length > 0 && (
                        <>
                          <p className="h5">Data</p>
                          <hr className="mt-1 mb-2"/>
                          <pre className="bg-light p-2">
                            <code>{JSON.stringify(this.props.job.data, null, 2)}</code>
                          </pre>
                        </>
                      )
                    }
                    {
                      typeof this.props.job.data !== 'object' && (
                        <>
                          <p className="h5">Data</p>
                          <hr className="mt-1 mb-2"/>
                          <pre className="bg-light p-2">
                            <code>{this.props.job.data}</code>
                          </pre>
                        </>
                      )
                    }
                  </>
                )
              }
              {
                this.props.job.result && (
                  <>
                    {
                      typeof this.props.job.result === 'object' && Object.keys(this.props.job.result).length > 0 && (
                        <>
                          <p className="h5">Result</p>
                          <hr className="mt-1 mb-2"/>
                          <pre className="bg-light p-2">
                            <code>{JSON.stringify(this.props.job.result, null, 2)}</code>
                          </pre>
                        </>
                      )
                    }
                    {
                      typeof this.props.job.result !== 'object' && (
                        <>
                          <p className="h5">Result</p>
                          <hr className="mt-1 mb-2"/>
                          <pre className="bg-light p-2">
                            <code>{this.props.job.result}</code>
                          </pre>
                        </>
                      )
                    }
                  </>
                )
              }
              {
                this.props.job.error && (
                  <>
                    <p className="h5">Error</p>
                    <hr className="mt-1 mb-2"/>
                    <pre className="bg-light p-2">
                      <code>{this.props.job.error}</code>
                    </pre>
                  </>
                )
              }
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-outline-secondary" data-dismiss="modal">Close</button>
            </div>
          </div>
        </form>
      </div>
    );
  }
};
