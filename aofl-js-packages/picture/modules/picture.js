/**
 * @summary aofl-picture
 * @version 3.0.0
 * @since 3.0.0
 * @author Arian Khosravi <arian.khosravi@aofl.com>
 */
import {AoflElement} from '@aofl/element';
import style from './picture.css';

/**
 * <aofl-picture> serves as a container for zero or more <aofl-source> and one <aofl-img> elements
 * to provide versions of an image for different display sizes.
 *
 * @memberof module:@aofl/picture
 * @extends {AoflElement}
 */
class AoflPicture extends AoflElement {
  /**
   * Creates an instance of AoflPicture.
   */
  constructor() {
    super();
    this.img = null;
    this.defaultSrc = null;
    this.sources = [];
    this.updateImageSrc = () => {
      const matchedSource = AoflPicture.findMatchingSource(this.sources);
      this.setMediaSrc(matchedSource);
    };
  }
  /**
   *
   * @readonly
   * @type {String}
   */
  static get is() {
    return 'aofl-picture';
  }
  /**
   *
   * @readonly
   * @type {Object}
   */
  static get properties() {
    return {
      'disable-sources': {type: Boolean}
    };
  }
  /**
   *
   * @return {Object}
   */
  render() {
    return super.render((ctx, html) => html`<slot></slot>`, [style]);
  }
  /**
   * setImg should be invoked by a slotted <aofl-img> and sets the aofl-img element as the main img element of aofl-picture.
   *
   * @param {HTMLElement} img
   */
  setImg(img) {
    /* istanbul ignore next */
    if (this.img !== null) { return; }
    this.img = img;
    this.defaultSrc = {
      src: this.img.src,
      height: this.img.height,
      width: this.img.width
    };

    this.updateImageSrc();
  }

  /**
   * addSource should be invoked by a slotted <aofl-source> element and adds aofl-source elements as alternative
   * sources for image besed on media attribute of aofl-source
   *
   * @param {String} source
   */
  addSource(source) {
    if (this['disable-sources']) return;
    const mediaQuery = window.matchMedia(source.getAttribute('media'));
    const sourceAttributes = {
      src: source.getAttribute('srcset'),
      height: source.getAttribute('height'),
      width: source.getAttribute('width'),
      mediaQuery
    };

    this.sources.push(sourceAttributes);
    mediaQuery.addListener(this.updateImageSrc);

    this.updateImageSrc();
  }
  /**
   * Set's aofl-picture's image source to the matching aofl-source media query.
   *
   * @param {String} [source=this.defaultSrc]
   */
  setMediaSrc(source = this.defaultSrc) {
    if (!this.img) { return; }
    const imgSrc = this.img.src;

    if (imgSrc !== source.src) {
      this.img.setAttribute('src', source.src);

      /* istanbul ignore else */
      if (source.width) {
        this.img.setAttribute('width', source.width);
      }

      /* istanbul ignore else */
      if (source.height) {
        this.img.setAttribute('height', source.height);
      }
    }
  }
  /**
   * Iterates through an array of sources and returns the first matching source.
   *
   * @param {Array} [sources=[]]
   * @return {Object}
   */
  static findMatchingSource(/* istanbul ignore next */sources = []) {
    for (let i = 0; i < sources.length; i++) {
      if (sources[i].mediaQuery.matches === true) {
        return sources[i];
      }
    }
  }
  /**
   *
   */
  disconnectedCallback() {
    for (let i = 0; i < this.sources.length; i++) {
      this.sources[i].mediaQuery.removeListener(this.updateImageSrc);
    }
    super.disconnectedCallback();
  }
}

if (window.customElements.get(AoflPicture.is) === void 0) {
  window.customElements.define(AoflPicture.is, AoflPicture);
}

export default AoflPicture;
