import {
  SUPPORTED_FORMATS,
  SUPPORTED_EXTENSIONS,
} from '~/constants/constants'
import type { KBOBranchData } from '~/types/KBO'
import type { OndernemingType } from '~/types/onderneming'
import { kboDataToQuads } from '~/server/services/kbo-serialization.service'
import { serializeQuadsToString } from '~/services/serialization.service'
import { geefOnderneming } from '~/services/onderneming.service'
import { mapVestigingToBranch } from '~/server/services/branch.service'
import { getNaam } from '~/server/utils/soap-utils'

export default defineEventHandler(
  async (event): Promise<KBOBranchData | string | null> => {
    try {
      const slug = getRouterParam(event, 'slug')

      if (!slug) {
        throw createError({ statusCode: 400, statusMessage: 'Branch is required' })
      }

      console.log(`[${new Date().toISOString()}] Fetching branch: ${slug}`)

      const extension = SUPPORTED_EXTENSIONS.find((ext) => slug.endsWith(ext))
      const cleanSlug = extension ? slug.replace(extension, '') : slug

      const firstDigit = parseInt(cleanSlug.charAt(0), 10)
      if (isNaN(firstDigit) || firstDigit < 2) {
        throw createError({
          statusCode: 404,
          statusMessage: `This is not a vestiging (branch), this endpoint requires a branch ID starting with 2 or higher: ${cleanSlug}`,
        })
      }

      const acceptHeader = getHeader(event, 'accept') ?? ''
      const extensionFormat = extension
        ? SUPPORTED_FORMATS[extension.replace('.', '') as keyof typeof SUPPORTED_FORMATS]
        : null
      const requestedFormat =
        extensionFormat ||
        Object.values(SUPPORTED_FORMATS).find((fmt) => acceptHeader.includes(fmt))

      const referte = `OSLO-SP-Vestiging-${Date.now()}`
      const environment = useRuntimeConfig().public.ENVIRONMENT

      // A vestiging (branch) has no nested vestigingen: querying GeefOnderneming
      // with a branch number returns the vestiging itself. Its parent enterprise
      // number is exposed via MaatschappelijkeZetel, which MAGDA only populates
      // when GerelateerdeOndernemingen is also requested.
      const antwoord = await geefOnderneming(
        {
          Criteria: {
            Ondernemingsnummer: cleanSlug,
            Basisgegevens: '1',
            Activiteiten: '1',
            GerelateerdeOndernemingen: { Aanduiding: '1', Vestigingen: '1' },
          },
        },
        referte,
      )

      if (environment !== 'Production') {
        console.log(`[${new Date().toISOString()}] GeefOnderneming response for branch ${cleanSlug}:`, JSON.stringify(antwoord, null, 2))
      }

      const inhoud = antwoord?.Repliek?.Antwoorden?.Antwoord?.Inhoud as { Onderneming?: OndernemingType } | undefined
      const vestiging = inhoud?.Onderneming

      if (!vestiging) {
        throw createError({ statusCode: 404, statusMessage: `Branch not found: ${cleanSlug}` })
      }

      // Get the parent enterprise number from MaatschappelijkeZetel
      const enterpriseNummer = getNaam(vestiging.MaatschappelijkeZetel?.Ondernemingsnummer)

      if (!enterpriseNummer) {
        throw createError({ statusCode: 404, statusMessage: `No parent enterprise found for branch: ${cleanSlug}` })
      }

      const branch = mapVestigingToBranch(cleanSlug, vestiging, enterpriseNummer, vestiging)

      if (requestedFormat) {
        const quads = kboDataToQuads(branch)
        const serialized = await serializeQuadsToString(quads, requestedFormat)
        setHeader(event, 'Content-Type', requestedFormat)
        return serialized
      }

      return branch
    } catch (error: any) {
      if (error.statusCode) throw error
      console.error('Error fetching branch:', error)
      throw createError({ statusCode: 500, statusMessage: 'Error fetching branch' })
    }
  },
)
