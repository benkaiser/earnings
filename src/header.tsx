import * as React from 'react';
import { Link } from 'react-router-dom';

import { default as COMPANY_LIST }  from '../shared/CompanyList.json';

export default function Header(): React.ReactElement {
  return (
    <nav className="navbar navbar-expand-lg fixed-top navbar-dark bg-primary">
      <div className="container">
        <a className="navbar-brand" href="#">Earnings Movements</a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar" aria-controls="navbar" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbar">
          <ul className="navbar-nav mr-auto">
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" id="navbarDropdown" role="button" data-bs-toggle="dropdown">
                Change Company
              </a>
              <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                { Object.keys(COMPANY_LIST).map((company: string) => {
                  const className = window.location.hash.indexOf(company) > -1 ? 'active' : '';
                  return (
                    <li key={ company }>
                      <Link className={`dropdown-item ${className}`} to={`${company}`}>{ company }</Link>
                    </li>
                  )
                } ) }
              </ul>
            </li>
            <li className="nav-item">
              <Link className='nav-link' to='/addticker'>Add Company</Link>
            </li>
          </ul>
          <div className="navbar-collapse collapse">
            <ul className="navbar-nav ms-auto">
                <li className="nav-item">
                    <a className="nav-link" href="https://github.com/benkaiser/earnings">Github Source</a>
                </li>
            </ul>
        </div>
        </div>


      </div>
    </nav>
  );
}