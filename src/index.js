import { expose } from 'threads/worker';
// import * as salve from './lib/salve/salve.min.js';
import * as salve from 'salve-annos/build/dist/salve.min';
import jsdom from './lib/jsdom/jsdom-browserified.js';
import { loadSchema } from './conversion';
import { possibleAt } from './possible';
import { validate, validatePossibleAt } from './validate';
import { virtualEditor } from './virtualEditor';

const { JSDOM } = jsdom;
const DOM = new JSDOM('<!DOCTYPE html><p>_</p>');
self.window = DOM.window;

self.salve = salve;

console.info('WORKER VALIDATOR READY');

expose({
  async loadSchema(schema) {
    return await loadSchema(schema);
  },
  validate(documentString, userRequest) {
    return validate(documentString, userRequest);
  }, 
  async validatePossible(xpath, index, type) {
    return await validatePossibleAt(xpath, index, type);
  },
  hasValidator() {
    return virtualEditor.hasValidator();
  },
  async possibleAtContextMenu(parameters) {
    return await possibleAt(parameters);
  },
});
