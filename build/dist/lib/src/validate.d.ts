import Observable from 'observable-fns/observable';
import { WorkingState } from 'salve-dom/build/dist';
declare type DocumentString = string;
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
declare type PossibleNodes = {
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
export declare const validate: (documentString: DocumentString, { userRequest, newDocument }?: ValidateRequestOptions) => Observable<any>;
export declare const validatePossibleAt: (xpath: string, index: number, type: string) => Promise<ValidatePossibleAtResponse>;
export {};
