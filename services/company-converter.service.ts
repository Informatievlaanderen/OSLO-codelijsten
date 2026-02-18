import type { Company } from '../types/company'
import type { Stats } from '../types/statistics'
//import { KBOToTTLService } from './kbo-to-ttl.service'
import { FileWriterService } from './file-writer.service'
import { CsvReaderService } from './csv-reader.service'

export class CompanyConverterService {
  //  private readonly ttlConverter = new KBOToTTLService()
  private readonly fileWriter = new FileWriterService()
  private readonly csvReader = new CsvReaderService()

  /**
   * Convert companies from CSV to JSON files
   */
  async convertCompanies(inputDir: string, outputDir: string): Promise<Stats> {
    console.log(`Reading KBO companies from: ${inputDir}`)
    const companies = this.csvReader.readCompanies(inputDir)

    console.log(`Converting ${companies.length} companies...`)

    this.fileWriter.ensureDirectoryExists(outputDir)

    const stats = await this.processCompanies(companies, outputDir)

    this.printSummary(stats, outputDir)

    return stats
  }

  /**
   * Process all companies and write to files
   */
  private async processCompanies(
    companies: Company[],
    outputDir: string,
  ): Promise<Stats> {
    let successCount = 0
    let overwriteCount = 0

    for (const comp of companies) {
      try {
        const fileName = `${comp.identifier}.json`
        const filePath = this.fileWriter.getFilePath(outputDir, fileName)

        if (this.fileWriter.fileExists(filePath)) {
          console.log(
            `File already exists: ${fileName} (${comp.name}) - Overwriting...`,
          )
          overwriteCount++
        }

        //const ttlContent = this.ttlConverter.convertToTTLWithPrefixes(comp)
        this.fileWriter.writeFile(filePath, JSON.stringify(comp, null, 2))
        successCount++

        if (successCount % 10 === 0) {
          console.log(`Processed ${successCount}/${companies.length} files...`)
        }
      } catch (error) {
        console.error(`Error processing ${comp.identifier}:`, error)
      }
    }

    return {
      totalCompanies: companies.length,
      validCompanies: companies.length,
      successCount,
      overwriteCount,
    }
  }

  /**
   * Print conversion summary
   */
  private printSummary(stats: Stats, outputDir: string): void {
    console.log(
      `Successfully converted ${stats.successCount} companies to individual files in ${outputDir}`,
    )

    if (stats.overwriteCount > 0) {
      console.log(`Overwrote ${stats.overwriteCount} existing file(s)`)
    }
  }
}
