const React = require('react');

module.exports = class Loading extends React.Component {
  shouldComponentUpdate() {
    return false;
  }

  render() {
    return (
      <div className="text-center text-muted py-5 main-content">
        <div className="spinner-border">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }
};
