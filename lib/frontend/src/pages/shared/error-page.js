const React = require('react');
const PropTypes = require('prop-types');

module.exports = class ErrorPage extends React.PureComponent {
  static get propTypes() {
    return {error: PropTypes.any};
  }

  static get defaultProps() {
    return {error: ''};
  }

  state = {};

  constructor(props) {
    super(props);
    document.title = 'Error - Bull Admin Panel';
    this.state.message = props.error.message ? props.error.message : `${props.error}`;
  }

  render() {
    return (<p className="text-center h2">{this.state.message}</p>);
  }
};
