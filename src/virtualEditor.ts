import { v4 as uuidv4 } from 'uuid';
import { safeParse, Validator, WorkingState } from 'salve-dom/build/dist';
import { Grammar, GrammarWalker, NameResolver } from 'salve-annos/build/dist';

class VirtualEditor {
  #id: string;
  #validatorPrefix: string;
  #schemaId?: string;
  #schema?: Grammar;
  #walker?: GrammarWalker<NameResolver>;
  #docXML?: Document;
  #validator?: Validator;

  constructor() {
    this.#id = uuidv4();
    this.#validatorPrefix = 'cwrc';
  }

  reset() {
    this.stopValidator();
    this.#id = uuidv4();
    this.#schemaId = undefined;
    this.#schema = undefined;
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

  async setSchema({ id, grammar }: { id: string; grammar: Grammar }): Promise<Grammar> {
    this.#schemaId = id;
    this.#schema = grammar;
    // this.#walker = grammar.newWalker();

    return this.#schema;
  }

  get document() {
    return this.#docXML;
  }

  setDocument(documentString: string) {
    this.#docXML = safeParse(documentString, window);

    //TODO Must be a better way to do this. Perhaps .resetTo | .resetAt | or event create a new Validator;
    //@ts-ignore //We need to fort validaotr to update document
    if (this.#validator) this.#validator.root = this.#docXML;

    return this.#docXML;
  }

  get validator() {
    return this.#validator;
  }

  setValidator() {
    if (!this.#docXML) throw new Error('Document is not set');

    const validator: Validator = new Validator(this.#schema, this.#docXML, {
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

    this.#validator.start();

    return this.#validator;
  }

  restartValidator = () => {
    if (!this.#validator) throw new Error('Validator is not set');
    if (this.#validator.getWorkingState().state === WorkingState.WORKING) this.stopValidator();

    //TODO Must be a better way to do this. Perhaps .resetTo | .resetAt | or event create a new Validator;
    //@ts-ignore //We need to for validator to update document
    this.#validator.root = this.#docXML;
    //@ts-ignore
    this.#validator.restartAt();

    return this.#validator;
  };

  stopValidator() {
    if (!this.#validator) throw new Error('Validator is not set');
    this.#validator.stop();

    return this.#validator;
  }
}

export const virtualEditor = new VirtualEditor();
export default VirtualEditor;
