import { sortBy, uniqBy } from 'lodash';
import Observable, { SubscriptionObserver } from 'observable-fns/observable';
import { EventSet } from 'salve-annos/build/dist';
import { AttributeValueEvent, EndTagEvent, TextEvent } from 'salve-annos/build/dist/salve/events';
import { ErrorData, WorkingStateData, WorkingState } from 'salve-dom/build/dist';
import { evaluateXPath, getFullNameFromDocumentation, getXPathForElement } from './utils';
import { virtualEditor } from './virtualEditor';

type DocumentString = string;

export interface ValidateRequestOptions {
  userRequest?: boolean;
  newDocument?: boolean;
}

interface ValidationNodeTarget {
  index?: number;
  isAttr: boolean;
  name?: string;
  ns?: string;
  documentation?: string;
  fullName?: string;
  xpath?: string;
}

interface ValidationNodeElement {
  name?: string;
  documentation?: string;
  fullName?: string;
  xpath?: string;
  parentElementName?: string;
  parentElementXpath?: string;
  parentElementIndex?: number;
}

export interface ValidationNode {
  type?: string;
  msg: string;
  target: ValidationNodeTarget;
  element?: ValidationNodeElement;
}

export interface ValidationResponse {
  state?: WorkingState;
  partDone?: number;
  valid?: boolean;
  errors?: ValidationNode[];
}

type PossibleNodes = {
  name: string;
};

export interface possibleTags {
  name: string | RegExp;
  ns?: string;
  fullName?: string;
  documentation?: string;
}

export interface ValidatePossibleAtResponse {
  xpath: string;
  index: number;
  possibleTags?: possibleTags[];
  possibleNodes?: PossibleNodes[];
}


let observable: Observable<any>;

const SKIP_EVENTS = new Set(['leaveStartTag']);

const ERROR_TYPES: Map<string, string> = new Map();
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

export const validate = (documentString: string) => {
  console.time('Validate Document');

  virtualEditor.setDocument(documentString);
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

const handleValidatorStateUpdate = (
  { partDone, state }: WorkingStateData,
  observer: SubscriptionObserver<any>
) => {
  //* state [1] INCOMPLETE: Doesn't happens here because validator runs without timeout
  //* State [2] WORKING: Keep updating the main thread;
  if (state === 2) {
    observer.next({ state, partDone });
    return;
  }

  if (!virtualEditor.validator) throw new Error('virtualEditor: Validator not set');
  const valid = virtualEditor.validator.errors.length > 0 ? false : true;

  //* State [4] VALID: Resolve
  if (state === 4) {
    console.timeEnd('Validate Document');
    observer.next({ valid });
    return;
  }

  //* State [3] INVALID: Process errors and Resolve
  const errors: ValidationNode[] = virtualEditor.validator.errors.map((errorData) =>
    parseErrors(errorData)
  );

  console.timeEnd('Validate Document');
  observer.next({ valid, errors });
};

const parseErrors = ({ error, index, node }: ErrorData): ValidationNode => {
  if (!virtualEditor.document) throw new Error('virtualEditor: Document not set');

  /*
    error types:
    - AttributeNameError
    - AttributeValueError
    - ElementNameError
    - ChoiceError
    - ValidationError (more severe?)
  */

  const type =
    ERROR_TYPES.get(error.constructor?.name) ??
    ERROR_TYPES.get(error.msg) ??
    ERROR_TYPES.get('ValidationError');

  const msg = error.msg;

  const target: ValidationNodeTarget = {
    index,
    isAttr: type === 'AttributeNameError' ? true : false,
  };

  if (error.name) {
    target.name = error.name.name;
    target.ns = error.name.ns;
    target.documentation = error.name.documentation
      ? error.name.documentation
      : getDocumentation(target.name) ?? undefined;
    target.fullName = target.documentation
      ? getFullNameFromDocumentation(target.documentation)
      : undefined;
  }

  if (!node) return { type, msg, target };

  const element: ValidationNodeElement = {};

  const elementNode =
    type === 'AttributeNameError' || type === 'AttributeValueError'
      ? //@ts-ignore
        node.ownerElement
      : node;

  element.name = elementNode.nodeName;
  element.documentation = getDocumentation(element.name) ?? undefined;
  element.fullName = element.documentation
    ? getFullNameFromDocumentation(element.documentation)
    : undefined;

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

export const validatePossibleAt = async (
  xpath: string,
  index: number,
  type: string
): Promise<ValidatePossibleAtResponse> => {
  console.time(`Validate ${type}`);
  if (!virtualEditor.document) throw new Error('virtualEditor: Document not set');
  if (!virtualEditor.validator) throw new Error('virtualEditor: Validator not set');

  const isAttr = type === 'AttributeNameError';
  const container = evaluateXPath(xpath, virtualEditor.document);

  const possibleAt: EventSet = virtualEditor.validator.possibleAt(container, index, isAttr);
  const { possibleNodes, possibleTags } = parsePossibleAt(possibleAt, isAttr);

  console.timeEnd(`Validate ${type}`);
  return { xpath, index, possibleNodes, possibleTags };
};

const parsePossibleAt = (possibleAt: EventSet, isAttr: boolean) => {
  //Pepare to store possible events
  const possibleNodes: PossibleNodes[] = [] as PossibleNodes[]; //specific for text or end-tag
  let possibleTags: possibleTags[] = [];

  Array.from(possibleAt).forEach((event) => {
    //skip events
    if (SKIP_EVENTS.has(event.name)) return;

    //get events for text or endtags, since they have less information
    if (event.name === 'text' || event.name === 'endTag') {
      const ev: EndTagEvent | TextEvent = event as EndTagEvent | TextEvent;
      const node: PossibleNodes = { name: ev.name };
      possibleNodes.push(node);
      return;
    }

    if (event.isAttributeEvent) {
      const ev: AttributeValueEvent = event as AttributeValueEvent;
      possibleTags.push({ name: ev.value });
      return;
    }

    //other events
    const {
      //@ts-ignore
      namePattern: { name, ns, documentation },
    } = event;

    const fullName = getFullNameFromDocumentation(documentation) ?? undefined;

    possibleTags.push({ name, ns, fullName, documentation });
  });

  //remove duplicates and sort alphabetacally;
  possibleTags = uniqBy(possibleTags, 'name');
  possibleTags = sortBy(possibleTags, ['name']);

  possibleNodes.reverse();

  return { possibleNodes, possibleTags };
};

const getDocumentation = (tagName?: string) => {
  if (!tagName) return;

  if (!virtualEditor.schema) throw new Error('schema is not set');

  //@ts-ignore
  const definitions = Array.from(virtualEditor.schema.definitions.values());
  const definition: any = definitions.find((def: any) => def.pat?.name?.name === tagName);

  const documentation = definition
    ? definition.pat.name.documentation
    : 'Element undefined or documentation unavailable';

  return documentation;
};
