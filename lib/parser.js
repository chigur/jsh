'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parse;
var rules = new Map();

rules.set(/['"`]/, function (char, state) {
  if (state.name === 'START') {
    state.name = 'QUOTE';
    state.quoteChar = char;
    return true;
  } else if (state.name === 'QUOTE' && char === state.quoteChar) {
    state.name = 'START';
    state.quoteChar = undefined;
    return true;
  }
});

rules.set(/\\/, function (char, state) {
  if (state.name === 'QUOTE') {
    state.name = 'QUOTE_ESCAPE';
    return true;
  }
});

rules.set(/\//, function (char, state) {
  if (state.name === 'START') {
    state.name = 'SLASH';
    return true;
  } else if (state.name === 'SLASH') {
    state.name = 'COMMENT_SL';
    return true;
  } else if (state.name === 'COMMENT_ML_END1') {
    state.name = 'START';
    return true;
  } else if (state.name === 'QUOTE' && char === state.quoteChar) {
    state.name = 'START';
    state.quoteChar = undefined;
    return true;
  }
});

rules.set(/\*/, function (char, state) {
  if (state.name === 'SLASH') {
    state.name = 'COMMENT_ML';
    return true;
  } else if (state.name === 'COMMENT_ML') {
    state.name = 'COMMENT_ML_END1';
    return true;
  }
});

rules.set(/[^\/]/, function (char, state) {
  if (state.name === 'COMMENT_ML_END1') {
    state.name = 'COMMENT_ML';
    return true;
  }
});

rules.set(/[^\*\/]/, function (char, state) {
  if (state.name === 'SLASH') {
    state.name = 'QUOTE';
    state.quoteChar = '/';
    return true;
  }
});

rules.set(/\n/, function (char, state) {
  if (state.name === 'COMMENT_SL') {
    state.name = 'START';
    return true;
  }
});

rules.set(/\{/, function (char, state) {
  if (state.name === 'START') {
    state.count++;
    return true;
  }
});

rules.set(/\}/, function (char, state) {
  if (state.name === 'START') {
    state.count--;
    return true;
  }
});

rules.set(/./, function (char, state) {
  if (state.name === 'QUOTE_ESCAPE') {
    state.name = 'QUOTE';
    return true;
  }
});

function separate(input) {
  input = input.trim();
  // HACK: for git-bash auto conversion to path bug
  input = input.replace(/[A-Z]:\/Users\/\w+\/AppData\/Local\/Temp/, '/tmp');
  input = input.replace(/[A-Z]:\/[^\/]*?\/Git/, '');
  var separateAt = input.match(/\s/);

  if (separateAt === null) {
    throw new Error('Parsing Error');
  }

  var pattern = input.slice(0, separateAt.index);
  var rest = input.slice(separateAt.index + 1);
  rest = rest.trim();

  return { pattern: pattern, rest: rest };
}

function parse(input, output, state) {
  var sep = separate(input),
      pattern = sep.pattern,
      rest = sep.rest;
  var command = undefined,
      i = undefined;

  output = output || new Map();
  if (!state) {
    state = { name: 'START', quoteChar: undefined, count: 0 };
  }

  for (i = 0; i < rest.length; i++) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = rules.keys()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var rule = _step.value;

        if (rule.test(rest[i])) {
          if (rules.get(rule)(rest[i], state)) {
            break;
          }
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    if (state.count === 0) {
      break;
    }
  }

  if (state.count === 0 && state.name === 'START' && state.quoteChar === undefined) {
    command = rest.slice(0, i + 1);
    output.set(pattern, command);

    rest = rest.slice(i + 1);
    rest = rest.trim();

    if (rest.length > 0) {
      parse(rest, output);
    }
  } else {
    throw new Error('Parsing Error');
  }

  return output;
}