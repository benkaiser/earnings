export default interface ITickerHistory {
  timestamp: number;
  date: string;
  index: number;
  close: number;
  high: number;
  open: number;
  low: number;
  volume: number;
}