const classNames = require('classnames');
const React = require('react');
const PropTypes = require('prop-types');
const dayjs = require('dayjs');
const {AutoSizer, List, WindowScroller} = require('react-virtualized');
const TimeAgo = require('react-timeago').default;
const {RouterView, Link} = require('capybara-router');
const Base = require('./shared/base');

module.exports = class Jobs extends Base {
  static get propTypes() {
    return {
      jobs: PropTypes.array.isRequired,
      jobQuantity: PropTypes.object.isRequired
    };
  }

  constructor(props) {
    super(props);
    this.state.scrollToIndex = -1;
    this.state.rowHeight = props.params.state === 'failed' ? 106 : 81;
    this.rowRenderer = this.rowRenderer.bind(this);
  }

  rowRenderer({index, key, style}) {
    const job = this.props.jobs[index];
    const detailLinkParams = Object.assign({}, {jobId: job.id}, this.props.params);
    const updatedAtText = dayjs(job.updatedAt).format('LLL');
    let shortErrorMessage;

    if (index < this.props.jobs.length - 1) {
      style.height += 1;
    }

    if (this.props.params.state === 'failed' && job.error) {
      shortErrorMessage = job.error.match(/^(.*)\n/)[1];
    }

    return (
      <div key={key} className="list-group-item" style={style}>
        <div className="d-flex justify-content-between">
          <div className="text-truncate">
            <h5 className="mb-1 text-truncate">
              <Link to={{name: 'web.jobs.details', params: detailLinkParams}}>#{job.id}</Link> <small className="text-secondary">{job.type}</small>
            </h5>
            {
              shortErrorMessage && (<p className="mb-1 text-dark text-truncate">{shortErrorMessage}</p>)
            }
          </div>
          <div className="ml-auto text-right" style={{width: '70px', minWidth: '70px'}}>
            <Link to={{name: 'web.jobs.details', params: detailLinkParams}} className="btn btn-outline-secondary btn-sm"><i className="fas fa-info-circle"/></Link>
            &nbsp;
            <button className="btn btn-outline-danger btn-sm" type="button" title="Delete">
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
                        window.listEl = el;
                      }}
                      autoHeight
                      height={height}
                      className="list-group"
                      isScrolling={isScrolling}
                      overscanRowCount={2}
                      rowCount={this.props.jobs.length}
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
          !this.props.jobs.length && (<p className="text-center text-secondary p-5 h3">Empty</p>)
        }
        <RouterView/>
      </>
    );
  }
};
