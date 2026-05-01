// Minimal object-hash shim for Tailwind CSS config hashing
// Produces a deterministic string hash from any JS value

function objectHash(obj) {
  return stableStringify(obj);
}

function stableStringify(val) {
  if (val === null || val === undefined) return String(val);
  if (typeof val === 'boolean' || typeof val === 'number') return String(val);
  if (typeof val === 'string') return JSON.stringify(val);
  if (typeof val === 'function') return '"__fn__"';
  if (Array.isArray(val)) {
    return '[' + val.map(stableStringify).join(',') + ']';
  }
  if (typeof val === 'object') {
    var keys = Object.keys(val).sort();
    return '{' + keys.map(function (k) {
      return JSON.stringify(k) + ':' + stableStringify(val[k]);
    }).join(',') + '}';
  }
  return String(val);
}

objectHash.sha1 = objectHash;
objectHash.MD5 = objectHash;
objectHash.keys = objectHash;
objectHash.keysMD5 = objectHash;

module.exports = objectHash;
