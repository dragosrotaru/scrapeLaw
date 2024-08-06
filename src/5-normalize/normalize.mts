// Utility
import { readJSONFile } from "../utility/io.mts";
import { emailToDomain, htmlToDate, htmlToEmail, htmlToPhone, htmlToURL, manitobaPersonName } from "../utility/validators.mts"

// This Step
import type { Source, DecisionMethod } from "./types.mts";
import { DecisionBuilder } from "./builder.mts";

const SOURCE: Source = {
  id: "law_society_manitoba",
  name: "Law Society of Manitoba",
  description:
    "The Law Society of Manitoba is the governing body for all lawyers in Manitoba, Canada.",
};
const decisionMethod: DecisionMethod = {
  id: "law_society_ingestion_1",
  name: "handwritten code",
  description: "Handwritten code tailored to law_society_manitoba",
};

function recognizeEntities() {
  const decisionBuilder = new DecisionBuilder(decisionMethod);
  const regular = readJSONFile(REGULAR_FILE) as Sample[];
  for (const sample of regular) {
    const { output, input } = sample;

    const data = {
        // todo fix name and KC
        name: manitobaPersonName(output["name"]),
        address: output["address"], // todo normalize address
        // todo fix phone and fax, both are null
        phone: htmlToPhone(output["phone"]),
        fax: htmlToPhone(output["fax"]),
        email: htmlToEmail(output["email"]),
        firm: output["firm"],
        status: output["status"],
        callDate: htmlToDate(output["callDate"]),
        disciplined: htmlToURL(output["disciplined"]),
        kingsCounsel: output["name"]?.includes("(KC)") || null,
        domain: emailToDomain(output["email"]),
    }

    const record = decisionBuilder.addRecord(SOURCE, data, input, true);
 
    if (!data.name) {
        throw new Error("No name found in record: " + JSON.stringify(data, null, 4));
    }

    const person = decisionBuilder.recognizeEntity(
      record,
      "person",
      true
    ).entity;
    decisionBuilder.addFieldAttribute(person, "name", data.name, true, record.id);

    // todo store honorifics, status, callDate, disciplined as attributes on a Relation between person and Manitoba Law Society or something
    if (data.kingsCounsel) 
        decisionBuilder.addFieldAttribute(person, "honorific", "kings counsel", true, record.id);
    if (data.status)
        decisionBuilder.addFieldAttribute(person, "practicingStatus", data.status, true, record.id);
    if (data.callDate)
        decisionBuilder.addFieldAttribute(person, "callDate", data.callDate, true, record.id);
    if (data.disciplined)
        decisionBuilder.addFieldAttribute(person, "disciplined", data.disciplined, true, record.id);

    // todo attribute these based on more sophisticated methods
    if (data.address)
        decisionBuilder.addFieldAttribute(person, "address", data.address, true, record.id);
    if (data.phone)
        decisionBuilder.addFieldAttribute(person, "phone", data.phone, true, record.id);
    if (data.fax)
        decisionBuilder.addFieldAttribute(person, "fax", data.fax, true, record.id);
    if (data.email)
        decisionBuilder.addFieldAttribute(person, "email", data.email, true, record.id);
    // todo domain

    // todo classify firm

    const firmName = data["firm"];
    if (!firmName) continue;

    const firm = decisionBuilder.recognizeEntity(record, "firm", true).entity;
    decisionBuilder.addFieldAttribute(firm, "name", firmName, true, record.id);

    // create relationship between person and firm
    decisionBuilder.addRelationAttribute(person, "unknown", firm , true, record.id);

  }

  decisionBuilder.save();
}

recognizeEntities();