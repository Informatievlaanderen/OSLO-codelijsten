import * as fs from 'fs'
import type { Company, Code } from '../types/company'
import * as path from 'path'
import csv from 'csv-parser'
import { CompanyToTTLService } from './company-to-ttl.service'

interface CsvRow {
  [key: string]: string
}

export class CsvReaderService {
  private inputPath: string = ''
  private readonly BATCH_SIZE = 100 // Process companies in batches of 100
  private readonly MAX_COMPANY_BATCH = 10000 // Process companies in chunks of 10k. Play with this value to find the right amount

  /**
   * Read and parse companies from CSV files with chunked processing
   */
  async readCompanies(
    inputPath: string,
    outputDir: string,
  ): Promise<{ total: number; batches: number }> {
    this.inputPath = inputPath

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    console.log('Step 1: Building company list...')
    const companyIds = await this.getCompanyIds()
    const totalCompanies = companyIds.length
    console.log(`Found ${totalCompanies} companies to process`)

    let totalProcessed = 0
    let totalBatches = 0

    // Process companies in chunks to avoid memory issues
    for (let i = 0; i < companyIds.length; i += this.MAX_COMPANY_BATCH) {
      const chunk = companyIds.slice(i, i + this.MAX_COMPANY_BATCH)
      const chunkNumber = Math.floor(i / this.MAX_COMPANY_BATCH) + 1
      const totalChunks = Math.ceil(companyIds.length / this.MAX_COMPANY_BATCH)

      console.log(`\n========================================`)
      console.log(`Processing chunk ${chunkNumber}/${totalChunks}`)
      console.log(
        `Companies ${i + 1} to ${Math.min(i + this.MAX_COMPANY_BATCH, totalCompanies)}`,
      )
      console.log(`========================================`)

      const { processed, batches } = await this.processCompanyChunk(
        chunk,
        outputDir,
      )

      totalProcessed += processed
      totalBatches += batches

      // Force garbage collection after each chunk
      if (global.gc) {
        console.log('Running garbage collection...')
        global.gc()
      }

      console.log(`✓ Completed chunk ${chunkNumber}/${totalChunks}`)
    }

    return {
      total: totalProcessed,
      batches: totalBatches,
    }
  }

  /**
   * Get list of all company IDs
   */
  private async getCompanyIds(): Promise<string[]> {
    const companyIds: string[] = []

    await this.streamCsv('enterprise.csv', (row) => {
      if (row.EnterpriseNumber) {
        companyIds.push(row.EnterpriseNumber)
      }
    })

    return companyIds
  }

  /**
   * Process a chunk of companies
   */
  private async processCompanyChunk(
    companyIds: string[],
    outputDir: string,
  ): Promise<{ processed: number; batches: number }> {
    console.log('Building lookup tables for chunk...')

    // Build lookup tables only for this chunk
    const companyIdSet = new Set(companyIds)

    const [
      companyLookup,
      denominationLookup,
      establishmentLookup,
      branchLookup,
      activityLookup,
      contactLookup,
      addressLookup,
    ] = await Promise.all([
      this.buildCompanyLookupForChunk(companyIdSet),
      this.buildDenominationLookupForChunk(companyIdSet),
      this.buildEstablishmentLookupForChunk(companyIdSet),
      this.buildBranchLookupForChunk(companyIdSet),
      this.buildActivityLookupForChunk(companyIdSet),
      this.buildContactLookupForChunk(companyIdSet),
      this.buildAddressLookupForChunk(companyIdSet),
    ])

    console.log('Building companies in batches...')

    // Process companies in batches
    const stats = await this.buildCompaniesInBatches(
      outputDir,
      companyLookup,
      denominationLookup,
      establishmentLookup,
      branchLookup,
      activityLookup,
      contactLookup,
      addressLookup,
    )

    // Clear lookups from memory
    companyLookup.clear()
    denominationLookup.clear()
    establishmentLookup.clear()
    branchLookup.clear()
    activityLookup.clear()
    contactLookup.clear()
    addressLookup.clear()

    return stats
  }

