import IEstimate from '../shared/IEstimate';
import IEstimateWithInfo from '../shared/IEstimateWithInfo';
import ITickerHistory from '../shared/ITickerHistory';
import { default as COMPANY_LIST }  from '../shared/CompanyList.json';
import { ICompanyOptions, ICompanyList } from '../shared/ICompanyList';
import { Response } from 'got';
import path, { join } from 'path';
import * as cheerio from 'cheerio';
import moment from 'moment-timezone';
import { writeFile } from 'jsonfile';
const cached = require('cached-got');
const { got } = cached(path.join(__dirname, 'cache.json'));

interface IQuote {
  close: number[],
  high: number[],
  low: number[],
  open: number[],
  volume: number[]
};

interface IPriceJson {
  chart: {
    result: Array<{
      indicators: {
        quote: Array<IQuote>
      },
      timestamp: Array<number>;
    }>;
  };
}

console.log('- Started scrape');

class CompanyScraper {
  private ticker: string;
  private options: ICompanyOptions;

  constructor(ticker: string, options: ICompanyOptions) {
    this.ticker = ticker;
    this.options = options;
  }

  public process(): Promise<void> {
    return Promise.all([
      got(`https://query1.finance.yahoo.com/v8/finance/chart/${this.ticker}?interval=1d&range=50y`),
      got(`https://finance.yahoo.com/calendar/earnings?symbol=${this.ticker}`)
    ]).then((responses: Response<any>[]) => {
      const [ priceResponse, earningsResponse ] = responses;
      const priceJson = this.processTickerPrices(priceResponse.body);
      const earnignsJson = this.processEarningsPage(earningsResponse.body);
      const earningsDecorated = this.correlateEarningsWithStockprice(priceJson, earnignsJson);
      this.writeFile(earningsDecorated);
    })
    .then(() => {
      console.log('Done ' + this.ticker);
    })
    .catch((error: Error) => {
      console.error(error);
    });
  }

  private writeFile(fullEarningsData: IEstimateWithInfo[]): void {
    writeFile(join(__dirname, '..', 'data', this.ticker + '_full.json'), fullEarningsData);
    const partialEarnings = fullEarningsData.filter(item => {
      return new Date(item.date) > moment().tz('America/New_York').subtract(5, 'years').toDate()
    });
    writeFile(join(__dirname, '..', 'data', this.ticker + '_partial.json'), partialEarnings);
  }

  private processEarningsPage(earningsRawHtml: string): IEstimate[] {
    const $ = cheerio.load(earningsRawHtml);
    const dates = $('[aria-label="Earnings Date"]').map((_, element: CheerioElement) => this.processDate($(element).text())).get();
    const epsEstimates = $('[aria-label="EPS Estimate"]').map((_, element: CheerioElement) => parseFloat($(element).text())).get();
    const reportedEps = $('[aria-label="Reported EPS"]').map((_, element: CheerioElement) => parseFloat($(element).text())).get();
    const combined = dates.map((_, index) => ({
      date: dates[index],
      estimated: epsEstimates[index],
      reported: reportedEps[index]
    }));
    if (dates.length !== epsEstimates.length || dates.length !== reportedEps.length) {
      console.error(`Error creating earnings JSON for ${this.ticker}, cells have different lengths`);
    }
    return combined;
  }

  private processTickerPrices(pricesRaw: string): ITickerHistory[] {
    const priceJson: IPriceJson = JSON.parse(pricesRaw);
    const result = priceJson.chart.result[0];
    return result.timestamp.map((timestamp, index) => {
      return {
        timestamp: timestamp,
        date: moment(timestamp * 1000).tz('America/New_York').format('YYYY-MM-DD'),
        index: index,
        close: this.toCents(result.indicators.quote[0].close[index]),
        high: this.toCents(result.indicators.quote[0].high[index]),
        low: this.toCents(result.indicators.quote[0].low[index]),
        open: this.toCents(result.indicators.quote[0].open[index]),
        volume: result.indicators.quote[0].volume[index],
      };
    });
  }

  private toCents(fullNumber: number): number {
    if (fullNumber === null) {
      return fullNumber;
    }
    return Number(fullNumber.toFixed(2));
  }

  private correlateEarningsWithStockprice(tickerPrices: ITickerHistory[], earningsJson: IEstimate[]): IEstimateWithInfo[] {
    return earningsJson.map((earning) => {
      if (!earning.estimated || !earning.reported) {
        return {
          ...earning,
          pre: [],
          post: [],
        };
      };
      return {
        ...earning,
        pre: [...Array(11)].map((_, index) => this.getPriceFor(tickerPrices, earning.date, (this.options.type === 'pre' ? -11 : -10) + index)),
        post: [...Array(11)].map((_, index) => this.getPriceFor(tickerPrices, earning.date, index + (this.options.type === 'pre' ? 0 : 1)))
      };
    });
  }

  private getPriceFor(tickerPrices: ITickerHistory[], date: string, daysAhead: number = 0): ITickerHistory {
    const tickerNotFound: ITickerHistory = {
      timestamp: NaN,
      date: '',
      index: NaN,
      volume: NaN,
      open: NaN,
      close: NaN,
      high: NaN,
      low: NaN
    };
    for (let i = 0; i < tickerPrices.length; i++) {
      if (tickerPrices[i].date === date) {
        return tickerPrices[i + daysAhead] || tickerNotFound;
      }
    }
    if (new Date(date) < new Date()) {
      console.log(`Unable to find ticker for date ${date} on symbol ${this.ticker}`);
    }
    return tickerNotFound;
  }

  private processDate(date: string): string {
    return moment(date.split(',').slice(0,2).join(','), 'MMM DD, YYYY').format('YYYY-MM-DD');
  }
}

Object.keys(COMPANY_LIST).forEach((ticker: string) => {
  new CompanyScraper(ticker, (COMPANY_LIST as ICompanyList)[ticker]).process();
});