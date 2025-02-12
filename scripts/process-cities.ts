import fs from 'fs';
import path from 'path';

function processCitiesFile(inputPath: string, outputPath: string): void {
    const rawData = fs.readFileSync(inputPath, 'utf-8');
    const lines = rawData.split('\n');

    const processedData = lines.map(line => {
        if (!line.trim()) return '';
        const columns = line.split('\t');

        // See https://download.geonames.org/export/dump/ for the field mapping
        // Extract required columns based on cities500.txt format documentation:
        // 0: geonameid, 1: name, 2: asciiname, 3: alternatenames, 4: latitude, 5: longitude
        // 6: feature class, 7: feature code, 8: country code, 9: cc2, 10: admin1 code
        // 11: admin2 code, 12: admin3 code, 13: admin4 code, 14: population, 15: elevation
        // 16: dem (digital elevation model), 17: timezone, 18: modified date
        const [, name, , , latitude, longitude, , , , , , , , , population] = columns;


        return [name, latitude, longitude, population].join('\t');
    }).sort((a, b) => Number(a.split('\t')[3]) < Number(b.split('\t')[3]) ? 1 : -1).join('\n');

    fs.writeFileSync(outputPath, processedData);
    console.log(`Processed ${lines.length} entries saved to ${outputPath}`);
}

// Set paths relative to project root
const inputFile = path.join(__dirname, '../scripts/cities500.txt');
const outputFile = path.join(__dirname, '../src/assets/cities500_updated.txt');

processCitiesFile(inputFile, outputFile);
