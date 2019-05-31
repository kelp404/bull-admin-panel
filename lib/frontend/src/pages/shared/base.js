const React = require('react');
const store = require('../../store');

module.exports = class Base extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      $isApiProcessing: store.get('$isApiProcessing')
    };
    this.$listens = [
      store.subscribe('$isApiProcessing', (_, data) => {
        this.setState({$isApiProcessing: data});
      })
    ];
  }

  componentWillUnmount() {
    this.$listens.forEach(x => x());
  }
};
