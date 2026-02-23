import type { Company } from '../types/company'
import type { Stats } from '../types/statistics'
import { FileWriterService } from './file-writer.service'
import { CsvReaderService } from './csv-reader.service'
import { CompanyToTTLService } from './company-to-ttl.service'

export class CompanyConverterService {
  //  private readonly ttlConverter = new KBOToTTLService()
  private readonly fileWriter = new FileWriterService()
  private readonly csvReader = new CsvReaderService()
  private readonly ttlConverter = new CompanyToTTLService()

  /**
   * Convert companies from CSV to JSON files
   */
  async convertCompanies(inputDir: string, outputDir: string): Promise<Stats> {
    console.log(`Reading KBO companies from: ${inputDir}`)
    const result = await this.csvReader.readCompanies(inputDir, outputDir)
    const codes = await this.csvReader.readCodes(inputDir)

    this.ttlConverter.convertCodes(codes)

    console.log(
      `✓ Processed ${result.total} companies in ${result.batches} batches`,
    )

    const stats: Stats = {
      total: result.total,
      success: result.total,
      errors: 0,
      overwritten: 0,
    }

    this.printSummary(stats, outputDir)

    return stats
  }

  /**
   * Print conversion summary
   */
  private printSummary(stats: Stats, outputDir: string): void {
    console.log('\n========================================')
    console.log('Conversion Summary')
    console.log('========================================')
    console.log(`Total companies: ${stats.total}`)
    console.log(`Successfully converted: ${stats.success}`)
    console.log(`Errors: ${stats.errors}`)
    console.log(`Overwritten: ${stats.overwritten}`)
    console.log(`Output directory: ${outputDir}`)
    console.log('========================================\n')
  }
}
