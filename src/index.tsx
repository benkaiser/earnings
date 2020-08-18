import { Route, HashRouter, Switch, Link } from 'react-router-dom';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import Company from './company';
import Header from './header';
import Body from './body';
import Home from './home';

ReactDOM.render(
  <HashRouter>
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