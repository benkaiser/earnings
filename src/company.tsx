import * as React from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import { ResponsiveLine } from '@nivo/line'

import IEstimateWithInfo from "../shared/IEstimateWithInfo";
import { default as COMPANY_LIST }  from '../shared/CompanyList.json';
import { ICompanyList, ICompanyOptions } from '../shared/ICompanyList';

interface ICompanyRouteProps {
  company: string;
}

type ICompanyProps = RouteComponentProps<ICompanyRouteProps>;

interface ICompanyState {
  ticker: string;
  data: IEstimateWithInfo[];
  checkedMap: CheckMap;
}

type CheckMap = { [key: string]: boolean };

const dataCache: { [key: string]: IEstimateWithInfo[] } = {};

export default class Company extends React.Component<ICompanyProps, ICompanyState> {
  private options: ICompanyOptions;

  constructor(props: ICompanyProps) {
    super(props);
    const ticker = props.match.params.company;
    this.options = (COMPANY_LIST as ICompanyList)[ticker];
    this.state = {
      ticker,
      data: dataCache[ticker]?.filter(row => row.estimated && row.reported),
      checkedMap: { 0: true, 1: true, 2: true, 3: true }
    };
  }

  componentDidMount() {
    if (this.state.data) {
      return;
    }
    fetch(`data/${this.state.ticker}_partial.json`)
    .then(response => response.json())
    .then(data => {
      console.log(data);
      const filteredData = data.filter((row: IEstimateWithInfo) => row.estimated && row.reported);
      dataCache[this.state.ticker] = filteredData;
      this.setState({
        data: filteredData
      });
    });
  }

  render() {
    return (
      <div>
        <h1>
          Stock Movements around Earnings for
          { ' ' }
          <div className="dropdown d-inline">
            <button className="btn btn-primary dropdown-toggle" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
              { this.props.match.params.company }
            </button>
            <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
              { Object.keys(COMPANY_LIST).map((company: string) => {
                const className = window.location.hash.indexOf(company) > -1 ? 'active' : '';
                return (
                  <li key={ company }>
                    <Link className={`dropdown-item ${className}`} to={`${company}`}>{ company }</Link>
                  </li>
                )
              } ) }
            </ul>
          </div>
        </h1>
        { this.state.data && this.renderData() }
      </div>
    );
  }

  renderData() {
    const filteredData = this.state.data
    return (
      <>
        <div className='chartContainer'>
        <ResponsiveLine
          data={this.chartData()}
          margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
          xScale={{ type: 'linear', min: 'auto', max: 'auto' }}
          yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
          axisTop={null}
          axisRight={null}
          tooltip={({ point} ) => {
            const xLabel: string = point.data.x === 0
              ? 'First market day after earnings'
              : (point.data.x > 0 ?
                  "Days after earnings: " + (this.options.type === 'pre' ? point.data.x : (point.data.x as number) + 1) :
                  "Days before earnings: " + Math.abs(point.data.x as number + (this.options.type === 'pre' ? 0 : 1)));

            return (
                <div
                    style={{
                        background: 'white',
                        padding: '9px 12px',
                        border: '1px solid #ccc',
                    }}
                >
                    <div>{xLabel}</div>
                    <div>Price difference between pre-earnings close: {(point.data.y as number).toFixed(2)}%</div>
                    <div>Earnings season: {point.serieId} (announced { this.options.type }-market)</div>
                    <div>Date: {(point.data as any).date}</div>
                    <div>Raw price at close: {(point.data as any).close}</div>
                </div>
            )
        }}
          axisBottom={{
              format: (tick) => (this.options.type === 'pre' ? -tick : -tick - 1),
              orient: 'bottom',
              tickSize: 1,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'days until earnings',
              legendOffset: 36,
              legendPosition: 'middle'
          }}
          axisLeft={{
              orient: 'left',
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'price relative to pre-earnings close',
              legendOffset: -40,
              legendPosition: 'middle'
          }}
          colors={{ scheme: 'set1' }}
          useMesh={true}
          legends={[
              {
                  anchor: window.innerWidth < 800 ? 'bottom': 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 100,
                  translateY: 0,
                  itemWidth: 80,
                  itemHeight: 20,
              }
          ]}
        />
        </div>
        <table className="table table-bordered table-hover">
          <thead>
            <tr><th>Date</th><th>Expected EPS</th><th>Actual EPS</th><th title="change after market close day after earnings announced">Earnings Move</th><th title="change in price at market open">Earnings Gap</th></tr>
          </thead>
          <tbody style={ ({ cursor: 'pointer' }) }>
            { filteredData.map((dataRow, index) => (
              <tr key={ dataRow.date } onClick={this._onCheck.bind(this, index)} className={this.state.checkedMap[index] ? 'table-dark' : ''}>
                <td>{ dataRow.date }</td>
                <td>{ dataRow.estimated }</td>
                { this.actualEPS(dataRow) }
                { this.earningsMove(dataRow) }
                { this.openingGap(dataRow) }
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }

  private _onCheck(index: number): void {
    this.setState({
      checkedMap: {
        ...this.state.checkedMap,
        [index]: !this.state.checkedMap[index]
      }
    });
  }

  chartData() {
    const filteredData = this.state.data.filter((_, index) => this.state.checkedMap[index]);
    return filteredData.map(earning => {
      const allDays = earning.pre.concat(earning.post);
      // end of day before earnings
      const midPoint = earning.pre[earning.pre.length-1].close;
      return {
        id: earning.date,
        data: allDays.filter(day => day && day.close).map((day, index) => ({
          x: index - 11,
          y: day.close / midPoint * 100 - 100,
          close: day.close,
          date: day.date
        }))
      };
    });
  }

  earningsMove(earnings: IEstimateWithInfo) {
    const pre = earnings.pre[earnings.pre.length - 1];
    const day = earnings.post[0];
    if (!day || Number.isNaN(day.close)) {
      return <td>N/a</td>;
    }
    const earningsMove = day.close / pre.close * 100 - 100;
    return this.cellDisplay(earningsMove);
  }

  openingGap(earnings: IEstimateWithInfo) {
    const pre = earnings.pre[earnings.pre.length - 1];
    const day = earnings.post[0];
    if (!day || Number.isNaN(day.close)) {
      return <td>N/a</td>;
    }
    const earningsGap = day.open / pre.close * 100 - 100;
    return this.cellDisplay(earningsGap);
  }

  actualEPS(earnings: IEstimateWithInfo) {
    const className = earnings.reported > earnings.estimated  ? "text-success" : "text-danger";
    return (
      <td className={ className }>{ earnings.reported } {this.beat(earnings)}</td>
    );
  }

  beat(earnings: IEstimateWithInfo): string | undefined {
    if (earnings.reported > 0 && earnings.estimated > 0) {
      const beatAmount = earnings.reported - earnings.estimated;
      return `(${beatAmount > 0 ? '+' : ''}${beatAmount.toFixed(2)})`;
    }
  }

  cellDisplay(percentage: number): React.ReactElement {
    const className = percentage > 0 ? "text-success" : "text-danger";
    return (
      <td className={ className }>%{ percentage.toFixed(2) }</td>
    );
  }
}
