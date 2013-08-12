var ret = require('ret')
  , types = ret.types
  ;


// if code is alphabetic, converts to other case
// if not alphabetic, returns back code
var toOtherCase = function(code) {
  return code + (97 <= code && code <= 122 ? -32 :
                 65 <= code && code <= 90  ?  32 : 0);
};

// returns subset of [a, b] if [from, to] is in it
var range = function(a, b, from, to) {
  return a <= from && from <= b ? { from: from, to: Math.min(b, to) } :
         a <= to   && to   <= b ? { from: Math.max(a, from), to: to } :
         false;
};

// returns true if all properties of a are equal to b
// a and b are arrays of objects
var deepEqual = function(a, b) {
  var i, l, key, obj;
  if ((l = a.length) !== b.length) return false;

  for (i = 0; i < l; i++) {
    obj = a[i];
    for (key in obj) {
      if (obj.hasOwnProperty(key) && obj[key] !== b[i][key]) {
        return false;
      }
    }
  }

  return true;
};

// returns true if negated needle set is inside of sets array
// using deepEqual as comparator
var findNotSet = function(sets, needle) {
  for (var i = 0, l = sets.length; i < l; i++) {
    var cset = sets[i];
    if (cset.not !== needle.not && deepEqual(cset.set, needle.set)) {
      return true;
    }
  }

  return false;
};

// returns true if character is in class set
var inClass = function(set, code, ignoreCase) {
  var token
    , v
    , sets = []
    , infLoop = false
    ;

  for (var i = 0, l = set.length; i < l; i++) {
    token = set[i];

    switch (token.type) {
      case types.CHAR:
        v = token.value;
        if (v === code || (ignoreCase && toOtherCase(v) === code)) {
          return true;
        }
        break;

      case types.RANGE:
        // if ignoreCase is on, and alphabetic character ranges fall
        // inside this range, check against both cases
        if (token.from <= code && code <= token.to || (ignoreCase &&
            (((v = range(97, 122, token.from, token.to)) !== false &&
              v.from <= code && code <= v.to) ||
              ((v = range(65, 90, token.from, token.to)) !== false &&
              v.from <= code && code <= v.to)))) {
          return true;
        }
        break;

      case types.SET:
        // use these to detect an infinite loop with 2 sets
        // that cancel out each other
        if (sets.length > 0 && findNotSet(sets, token)) {
          infLoop = true;
        } else {
          sets.push(token);
        }

        if (!infLoop &&
            inClass(token.set, code, ignoreCase) !== token.not) {
          return true;
        }
    }
  }

  return false;
};

var char = function(code) {
  return String.fromCharCode(code);
};


// generate the simplest string modeled after given tokens
var gen = function(token, groups, negate) {
  var groupNumber, stackArray, stack, str, n, i, l, k, not;
  var result, groupsBaseLen, groupsSave;

  switch (token.type) {


    case types.ROOT:
    case types.GROUP:
      if (token.notFollowedBy) { return ''; }

      // insert placeholder until group string is generated
      if (token.remember) {
        groups.push(false);
      }

      stackArray = token.options ? token.options : [token.stack];
      result = null;
      groupsBaseLen = groups.length;

      for (k = 0; k < stackArray.length; k++) {
        stack = stackArray[k];
        groups.length = groupsBaseLen;

        str = '';
        for (i = 0, l = stack.length; i < l; i++) {
          str += gen.call(this, stack[i], groups);
        }

        if (result === null || str.length < result.length) {
          result = str;
          groupsSave = JSON.stringify(groups.slice(groupsBaseLen));
          if (str === '') break;
        }
      }

      groups.length = groupsBaseLen;
      [].push.apply(groups, JSON.parse(groupsSave));

      if (token.remember) {
        groups[groupsBaseLen - 1] = result;
      }
      return result;


    case types.POSITION:
      // do nothing for now
      return '';


    case types.SET:

      // if this class is an except class i.e. [^abc]
      // traverse the list of characters until one that isn't in this class
      // is found
      negate = !!negate;
      not = negate !== token.not;
      if (not) {
        for (var code = 32; code < 65536; code++) {
          var c = String.fromCharCode(code);
          if (inClass(token.set, code, this.ignoreCase)) { continue; }
          return c;
        }
        for (var code = 0; code < 31; code++) {
          var c = String.fromCharCode(code);
          if (inClass(token.set, code, this.ignoreCase)) { continue; }
          return c;
        }
      // otherwise, pick the first token in the class set
      } else {
        return gen.call(this, token.set[0], groups, not);
      }
      break;


    case types.RANGE:
      // pick the first character in the range
      return char(token.from);


    case types.REPETITION:
      // repeat the smallest allowed times
      n = token.min;

      str = '';
      for (i = 0; i < n; i++) {
        str += gen.call(this, token.value, groups);
      }

      return str;


    case types.REFERENCE:
      return groups[token.value - 1] || '';


    case types.CHAR:
      return char(token.value);
  }
};


// constructor
// takes either a regexp or a string with modifiers
var SimpExp = module.exports = function(regexp, m) {
  if (regexp instanceof RegExp) {
    this.ignoreCase = regexp.ignoreCase;
    this.multiline = regexp.multiline;
    regexp = regexp.source;

  } else if (typeof regexp === 'string') {
    this.ignoreCase = m && m.indexOf('i') !== -1;
    this.multiline = m && m.indexOf('m') !== -1;
  } else {
    throw new Error('Expected a regexp or string');
  }

  this.tokens = ret(regexp);
};

// generates the string
SimpExp.prototype.gen = function() {
  return gen.call(this, this.tokens, []);
};


// enables use of simpexp with a shorter calls
// saves the SimpExp object into the regex
var simpexp = SimpExp.simpexp = function(regexp, m) {
  var simpexp;

  if (regexp._randexp === undefined) {
    simpexp = new SimpExp(regexp, m);
    regexp._randexp = simpexp;
  } else {
    simpexp = regexp._randexp;
  }

  return simpexp.gen();
};

// this enables sugary /regexp/.gen syntax
SimpExp.sugar = function() {
  RegExp.prototype.gen = function() {
    return simpexp(this);
  };
};
