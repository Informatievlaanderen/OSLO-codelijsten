import {
  CONTACT_POINTS_QUERY,
  SUPPORTED_FORMATS,
  SUPPORTED_EXTENSIONS,
  KBO_BY_ID_QUERY,
} from '~/constants/constants'
import { executeQuery } from '~/server/services/rdfquery.service'
import { serializeKboData } from '~/services/serialization-service'
import type {
  KboData,
  KboContactPoint,
  KboRegistration,
  KboSite,
} from '~/types/KBO'

export default defineEventHandler(
  async (event): Promise<KboData | string | null> => {
    try {
      const slug = getRouterParam(event, 'slug')

      if (!slug) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Slug is required',
        })
      }

      console.log(`[${new Date().toISOString()}] Fetching KBO: ${slug}`)

      // Detect supported file extension (.ttl, .jsonld, .nt)
      const extension: string | undefined = SUPPORTED_EXTENSIONS.find((ext) =>
        slug.endsWith(ext),
      )

      const cleanSlug = extension ? slug.replace(extension, '') : slug

      const runtimeConfig = useRuntimeConfig()
      const KBO_TTL_URL = runtimeConfig.KBO_TTL_URL ?? process.env.KBO_TTL_URL

      const sourceUrl = `${KBO_TTL_URL}/${cleanSlug}.ttl`

      // Handle content negotiation - serialize in requested format
      const acceptHeader = getHeader(event, 'accept') ?? ''
      const extensionFormat = extension
        ? SUPPORTED_FORMATS[
            extension.replace('.', '') as keyof typeof SUPPORTED_FORMATS
          ]
        : null
      const requestedFormat =
        extensionFormat ||
        Object.values(SUPPORTED_FORMATS).find((fmt) =>
          acceptHeader.includes(fmt),
        )

      if (requestedFormat) {
        const serialized = await serializeKboData(
          cleanSlug,
          sourceUrl,
          requestedFormat,
        )
        setHeader(event, 'Content-Type', requestedFormat)
        return serialized
      }

      // Fetch KBO data as JSON
      const bindings = await executeQuery(KBO_BY_ID_QUERY(cleanSlug), [
        sourceUrl,
      ])

      if (!bindings.length) {
        throw createError({
          statusCode: 404,
          statusMessage: `KBO not found: ${cleanSlug}`,
        })
      }

      // Collect unique legalNames
      const legalNames = new Set<string>()
      const contactTypes = new Set<string>()
      const sitesMap = new Map<string, KboSite>()
      let uri: string | undefined
      let rechtspersoonlijkheid: string | undefined
      let rechtstoestand: string | undefined
      let rechtsvorm: string | undefined
      let created: string | undefined
      let thoroughfare: string | undefined
      let postCode: string | undefined
      let municipality: string | undefined
      let country: string | undefined
      let contactEmail: string | undefined
      let contactTelephone: string | undefined
      let registrationNotation: string | undefined
      let registrationCreator: string | undefined
      let registrationSchemaAgency: string | undefined
      let registrationIssued: string | undefined

      for (const binding of bindings) {
        uri = uri ?? binding.get('organization')?.value
        rechtspersoonlijkheid =
          rechtspersoonlijkheid ?? binding.get('rechtspersoonlijkheid')?.value
        rechtstoestand = rechtstoestand ?? binding.get('rechtstoestand')?.value
        rechtsvorm = rechtsvorm ?? binding.get('rechtsvorm')?.value
        created = created ?? binding.get('issued')?.value

        const legalName = binding.get('legalName')?.value
        if (legalName) legalNames.add(legalName)

        const contactType = binding.get('contactType')?.value
        if (contactType) contactTypes.add(contactType)

        contactEmail = contactEmail ?? binding.get('contactEmail')?.value
        contactTelephone =
          contactTelephone ?? binding.get('contactTelephone')?.value

        thoroughfare = thoroughfare ?? binding.get('addressThoroughfare')?.value
        postCode = postCode ?? binding.get('addressPostCode')?.value
        municipality = municipality ?? binding.get('addressMunicipality')?.value
        country = country ?? binding.get('addressCountry')?.value

        registrationNotation =
          registrationNotation ?? binding.get('registrationNotation')?.value
        registrationCreator =
          registrationCreator ?? binding.get('registrationCreator')?.value
        registrationSchemaAgency =
          registrationSchemaAgency ??
          binding.get('registrationSchemaAgency')?.value
        registrationIssued =
          registrationIssued ?? binding.get('registrationIssued')?.value

        // Collect registered sites
        const siteUri = binding.get('site')?.value
        if (siteUri && !sitesMap.has(siteUri)) {
          sitesMap.set(siteUri, {
            uri: siteUri,
            created: binding.get('siteCreated')?.value,
            registration: binding.get('siteRegNotation')?.value
              ? {
                  notation: binding.get('siteRegNotation')?.value,
                  creator: binding.get('siteRegCreator')?.value,
                  schemaAgency: binding.get('siteRegSchemaAgency')?.value,
                  issued: binding.get('siteRegIssued')?.value,
                }
              : undefined,
          })
        }
      }

      const contactPoints: KboContactPoint[] = []
      if (
        thoroughfare ||
        postCode ||
        municipality ||
        country ||
        contactEmail ||
        contactTelephone ||
        contactTypes.size
      ) {
        contactPoints.push({
          id: 'contact-0',
          type: contactTypes.size ? Array.from(contactTypes) : undefined,
          email: contactEmail,
          telephone: contactTelephone,
          address:
            thoroughfare || postCode || municipality || country
              ? { thoroughfare, postCode, municipality, country }
              : undefined,
        })
      }

      const registration: KboRegistration | undefined =
        registrationNotation ||
        registrationCreator ||
        registrationSchemaAgency ||
        registrationIssued
          ? {
              notation: registrationNotation,
              creator: registrationCreator,
              schemaAgency: registrationSchemaAgency,
              issued: registrationIssued,
            }
          : undefined

      const kboData: KboData = {
        id: cleanSlug,
        uri,
        legalName: legalNames.size ? Array.from(legalNames) : undefined,
        rechtspersoonlijkheid,
        rechtstoestand,
        rechtsvorm,
        created,
        contactPoints: contactPoints.length ? contactPoints : undefined,
        registration,
        registeredSites: sitesMap.size
          ? Array.from(sitesMap.values())
          : undefined,
        source: sourceUrl,
      }

      return kboData
    } catch (error) {
      console.error('Error fetching KBO:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Error fetching KBO data',
      })
    }
  },
)
