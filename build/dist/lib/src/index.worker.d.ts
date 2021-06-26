import { SchemaRequest } from './conversion';
import { PossibleRequest } from './possible';
import { TagRequest } from './tag';
import { ValidationResponse } from './validate';
export { SchemaRequest, SchemaResponse } from './conversion';
export { PossibleRequest, PossibleResponse, Selection } from './possible';
export { Tag } from './sharedTypes';
export { TagAttribute, TagRequest } from './tag';
export { PossibleNodes, ValidatePossibleAtResponse, ValidationNode, ValidationNodeElement, ValidationNodeTarget, ValidationResponse, } from './validate';
declare const cwrcWorkerValidator: {
    loadSchema(schema: SchemaRequest): Promise<import("./conversion").SchemaResponse>;
    validate(documentString: string, callback: (value: ValidationResponse) => void): void;
    validatePossible(xpath: string, index: number, type: string): Promise<import("./validate").ValidatePossibleAtResponse>;
    tagAt(tag: TagRequest): Promise<import("./sharedTypes").Tag | undefined>;
    attributesForTag(xpath: string, index?: number | undefined): Promise<import("./tag").TagAttribute[]>;
    hasValidator(): boolean;
    possibleAtContextMenu(parameters: PossibleRequest): Promise<import("./possible").PossibleResponse>;
};
export declare type CwrcWorkerValidator = typeof cwrcWorkerValidator;
