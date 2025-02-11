import fs from 'fs';
import path from 'path';

interface CityData {
    name: string;
    asciiname: string;
    latitude: string;
    longitude: string;
}

function processCitiesFile(inputPath: string, outputPath: string): void {
    const rawData = fs.readFileSync(inputPath, 'utf-8');
    const lines = rawData.split('\n');
    
    const processedData = lines.map(line => {
        if (!line.trim()) return '';
        const columns = line.split('\t');
        
        // Extract required columns based on cities500.txt format documentation:
        // 0: geonameid, 1: name, 2: asciiname, 3: alternatenames, 4: latitude, 5: longitude
        const [name, asciiname, , , latitude, longitude] = columns;
        
        return [name, asciiname, latitude, longitude].join('\t');
    }).join('\n');
    
    fs.writeFileSync(outputPath, processedData);
    console.log(`Processed ${lines.length} entries saved to ${outputPath}`);
}

// Set paths relative to project root
const inputFile = path.join(__dirname, '../scripts/cities500.txt');
const outputFile = path.join(__dirname, '../scripts/cities500_updated.txt');

processCitiesFile(inputFile, outputFile);
