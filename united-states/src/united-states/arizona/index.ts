
// TODO 

const MAX_PAGE_SIZE = 25;

const composeIndexUrl = (page: number) =>
  `https://api-proxy.azbar.org/MemberSearch/Search/?PageSize=${MAX_PAGE_SIZE}&Page=${page}&RequestorEntityNumber=undefined`;

const fetchIndex = async (page: number) => {
  const url = composeIndexUrl(page);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      FirstName: "",
      MiddleName: "",
      LastName: "",
      Firm: "",
      City: "",
      State: "",
      Zip: "",
      County: "",
      LanguageCode: "",
      LawSchool: "",
      Section: "",
      Specialization: "",
      IncludeDeceased: false,
      FuzzySearch: false,
      JurisdictionCode: "",
      LegalNeed: "",
      IsLpSearch: false,
    }),
  });
  const data = await response.json();
  return data;
};

const index = async () => {
  const index = new Set<string>();
};
