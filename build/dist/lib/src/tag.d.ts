import { Tag } from './sharedTypes';
export interface TagRequest {
    tagName: string;
    parentXpath: string;
    index: number;
}
export interface TagAttribute {
    name: string;
    ns?: string;
    fullName?: string;
    documentation?: string;
}
export declare const tagAt: ({ tagName, parentXpath, index, }: TagRequest) => Promise<Tag | undefined>;
export declare const attributesForTag: (xpath: string, index?: number) => Promise<TagAttribute[]>;
