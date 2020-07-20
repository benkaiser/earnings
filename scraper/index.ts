import { Response } from 'got';
import path from 'path';
import * as cheerio from 'cheerio';
import moment from 'moment';
const cached = require('cached-got');
const { got } = cached(path.join(__dirname, 'cache.json'));

interface IEstimate {
  date: string;
  estimated: number;
  reported: number;
}

interface IEstimateWithInfo extends IEstimate {
  pre: {
    oneDay: ITickerHistory;
    twoDay: ITickerHistory;
    threeDay: ITickerHistory;
    oneWeek: ITickerHistory;
    twoWeek: ITickerHistory;
  };
  post: {
    oneDay: ITickerHistory;
    twoDay: ITickerHistory;
    threeDay: ITickerHistory;
    oneWeek: ITickerHistory;
    twoWeek: ITickerHistory;
  };
}

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

interface ITickerHistory {
  timestamp: number;
  date: string;
  index: number;
  close: number;
  high: number;
  open: number;
  low: number;
  volume: number;
}

console.log('- Started scrape');

class CompanyScraper {
  private ticker: string;

  constructor(ticker: string) {
    this.ticker = ticker;
  }

  public process(): Promise<void> {
    return Promise.all([
      got(`https://query1.finance.yahoo.com/v8/finance/chart/${this.ticker}?interval=1d&range=50y`),
      got(`https://finance.yahoo.com/calendar/earnings?from=2020-07-12&to=2020-07-18&day=2020-07-13&symbol=${this.ticker}`)
    ]).then((responses: Response<any>[]) => {
      const [ priceResponse, earningsResponse ] = responses;
      const priceJson = this.processTickerPrices(priceResponse.body);
      const earnignsJson = this.processEarningsPage(earningsResponse.body);
      const earningsDecorated = this.correlateEarningsWithStockprice(priceJson, earnignsJson);
      console.log(earningsDecorated.slice(0, 10));
    });
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
        date: moment(timestamp * 1000).format('YYYY-MM-DD'),
        index: index,
        close: result.indicators.quote[0].close[index],
        high: result.indicators.quote[0].high[index],
        low: result.indicators.quote[0].low[index],
        open: result.indicators.quote[0].open[index],
        volume: result.indicators.quote[0].volume[index],
      };
    });
  }

  private correlateEarningsWithStockprice(tickerPrices: ITickerHistory[], earningsJson: IEstimate[]): IEstimateWithInfo[] {
    return earningsJson.map((earning) => {
      return {
        ...earning,
        pre: {
          oneDay: this.getPriceFor(tickerPrices, earning.date),
          twoDay: this.getPriceFor(tickerPrices, earning.date, -1),
          threeDay: this.getPriceFor(tickerPrices, earning.date, -2),
          oneWeek: this.getPriceFor(tickerPrices, earning.date, -5),
          twoWeek: this.getPriceFor(tickerPrices, earning.date, -10),
        },
        post: {
          oneDay: this.getPriceFor(tickerPrices, earning.date, 1),
          twoDay: this.getPriceFor(tickerPrices, earning.date, 2),
          threeDay: this.getPriceFor(tickerPrices, earning.date, 3),
          oneWeek: this.getPriceFor(tickerPrices, earning.date, 6),
          twoWeek: this.getPriceFor(tickerPrices, earning.date, 11),
        },
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
    console.log(`Unable to find ticker for date ${date} on symbol ${this.ticker}`);
    return tickerNotFound;
  }

  private processDate(date: string): string {
    return moment(date.split(',').slice(0,2).join(',')).format('YYYY-MM-DD');
  }
}

const COMPANY_LIST: string[] = [
  'MSFT',
  // 'AAPL',
  // 'AMZN',
];
COMPANY_LIST.forEach(ticker => {
  new CompanyScraper(ticker).process();
});




