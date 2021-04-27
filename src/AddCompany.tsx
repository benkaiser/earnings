import * as React from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';


export default function AddCompany(_: RouteComponentProps): React.ReactElement {
  const tickerRef = React.useRef<HTMLInputElement>(null);
  const announceRef = React.useRef<HTMLSelectElement>(null);
  const [tickerState, setTickerState] = React.useState<string>();
  function addCompany() {
    if (!tickerRef.current?.value || !announceRef.current?.value) {
      return;
    }
    setTickerState(tickerRef.current.value);
    const ticker = tickerRef.current.value;
    const announce = announceRef.current.value;
    window.open(`https://github.com/benkaiser/earnings/issues/new?title=${encodeURIComponent(`Add Stock: ${ticker}`)}&body=${encodeURIComponent(`Announces: ${announce}`)}&labels=addticker`, '_blank');
  }
  return (
    <div>
      <h1>
        Add a Ticker
      </h1>
      { tickerState ?
        <p>Navigate to the page for <Link to={'/' + tickerState}>{tickerState}</Link>, you'll be prompted to refresh repeatedly until it's available.</p> :
        <>
          <p>Note: requires a Github account</p>
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
