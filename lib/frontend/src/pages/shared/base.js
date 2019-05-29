const React = require('react');
const store = require('../../store');

module.exports = class Base extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      $isApiProcessing: store.get('$isApiProcessing')
    };
    this.$subscriptions = [
      store.subscribe('$isApiProcessing', (msg, data) => {
        this.setState({$isApiProcessing: data});
      })
    ];
  }

  componentWillUnmount() {
    this.$subscriptions.forEach(x => store.unsubscribe(x));
  }
};
