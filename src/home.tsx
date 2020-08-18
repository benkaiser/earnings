import * as React from 'react';
import { Link } from 'react-router-dom';

import { COMPANY_LIST } from '../shared/constants';

export default function Home(): React.ReactElement {
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
