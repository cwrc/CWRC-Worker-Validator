import { sortBy, uniqBy } from 'lodash';
import { evaluateXPath, getFullNameFromDocumentation } from './utils';
import { virtualEditor } from './virtualEditor';

const skipEvent = new Set(['leaveStartTag', 'endTag', 'text']);
const processSpeculativeContent = new Map();

export const possibleAt = async ({ xpath, index, selection = undefined }) => {
  const _type = selection ? ` - ${selection.type}` : '';
  console.groupCollapsed(`PossibleAt: ${xpath}${_type}`);
  console.time('Timer');

  const container = evaluateXPath(virtualEditor.document, xpath);
  const possibleAt = virtualEditor.validator.possibleAt(container, index);
  const possibleTags = storePossibleTags(possibleAt);

  const speculativeTags =
    speculate({
      container,
      index,
      possibleTags,
      selection,
    }) ?? null;

  const result = {
    xpath,
    index,
    tags: {
      possible: possibleTags,
      speculative: speculativeTags,
    },
  };

  console.timeEnd('Timer');
  console.groupEnd();

  return result;
};

//Pepare to store possible tags
const storePossibleTags = (possibleAt) => {
  let possibleTags = [];

  Array.from(possibleAt).forEach((event) => {
    if (skipEvent.has(event.name)) return;

    const {
      namePattern: { name, documentation = null },
    } = event;

    const fullName = documentation ? getFullNameFromDocumentation(documentation) : null;

    possibleTags.push({ name, fullName });
  });

  possibleTags = uniqBy(possibleTags, 'name');
  possibleTags = sortBy(possibleTags, ['name']);

  return possibleTags;
};

const speculate = ({ container, index, possibleTags, selection = undefined }) => {
  // console.time('Speculative Possibilities');
  const speculativePossibility = [];

  for (const tag of possibleTags) {
    const specContent = speculativeContent(container, tag, selection);
    if (!specContent) continue;

    const speculation = virtualEditor.validator.speculativelyValidate(
      container,
      index,
      specContent
    );

    //specualtive validate returns an errors
    //when it is not possible to add a
    //specific tag (or event) in the container
    //We add the ones that doesn't have errors.
    if (!speculation) speculativePossibility.push(tag);
  }

  // console.timeEnd('Speculative Possibilities');
  return speculativePossibility;
};

const speculativeContent = (container, tag, selection = undefined) => {
  if (!selection || !selection.type) {
    const specContent = virtualEditor.document.createElement(tag.name);
    return specContent;
  }

  const { type } = selection;
  return processSpeculativeContent.get(type)(tag, selection, container);
};

const processSpeculativeContentSpan = (tag, selection, container) => {
  const { startContainerIndex, startOffset, endContainerIndex, endOffset } = selection;

  const specContent = virtualEditor.document.createElement(tag.name);

  Array.from(container.childNodes).forEach((child, i) => {
    if (i === startContainerIndex) {
      const textIn = child.textContent.substring(startOffset, child.textContent.length);
      specContent.append(textIn);
    }

    if (i > startContainerIndex && i < endContainerIndex) {
      const clone = child.cloneNode(true);
      specContent.append(clone);
    }

    if (i === endContainerIndex) {
      const textIn = child.textContent.substring(0, endOffset);
      specContent.append(textIn);
    }
  });

  return specContent;
};

const processSpeculativeContenChildNodes = (tag, selection) => {
  const { startContainerIndex, endContainerIndex, skip, xpath } = selection;

  if (skip === tag.name) return;

  const specContent = virtualEditor.document.createElement(tag.name);
  const contentContainer = evaluateXPath(virtualEditor.document, xpath);
  Array.from(contentContainer.childNodes).forEach((child, i) => {
    if (i >= startContainerIndex && i <= endContainerIndex) {
      const clone = child.cloneNode(true);
      specContent.append(clone);
    }
  });

  return specContent;
};

const processSpeculativeContentBefore = (tag, selection) => {
  const { containerIndex, xpath } = selection;

  const specArray = [];

  const specContent = virtualEditor.document.createElement(tag.name);
  const contentContainer = evaluateXPath(virtualEditor.document, xpath);

  Array.from(contentContainer.childNodes).forEach((child, i) => {
    if (i <= containerIndex) {
      const clone = child.cloneNode(true);
      specArray.push(clone);
    }
    if (i === containerIndex) {
      specArray.push(specContent);
    }
    if (i > containerIndex) {
      const clone = child.cloneNode(true);
      specArray.push(clone);
    }
  });

  return specArray;
};

const processSpeculativeContentAfter = (tag, selection) => {
  const { containerIndex, xpath } = selection;

  const specArray = [];

  const specContent = virtualEditor.document.createElement(tag.name);
  specArray.push(specContent);

  const contentContainer = evaluateXPath(virtualEditor.document, xpath);
  Array.from(contentContainer.childNodes).forEach((child, i) => {
    if (i >= containerIndex) {
      const clone = child.cloneNode(true);
      specArray.push(clone);
    }
  });

  return specArray;
};

const processSpeculativeContentNode = (tag, selection) => {
  const { xpath } = selection;

  const specContent = virtualEditor.document.createElement(tag.name);
  const node = evaluateXPath(virtualEditor.document, xpath);
  const clone = node.cloneNode(true);
  specContent.append(clone);

  return specContent;
};

processSpeculativeContent.set('span', processSpeculativeContentSpan);
processSpeculativeContent.set('change', processSpeculativeContenChildNodes);
processSpeculativeContent.set('before', processSpeculativeContentBefore);
processSpeculativeContent.set('after', processSpeculativeContentAfter);
processSpeculativeContent.set('around', processSpeculativeContentNode);
processSpeculativeContent.set('inside', processSpeculativeContenChildNodes);
