const React = require('react');
const store = require('../../store');

module.exports = class Base extends React.Component {
  constructor(props) {
    super(props);
    this.$isMounted = false;
    this.state = {
      $isApiProcessing: store.get('$isApiProcessing')
    };
    this.$listens = [
      store.subscribe('$isApiProcessing', (_, data) => {
        if (this.$isMounted) {
          this.setState({$isApiProcessing: data});
        } else {
          this.state.$isApiProcessing = data;
        }
      })
    ];
  }

  componentDidMount() {
    this.$isMounted = true;
  }

  componentWillUnmount() {
    this.$listens.forEach(x => x());
  }
};
