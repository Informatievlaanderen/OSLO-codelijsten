import path from "path"
import type { SoapEnvironmentConfig } from "~/types/soap"

const ENVIRONMENT = process.env.NUXT_ENVIRONMENT || 'Production'
const CERT_DIR = process.env.CERT_DIR || process.cwd()
// MAGDA identificatie (Afzender.Identificatie) per environment, overridable via env.
const MAGDA_IDENTIFICATIE = process.env.MAGDA_IDENTIFICATIE

const SOAP_ENVIRONMENTS: Record<string, SoapEnvironmentConfig> = {
  Development: {
    certificates: {
      privateKeyPath: path.join(CERT_DIR, 'MAGDA-VKBO-subjectpages-aip.pem'),
      publicCertificatePath: path.join(CERT_DIR, 'OVO002949-subjectpagesvkbo-aip.crt'),
      caPath: path.join(CERT_DIR, 'VOICA42026.crt'),
    },
    identificatie: MAGDA_IDENTIFICATIE ?? "",
    endpointHost: 'https://magdaondernemingdienst-aip.vlaanderen.be',
  },
  Production: {
    certificates: {
      privateKeyPath: path.join(CERT_DIR, 'MAGDA-VKBO-subjectpages.pem'),
      publicCertificatePath: path.join(CERT_DIR, 'OVO002949-subjectpagesvkbo.crt'),
      caPath: path.join(CERT_DIR, 'VOICA42026.crt'),
    },
    identificatie: MAGDA_IDENTIFICATIE ?? "",
    endpointHost: 'https://magdaondernemingdienst.vlaanderen.be',
  },
}

export const activeEnvironment =
  SOAP_ENVIRONMENTS[ENVIRONMENT] ?? SOAP_ENVIRONMENTS.Production
