export interface ICompanyList {
  [ticker: string]: ICompanyOptions;
}

export interface ICompanyOptions {
  type: 'pre' | 'post';
}