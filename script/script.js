"use strict";

var elasticsearch = require('elasticsearch');
var util = require('util');
var async = require('async');
var json2csv = require('json2csv');
var L = require('lgr');

var esConfig = require('../config/es_config');
var email = require('../lib/email');
var buildQuery = require('../esQuery/queryBuilder');

var ESClient = new elasticsearch.Client({
  host: esConfig.movies.host
});

var mailOpts = {
  'Subject': 'ES Sample Report',
  'defaultRecipients': 'Kanika Sharma <testidsh4@gmail.com>'
};

var report = {

  collectData: function prepareQueryFn(opts, cb) {
    //index and type taken from kibana- 'https://github.com/bly2k/files/blob/master/accounts.zip?raw=true'
    var esOpts = {
      index: 'accounts',
      type: 'account'
    };

    async.parallel({
      totalEmployeesCount: function (cb) {
        var queryOpts = {};
        var totalCount = {};
        var esQuery = buildQuery.QueryBuilder(queryOpts);
        esOpts.body = esQuery;
        // L.log("totalEmployeesCount: " + JSON.stringify(esQuery));
        ESClient.search(esOpts).then(function (resp) {
          totalCount = resp.hits.total;
          cb(null, totalCount);
        });
      },
      topFiveMaleAccount: function (cb) {

        var fieldsRequired = ["firstname", "lastname", "balance"];
        var queryOpts = {
          limit: 5,
          filter: ["gender", "m"],
          sort: ["balance", "desc"]
        };
        var topMaleAccounts = {};
        var esQuery = buildQuery.QueryBuilder(queryOpts, fieldsRequired);
        esOpts.body = esQuery;
        // L.log("topFiveMaleAccount: " + JSON.stringify(esQuery));
        ESClient.search(esOpts).then(function (resp) {
          topMaleAccounts = resp.hits.hits;
          cb(null, topMaleAccounts);
        });
      },
      topFiveFemaleAccount: function (cb) {
        var fieldsRequired = ["firstname", "lastname", "balance"];
        var queryOpts = {
          limit: 5,
          filter: ["gender", "f"],
          sort: ["balance", "desc"]
        };
        var topFemaleAccounts = {};
        var esQuery = buildQuery.QueryBuilder(queryOpts, fieldsRequired);
        esOpts.body = esQuery;
        // L.log("topFiveFemaleAccount" + JSON.stringify(esQuery));
        ESClient.search(esOpts).then(function (res) {
          topFemaleAccounts = res.hits.hits;
          cb(null, topFemaleAccounts);
        });
      },
      topFiveAccounts: function (cb) {
        var fieldsRequired = ["firstname", "lastname", "balance", "gender"];
        var queryOpts = {
          limit: 5,
          filter: [],
          sort: ["balance", "desc"]
        };
        var topAccounts = {};
        var esQuery = buildQuery.QueryBuilder(queryOpts, fieldsRequired);
        esOpts.body = esQuery;
        L.log("topFiveAccounts: " + JSON.stringify(esQuery));
        ESClient.search(esOpts).then(function (res) {
          topAccounts = res.hits.hits;
          cb(null, topAccounts);
        });
      },
      topcities: function (cb) {
        console.log(">>>top cities >>>");
        /* Query to get top cities and their total/male/female users*/

        // var q = {
        //   "size": 0,
        //   "query": {
        //     "filtered": {
        //       "query": {
        //         "match_all": {}
        //       },
        //       "filter": {}
        //     }
        //   },
        //   "aggs": {
        //     "cities": {
        //       "terms": {
        //         "field": "city",
        //         "size": 5
        //       },
        //       "aggs": {
        //         "gender": {
        //           "terms": {
        //             "field": "gender",
        //             "size": 5
        //           }
        //         }
        //       }
        //     }
        //   }
        // }; 

        //{"query":{"filtered":{"filter":{}}},"size":0,"aggs":{"gender":{"terms":{"field":{}}}}}

        // var fName=["aggs":{"cities","gender"},"field":{"city","gender"},"size":{5,5}];
        var aggsName = ["cities", "gender"];
        var fields = ["city", "gender"];
        var size = [5, 5];
        var fName = [];
        fName.push(aggsName);
        fName.push(fields);
        fName.push(size);
        // var fName = _.concat(aggsName,fields,size);

        // var fName={"aggsName":{},"fields":{"":""},"size":{}};
        // var fName={};

        var queryOpts = {
          limit: 0,
          filter: [],
          aggs: fName
        };
        var esQuery = buildQuery.QueryBuilder(queryOpts);
        esOpts.body = esQuery;
        console.log(">>> ");
        console.log();
        console.log();
        console.log();
        L.log("topcities: " + JSON.stringify(esQuery));
        // var topcities = {};

        // cb(null, 'dummy123');

      },
      topState: function (cb) {
        /*9.  Query to  get top state and their total/male/female users */
        var q = {
          "size": 0,
          "query": {
            "filtered": {
              "query": {
                "match_all": {}
              },
              "filter": {}
            }
          },
          "aggs": {
            "cities": {
              "terms": {
                "field": "state",
                "size": 5
              },
              "aggs": {
                "gender": {
                  "terms": {
                    "field": "gender",
                    "size": 5
                  }
                }
              }
            }
          }
        };
        cb(null, 'top state dummy res');
      }
    }, function (err, results) {
      if (!err)
        console.log(results);
    });

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
  L.log('Creating report with options: ' + JSON.stringify(opts));
  var r = report;
  var routes = [r.collectData, r.prepareData, r.prepareReport, r.sendReport];
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
