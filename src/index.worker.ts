import * as Comlink from 'comlink';
import * as salve from 'salve-annos/build/dist';
import { loadSchema, SchemaRequest } from './conversion';
//@ts-ignore
import jsdom from './lib/jsdom/jsdom-browserified.js';
import { possibleAt, PossibleRequest } from './possible';
import { attributesForTag, tagAt, TagRequest } from './tag';
import { validate, validatePossibleAt, ValidationResponse } from './validate';
import { virtualEditor } from './virtualEditor';

export { SchemaRequest, SchemaResponse } from './conversion';
export { PossibleRequest, PossibleResponse, Selection } from './possible';
export { Tag } from './sharedTypes';
export { TagAttribute, TagRequest } from './tag';
export {
  PossibleNodes,
  ValidatePossibleAtResponse,
  ValidationNode,
  ValidationNodeElement,
  ValidationNodeTarget,
  ValidationResponse,
} from './validate';

//INITIALIZE
const { JSDOM } = jsdom;
const DOM = new JSDOM('<!DOCTYPE html><p>_</p>');
//@ts-ignore
self.window = DOM.window as Window;
//@ts-ignore
self.salve = salve;

console.info('WORKER VALIDATOR READY');

const cwrcWorkerValidator = {
  async loadSchema(schema: SchemaRequest) {
    return await loadSchema(schema);
  },
  validate(documentString: string, callback: (value: ValidationResponse) => void) {
    return validate(documentString, callback);
  },
  async validatePossible(xpath: string, index: number, type: string) {
    return await validatePossibleAt(xpath, index, type);
  },
  async tagAt(tag: TagRequest) {
    return await tagAt(tag);
  },
  async attributesForTag(xpath: string, index?: number) {
    return await attributesForTag(xpath, index);
  },
  hasValidator() {
    return virtualEditor.hasValidator();
  },
  async possibleAtContextMenu(parameters: PossibleRequest) {
    return await possibleAt(parameters);
  },
};

export type CwrcWorkerValidator = typeof cwrcWorkerValidator;

Comlink.expose(cwrcWorkerValidator);
