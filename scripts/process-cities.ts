import fs from 'fs';
import path from 'path';

interface CityEntry {
    name: string;
    countryCode: string;
    population: number;
    latitude: string;
    longitude: string;
}

interface IndexedCities {
    [prefix: string]: {
        exactMatches: CityEntry[];
        partialMatches: CityEntry[];
    };
}

function processCitiesFile(inputPath: string, outputPath: string): void {
    const rawData = fs.readFileSync(inputPath, 'utf-8');
    const lines = rawData.split('\n');
    
    // First pass: collect unique cities with highest population
    const cityMap = new Map<string, CityEntry>();
    
    lines.forEach(line => {
        if (!line.trim()) return;
        const columns = line.split('\t');
        
        const [, name, , , latitude, longitude, , , countryCode, , , , , , population] = columns;
        const cityKey = `${name.toLowerCase()}_${countryCode}`;
        
        const existingCity = cityMap.get(cityKey);
        const currentPopulation = Number(population);
        
        if (!existingCity || currentPopulation > existingCity.population) {
            cityMap.set(cityKey, {
                name,
                countryCode,
                population: currentPopulation,
                latitude,
                longitude
            });
        }
    });

    // Create prefix-based index structure
    const indexedCities: IndexedCities = {};
    const prefixLength = 3; // Index by first 3 characters
    
    Array.from(cityMap.values())
        .sort((a, b) => b.population - a.population)
        .forEach(city => {
            const normalizedName = city.name.toLowerCase();
            const prefix = normalizedName.slice(0, Math.min(prefixLength, normalizedName.length));
            
            if (!indexedCities[prefix]) {
                indexedCities[prefix] = {
                    exactMatches: [],
                    partialMatches: []
                };
            }
            
            // Add to exact matches if the name starts with prefix
            if (normalizedName.startsWith(prefix)) {
                indexedCities[prefix].exactMatches.push(city);
            } else {
                indexedCities[prefix].partialMatches.push(city);
            }
        });

    // Write the indexed structure to file
    fs.writeFileSync(outputPath, JSON.stringify(indexedCities, null, 2));
    console.log(`Processed ${cityMap.size} unique cities into ${Object.keys(indexedCities).length} prefixes`);
}

// Set paths relative to project root
const inputFile = path.join(__dirname, '../scripts/cities500.txt');
const outputFile = path.join(__dirname, '../src/assets/cities500_updated.json');

processCitiesFile(inputFile, outputFile);
