"use strict";

var elasticsearch = require('elasticsearch');
var util = require('util');
var async = require('async');
var json2csv = require('json2csv');
var L = require('lgr');

var esConfig = require('../config/es_config');
var email = require('../lib/email');
var buildQuery = require('../esQuery/es_query_builder');

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
    //index and type taken from kibana- 'https://github.com/bly2k/files/blob/master/accounts.zip?raw=true'
    var esOpts = {
      index: 'accounts',
      type: 'account'
    };

    async.parallel({
      //total employees count
      one: function (cb) {
        var queryOpts = {};
        var firstResult = {};
        var esQuery = buildQuery.QueryBuilder(queryOpts);
        esOpts.body = esQuery;
        ESClient.search(esOpts).then(function (resp) {
          firstResult = resp.hits.total;
          cb(null, firstResult);
        });
      },
      // Top 5 male account
      two: function (cb) {

        var fieldsRequired=["firstname", "lastname", "balance"];
        var queryOpts = {limit:5};
        var secondResult = {};
        var aa = {
          "size": 5,
          "_source": ["firstname", "lastname", "balance"],
          "query": {
            "filtered": {
              "query": {
                "match_all": {}
              },
              "filter": {
                "and": [{
                  "term": {
                    "gender": "m"
                  }
                }]
              }
            }
          },
          "sort": [{
            "balance": {
              "order": "desc"
            }
          }]
        };
        var esQuery = buildQuery.QueryBuilder(queryOpts, fieldsRequired);
        esOpts.body = aa;
        ESClient.search(esOpts).then(function (resp) {
          secondResult = resp;
          cb(null, secondResult);
        });
      }
    }, function (err, results) {
      console.log(results);

    });

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

  var opts = {
    recipients: process.argv[2] || mailOpts.defaultRecipients,
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
