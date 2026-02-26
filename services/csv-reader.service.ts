import * as fs from 'fs'
import type { Company, Code, Address, Establishment } from '../types/company'
import * as path from 'path'
import csv from 'csv-parser'
import { CompanyToTTLService } from './company-to-ttl.service'
import {
  CsvRow,
  CompanyLookupItem,
  DenominationLookupItem,
  EstablishmentLookupItem,
  BranchLookupItem,
  ActivityLookupItem,
  ContactLookupItem,
  AddressLookupItem,
} from '../types/reader'

export class CsvReaderService {
  private inputPath: string = ''
  private readonly BATCH_SIZE = 100
  private readonly MAX_COMPANY_BATCH = 10000

  async readCompanies(
    inputPath: string,
    outputDir: string,
  ): Promise<{ total: number; batches: number }> {
    this.inputPath = inputPath

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    console.log('Step 1: Building company list...')
    const companyIds = await this.getCompanyIds()
    const totalCompanies = companyIds.length
    console.log(`Found ${totalCompanies} companies to process`)

    let totalProcessed = 0
    let totalBatches = 0

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

      if (global.gc) {
        console.log('Running garbage collection...')
        global.gc()
      }

      console.log(`✓ Completed chunk ${chunkNumber}/${totalChunks}`)
    }

