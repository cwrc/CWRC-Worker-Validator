import { SchemaRequest } from './conversion';
import { PossibleRequest } from './possible';
import { ValidateRequestOptions } from './validate';
export { SchemaRequest, SchemaResponse } from './conversion';
export { PossibleRequest, PossibleResponse, Selection, Tag } from './possible';
export { possibleTags, ValidatePossibleAtResponse, ValidateRequestOptions, ValidationNode, ValidationResponse, } from './validate';
declare const cwrcWorkerValidator: {
    loadSchema(schema: SchemaRequest): Promise<import("./conversion").SchemaResponse>;
    validate(documentString: string, userRequest: ValidateRequestOptions): import("observable-fns/observable").default<any>;
    validatePossible(xpath: string, index: number, type: string): Promise<import("./validate").ValidatePossibleAtResponse>;
    hasValidator(): boolean;
    possibleAtContextMenu(parameters: PossibleRequest): Promise<import("./possible").PossibleResponse>;
};
export declare type CwrcWorkerValidator = typeof cwrcWorkerValidator;