  /**
   * Stream CSV file and process in chunks
   */
  private async streamCsv(
    filename: string,
    onRow: (row: CsvRow) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const filePath = path.join(this.inputPath, filename)
      let rowCount = 0

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row: CsvRow) => {
          onRow(row)
          rowCount++

          // Log progress every 100000 rows
          if (rowCount % 100000 === 0) {
            console.log(`  Processed ${rowCount} rows from ${filename}`)
          }
        })
        .on('end', () => {
          console.log(`  ✓ Completed ${filename}: ${rowCount} rows`)
          resolve()
        })
        .on('error', reject)
    })
  }

  /**
   * Build company lookup for specific chunk
   */
  private async buildCompanyLookupForChunk(
    companyIdSet: Set<string>,
  ): Promise<Map<string, any>> {
    const lookup = new Map()

    await this.streamCsv('enterprise.csv', (row) => {
      if (companyIdSet.has(row.EnterpriseNumber)) {
        lookup.set(row.EnterpriseNumber, {
          id: row.EnterpriseNumber,
          status: row.Status,
          juridicalSituation: row.JuridicalSituation,
          type: row.TypeOfEnterprise,
          juridicalForm: row.JuridicalForm,
          juridicalFormCAC: row.JuridicalFormCAC,
          startDate: row.StartDate,
        })
      }
    })

    return lookup
  }

  /**
   * Build denomination lookup for specific chunk
   */
  private async buildDenominationLookupForChunk(
    companyIdSet: Set<string>,
  ): Promise<Map<string, Array<any>>> {
    const lookup = new Map<string, Array<any>>()

    await this.streamCsv('denomination.csv', (row) => {
      const id = row.EntityNumber
      if (companyIdSet.has(id)) {
        if (!lookup.has(id)) {
          lookup.set(id, [])
        }

        lookup.get(id)!.push({
          language: row.Language,
          type: row.TypeOfDenomination,
          denomination: row.Denomination,
        })
      }
    })

    return lookup
  }

  /**
   * Build establishment lookup for specific chunk
   */
  private async buildEstablishmentLookupForChunk(
    companyIdSet: Set<string>,
  ): Promise<Map<string, Array<any>>> {
    const lookup = new Map<string, Array<any>>()

    await this.streamCsv('establishment.csv', (row) => {
      const companyId = row.EnterpriseNumber
      if (companyIdSet.has(companyId)) {
        if (!lookup.has(companyId)) {
          lookup.set(companyId, [])
        }

        lookup.get(companyId)!.push({
          id: row.EstablishmentNumber,
          startDate: row.StartDate,
          companyId: row.EnterpriseNumber,
        })
      }
    })

    return lookup
  }

  /**
   * Build branch lookup for specific chunk
   */
  private async buildBranchLookupForChunk(
    companyIdSet: Set<string>,
  ): Promise<Map<string, Array<any>>> {
    const lookup = new Map<string, Array<any>>()

    await this.streamCsv('branch.csv', (row) => {
      const companyId = row.EnterpriseNumber
      if (companyIdSet.has(companyId)) {
        if (!lookup.has(companyId)) {
          lookup.set(companyId, [])
        }

        lookup.get(companyId)!.push({
          id: row.Id,
          startDate: row.StartDate,
          companyId: row.EnterpriseNumber,
        })
      }
    })

    return lookup
  }

  /**
   * Build activity lookup for specific chunk
   */
  private async buildActivityLookupForChunk(
    companyIdSet: Set<string>,
  ): Promise<Map<string, Array<any>>> {
    const lookup = new Map<string, Array<any>>()

    await this.streamCsv('activity.csv', (row) => {
      const id = row.EntityNumber
      if (companyIdSet.has(id)) {
        if (!lookup.has(id)) {
          lookup.set(id, [])
        }

        lookup.get(id)!.push({
          group: row.ActivityGroup,
          naceVersion: row.NaceVersion,
          naceCode: row.NaceCode,
          classification: row.Classification,
        })
      }
    })

    return lookup
  }

  /**
   * Build contact lookup for specific chunk
   */
  private async buildContactLookupForChunk(
    companyIdSet: Set<string>,
  ): Promise<Map<string, Array<any>>> {
    const lookup = new Map<string, Array<any>>()

    await this.streamCsv('contact.csv', (row) => {
      const id = row.EntityNumber
      if (companyIdSet.has(id)) {
        if (!lookup.has(id)) {
          lookup.set(id, [])
        }

        lookup.get(id)!.push({
          entityContact: row.EntityContact,
          type: row.ContactType,
          value: row.Value,
        })
      }
    })

    return lookup
  }

  /**
   * Build address lookup for specific chunk
   */
  private async buildAddressLookupForChunk(
    companyIdSet: Set<string>,
  ): Promise<Map<string, any>> {
    const lookup = new Map()

    await this.streamCsv('address.csv', (row) => {
      if (companyIdSet.has(row.EntityNumber)) {
        lookup.set(row.EntityNumber, {
          id: row.EntityNumber,
          type: row.TypeOfAddress,
          countryNL: row.CountryNL || 'België',
          countryFR: row.CountryFR || 'Belgique',
          zipcode: row.Zipcode,
          municipalityNL: row.MunicipalityNL,
          municipalityFR: row.MunicipalityFR,
          streetNL: row.StreetNL,
          streetFR: row.StreetFR,
          houseNumber: row.HouseNumber,
          box: row.Box || undefined,
          extraAddressInfo: row.ExtraAddressInfo || undefined,
          dateStrikingOff: row.DateStrikingOff || undefined,
        })
      }
    })

    return lookup
  }

  // ...existing code for buildCompaniesInBatches, writeBatchToDisk, and parse methods...

  private async buildCompaniesInBatches(
    outputDir: string,
    companyLookup: Map<string, any>,
    denominationLookup: Map<string, Array<any>>,
    establishmentLookup: Map<string, Array<any>>,
    branchLookup: Map<string, Array<any>>,
    activityLookup: Map<string, Array<any>>,
    contactLookup: Map<string, Array<any>>,
    addressLookup: Map<string, any>,
  ): Promise<{ processed: number; batches: number; batch: Company[] }> {
    const companyIds = Array.from(companyLookup.keys())
    let processedCount = 0
    let batchCount = 0
    const batch: Company[] = []

    for (let i = 0; i < companyIds.length; i += this.BATCH_SIZE) {
      const batchIds = companyIds.slice(i, i + this.BATCH_SIZE)

      for (const identifier of batchIds) {
        const companyData = companyLookup.get(identifier)

        const company: Company = {
          identifier,
          name: [],
          juridicalState: companyData.status,
          juridicalSituation: companyData.juridicalSituation,
          juridicalEntity: companyData.type,
          juridicalForm: companyData.juridicalForm,
          juridicalFormCAC: companyData.juridicalFormCAC,
          startDate: companyData.startDate,
          establishment: [],
          branch: [],
          activity: [],
          mainContact: {},
          mainAddress: {},
        }

        this.parseDenomination(company, denominationLookup)
        this.parseEstablishment(
          company,
          establishmentLookup,
          denominationLookup,
          activityLookup,
          contactLookup,
          addressLookup,
        )
        this.parseBranch(company, branchLookup)
        this.parseActivity(company, activityLookup)
        this.parseContact(company, contactLookup)
        this.parseAddress(company, addressLookup)

        batch.push(company)
        processedCount++
      }

      await this.writeBatchToDisk(outputDir, batch, batchCount)
      batchCount++
      batch.length = 0

      if (global.gc && batchCount % 10 === 0) {
        global.gc()
      }
    }

    return { processed: processedCount, batches: batchCount, batch: batch }
  }

  private async writeBatchToDisk(
    outputDir: string,
    companies: Company[],
    batchNumber: number,
  ): Promise<void> {
    const writePromises = companies.map(async (company) => {
      const fileName = `${company.identifier}.ttl`
      const filePath = path.join(outputDir, fileName)
      const ttlConverter = new CompanyToTTLService()
      ttlConverter.convertToRDF(company)
      const content = await ttlConverter.exportRDFAsTurtle(company.identifier)

      return fs.promises.writeFile(filePath, content, 'utf8')
    })

    await Promise.all(writePromises)
  }

  private parseDenomination(
    company: Company,
    denominationLookup: Map<string, Array<any>>,
  ): void {
    const denominations = denominationLookup.get(company.identifier)
    if (denominations) {
      company.name = denominations.map((d) => ({
        language: d.language,
        type: d.type,
        name: d.denomination,
      }))
    }
  }

  private parseEstablishment(
    company: Company,
    establishmentLookup: Map<string, Array<any>>,
    denominationLookup: Map<string, Array<any>>,
    activityLookup: Map<string, Array<any>>,
    contactLookup: Map<string, Array<any>>,
    addressLookup: Map<string, any>,
  ): void {
    const establishments = establishmentLookup.get(company.identifier)
    if (!establishments) return

    for (const est of establishments) {
      const establishment: any = {
        identifier: est.id,
        name: [],
        startDate: est.startDate,
        activity: [],
        contact: {},
        address: {},
      }

      const denominations = denominationLookup.get(est.id)
      if (denominations) {
        establishment.name = denominations.map((d: any) => ({
          language: d.language,
          type: d.type,
          name: d.denomination,
        }))
      }

      const activities = activityLookup.get(est.id)
      if (activities) {
        establishment.activity = activities.map((a: any) => ({
          group: a.group,
          naceVersion: a.naceVersion,
          naceCode: a.naceCode,
          classification: a.classification,
        }))
      }

      const contacts = contactLookup.get(est.id)
      if (contacts) {
        for (const contact of contacts) {
          this.mapContactToObject(establishment.contact, contact)
        }
      }

      const address = addressLookup.get(est.id)
      if (address) {
        establishment.address = this.mapAddress(address)
      }

      company.establishment.push(establishment)
    }
  }

  private parseBranch(
    company: Company,
    branchLookup: Map<string, Array<any>>,
  ): void {
    const branches = branchLookup.get(company.identifier)
    if (branches) {
      company.branch = branches.map((b) => ({
        identifier: b.id,
        startDate: b.startDate,
        address: {},
      }))
    }
  }

  private parseActivity(
    company: Company,
    activityLookup: Map<string, Array<any>>,
  ): void {
    const activities = activityLookup.get(company.identifier)
    if (activities) {
      company.activity = activities.map((a) => ({
        group: a.group,
        naceVersion: a.naceVersion,
        naceCode: a.naceCode,
        naceDescriptionNl: '', // TODO: get from codeLookup
        naceDescriptionFr: '', // TODO: get from codeLookup
        classification: a.classification,
      }))
    }
  }

  private parseContact(
    company: Company,
    contactLookup: Map<string, Array<any>>,
  ): void {
    const contacts = contactLookup.get(company.identifier)
    if (contacts) {
      for (const contact of contacts) {
        this.mapContactToObject(company.mainContact, contact)
      }
    }
  }

  private parseAddress(
    company: Company,
    addressLookup: Map<string, any>,
  ): void {
    const address = addressLookup.get(company.identifier)
    if (address && address.type === 'REGO') {
      company.mainAddress = this.mapAddress(address)
    }
  }

  private mapContactToObject(contactObj: any, contact: any): void {
    switch (contact.type) {
      case 'EMAIL':
        contactObj.email = contact.value
        break
      case 'TEL':
        contactObj.telephone = contact.value
        break
      case 'FAX':
        contactObj.fax = contact.value
        break
      case 'WEB':
        contactObj.homepage = contact.value
        break
    }
  }

  private mapAddress(address: any): any {
    return {
      countryNl: address.countryNL,
      countryFr: address.countryFR,
      zipcode: address.zipcode,
      municipalityNl: address.municipalityNL,
      municipalityFr: address.municipalityFR,
      streetNl: address.streetNL,
      streetFr: address.streetFR,
      houseNumber: address.houseNumber,
      box: address.box,
      extraAddressInfo: address.extraAddressInfo,
      endDate: address.dateStrikingOff,
    }
  }

  readCodes(inputPath: string): any {
    const codeData = fs.readFileSync(path.join(inputPath, 'code.csv'), 'utf-8')
    const codeLines: string[] = codeData.split(/\r?\n/).slice(1)
    const codeLookup: any = {}
    for (const line of codeLines) {
      if (line == '') continue

      const raw = line.replace(/"/g, '').split(',')
      const category = raw[0]
      const code = raw[1]
      if (!(category in codeLookup)) {
        codeLookup[category] = []
      }

      codeLookup[category].push({
        category: raw[0],
        code: raw[1],
        language: raw[2],
        description: raw[3],
      })
    }

    return codeLookup
  }

  /**
   * Read and parse companies from CSV file
   */
  readCompanies2(inputPath: string): Company[] {
    const companies: Company[] = []
    const companyData = fs.readFileSync(
      path.join(inputPath, 'enterprise.csv'),
      'utf-8',
    )
    const companyLines: string[] = companyData.split(/\r?\n/).slice(1)
    const denominationData = fs.readFileSync(
      path.join(inputPath, 'denomination.csv'),
      'utf-8',
    )
    const denonimationLines: string[] = denominationData.split(/\r?\n/).slice(1)
    const denominationLookup: any = {}
    for (const line of denonimationLines) {
      if (line == '') continue

      const raw = line.replace(/"/g, '').split(',')
      const id = raw[0]
      if (!(id in denominationLookup)) {
        denominationLookup[id] = []
      }

      denominationLookup[id].push({
        id: raw[0],
        language: raw[1],
        type: raw[2],
        denomination: raw[3],
      })
    }
    const establishmentData = fs.readFileSync(
      path.join(inputPath, 'establishment.csv'),
      'utf-8',
    )
    const establishmentLines: string[] = establishmentData
      .split(/\r?\n/)
      .slice(1)
    const establishmentLookup: any = {}
    for (const line of establishmentLines) {
      if (line == '') continue

      const raw = line.replace(/"/g, '').split(',')
      const id = raw[2]
      if (!(id in establishmentLookup)) {
        establishmentLookup[id] = []
      }

      establishmentLookup[id].push({
        id: raw[0],
        startDate: raw[1],
        companyId: raw[2],
      })
    }
    const branchData = fs.readFileSync(
      path.join(inputPath, 'branch.csv'),
      'utf-8',
    )
    const branchLookup: any = {}
    const branchLines: string[] = branchData.split(/\r?\n/).slice(1)
    for (const line of branchLines) {
      if (line == '') continue

      const raw = line.replace(/"/g, '').split(',')
      const id = raw[2]
      if (!(id in branchLookup)) {
        branchLookup[id] = []
      }

      branchLookup[id].push({
        id: raw[0],
        startDate: raw[1],
        companyId: raw[2],
      })
    }
    const activityData = fs.readFileSync(
      path.join(inputPath, 'activity.csv'),
      'utf-8',
    )
    const activityLines: string[] = activityData.split(/\r?\n/).slice(1)
    const activityLookup: any = {}
    for (const line of activityLines) {
      if (line == '') continue

      const raw = line.replace(/"/g, '').split(',')
      const id = raw[0]
      if (!(id in activityLookup)) {
        activityLookup[id] = []
      }

      activityLookup[id].push({
        id: raw[0],
        group: raw[1],
        naceVersion: raw[2],
        naceCode: raw[3],
        classification: raw[4],
      })
    }
    const contactData = fs.readFileSync(
      path.join(inputPath, 'contact.csv'),
      'utf-8',
    )
    const contactLines: string[] = contactData.split(/\r?\n/).slice(1)
    const contactLookup: any = {}
    for (const line of contactLines) {
      if (line == '') continue

      const raw = line.replace(/"/g, '').split(',')
      const id = raw[0]
      if (!(id in contactLookup)) {
        contactLookup[id] = []
      }

      contactLookup[id].push({
        id: raw[0],
        entityContact: raw[1],
        type: raw[2],
        value: raw[3],
      })
    }
    const addressData = fs.readFileSync(
      path.join(inputPath, 'address.csv'),
      'utf-8',
    )
    const addressLines: string[] = addressData.split(/\r?\n/).slice(1)
    const addressLookup: any = {}
    for (const line of addressLines) {
      if (line == '') continue

      const raw = line.replace(/"/g, '').split(',')
      const id = raw[0]
      addressLookup[id] = {
        id: raw[0],
        type: raw[1],
        countryNl: raw[2],
        countryFr: raw[3],
        zipcode: raw[4],
        municipalityNl: raw[5],
        municipalityFr: raw[6],
        streetNl: raw[7],
        streetFr: raw[8],
        houseNumber: raw[9],
        box: raw[10],
        extraAddressInfo: raw[11],
        dateStrikingOff: raw[12],
      }
    }

    /* Process */
    for (const line of companyLines) {
      if (line == '') continue

      const raw = line.replace(/"/g, '').split(',')
      const identifier = raw[0]
      console.log(`${identifier}`)

      const company: Company = {
        identifier: identifier,
        name: [],
        juridicalState: raw[1],
        juridicalSituation: raw[2],
        juridicalEntity: raw[3],
        juridicalForm: raw[4],
        juridicalFormCAC: raw[5],
        startDate: raw[6],
        establishment: [],
        branch: [],
        activity: [],
        mainContact: {},
        mainAddress: {},
      }

      const codeLookup = this.readCodes(inputPath)
      this.parseEstablishment2(company, establishmentLookup)
      this.parseDenomination2(company, denominationLookup)
      this.parseBranch2(company, branchLookup)
      this.parseActivity2(company, activityLookup, codeLookup)
      this.parseContact2(company, contactLookup)
      this.parseAddress2(company, addressLookup)

      companies.push(company)
    }

    return companies
  }

  parseDenomination2(company: Company, denomination: any): void {
    /* Hoofdzetel */
    if (denomination[company.identifier]) {
      for (const entity of denomination[company.identifier]) {
        company.name.push({
          language: entity['language'],
          type: entity['type'],
          name: entity['denomination'],
        })
      }
    }
    /* Vestigingen */
    for (const establishment of company.establishment) {
      if (denomination[establishment.identifier]) {
        for (const entity of denomination[establishment.identifier]) {
          establishment.name.push({
            language: entity['language'],
            type: entity['type'],
            name: entity['denomination'],
          })
        }
      }
    }
  }

  parseEstablishment2(company: Company, establishment: any): void {
    if (establishment[company.identifier]) {
      for (const entity of establishment[company.identifier]) {
        company.establishment.push({
          identifier: entity['id'],
          name: [],
          startDate: entity['startDate'],
          activity: [],
          contact: {},
          address: {},
        })
      }
    }
  }

  parseBranch2(company: Company, branch: any): void {
    if (branch[company.identifier]) {
      for (const entity of branch[company.identifier]) {
        company.branch.push({
          identifier: entity['id'],
          startDate: entity['startDate'],
          address: {},
        })
      }
    }
  }

  parseActivity2(company: Company, activity: any, codes: any): void {
    /* Hoofdzetel */
    if (activity[company.identifier]) {
      for (const entity of activity[company.identifier]) {
        const descriptionNl = codes[`Nace${entity['naceVersion']}`].find(
          (element: any) =>
            element.code == entity['naceCode'] && element.language == 'NL',
        ).description
        const descriptionFr = codes[`Nace${entity['naceVersion']}`].find(
          (element: any) =>
            element.code == entity['naceCode'] && element.language == 'FR',
        ).description
        company.activity.push({
          group: entity['group'],
          naceVersion: entity['naceVersion'],
          naceCode: entity['naceCode'],
          naceDescriptionNl: descriptionNl,
          naceDescriptionFr: descriptionFr,
          classification: entity['classification'],
        })
      }
    }
    /* Vestigingen */
    for (const establishment of company.establishment) {
      if (activity[establishment.identifier]) {
        for (const entity of activity[establishment.identifier]) {
          let descriptionNl = codes[`Nace${entity['naceVersion']}`].find(
            (element: any) => element.code == entity['naceCode'],
          ).description
          const descriptionFr = codes[`Nace${entity['naceVersion']}`].find(
            (element: any) =>
              element.code == entity['naceCode'] && element.language == 'FR',
          ).description
          establishment.activity.push({
            group: entity['group'],
            naceVersion: entity['naceVersion'],
            naceCode: entity['naceCode'],
            naceDescriptionNl: descriptionNl,
            naceDescriptionFr: descriptionFr,
            classification: entity['classification'],
          })
        }
      }
    }
  }

  parseContact2(company: Company, contact: any): void {
    /* Hoofdzetel */
    if (contact[company.identifier]) {
      for (const entity of contact[company.identifier]) {
        const type = entity['type']
        const value = entity['value']
        switch (type) {
          case 'EMAIL':
            company.mainContact.email = value
            break

          case 'TEL':
            company.mainContact.email = value
            break

          case 'FAX':
            company.mainContact.fax = value
            break

          case 'WEB':
            company.mainContact.homepage = value
            break
        }
      }
    }
    /* Vestigingen */
    for (const establishment of company.establishment) {
      if (contact[establishment.identifier]) {
        for (const entity of contact[establishment.identifier]) {
          const type = entity['type']
          const value = entity['value']
          switch (type) {
            case 'EMAIL':
              establishment.contact.email = value
              break

            case 'TEL':
              establishment.contact.telephone = value
              break

            case 'FAX':
              establishment.contact.fax = value
              break

            case 'WEB':
              establishment.contact.homepage = value
              break
          }
        }
      }
    }
  }

  parseAddress2(company: Company, address: any): void {
    if (address[company.identifier]) {
      const type = address[company.identifier]['type']
      /* Hoofdzetel */
      if (type == 'REGO') {
        company.mainAddress = {
          countryNl:
            address[company.identifier]['countryNl'] == ''
              ? 'België'
              : address[company.identifier]['countryNl'],
          countryFr:
            address[company.identifier]['countryFr'] == ''
              ? 'Belgique'
              : address[company.identifier]['countryFr'],
          zipcode: address[company.identifier]['zipcode'],
          municipalityNl: address[company.identifier]['municipalityNl'],
          municipalityFr: address[company.identifier]['municipalityFr'],
          streetNl: address[company.identifier]['streetNl'],
          streetFr: address[company.identifier]['streetFr'],
          houseNumber: address[company.identifier]['houseNumber'],
          box:
            address[company.identifier]['box'] == ''
              ? undefined
              : address[company.identifier]['box'],
          extraAddressInfo:
            address[company.identifier]['extraAddressInfo'] == ''
              ? undefined
              : address[company.identifier]['extraAddressInfo'],
          endDate:
            address[company.identifier]['endDate'] == ''
              ? undefined
              : address[company.identifier]['endDate'],
        }
      }
    }
    /* Vestigingen */
    for (const establishment of company.establishment) {
      if (address[establishment.identifier]) {
        establishment.address = {
          countryNl:
            address[establishment.identifier]['countryNl'] == ''
              ? 'België'
              : address[establishment.identifier]['countryNl'],
          countryFr:
            address[establishment.identifier]['countryFr'] == ''
              ? 'Belgique'
              : address[establishment.identifier]['countryFr'],
          zipcode: address[establishment.identifier]['zipcode'],
          municipalityNl: address[establishment.identifier]['municipalityNl'],
          municipalityFr: address[establishment.identifier]['municipalityFr'],
          streetNl: address[establishment.identifier]['streetNl'],
          streetFr: address[establishment.identifier]['streetFr'],
          houseNumber: address[establishment.identifier]['houseNumber'],
          box:
            address[establishment.identifier]['box'] == ''
              ? undefined
              : address[establishment.identifier]['box'],
          extraAddressInfo:
            address[establishment.identifier]['extraAddressInfo'] == ''
              ? undefined
              : address[establishment.identifier]['extraAddressInfo'],
          endDate:
            address[establishment.identifier]['endDate'] == ''
              ? undefined
              : address[establishment.identifier]['endDate'],
        }
      }
    }

    /* Bijkantoren */
    for (const branch of company.branch) {
      if (address[branch.identifier]) {
        branch.address = {
          countryNl:
            address[branch.identifier]['countryNl'] == ''
              ? 'België'
              : address[branch.identifier]['countryNl'],
          countryFr:
            address[branch.identifier]['countryFr'] == ''
              ? 'Belgique'
              : address[branch.identifier]['countryFr'],
          zipcode: address[branch.identifier]['zipcode'],
          municipalityNl: address[branch.identifier]['municipalityNl'],
          municipalityFr: address[branch.identifier]['municipalityFr'],
          streetNl: address[branch.identifier]['streetNl'],
          streetFr: address[branch.identifier]['streetFr'],
          houseNumber: address[branch.identifier]['houseNumber'],
          box:
            address[branch.identifier]['box'] == ''
              ? undefined
              : address[branch.identifier]['box'],
          extraAddressInfo:
            address[branch.identifier]['extraAddressInfo'] == ''
              ? undefined
              : address[branch.identifier]['extraAddressInfo'],
          endDate:
            address[branch.identifier]['endDate'] == ''
              ? undefined
              : address[branch.identifier]['endDate'],
        }
      }
    }
  }
}
