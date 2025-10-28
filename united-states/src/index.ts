import { profiles as floridaProfiles } from "./united-states/florida/profile";
import { index as floridaIndex } from "./united-states/florida/index";
import { profiles as texasProfiles } from "./united-states/texas/profile";
import { filterProfiles, index as georgiaIndex } from "./united-states/georgia/index";
import { index as ohioIndex } from "./united-states/ohio/index";

const florida = async () => {
    await floridaIndex();
    await floridaProfiles();
}

const texas = async () => {
    await texasProfiles();
}

const georgia = async () => {
    await georgiaIndex();
    filterProfiles();
}

const ohio = async () => {
    await ohioIndex();
}

const main = async () => {
    await ohio();
}

main();