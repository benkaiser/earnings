import * as React from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';


export default function AddCompany(_: RouteComponentProps): React.ReactElement {
  const tickerRef = React.useRef<HTMLInputElement>(null);
  const announceRef = React.useRef<HTMLSelectElement>(null);
  const [tickerState, setTickerState] = React.useState<string>();
  const [isWaiting, setIsWaiting] = React.useState<boolean>(false);
  function addCompany() {
    if (!tickerRef.current?.value || !announceRef.current?.value) {
      return;
    }
    const ticker = tickerRef.current.value.toUpperCase();
    const announce = announceRef.current.value;
    setTickerState(ticker);
    fetch("https://publicactiontrigger.azurewebsites.net/api/dispatches/benkaiser/earnings", {
      method: 'POST',
      mode: 'cors',
      body: JSON.stringify({ event_type: 'Add Ticker: ' + ticker, client_payload: { data: JSON.stringify({ ticker: ticker, type: announce }) } })
    });
    setInterval(() => {
      console.log('Checking for ticker available...');
      fetch(`data/${ticker}_partial.json?cachebust=${Math.random()}`).then((response) => {
        if (response.status === 200) {
          console.log('Ticker available, redirecting');
          window.location.href = window.location.pathname + '?cachebust=' + Math.random() +  '#/MSFT';
        } else {
          console.log('Ticker not yet available');
        }
      }).catch(() => {
        console.log('Ticker not yet available');
      });
    }, 5000);
  }
  return (
    <div>
      <h1>
        Add a Ticker
      </h1>
      { tickerState ?
        <>
          <p>Waiting for {tickerState} to be added, this may take up to a minute. You'll be redirected once it is available.</p>
          <img src="dist/pulse.svg" alt="Loading spinner" />
        </> :
        <>
          <div className="mb-3 row">
            <label htmlFor="inputTicker" className="col-sm-3 col-form-label">Stock Ticker</label>
            <div className="col-sm-9">
              <input ref={tickerRef} type="text" className="form-control" id="inputTicker" />
            </div>
          </div>
          <div className="mb-3 row">
            <label htmlFor="inputTicker" className="col-sm-3 col-form-label">When do they usually announce?</label>
            <div className="col-sm-9">
              <select ref={announceRef} className="form-select" aria-label="Announce Options">
                <option value="pre">Before market open</option>
                <option value="post">After market close</option>
              </select>
            </div>
          </div>
          <div className="mb-3 row">
            <div className="col-sm-9 offset-sm-3">
              <p>Note, click "Submit new issue" after landing on github, it will be automatically added.</p>
              <button type="button" className="btn btn-primary" onClick={addCompany}>Add Company</button>

            </div>
          </div>
        </>
      }
    </div>
  );
}
