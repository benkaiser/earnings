const Route =  window.ReactRouterDOM.Route;
const HashRouter = window.ReactRouterDOM.HashRouter;
const Switch = window.ReactRouterDOM.Switch;
const Link =  window.ReactRouterDOM.Link;

function Header() {
  return (
    <nav className="navbar navbar-expand-lg fixed-top navbar-dark bg-primary">
      <div class="container">
        <a className="navbar-brand" href="#">Earnings Movements</a>
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarColor01" aria-controls="navbarColor01" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarColor01">
          <ul className="navbar-nav mr-auto">
            { COMPANY_LIST.map(company => {
              const className = window.location.hash.indexOf(company) > -1 ? 'active' : '';
              return (
                <li className={ `nav-item ${className}` }>
                  <Link className="nav-link" to={`${company}`}>{ company }</Link>
                </li>
              )
            } ) }
          </ul>
        </div>

        <div className="navbar-collapse collapse w-100 order-3 dual-collapse2">
            <ul className="navbar-nav ml-auto">
                <li className="nav-item">
                    <a className="nav-link" href="https://github.com/benkaiser/earnings">Github Source</a>
                </li>
            </ul>
        </div>
      </div>
    </nav>
  );
}

function Body(props) {
  return (
    <div className="body container">
      { props.children }
    </div>
  );
}

class Home extends React.Component {
  render() {
    return (
      <div>
        <h1>
          Stock Movements around Earnings
        </h1>
        <p>See how top stocks move around past earnings to better predict future earnings movements.</p>
        { COMPANY_LIST.map(company => (
          <div>See: <Link to={`${company}`}>{ company }</Link></div>
        ))}
      </div>
    );
  }
}

class Company extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ticker: props.match.params.company
    };
  }

  componentDidMount() {
    fetch(`/data/${this.state.ticker}_partial.json`)
    .then(response => response.json())
    .then(data => {
      console.log(data);
      this.setState({
        data
      });
    });
  }

  render() {
    return (
      <div>
        <h1>
          Stock Movements around Earnings for { this.props.match.params.company }
        </h1>
        { this.state.data && this.renderData() }
      </div>
    );
  }

  renderData() {
    const filteredData = this.state.data.filter(row => row.estimated && row.reported);
    return (
      <table className="table">
        <thead>
          <tr><th>Date</th><th>Expected EPS</th><th>Actual EPS</th><th>Earnings Move</th><th>Earnings Gap</th></tr>
        </thead>
        <tbody>
          { filteredData.map(dataRow => (
            <tr>
              <td>{ dataRow.date }</td>
              <td>{ dataRow.estimated }</td>
              { this.actualEPS(dataRow) }
              { this.earningsMove(dataRow) }
              { this.openingGap(dataRow) }
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  earningsMove(earnings) {
    const pre = earnings.pre[earnings.pre.length - 1];
    const day = earnings.post[0];
    if (!day || Number.isNaN(day.close)) {
      return <td>N/a</td>;
    }
    const earningsMove = day.close / pre.close * 100 - 100;
    return this.cellDisplay(earningsMove);
  }

  openingGap(earnings) {
    const pre = earnings.pre[earnings.pre.length - 1];
    const day = earnings.post[0];
    if (!day || Number.isNaN(day.close)) {
      return <td>N/a</td>;
    }
    const earningsGap = day.open / pre.close * 100 - 100;
    return this.cellDisplay(earningsGap);
  }

  actualEPS(earnings) {
    const className = earnings.reported > earnings.estimated  ? "text-success" : "text-danger";
    return (
      <td className={ className }>{ earnings.reported } {this.beat(earnings)}</td>
    );
  }

  beat(earnings) {
    if (earnings.reported > 0 && earnings.estimated > 0) {
      const beatAmount = earnings.reported - earnings.estimated;
      return `(${beatAmount > 0 ? '+' : ''}${beatAmount.toFixed(2)})`;
    }
  }

  cellDisplay(percentage) {
    const className = percentage > 0 ? "text-success" : "text-danger";
    return (
      <td className={ className }>%{ percentage.toFixed(2) }</td>
    );
  }
}


const COMPANY_LIST = [
  'AAPL',
  'AMZN',
  'FB',
  'MSFT',
  'TSLA'
];

ReactDOM.render(
  <HashRouter baseName="/">
    <Route path="/" render={() => <Header />} />
    <Body>
      <Switch>
        <Route exact path="/" render={() => <Home />} />
        <Route exact path="/:company" render={(routeProps) => <Company key={ routeProps.match.params.company } {...routeProps} /> } />
      </Switch>
    </Body>
  </HashRouter>,
  document.getElementById('container')
);