import { v4 as uuidv4 } from 'uuid';
import { safeParse, Validator } from './lib/salve-dom/salve-dom.min.js';

class VirtualEditor {
  #id;
  #schema;
  #schemaId;
  #walker;
  #docXML;
  #validator;
  #validatorPrefix;

  constructor() {
    this.#id = uuidv4();
    this.#validatorPrefix = 'cwrc';
  }

  reset() {
    this.stopValidator();

    this.#id = uuidv4();
    this.#schema = undefined;
    this.#schemaId = undefined;
    this.#walker = undefined;
    this.#docXML = undefined;
    this.#validator = undefined;

    return this;
  }

  get id() {
    return this.#id;
  }

  get schemaId() {
    return this.#schemaId;
  }

  get schema() {
    return this.#schema;
  }

  async setSchema({ id, grammar }) {
    this.#schemaId = id;
    this.#schema = grammar;
    this.#walker = grammar.newWalker();

    return this.#schema;
  }

  get document() {
    return this.#docXML;
  }

  setDocument(documentString) {
    // this.#docXML = parseXMLString(documentString);
    
    this.#docXML = safeParse(documentString, window);
    if (this.#validator) this.#validator.root = this.#docXML;

    return this.#docXML;
  }

  get validator() {
    return this.#validator;
  }

  setValidator() {
    if (!this.#docXML) throw new Error('Document is not set');

    const validator = new Validator(this.#schema, this.#docXML, {
      prefix: this.#validatorPrefix,
      timeout: 0,
      maxTimespan: 0,
    });

    this.#validator = validator;

    return this.#validator;
  }

  hasValidator() {
    return this.#validator ? true : false;
  }

  startValidator() {
    if (!this.#validator) throw new Error('Validator is not set');
    this.validator.start();

    return this.#validator;
  }

  restartValidator = () => {
    if (!this.#validator) throw new Error('Validator is not set');
    if (this.#validator.getWorkingState() === 2) this.stopValidator();

    this.#validator.root = this.#docXML;
    this.validator.restartAt();

    return this.#validator;
  };

  stopValidator() {
    if (!this.#validator) throw new Error('Validator is not set');
    this.validator.stop();

    return this.#validator;
  }
};

export const virtualEditor = new VirtualEditor();
export default VirtualEditor;
