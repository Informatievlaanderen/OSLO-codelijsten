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
import { getNaam, getCode, getOmschrijving, toArray } from '~/server/utils/soap-utils'

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

      // Get the parent enterprise number from MaatschappelijkeZetel.
      let enterpriseNummer = getNaam(vestiging.MaatschappelijkeZetel?.Ondernemingsnummer)

      // Fallback: for (especially stopped) vestigingen MAGDA does not populate
      // MaatschappelijkeZetel. The parent is then exposed via
      // GerelateerdeOndernemingen as the relation "Richt vestigingseenheid op"
      // (Relatie.Code "001") with IsDochter="1".
      if (!enterpriseNummer) {
        const gerelateerde = (vestiging as any).GerelateerdeOndernemingen?.GerelateerdeOnderneming
        const related = toArray(gerelateerde).find(
          (r: any) =>
            getCode(r?.Relatie) === '001' ||
            String(r?.Relatie?.Omschrijving ?? '').toLowerCase().includes('richt vestiging'),
        )
        enterpriseNummer = getNaam(related?.Ondernemingsnummer)
      }

      if (!enterpriseNummer) {
        throw createError({ statusCode: 404, statusMessage: `No parent enterprise found for branch: ${cleanSlug}` })
      }

      const branch = mapVestigingToBranch(cleanSlug, vestiging, enterpriseNummer, vestiging)

      // A vestiging of a natural person inherits the natural person's privacy
      // restriction: strip its contact info (address, phone, email, GSM). The
      // vestiging's own SOAP response does not carry SoortOnderneming, so we
      // must fetch the parent enterprise to determine its type. This is
      // best-effort: if the parent fetch fails, we leave the branch untouched.
      try {
        const parentAntwoord = await geefOnderneming(
          {
            Criteria: {
              Ondernemingsnummer: enterpriseNummer,
              Basisgegevens: '1',
            },
          },
          `OSLO-SP-VestOuder-${Date.now()}`,
        )
        const parentInhoud = parentAntwoord?.Repliek?.Antwoorden?.Antwoord?.Inhoud as
          | { Onderneming?: OndernemingType }
          | undefined
        const parentOnderneming = parentInhoud?.Onderneming

        const isNatuurlijkPersoonOuder =
          getCode(parentOnderneming?.SoortOnderneming) === '1' ||
          getOmschrijving(parentOnderneming?.SoortOnderneming)
            ?.toLowerCase()
            .includes('natuurlijk')

        if (isNatuurlijkPersoonOuder) {
          branch.contactPoints = undefined
        }
      } catch (err) {
        console.error('Error fetching parent enterprise for privacy check:', err)
      }

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
