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
    }
    console.log(JSON.stringify(esQueryObj));
    return esQueryObj;
  },

  sort: function (field, order) {
    var sort = [];
    var k = {};
    k[field] = {
      "order": order
    };
    sort.push(k);
    return sort;
  },

  filter: function (fieldName, fieldValue) {
    esQueryObj.query = {
      "filtered": {
        "filter": {
          "and": []
        }
      }
    };
    var b = {};
    b["term"] = {};

    esQueryObj.query.filtered.filter.and.push(b);
    var c = {};
    var key = fieldName;
    c[key] = fieldValue;
    esQueryObj.query.filtered.filter.and[0].term = c;
    console.log(JSON.stringify(esQueryObj));
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

/*---------------------------------------------Driver Function------------------------------------------------------*/

if (require.main === module) {
  (function () {
    var field = 'balance';
    var order = 'desc';
    var sortTest = buildQuery.sort(field, order);

    var fTerm = 'gender';
    var fValue = 'm';
    // buildQuery.filter(fTerm, fValue);

    var kkk = {};
    var aa ={age:[30,35]};
    var d = "age, employer";
    kkk = buildQuery.QueryBuilder(aa, d);
    kkk.sort = sortTest;

    console.log(JSON.stringify(kkk));

  })();
}
