import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { ResponsiveLine } from '@nivo/line'

import IEstimateWithInfo from "../shared/IEstimateWithInfo";

interface ICompanyRouteProps {
  company: string;
}

type ICompanyProps = RouteComponentProps<ICompanyRouteProps>;

interface ICompanyState {
  ticker: string;
  data: IEstimateWithInfo[];
}

const dataCache: { [key: string]: IEstimateWithInfo[] } = {};

export default class Company extends React.Component<ICompanyProps, ICompanyState> {
  constructor(props: ICompanyProps) {
    super(props);
    const ticker = props.match.params.company;
    this.state = {
      ticker,
      data: dataCache[ticker]
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
      dataCache[this.state.ticker] = data;
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
      <>
        <div className='chartContainer'>
        <ResponsiveLine
          data={this.chartData()}
          margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
          xScale={{ type: 'linear', min: 'auto', max: 'auto' }}
          yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
              format: (tick) => -tick,
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
          colors={{ scheme: 'nivo' }}
          useMesh={true}
          legends={[
              {
                  anchor: 'bottom-right',
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
        <table className="table table-bordered">
          <thead>
            <tr><th>Date</th><th>Expected EPS</th><th>Actual EPS</th><th>Earnings Move</th><th>Earnings Gap</th></tr>
          </thead>
          <tbody>
            { filteredData.map(dataRow => (
              <tr key={ dataRow.date }>
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

  chartData() {
    const filteredData = this.state.data.filter(row => row.estimated && row.reported).slice(0, 4);
    return filteredData.map(earning => {
      const allDays = earning.pre.concat(earning.post);
      // end of day before earnings
      const midPoint = earning.pre[earning.pre.length-1].close;
      return {
        id: earning.date,
        data: allDays.map((day, index) => ({
          x: index - 10,
          y: day.close / midPoint * 100 - 100
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
