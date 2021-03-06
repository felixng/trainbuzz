/* eslint consistent-return:0 */

const express = require('express');
const logger = require('./logger');

const argv = require('./argv');
const setup = require('./middlewares/frontendMiddleware');
const setupBackend = require('./middlewares/backendMiddleware');
const port = require('./port');

const isDev = process.env.NODE_ENV !== 'production';
const ngrok = (isDev && process.env.ENABLE_TUNNEL) || argv.tunnel ? require('ngrok') : false;
const resolve = require('path').resolve;
const app = express();
const counters = require('./bots/counters');

// If you need a backend, e.g. an API, add your custom backend-specific middleware here
// app.use('/api', myApi);
setupBackend(app);

// In production we need to pass these values in instead of relying on webpack
setup(app, {
  outputPath: resolve(process.cwd(), 'build'),
  publicPath: '/',
});

// get the intended host and port number, use localhost and port 3000 if not provided
const customHost = argv.host || process.env.HOST;
const host = customHost || null; // Let http.Server use its default IPv6/4 host
const prettyHost = customHost || 'localhost';

// Start your app.
app.listen(port, host, (err) => {
  if (err) {
    return logger.error(err.message);
  }

  // Connect to ngrok in dev mode
  if (ngrok) {
    ngrok.connect(port, (innerErr, url) => {
      if (innerErr) {
        return logger.error(innerErr);
      }

      logger.appStarted(port, prettyHost, url);
    });
  } else {
    logger.appStarted(port, prettyHost);
  }
});


//Bots
var CronJob = require('cron').CronJob;

new CronJob('00 00 01 * * *', function() {
  counters.tweetCounter.gatherAll();
}, null, true, 'Europe/London');

// setInterval(counters.tweetCounter.favAll, 1000 * 60);

// setTimeout(function(){
//   console.log('counters.tweetCounter.getYesterdayRanking()');
//   counters.tweetCounter.getYesterdayRankingTweetText();
// }, 15000);

new CronJob('00 00 07 * * *', function() {
  counters.tweetCounter.getYesterdayRankingTweetText();
}, null, true, 'Europe/London');