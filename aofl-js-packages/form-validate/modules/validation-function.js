/**
 * @summary validation-function
 *
 * @version 3.0.0
 * @since 1.0.0
 * @author Arian Khosravi <arian.khosravi@aofl.com>
 */
import {get} from '@aofl/object-utils';
/**
 * ValidationFunction implementation
 *
 * @memberof module:@aofl/form-validate
 */
class ValidationFunction {
  /**
   * Creates an instance of ValidationFunction.
   *
   * @param {Object} target
   * @param {Object} validatorFn
   * @param {String} path
   */
  constructor(target, validatorFn, path) {
    Object.defineProperties(this, {
      target: {
        value: target
      },
      path: {
        value: path
      },
      propName: {
        value: path.split('.').slice(0, -1)
          .join('.')
      },
      resolve: {
        writable: true
      },
      cachedPromise: {
        writable: true
      },
      validateCompletePromise: {
        writable: true
      },
      valid: {
        writable: true
      },
      observed: {
        writable: true
      },
      pending: {
        writable: true
      },
      validatorFn: {
        value: validatorFn
      }
    });

    this.reset();
  }

  /**
   *
   */
  reset() {
    this.cachedPromise = null;
    this.resolve = null;
    this.valid = true;
    this.observed = false;
    this.pending = false;
    this.validateCompletePromise = null;
  }

  /**
   *
   *
   */
  validate() {
    this.observed = true;
    const value = get(this.target, this.propName);
    const promise = Promise.resolve(this.validatorFn(value, this.target));

    this.cachedPromise = promise;

    if (this.pending === false) {
      this.validateCompletePromise = new Promise((resolve) => {
        this.resolve = resolve;
      });
    }

    this.pending = true;
    promise
      .then((valid) => {
        if (this.cachedPromise === promise) { // latest update
          this.valid = valid;
          this.pending = false;
          this.resolve();
          this.target.requestUpdate();
        }
      });
  }

  /**
   * @type {Promise}
   */
  get validateComplete() {
    return this.validateCompletePromise;
  }

  /* istanbul ignore next */
  /**
   *
   * @return {Array}
   */
  getKeys() {
    const keys = ['valid', 'pending', 'observed'];
    for (const key in this) {
      if (!Object.prototype.hasOwnProperty.call(this, key)) continue;
      keys.push(key);
    }
    return keys;
  }

  /* istanbul ignore next */
  /**
   * @return {String}
   */
  toString() {
    const keys = this.getKeys();
    return JSON.stringify(this, keys, 2);
  }
}

export {
  ValidationFunction
};