    return { total: totalProcessed, batches: totalBatches }
  }

  private async getCompanyIds(): Promise<string[]> {
    const companyIds: string[] = []

    await this.streamCsv('enterprise.csv', (row) => {
      if (row.EnterpriseNumber) {
        companyIds.push(row.EnterpriseNumber)
      }
    })

    return companyIds
  }

  private getNaceDescription(
    codeLookup: Map<string, Code[]>,
    naceCode: string,
    language: string,
  ): string {
    const codes = codeLookup.get(naceCode) || []
    const languageDesc = codes.find(
      (c) => c.language.toLowerCase() === language.toLowerCase(),
    )
    return languageDesc?.description || ''
  }

  private async processCompanyChunk(
    companyIds: string[],
    outputDir: string,
  ): Promise<{ processed: number; batches: number }> {
    console.log('Building lookup tables for chunk...')

    const companyIdSet = new Set(companyIds)

    const [
      companyLookup,
      denominationLookup,
      establishmentLookup,
      branchLookup,
      contactLookup,
      addressLookup,
      activityLookup,
      codeLookup,
    ] = await Promise.all([
      this.buildCompanyLookupForChunk(companyIdSet),
      this.buildDenominationLookupForChunk(companyIdSet),
      this.buildEstablishmentLookupForChunk(companyIdSet),
      this.buildBranchLookupForChunk(companyIdSet),
      this.buildContactLookupForChunk(companyIdSet),
      this.buildAddressLookupForChunk(companyIdSet),
      this.buildActivityLookupForChunk(companyIdSet),
      this.buildCodeLookupForChunk(),
    ])

    console.log('Building companies in batches...')

    const stats = await this.buildCompaniesInBatches(
      outputDir,
      companyLookup,
      denominationLookup,
      establishmentLookup,
      branchLookup,
      activityLookup,
      contactLookup,
      addressLookup,
      codeLookup,
    )

    // Clear lookups from memory
    companyLookup.clear()
    denominationLookup.clear()
    establishmentLookup.clear()
    branchLookup.clear()
    activityLookup.clear()
    contactLookup.clear()
    addressLookup.clear()
    codeLookup.clear()

    return stats
  }

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

  private async buildCompanyLookupForChunk(
    companyIdSet: Set<string>,
  ): Promise<Map<string, CompanyLookupItem>> {
    const lookup = new Map<string, CompanyLookupItem>()

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

  private async buildDenominationLookupForChunk(
    companyIdSet: Set<string>,
  ): Promise<Map<string, DenominationLookupItem[]>> {
    const lookup = new Map<string, DenominationLookupItem[]>()

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

  private async buildEstablishmentLookupForChunk(
    companyIdSet: Set<string>,
  ): Promise<Map<string, EstablishmentLookupItem[]>> {
    const lookup = new Map<string, EstablishmentLookupItem[]>()

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

  private async buildBranchLookupForChunk(
    companyIdSet: Set<string>,
  ): Promise<Map<string, BranchLookupItem[]>> {
    const lookup = new Map<string, BranchLookupItem[]>()

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

  private async buildActivityLookupForChunk(
    companyIdSet: Set<string>,
  ): Promise<Map<string, ActivityLookupItem[]>> {
    const lookup = new Map<string, ActivityLookupItem[]>()

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

  private async buildCodeLookupForChunk(): Promise<Map<string, Code[]>> {
    const lookup = new Map<string, Code[]>()

    await this.streamCsv('code.csv', (row) => {
      const id = row.Code

      if (!lookup.has(id)) {
        lookup.set(id, [])
      }
      lookup.get(id)!.push({
        code: id,
        category: row.Category,
        language: row.Language,
        description: row.Description,
      })
    })
    return lookup
  }

  private async buildContactLookupForChunk(
    companyIdSet: Set<string>,
  ): Promise<Map<string, ContactLookupItem[]>> {
    const lookup = new Map<string, ContactLookupItem[]>()

    await this.streamCsv('contact.csv', (row) => {
      const id = row.EntityNumber
      if (companyIdSet.has(id)) {
        if (!lookup.has(id)) {
          lookup.set(id, [])
        }

        lookup.get(id)!.push({
          id: [id],
          entityContact: row.EntityContact,
          type: row.ContactType,
          value: row.Value,
        })
      }
    })

    return lookup
  }

  private async buildAddressLookupForChunk(
    companyIdSet: Set<string>,
  ): Promise<Map<string, AddressLookupItem>> {
    const lookup = new Map<string, AddressLookupItem>()

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

  private async buildCompaniesInBatches(
    outputDir: string,
    companyLookup: Map<string, CompanyLookupItem>,
    denominationLookup: Map<string, DenominationLookupItem[]>,
    establishmentLookup: Map<string, EstablishmentLookupItem[]>,
    branchLookup: Map<string, BranchLookupItem[]>,
    activityLookup: Map<string, ActivityLookupItem[]>,
    contactLookup: Map<string, ContactLookupItem[]>,
    addressLookup: Map<string, AddressLookupItem>,
    codeLookup: Map<string, Code[]>,
  ): Promise<{ processed: number; batches: number }> {
    const companyIds = Array.from(companyLookup.keys())
    let processedCount = 0
    let batchCount = 0
    const batch: Company[] = []

    for (let i = 0; i < companyIds.length; i += this.BATCH_SIZE) {
      const batchIds = companyIds.slice(i, i + this.BATCH_SIZE)

      for (const identifier of batchIds) {
        const companyData = companyLookup.get(identifier)!

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
        this.parseActivity(company, activityLookup, codeLookup)
        this.parseContact(company, contactLookup)
        this.parseAddress(company, addressLookup)

        batch.push(company)
        processedCount++
      }

      await this.writeBatchToDisk(outputDir, batch)
      batchCount++
      batch.length = 0

      if (global.gc && batchCount % 10 === 0) {
        global.gc()
      }
    }

    return { processed: processedCount, batches: batchCount }
  }

  private async writeBatchToDisk(
    outputDir: string,
    companies: Company[],
  ): Promise<void> {
    const writePromises = companies.map(async (company) => {
      // remove the . from the filename so that we can use it as path /onderneming/{id}
      console.log(company.identifier)
      const sanitizedId = company.identifier.replace(/\./g, '')
      const fileName = `${sanitizedId}.ttl`
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
    denominationLookup: Map<string, DenominationLookupItem[]>,
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
    establishmentLookup: Map<string, EstablishmentLookupItem[]>,
    denominationLookup: Map<string, DenominationLookupItem[]>,
    activityLookup: Map<string, ActivityLookupItem[]>,
    contactLookup: Map<string, ContactLookupItem[]>,
    addressLookup: Map<string, AddressLookupItem>,
  ): void {
    const establishments = establishmentLookup.get(company.identifier)
    if (!establishments) return

    for (const est of establishments) {
      const establishment: Establishment = {
        identifier: est.id,
        name: [],
        startDate: est.startDate,
        activity: [],
        contact: {},
        address: {},
      }

      const denominations = denominationLookup.get(est.id)
      if (denominations) {
        establishment.name = denominations.map((d: DenominationLookupItem) => ({
          language: d.language,
          type: d.type,
          name: d.denomination,
        }))
      }

      const activities = activityLookup.get(est.id)
      if (activities) {
        establishment.activity = activities.map((a: ActivityLookupItem) => ({
          group: a.group,
          naceVersion: a.naceVersion,
          naceCode: a.naceCode,
          classification: a.classification,
          naceDescriptionNl: '',
          naceDescriptionFr: '',
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
    branchLookup: Map<string, BranchLookupItem[]>,
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
    activityLookup: Map<string, ActivityLookupItem[]>,
    codeLookup: Map<string, Code[]>,
  ): void {
    const activities = activityLookup.get(company.identifier)
    if (activities) {
      company.activity = activities.map((a) => {
        return {
          group: a.group,
          naceVersion: a.naceVersion,
          naceCode: a.naceCode,
          naceDescriptionNl: this.getNaceDescription(
            codeLookup,
            a.naceCode,
            'nl',
          ),
          naceDescriptionFr: this.getNaceDescription(
            codeLookup,
            a.naceCode,
            'fr',
          ),
          classification: a.classification,
        }
      })
    }
  }

  private parseContact(
    company: Company,
    contactLookup: Map<string, ContactLookupItem[]>,
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
    addressLookup: Map<string, AddressLookupItem>,
  ): void {
    const address = addressLookup.get(company.identifier)
    if (address && address.type === 'REGO') {
      company.mainAddress = this.mapAddress(address)
    }
  }

  private mapContactToObject(
    contactObj: any,
    contact: ContactLookupItem,
  ): void {
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

  private mapAddress(address: AddressLookupItem): Address {
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

  public readCodes(inputPath: string): Record<string, Code[]> {
    const codeData = fs.readFileSync(path.join(inputPath, 'code.csv'), 'utf-8')
    const codeLines: string[] = codeData.split(/\r?\n/).slice(1)
    const codeLookup: Record<string, Code[]> = {}

    for (const line of codeLines) {
      if (line === '') continue

      const raw = line.replace(/"/g, '').split(',')
      const code = raw[1]

      if (!(code in codeLookup)) {
        codeLookup[code] = []
      }

      codeLookup[code].push({
        category: raw[0],
        code: raw[1],
        language: raw[2],
        description: raw[3],
      })
    }

    return codeLookup
  }
}
