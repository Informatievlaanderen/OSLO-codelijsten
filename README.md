# OVO Codes Extractie

Deze repository bevat scripts voor het extraheren van OVO-codes uit de basisregisters van Vlaanderen. OVO-codes worden gebruikt om verschillende administratieve entiteiten te identificeren en te classificeren. De OVO codes worden gepubliceerd op https://data.vlaanderen.be.

## Organization to TTL Converter

### Overzicht

De Organization to TTL Converter is een command-line tool die organisatiegegevens in JSON-formaat omzet naar RDF Turtle (TTL) formaat.

### Installatie

#### Lokaal gebruik

```bash
# Installeer dependencies
npm install

# Build het project
npm run build

node dist/convert-org-to-ttl.js --input <input-file> --output <output-directory>
```

#### Als NPM package

```bash
npm install -g @oslo-flanders/org-to-ttl-converter
```

### Gebruik

#### CLI

```bash
# Lange vorm
oslo-org-to-ttl --input <input-file> --output <output-directory>
```

**Parameters**

- `--input, -i`: Pad naar het input JSON-bestand met organisatiegegevens
- `--output, -o`: Pad naar de output directory waar TTL-bestanden worden opgeslagen

**Voorbeelden**

```bash
oslo-org-to-ttl -i ./data/orgs.json -o ./output/ttl
```
