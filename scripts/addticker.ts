const fs = require('fs');
const path = require('path');

export interface IActionInput {
  ticker: string;
  type: string;
}

const ACTION_INPUTS: IActionInput = JSON.parse(process.env.GITHUB_CONTEXT!) as IActionInput;

try {
  const ticker: string = ACTION_INPUTS.ticker.toUpperCase();
  const announceType: string = ACTION_INPUTS.type.toLowerCase();
  console.log('Ticker: ' + ticker);
  console.log('Announces: ' + announceType);
  if (announceType !== 'pre' && announceType !== 'post') {
    console.error('Invalid annoucement type, must be pre or post');
    process.exit(1);
  }
  const companyFile = path.join(__dirname, '../shared/CompanyList.json');
  const Companies = JSON.parse(fs.readFileSync(companyFile));
  if (Companies[ticker] && Companies[ticker].type === announceType) {
    throw new Error('Company with same earnings type already exists');
  }
  Companies[ticker] = { type: announceType };
  fs.writeFileSync(companyFile, JSON.stringify(Companies, null, 2));
  console.log('Attempting scrape');
  require('./scraper');
} catch (error) {
  console.error(error);
}
