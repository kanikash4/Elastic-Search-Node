// 'use strict';

var elasticsearch = require('elasticsearch');
var util = require('util');
var async = require('async');
var json2csv = require('json2csv');
var L = require('lgr');

var esConfig = require('../config/es_config');
var email = require('../lib/email');
var buildQuery=require('../esQuery/es_query_builder');

var ESClient = new elasticsearch.Client({
  host: esConfig.movies.host
});

var mailOpts = {
  'Subject': 'ES Sample Report',
  'defaultRecipients': 'Kanika Sharma <testidsh4@gmail.com>'
};

var report = {

  collect: function collectFn(opts, cb) {
    cb(null, opts);
  },

  prepareQuery: function prepareQueryFn(opts, cb) {
    cb(null, opts);
  },

  fetchLog: function fetchLogFn(opts, cb) {
    cb(null, opts);
  },

  prepareData: function prepareDataFn(opts, cb) {
    cb(null, opts);
  },

  prepareReport: function prepareReportFn(opts, cb) {
    cb(null, opts);
  },

  sendReport: function sendReportFn(opts, cb) {
    //body
  }

};

module.exports = report;

/*---------------------------------------------Driver Function------------------------------------------------------*/

if (require.main === module) {
  //intervalHours will generate the report from past 24 hours to current time 
  var intervalHours = process.argv[2] || 24;
  var fromDate = new Date();
  fromDate.setHours(fromDate.getHours() - intervalHours);

  var opts = {
    toDate: (new Date()),
    fromDate: fromDate,
    recipients: process.argv[4] || mailOpts.defaultRecipients,
  };
  console.log('Creating report with options: ' + JSON.stringify(opts));
  var r = report;
  var routes = [r.collect, r.prepareQuery, r.fetchLog, r.prepareData, r.prepareReport, r.sendReport];
  var index = 0;
  var router = function (err, opts) {
    if (err) {
      util.log(err);
      process.exit(0);
    } else if (index === routes.length - 1) {
      process.exit(1);
    } else {
      routes[++index](opts, router);
    }
  };
  routes[index](opts, router);
}
