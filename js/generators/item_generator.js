import prefixesData from '../../data/items/prefixes.json' with { type: 'json' };
import nounsData from '../../data/items/nouns.json' with { type: 'json' };
import suffixesData from '../../data/items/suffixes.json' with { type: 'json' };
import { selectedArea } from '../controllers/areas_controller';

const prefixList = prefixesData.prefixes;
const nounList = nounsData.nouns;
const suffixList = suffixesData.suffixes;

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function generateItem(type, areaId) {
    const numericalAreaId = Number(areaId)
    const nounCandidates = nounList.filter(n => n.type === type && n.areas.includes(numericalAreaId) && n.areas.includes(selectedArea.areaId));

    if (nounCandidates.length === 0) {
        throw new Error(`No noun candidates found for item type: "${type}"`);
    }

    const selectedNoun = getRandomElement(nounCandidates);

    const validSuffixes = suffixList.filter(s => !s.type || s.type === type);
    const suffixObj = validSuffixes.length > 0 ? getRandomElement(validSuffixes) : getRandomElement(suffixList);
    const prefixObj = getRandomElement(prefixList);

    const { noun, type: itemType, ...additionalNounStats } = selectedNoun;

    return {
        name: `${prefixObj.prefix} ${noun} ${suffixObj.suffix}`,
        type: itemType,
        "Element(s)": prefixObj.damage_types || [],
        "Secondary Stats": suffixObj.secondary_stats || [],
        ...additionalNounStats
    };
}