import fs from 'fs';
import path from 'path';

interface CityEntry {
    n: string;  // name
    p: number;  // population
}

interface IndexedCities {
    [prefix: string]: CityEntry[];
}

function processCitiesFile(inputPath: string, outputPath: string): void {
    const rawData = fs.readFileSync(inputPath, 'utf-8');
    const lines = rawData.split('\n');

    // Collect cities with population over 50,000
    const cityMap = new Map<string, CityEntry>();
    const MIN_POPULATION = 500;

    lines.forEach(line => {
        if (!line.trim()) return;
        const columns = line.split('\t');

        const [, name, , , , , , , , , , , , , population] = columns;
        const cityKey = name.toLowerCase();
        const currentPopulation = Number(population);

        if (currentPopulation < MIN_POPULATION) return;

        const existingCity = cityMap.get(cityKey);
        if (!existingCity || currentPopulation > existingCity.p) {
            cityMap.set(cityKey, {
                n: name,
                p: currentPopulation
            });
        }
    });

    // Create prefix-based index structure
    const indexedCities: IndexedCities = {};
    const prefixLength = 3;

    Array.from(cityMap.values())
        .sort((a, b) => b.p - a.p)
        .forEach(city => {
            const normalizedName = city.n.toLowerCase();
            const prefix = normalizedName.slice(0, Math.min(prefixLength, normalizedName.length));

            if (!indexedCities[prefix]) {
                indexedCities[prefix] = [];
            }

            indexedCities[prefix].push(city);
        });

    // Write the indexed structure to file with minimal whitespace
    fs.writeFileSync(outputPath, JSON.stringify(indexedCities));
    console.log(`Processed ${cityMap.size} cities into ${Object.keys(indexedCities).length} prefixes`);
}

// Set paths relative to project root
const inputFile = path.join(__dirname, '../scripts/cities500.txt');
const outputFile = path.join(__dirname, '../src/assets/cities500_updated.json');

processCitiesFile(inputFile, outputFile);
