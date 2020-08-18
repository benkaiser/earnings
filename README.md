# Movements around Earnings

Simple tool for analyzing the movements of stock prices around earnings dates for several companies.

This is similar to other offerings from marketchameleon.com or optionslam.com except you don't have to create an account or pay for access to this tool.
There is nothing magic here, just rounding up all the historical data for the tickers and seeing how they move in response to earnings.

## Running locally

```
npm install
npm start
```

Then browse to http://localhost:8080

## How do I add a new ticker?

Add the new ticker to this file `shared/constants.jsx` in the `COMPANY_LIST` array. Currently only supporting after-hours earnings announcements.

To add the data, run: `npm run scraper`