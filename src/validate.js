import { sortBy, uniqBy } from 'lodash';
import Observable from 'observable-fns/observable';
import { virtualEditor } from './virtualEditor';
import { evaluateXPath, getFullNameFromDocumentation, getXPathForElement } from './utils';

let observable;

const SKIP_EVENTS = new Set(['leaveStartTag']);

const ERROR_TYPES = new Map();
ERROR_TYPES.set('AttributeNameError', 'AttributeNameError');
ERROR_TYPES.set('AttributeValueError', 'AttributeValueError');
ERROR_TYPES.set('ElementNameError', 'ElementNameError');
ERROR_TYPES.set('ChoiceError', 'ChoiceError');
ERROR_TYPES.set('ValidationError', 'ValidationError');
ERROR_TYPES.set('attribute not allowed here', 'AttributeNameError');
ERROR_TYPES.set('invalid attribute value', 'AttributeValueError');
ERROR_TYPES.set('tag not allowed here', 'ElementNameError');
ERROR_TYPES.set('one value required from the following', 'ChoiceError'); //this might not work
ERROR_TYPES.set('text not allowed here', 'ValidationError');

export const validate = (documentString, { userRequest = false, newDocument = false } = {}) => {
  console.time('Validate Document');

  virtualEditor.setDocument(documentString);

  if (!observable || userRequest || newDocument) return createValidator();

  virtualEditor.restartValidator();
};

const createValidator = () => {
  const validator = virtualEditor.setValidator();

  observable = new Observable((observer) => {
    validator.events.addEventListener('error', () => {
      //TODO Informe progress to the UI
    });

    validator.events.addEventListener('state-update', (event) =>
      handleValidatorStateUpdate(event, observer)
    );
  });

  validator.start();

  return observable;
};

const handleValidatorStateUpdate = ({ partDone, state }, observer) => {
  //* state [1] INCOMPLETE: Doesn't happens here because validator runs without timeout
  //* State [2] WORKING: Keep updating the main thread;
  if (state === 2) {
    observer.next({ state, partDone });
    return;
  }

  const valid = virtualEditor.validator.errors.length > 0 ? false : true;

  //* State [4] VALID: Resolve
  if (state === 4) {
    console.timeEnd('Validate Document');
    observer.next({ valid });
    return;
  }

  //* State [3] INVALID: Process errors and Resolve
  const errors = virtualEditor.validator.errors.map((errorData) => parseErrors(errorData));

  console.timeEnd('Validate Document');
  observer.next({ valid, errors });
};

const parseErrors = ({ error, index, node }) => {
  /*
    error types:
    - AttributeNameError
    - AttributeValueError
    - ElementNameError
    - ChoiceError
    - ValidationError (more severe?)
  */

  const type =
    ERROR_TYPES.get(error.constructor.name) ??
    ERROR_TYPES.get(error.msg) ??
    ERROR_TYPES.get('ValidationError');

  const msg = error.msg;

  const target = {
    index,
    isAttr: type === 'AttributeNameError' ? true : false,
  };

  if (error.name) {
    target.name = error.name.name;
    target.ns = error.name.ns;
    target.documentation = error.name.documentation
      ? error.name.documentation
      : getDocumentation(target.name) ?? null;
    target.fullName = target.documentation
      ? getFullNameFromDocumentation(target.documentation)
      : null;
  }

  const element = {};
  const elementNode =
    type === 'AttributeNameError' || type === 'AttributeValueError' ? node.ownerElement : node;
  element.name = elementNode.nodeName;
  element.documentation = getDocumentation(element.name) ?? null;
  element.fullName = element.documentation
    ? getFullNameFromDocumentation(element.documentation)
    : null;

  element.xpath = getXPathForElement(elementNode, virtualEditor.document);

  if (type === 'ElementNameError') {
    target.xpath = `${element.xpath}/${target.name}`;
  }

  if (type === 'AttributeNameError' || type === 'AttributeValueError') {
    target.xpath = `${element.xpath}/@${target.name}`;
  }

  if (type === 'AttributeNameError') {
    const parentElement = elementNode.parentElement ?? elementNode;
    element.parentElementName = parentElement.nodeName;
    element.parentElementXpath = getXPathForElement(parentElement, virtualEditor.document);

    //index of element that holds the attribute
    const index = Array.from(parentElement.childNodes).findIndex((child) => child === elementNode);
    element.parentElementIndex = index;
  }

  return { type, msg, target, element };
};

export const validatePossibleAt = async (xpath, index, type) => {
  console.time(`Validate ${type}`);

  const isAttr = type === 'AttributeNameError';
  const container = evaluateXPath(virtualEditor.document, xpath);

  const possibleAt = virtualEditor.validator.possibleAt(container, index, isAttr);
  const [possibleNodes, possibleTags] = parsePossibleAt(possibleAt, type);

  console.timeEnd(`Validate ${type}`);
  return { xpath, index, possibleNodes, possibleTags };
};

const parsePossibleAt = (possibleAt, type) => {
  //Pepare to store possible events
  const possibleNodes = []; //specific for text or end-tag
  let possibleTags = [];

  Array.from(possibleAt).forEach((event) => {
    //skip events
    if (SKIP_EVENTS.has(event.name)) return;

    //get events for text or endtags, since they have less information
    if (event.name === 'text' || event.name === 'endTag') {
      possibleNodes.push({ name: event.name });
      return;
    }

    //Attributes Errors are simplier
    if (type === 'AttributeValueError') {
      possibleTags.push({ name: event.value });
      return;
    }

    //other events
    const {
      namePattern: { name, ns, documentation = null },
    } = event;

    const fullName = documentation ? getFullNameFromDocumentation(documentation) : null;

    possibleTags.push({ name, ns, fullName, documentation });
  });

  //remove duplicates and sort alphabetacally;
  possibleTags = uniqBy(possibleTags, 'name');
  possibleTags = sortBy(possibleTags, ['name']);

  possibleNodes.reverse();

  return [possibleNodes, possibleTags];
};

const getDocumentation = (tagName) => {
  if (!tagName) return;

  const definitions = Array.from(virtualEditor.schema.definitions.values());
  const definition = definitions.find((def) => def.pat?.name?.name === tagName);

  const documentation = definition
    ? definition.pat.name.documentation
    : 'Element undefined or documentation unavailable';

  return documentation;
};
