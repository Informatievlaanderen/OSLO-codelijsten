import * as fs from 'fs'
import * as path from 'path'

export class FileWriterService {
  /**
   * Ensure directory exists, create if it doesn't
   */
  ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  }

  /**
   * Check if file exists
   */
  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath)
  }

  /**
   * Write content to file
   */
  writeFile(filePath: string, content: string): void {
    fs.writeFileSync(filePath, content, 'utf-8')
  }

  /**
   * Get full file path
   */
  getFilePath(directory: string, fileName: string): string {
    return path.join(directory, fileName)
  }
}
