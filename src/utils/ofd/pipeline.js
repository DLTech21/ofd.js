
'use strict';
Array.prototype.pipeline = async function(callback){
  if (null === this || 'undefined' === typeof this) {
    // At the moment all modern browsers, that support strict mode, have
    // native implementation of Array.prototype.reduce. For instance, IE8
    // does not support strict mode, so this check is actually useless.
    throw new TypeError(
      'Array.prototype.pipeline called on null or undefined');
  }
  if ('function' !== typeof callback) {
    throw new TypeError(callback + ' is not a function');
  }
  var index, value,
    length = this.length >>> 0;
  for (index = 0; length > index; ++index) {
    value = await callback(value, this[index], index, this);
  }
  return value;
};

let _pipeline = function(...funcs){
  return funcs.pipeline((a, b) => b.call(this, a));
}

export const pipeline = _pipeline;
