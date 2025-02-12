import fs from 'fs';
import path from 'path';

interface IndexedCities {
    [prefix: string]: string[];
}

function processCitiesFile(inputPath: string, outputPath: string): void {
    const rawData = fs.readFileSync(inputPath, 'utf-8');
    const lines = rawData.split('\n');

    // First collect all cities with their populations
    const citiesWithPop: Array<[string, number]> = [];
    const MIN_POPULATION = 500;
    const removeFeatureCodes = ["PPLX"];

    lines.forEach(line => {
        if (!line.trim()) return;
        const columns = line.split('\t');

        // See https://download.geonames.org/export/dump/ for the field mapping
        // Extract required columns based on cities500.txt format documentation:
        // 0: geonameid, 1: name, 2: asciiname, 3: alternatenames, 4: latitude, 5: longitude
        // 6: feature class, 7: feature code, 8: country code, 9: cc2, 10: admin1 code
        // 11: admin2 code, 12: admin3 code, 13: admin4 code, 14: population, 15: elevation
        // 16: dem (digital elevation model), 17: timezone, 18: modified date
        const [, name, , , , , , featureCode, , , , , , , population] = columns;
        const pop = Number(population);

        if (pop >= MIN_POPULATION && !removeFeatureCodes.includes(featureCode)) {
            citiesWithPop.push([name, pop]);
        }
    });

    // Sort all cities by population
    citiesWithPop.sort((a, b) => b[1] - a[1]);

    // Create prefix-based index structure with pre-sorted cities
    const indexedCities: IndexedCities = {};
    const prefixLength = 3;

    // Only keep the highest population instance of each city name
    const seenNames = new Set<string>();
    citiesWithPop.forEach(([name]) => {
        const lowerName = name.toLowerCase();
        if (seenNames.has(lowerName)) return;
        seenNames.add(lowerName);

        const prefix = lowerName.slice(0, Math.min(prefixLength, lowerName.length));
        if (!indexedCities[prefix]) {
            indexedCities[prefix] = [];
        }
        indexedCities[prefix].push(name);
    });

    // Write the indexed structure to file with minimal whitespace
    fs.writeFileSync(outputPath, JSON.stringify(indexedCities));
    console.log(`Processed ${citiesWithPop.length} cities into ${Object.keys(indexedCities).length} prefixes`);
}

// Set paths relative to project root
const inputFile = path.join(__dirname, '../scripts/cities500.txt');
const outputFile = path.join(__dirname, '../src/assets/cities500_updated.json');

processCitiesFile(inputFile, outputFile);
