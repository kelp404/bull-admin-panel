const React = require('react');
const PropTypes = require('prop-types');

module.exports = class ErrorPage extends React.PureComponent {
  static get propTypes() {
    return {error: PropTypes.any};
  }

  static get defaultProps() {
    return {error: ''};
  }

  constructor(props) {
    super(props);
    document.title = 'Error - Kue Admin Panel';
    this.state = {message: `${props.error}`};
  }

  render() {
    return (<p className="text-center h2">{this.state.message}</p>);
  }
};
