import {
  SUPPORTED_FORMATS,
  SUPPORTED_EXTENSIONS,
} from '~/constants/constants'
import type { KboOrganizationData } from '~/types/KBO'
import type { OndernemingType } from '~/types/onderneming'
import { kboDataToQuads } from '~/server/services/kbo-serialization.service'
import { serializeQuadsToString } from '~/services/serialization.service'
import { geefOnderneming } from '~/services/onderneming.service'
import { mapOndernemingToEnterprise } from '~/server/services/enterprise.service'
import { getCode } from '~/server/utils/soap-utils'

export default defineEventHandler(
  async (event: any): Promise<KboOrganizationData | string | null> => {
    try {
      const slug = getRouterParam(event, 'slug')

      if (!slug) {
        throw createError({ statusCode: 400, statusMessage: 'Enterprise is required' })
      }

      console.log(`[${new Date().toISOString()}] Fetching enterprise: ${slug}`)

      const extension = SUPPORTED_EXTENSIONS.find((ext) => slug.endsWith(ext))
      const cleanSlug = extension ? slug.replace(extension, '') : slug

      const firstDigit = parseInt(cleanSlug.charAt(0), 10)
      if (!isNaN(firstDigit) && firstDigit >= 2) {
        throw createError({
          statusCode: 404,
          statusMessage: `This is a vestiging (branch), not an enterprise: ${cleanSlug}`,
        })
      }

      const acceptHeader = getHeader(event, 'accept') ?? ''
      const extensionFormat = extension
        ? SUPPORTED_FORMATS[extension.replace('.', '') as keyof typeof SUPPORTED_FORMATS]
        : null
      const requestedFormat =
        extensionFormat ||
        Object.values(SUPPORTED_FORMATS).find((fmt) => acceptHeader.includes(fmt))

      const referte = `OSLO-SP-Onderneming-${Date.now()}`
      const environment = useRuntimeConfig().public.ENVIRONMENT

      // Fetch from GeefOnderneming
      const antwoord = await geefOnderneming(
        {
          Criteria: {
            Ondernemingsnummer: cleanSlug,
            Basisgegevens: '1',
            Rechtstoestanden: '1',
            Vestigingen: {
              Aanduiding: '1',
              Details: '1'
            },
            Activiteiten: '1',
            AmbtshalveDoorhalingen: '1',
            Omschrijvingen: {
              Aanduiding: '1'
            },
          },
        },
        referte,
      )

      if (environment !== 'Production') {
        console.log(`[${new Date().toISOString()}] GeefOnderneming response for enterprise ${cleanSlug}:`, JSON.stringify(antwoord, null, 2))
      }

      const inhoud = antwoord?.Repliek?.Antwoorden?.Antwoord?.Inhoud as { Onderneming?: OndernemingType } | undefined
      const onderneming = inhoud?.Onderneming

      if (!onderneming) {
        const uitzonderingen =
          antwoord?.Repliek?.Antwoorden?.Antwoord?.Uitzonderingen ?? antwoord?.Repliek?.Uitzonderingen
        if (uitzonderingen) {
          const uitz = Array.isArray(uitzonderingen.Uitzondering)
            ? uitzonderingen.Uitzondering
            : [uitzonderingen.Uitzondering]
          const diagnoses = uitz.map((u: any) => u.Diagnose).join('; ')
          throw createError({ statusCode: 404, statusMessage: `Enterprise not found: ${cleanSlug} (${diagnoses})` })
        }
        throw createError({ statusCode: 404, statusMessage: `Enterprise not found: ${cleanSlug}` })
      }

      // Map SOAP data to KboOrganizationData
      const enterprise = await mapOndernemingToEnterprise(cleanSlug, onderneming)

      // SoortOnderneming code "1" is a Natuurlijk persoon: no contact info
      // (including address) should be exposed for natural persons. The phone,
      // email and GSM data is already mapped from the GeefOnderneming response's
      // Adressen.Descripties.Descriptie.Contact by mapOndernemingToEnterprise.
      const isNatuurlijkPersoon = getCode(onderneming.SoortOnderneming) === '1'
      if (isNatuurlijkPersoon) {
        enterprise.contactPoints = undefined
      }

      if (requestedFormat) {
        const quads = kboDataToQuads(enterprise)
        const serialized = await serializeQuadsToString(quads, requestedFormat)
        setHeader(event, 'Content-Type', requestedFormat)
        return serialized
      }

      return enterprise
    } catch (error: any) {
      if (error.statusCode) throw error
      console.error('Error fetching enterprise:', error)
      throw createError({ statusCode: 500, statusMessage: 'Error fetching enterprise' })
    }
  },
)
