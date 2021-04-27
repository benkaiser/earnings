export interface IGithubIssue {
  body: string;
  id: number;
  title: string;
  labels: string[];
}

const GITHUB_ISSUE: IGithubIssue = JSON.parse(process.env.GITHUB_CONTEXT!) as IGithubIssue;

console.log(GITHUB_ISSUE.body);
console.log(GITHUB_ISSUE.title);
console.log(GITHUB_ISSUE.labels);
console.log(GITHUB_ISSUE.id);