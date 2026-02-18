#!/usr/bin/env node

import { CompanyConverterService } from './services/company-converter.service'

/**
 * Parse command-line arguments with flags
 */
function parseArgs(): { inputDir?: string; outputDir?: string } {
  const args = process.argv.slice(2)
  const parsed: { inputDir?: string; outputDir?: string } = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if ((arg === '--input' || arg === '-i') && args[i + 1]) {
      parsed.inputDir = args[i + 1]
      i++
    } else if ((arg === '--output' || arg === '-o') && args[i + 1]) {
      parsed.outputDir = args[i + 1]
      i++
    }
  }

  return parsed
}

/**
 * Main entry point for KBO company to JSON conversion
 */
async function main() {
  const { inputDir, outputDir } = parseArgs()

  if (!inputDir || !outputDir) {
    console.error(
      'Error: Both input directory and output directory are required.',
    )
    console.error('')
    console.error(
      'Usage: ts-node convert-kbo-to-ttl.ts --input <file> --output <directory>',
    )
    console.error('')
    console.error('Options:')
    console.error('  --input, -i   Path to input JSON file')
    console.error('  --output, -o  Path to output directory')
    console.error('')
    console.error('Example:')
    console.error(
      '  ts-node convert-kbo-to-ttl.ts --input ./kbo-data --output ./output/kbo',
    )
    console.error(
      '  ts-node convert-kbo-to-ttl.ts -i ./kbo-data -o ./output/kbo',
    )
    process.exit(1)
  }

  try {
    const converter = new CompanyConverterService()
    await converter.convertCompanies(inputDir, outputDir)
  } catch (error) {
    console.error('Error converting organizations:', error)
    process.exit(1)
  }
}

main()
