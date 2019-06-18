const React = require('react');

module.exports = class Loading extends React.Component {
  shouldComponentUpdate() {
    return false;
  }

  render() {
    return (
      <p className="text-center text-muted h3 py-5">
        <i className="fa fa-spinner fa-pulse fa-fw"/> Loading...
      </p>
    );
  }
};
