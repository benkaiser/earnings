import * as React from 'react';
import { Link } from 'react-router-dom';

import { COMPANY_LIST } from '../shared/constants';

export default function Header(): React.ReactElement {
  return (
    <nav className="navbar navbar-expand-lg fixed-top navbar-dark bg-primary">
      <div className="container">
        <a className="navbar-brand" href="#">Earnings Movements</a>
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarColor01" aria-controls="navbarColor01" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarColor01">
          <ul className="navbar-nav mr-auto">
            { COMPANY_LIST.map(company => {
              const className = window.location.hash.indexOf(company) > -1 ? 'active' : '';
              return (
                <li key={ company } className={ `nav-item ${className}` }>
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