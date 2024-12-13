/**
 * Create an object composed of the picked object properties
 * @param {Object} object
 * @param {string[]} keys
 * @returns {Object}
 */
const match = (object: Record<string, any>, keys: string[]) =>
  keys.reduce((obj: any, key: string) => {
    if (object && Object.prototype.hasOwnProperty.call(object, 'search')) {
      // eslint-disable-next-line no-param-reassign
      obj[key] = { $regex: object['search'], $options: 'i' };
    }
    return obj;
  }, {});

export default match;
