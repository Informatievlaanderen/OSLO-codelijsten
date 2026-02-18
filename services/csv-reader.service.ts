import * as fs from 'fs'
import type { Company } from '../types/company'
import * as path from 'path'

export class CsvReaderService {
  /**
   * Read and parse companies from CSV file
   */
  readCompanies(inputPath: string): Company[] {
    const companies: Company[] = []
    const companyData = fs.readFileSync(
      path.join(inputPath, 'enterprise.csv'),
      'utf-8',
    )
    const companyLines: string[] = companyData.split(/\r?\n/).slice(1)
    const companyLookup: any = {}
    for (const line of companyLines) {
      if (line == '') continue

      const raw = line.replace(/"/g, '').split(',')
      const id = raw[0]
      companyLookup[id] = {
        id: raw[0],
        status: raw[1],
        juridicalSituation: raw[2],
        type: raw[3],
        juridicalForm: raw[4],
        juridicalFormCAC: raw[5],
        startDate: raw[6],
      }
    }
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
      console.log(`${identifier}`);

      const company: Company = {
        identifier: identifier,
        name: [],
        juridicalState: raw[1],
        rechtstoestand: raw[2],
        rechtspersoonlijkheid: raw[3],
        juridicalForm: raw[4],
        juridicalFormCAC: raw[5],
        startDate: raw[6],
        establishment: [],
        branch: [],
        activity: [],
        mainContact: {},
        mainAddress: {},
      }

      this.parseEstablishment(company, establishmentLookup)
      this.parseDenomination(company, denominationLookup)
      this.parseBranch(company, branchLookup)
      this.parseActivity(company, activityLookup)
      this.parseContact(company, contactLookup)
      this.parseAddress(company, addressLookup)

      companies.push(company)
    }

    return companies
  }

  parseDenomination(company: Company, denomination: any): void {
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

  parseEstablishment(company: Company, establishment: any): void {
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

  parseBranch(company: Company, branch: any): void {
    if (branch[company.identifier]) {
      for (const entity of branch[company.identifier]) {
        company.branch.push({
          identifier: entity['id'],
          startDate: entity['startDate'],
        })
      }
    }
  }

  parseActivity(company: Company, activity: any): void {
    /* Hoofdzetel */
    if (activity[company.identifier]) {
      for (const entity of activity[company.identifier]) {
        company.activity.push({
          group: entity['group'],
          naceVersion: entity['naceVersion'],
          naceCode: entity['naceCode'],
          classification: entity['classification'],
        })
      }
    }
    /* Vestigingen */
    for (const establishment of company.establishment) {
      if (activity[establishment.identifier]) {
        for (const entity of activity[establishment.identifier]) {
          establishment.activity.push({
            group: entity['group'],
            naceVersion: entity['naceVersion'],
            naceCode: entity['naceCode'],
            classification: entity['classification'],
          })
        }
      }
    }
  }

  parseContact(company: Company, contact: any): void {
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

  parseAddress(company: Company, address: any): void {
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
  }
}
