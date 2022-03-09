const React = require('react');
const PropTypes = require('prop-types');

module.exports = class ErrorPage extends React.PureComponent {
  static propTypes = {
    error: PropTypes.any.isRequired,
  };

  constructor(props) {
    super(props);
    document.title = 'Error - Bull Admin Panel';
  }

  render() {
    const {error} = this.props;

    return (<p className="text-center h2">{error.message || `${error}`}</p>);
  }
};
