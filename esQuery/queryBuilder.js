'use strict';

var _ = require('lodash');
var L = require('lgr');

var esQueryObj = {};

var buildQuery = {

  QueryBuilder: function (data, fieldsRequired) {
    esQueryObj = {
      _source: fieldsRequired,
      query: {
        bool: {
          must: [],
          minimum_should_match: 1
        }
      }
    };

    var rangeObj;

    for (var name in data) {
      if ('limit' === name) {
        esQueryObj.size = data[name];
      } else if ('range' === name) { /*logs placed or indexed with in last n days*/
        var r = data[name];
        for (var i in r) {
          var op = r[i];
          rangeObj = {};
          rangeObj[i] = {
            'gte': op[0],
            'lt': op[1]
          };
          esQueryObj.query.bool.must.push(getRangeObj(rangeObj));
        }
      } else if ('filter' === name) {
        delete esQueryObj.query.bool;
        esQueryObj.query.filtered = {};
        esQueryObj.query.filtered.filter = {};
        esQueryObj.query.filtered.filter.and = [];
        if (data.filter.length === 0 || data.filter.length === null || data.filter.length ===
          undefined) {
          esQueryObj.query.filtered.filter = {};
        } else {
          var ob = {};
          ob["term"] = {};
          esQueryObj.query.filtered.filter.and.push(ob);
          var d = {};
          var key = data.filter[0]; //fieldName
          d[key] = data.filter[1]; //fieldValue
          esQueryObj.query.filtered.filter.and[0].term = d;
        }
      }else if('aggs'===name){ console.log("aggregation detected");
        console.log(data.aggs);
        //TODO: aggregations single/nested
        var aggName;var terms = {};
        Object.keys(data.aggs).forEach(function (a) {
          aggName = data.aggs[a];
            esQueryObj.aggs = {};
            console.log("^^^");
            // console.log(esQueryObj);
          // console.log(aggName);
          Object.keys(aggName).forEach(function (b) {
            console.log(">>>");//console.log(aggName);
            esQueryObj.aggs[aggName]={};
            console.log(esQueryObj);
            // esQueryObj.aggs[aggName] = aggName[b];
            // console.log(aggName[b]);
            process.exit();
            // esQueryObj.aggs = {};
            // esQueryObj.aggs[aggName] = {};
            // esQueryObj.aggs[aggName].terms = {};
            // process.exit();

            // esQueryObj.aggs[aggName].terms.field = {};
            // esQueryObj.aggs[aggName].terms.field = "";
            // esQueryObj.aggs[aggName].terms.size = "";

          });
        });
      }
       else if ('sort' === name) {
        esQueryObj.sort = [];
        var k = {};
        k[data.sort[0]] = { //data.sort[0]-->field to be sort
          "order": data.sort[1] || desc //data.sort[1]-->order to be sorted
        };
        esQueryObj.sort.push(k);
      } else {
        var ar;
        if (_.isArray(data[name])) /*If data itself is array*/
          ar = data[name];
        else {
          if ("string" !== typeof data[name]) {
            data[name] = (data[name] || '').toString();
          }
          ar = data[name].split(',');
        }

        if (_.size(ar) == 1) {
          esQueryObj.query.bool.must.push(getMatchObj(name, ar[0]));
        } else { /*multivalue*/
          esQueryObj.query.bool.must.push(getBoolObj(name, ar));
        }
      }
    } console.log(" final query :   "); console.log(JSON.stringify(esQueryObj));
    return esQueryObj;
  }

};

module.exports = buildQuery;

function getMatchObj(name, value) {
  var obj = {
    match: {}
  };
  obj.match[name] = value;
  return obj;
}

function getRangeObj(ranger) {
  var obj = {
    range: {}
  };
  obj.range = ranger;
  return obj;
}

function getBoolObj(name, ar) {
  var boolObj = {
    bool: {
      should: [],
      minimum_should_match: 1
    }
  };
  ar.forEach(function (doc) {
    if (doc)
      boolObj.bool.should.push(getMatchObj(name, doc));
  });
  return boolObj;
}
