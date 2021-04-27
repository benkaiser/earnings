const fs = require('fs');
const path = require('path');

export interface ILabel {
  name: string;
}

export interface IGithubIssue {
  body: string;
  id: number;
  title: string;
  labels: ILabel[];
}

const GITHUB_ISSUE: IGithubIssue = JSON.parse(process.env.GITHUB_CONTEXT!) as IGithubIssue;

if (GITHUB_ISSUE.labels.filter(label => label.name === 'addticker')) {
  console.log('Found addticker label');
  try {
    const ticker: string = GITHUB_ISSUE.title.match(/:\s+(.+)/)![1].trim();
    const announceType: string = GITHUB_ISSUE.body.match(/:\s+(.+)/)![1].trim();
    console.log('Ticker: ' + ticker);
    console.log('Announces: ' + announceType);
    if (announceType !== 'pre' && announceType !== 'post') {
      console.error('Invalid annoucement type, must be pre or post');
      process.exit(1);
    }
    const Companies = JSON.parse(fs.readFileSync(path.join(__dirname, '../shared/CompanyList.json')));
    Companies[ticker] = { type: ticker };
    fs.writeFileSync(JSON.stringify(Companies, null, 2));
    console.log('Attempting scrape');
    require('./scraper');
  } catch (error) {
    console.error(error);
  }
}