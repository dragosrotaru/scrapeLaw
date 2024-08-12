import { detail, index, SITE } from "./scrape.mts";
// indexType json
// detailType json

interface Index {
    resultCount: number;
    results: Result[];
}

interface Result {
    id: string;
    fullName: string;
    lastName: string;
    firstName: string;
    middleName: string;
    preferredName: string;
    practice: string;
    suburb: string;
    isMember: boolean;
    firlId: number;
    branchId: number;
    compositeFirmKey: string;
    rowNum: number;
    isNotNameOnly: boolean;
}

export const info = [{
    site: SITE + "/lawyer",
    index: () => index("lawyer"),
    detail: () => detail("lawyer"),
},
{
    site: SITE + "/mediator",
    index: () => index("mediator"),
    detail: () => detail("mediator"),
},
{
    site: SITE + "/practice",
    index: () => index("practice"),
    detail: () => detail("practice"),
}];
