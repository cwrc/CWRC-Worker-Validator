import { virtualEditor } from './virtualEditor';

export const loadSchema = async ({ id, url, localData }) => {
  // url = '/sch/orlando.rng';

  if(virtualEditor.schemaId === id) {
    return { status: 'Schema already loaded'}
  };

  if (!localData && !url) {
    const errorMessage = 'Schema not loaded: No reference provided';
    console.warn(errorMessage);
    return { error: errorMessage };
  }

  const { status, grammar, remoteData } = localData
    ? readSchema(localData)
    : await convertSchema(url);

  virtualEditor.setSchema({ id, grammar });

  return { status, remoteData };
};

const readSchema = (schemaData) => {
  const { json } = JSON.parse(schemaData);
  const grammar = self.salve.readTreeFromJSON(json);

  return {
    grammar,
    status: 'Schema Loaded from cache.',
  };
};

const convertSchema = async (url) => {
  const convertedSchema = await self.salve.convertRNGToPattern(url);
  // const convertedSchema = await self.salve.convertRNGToPattern(url, {
  //   createManifest: true,
  //   manifestHashAlgorithm: 'SHA-1',
  // });
  // console.log(convertedSchema);

  const grammar = convertedSchema.pattern;

  const json = self.salve.writeTreeToJSON(convertedSchema.simplified, 3);

  return {
    grammar,
    remoteData: { json },
    status: 'Schema Loaded from file.',
  };
};

// eslint-disable-next-line no-unused-vars
const extractElementsDefinitions = (convertedSchema) => {
  const schemaDocumentation = new Set();
  for (const definition of convertedSchema.pattern.definitions.values()) {
    const { name, documentation } = definition.pat.name;
    schemaDocumentation.add({ name, documentation });
  }
  return schemaDocumentation;
};
