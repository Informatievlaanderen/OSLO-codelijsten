
import { GEEF_BESCHIKBARE_JAARREKENINGEN_NS, GEEF_BESCHIKBARE_JAARREKENINGEN_WSDL, GEEF_ONDERNEMING_NS, GEEF_ONDERNEMING_VKBO_NS, GEEF_ONDERNEMING_VKBO_WSDL, GEEF_ONDERNEMING_WSDL, GEEF_TEWERKSTELLING_NS, GEEF_TEWERKSTELLING_WSDL } from '~/constants/onderneming.constants'
import { createSoapService, buildVerzoek } from '~/server/soap/client'
import type { InhoudGeefOnderneming, InhoudGeefOndernemingVKBO, InhoudOndernemingsnummerCriteria } from '~/types/onderneming'
import type { GeefAntwoord } from '~/types/soap'


export const geefOnderneming = async (
  inhoud: InhoudGeefOnderneming,
  referte: string,
): Promise<GeefAntwoord> => {
  const method = await createSoapService<InhoudGeefOnderneming>(
    GEEF_ONDERNEMING_WSDL,
    'GeefOnderneming',
    GEEF_ONDERNEMING_NS,
  )
  return method(buildVerzoek('GeefOnderneming', '02.00.0000', referte, inhoud))
}

export const geefOndernemingVKBO = async (
  inhoud: InhoudGeefOndernemingVKBO,
  referte: string,
): Promise<GeefAntwoord> => {
  const method = await createSoapService<InhoudGeefOndernemingVKBO>(
    GEEF_ONDERNEMING_VKBO_WSDL,
    'GeefOndernemingVKBO',
    GEEF_ONDERNEMING_VKBO_NS,
  )
  return method(buildVerzoek('GeefOndernemingVKBO', '02.00.0000', referte, inhoud))
}

// currently unused
export const geefBeschikbareJaarrekeningen = async (
  inhoud: InhoudOndernemingsnummerCriteria,
  referte: string,
): Promise<GeefAntwoord> => {
  const method = await createSoapService<InhoudOndernemingsnummerCriteria>(
    GEEF_BESCHIKBARE_JAARREKENINGEN_WSDL,
    'GeefBeschikbareJaarrekeningen',
    GEEF_BESCHIKBARE_JAARREKENINGEN_NS,
  )
  return method(
    buildVerzoek('GeefBeschikbareJaarrekeningen', '02.00.0000', referte, inhoud),
  )
}

// currently unused
export const geefTewerkstelling = async (
  inhoud: InhoudOndernemingsnummerCriteria,
  referte: string,
): Promise<GeefAntwoord> => {
  const method = await createSoapService<InhoudOndernemingsnummerCriteria>(
    GEEF_TEWERKSTELLING_WSDL,
    'GeefTewerkstelling',
    GEEF_TEWERKSTELLING_NS,
  )
  return method(buildVerzoek('GeefTewerkstelling', '02.00.0000', referte, inhoud))
}
