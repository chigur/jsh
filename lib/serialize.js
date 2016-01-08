'use strict';

let isPrimitive = require('./utils').isPrimitive;

function serialize(obj, paths, currentPath) {
  paths = paths || {};
  currentPath = currentPath || '';

  for (let key of Object.keys(obj)) {
    let val = obj[key];
    let newPath = `${currentPath}/${key}`;

    if (isPrimitive(val)) {
      paths[newPath] = val;
    } else {
      paths = serialize(val, paths, newPath);
    }
  }

  return paths;
}

module.exports = serialize;