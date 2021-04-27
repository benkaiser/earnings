import { Route, HashRouter, Switch, Redirect } from 'react-router-dom';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import Company from './company';
import Header from './header';
import Body from './body';
import AddCompany from './AddCompany';

ReactDOM.render(
  <HashRouter>
    <Route path="/" render={() => <Header />} />
    <Body>
      <Switch>
        <Route exact path="/">
          <Redirect to="/MSFT" />
        </Route>
        <Route exact path="/addticker" render={(routeProps) => <AddCompany {...routeProps} /> } />
        <Route exact path="/:company" render={(routeProps) => <Company key={ routeProps.match.params.company } {...routeProps} /> } />
      </Switch>
    </Body>
  </HashRouter>,
  document.getElementById('container')
);