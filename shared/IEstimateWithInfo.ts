import IEstimate from './IEstimate';
import ITickerHistory from './ITickerHistory';

export default interface IEstimateWithInfo extends IEstimate {
  pre: ITickerHistory[];
  post: ITickerHistory[];
}