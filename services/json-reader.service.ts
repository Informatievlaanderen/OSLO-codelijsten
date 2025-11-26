import * as fs from 'fs'
import type { Organization } from '../types/organization'

export class JsonReaderService {
  /**
   * Read and parse organizations from JSON file
   */
  readOrganizations(inputPath: string): Organization[] {
    const jsonData = fs.readFileSync(inputPath, 'utf-8')
    return JSON.parse(jsonData)
  }
}
