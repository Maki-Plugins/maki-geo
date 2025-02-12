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

    lines.forEach(line => {
        if (!line.trim()) return;
        const columns = line.split('\t');
        const [, name, , , , , , , , , , , , , population] = columns;
        const pop = Number(population);
        
        if (pop >= MIN_POPULATION) {
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
    console.log(`Processed ${cityMap.size} cities into ${Object.keys(indexedCities).length} prefixes`);
}

// Set paths relative to project root
const inputFile = path.join(__dirname, '../scripts/cities500.txt');
const outputFile = path.join(__dirname, '../src/assets/cities500_updated.json');

processCitiesFile(inputFile, outputFile);
