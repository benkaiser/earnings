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

console.log('- Started scrape');

class CompanyScraper {
  private ticker: string;

  constructor(ticker: string) {
    this.ticker = ticker;
  }

  public process(): Promise<void> {
    return Promise.all([
      got(`https://query1.finance.yahoo.com/v8/finance/chart/${this.ticker}?interval=1d&range=10y`),
      got(`https://finance.yahoo.com/calendar/earnings?from=2020-07-12&to=2020-07-18&day=2020-07-13&symbol=${this.ticker}`)
    ]).then((responses: Response[]) => {
      // @ts-ignore
      const [ priceResponse, earningsResponse ] = responses;
      // @ts-ignore
      const earnignsJson = this.processEarningsPage(earningsResponse.body);
      console.log(earnignsJson);
      // console.log(priceResponse.statusCode)
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




