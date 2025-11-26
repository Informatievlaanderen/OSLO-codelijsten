import type { Organization } from '../types/organization'
import { OrganizationToTTLService } from './organization-to-ttl.service'
import { FileWriterService } from './file-writer.service'
import { JsonReaderService } from './json-reader.service'

export interface ConversionStats {
  totalOrganizations: number
  validOrganizations: number
  successCount: number
  overwriteCount: number
}

export class OrganizationConverterService {
  private readonly ttlConverter = new OrganizationToTTLService()
  private readonly fileWriter = new FileWriterService()
  private readonly jsonReader = new JsonReaderService()

  /**
   * Convert organizations from JSON to TTL files
   */
  async convertOrganizations(
    inputPath: string,
    outputDir: string,
  ): Promise<ConversionStats> {
    console.log(`Reading organizations from: ${inputPath}`)
    const organizations = this.jsonReader.readOrganizations(inputPath)

    console.log(`Converting ${organizations.length} organizations...`)

    this.fileWriter.ensureDirectoryExists(outputDir)

    const validOrganizations = this.filterValidOrganizations(organizations)

    const stats = await this.processOrganizations(validOrganizations, outputDir)

    this.printSummary(stats, outputDir)

    return stats
  }

  /**
   * Filter organizations that have required fields
   */
  private filterValidOrganizations(
    organizations: Organization[],
  ): Organization[] {
    return organizations.filter((org) => org.ovoNumber && org.name)
  }

  /**
   * Process all organizations and write to files
   */
  private async processOrganizations(
    organizations: Organization[],
    outputDir: string,
  ): Promise<ConversionStats> {
    let successCount = 0
    let overwriteCount = 0

    for (const org of organizations) {
      try {
        const fileName = `${org.ovoNumber}.ttl`
        const filePath = this.fileWriter.getFilePath(outputDir, fileName)

        if (this.fileWriter.fileExists(filePath)) {
          console.log(
            `⚠️  File already exists: ${fileName} (${org.name}) - Overwriting...`,
          )
          overwriteCount++
        }

        const ttlContent = this.ttlConverter.convertToTTLWithPrefixes(org)
        this.fileWriter.writeFile(filePath, ttlContent)
        successCount++

        if (successCount % 10 === 0) {
          console.log(
            `  Processed ${successCount}/${organizations.length} files...`,
          )
        }
      } catch (error) {
        console.error(`❌ Error processing ${org.ovoNumber}:`, error)
      }
    }

    return {
      totalOrganizations: organizations.length,
      validOrganizations: organizations.length,
      successCount,
      overwriteCount,
    }
  }

  /**
   * Print conversion summary
   */
  private printSummary(stats: ConversionStats, outputDir: string): void {
    console.log(
      `✓ Successfully converted ${stats.successCount} organizations to individual files in ${outputDir}`,
    )

    if (stats.overwriteCount > 0) {
      console.log(`⚠️  Overwrote ${stats.overwriteCount} existing file(s)`)
    }
  }
}
