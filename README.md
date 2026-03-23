# KBO Codes extractie en conversie

Deze repository bevat scripts voor het extraheren van KBO-codes uit de publicaties van de KBO-codes op een FTP server. De KBO-codes worden gepubliceerd door de Belgische overheid en bevatten informatie over bedrijven en organisaties in België (https://kbopub.economie.fgov.be/kbopub/zoeknummerform.html)

## KBO to TTL Converter

### Overzicht

De KBO to TTL Converter is een command-line tool die KBO-gegevens in CSV-formaat omzet naar RDF Turtle (TTL) formaat.

### Installatie

#### Lokaal gebruik

```bash
# Installeer dependencies
npm install

# Build het project
npm run build

node dist/convert-kbo-to-ttl.js --input <input-directory> --output <output-directory>
```

#### Als NPM package

```bash
npm install -g @oslo-flanders/kbo-to-ttl-converter
```

### Gebruik

#### CLI

```bash
# Lange vorm
oslo-kbo-to-ttl --input <input-directory> --output <output-directory>
```

**Parameters**

- `--input, -i`: Pad naar het de directory waar de KBO CSV-bestanden zich bevinden
- `--output, -o`: Pad naar de output directory waar TTL-bestanden worden opgeslagen

**Voorbeelden**

```bash
oslo-kbo-to-ttl -i ./data/kbo/ -o ./output/ttl
```
