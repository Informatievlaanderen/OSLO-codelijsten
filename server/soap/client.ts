import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import axios from 'axios'
import type { AxiosInstance } from 'axios'
import * as soap from 'soap'
import type { GeefAntwoord, Verzoek } from '../../types/soap'
import { activeEnvironment } from '~/constants/soap.constants'

// Mirrors the `public.ENVIRONMENT` runtime variable from nuxt.config.ts.
// "Development" targets the MAGDA test (aip) services, anything else (default
// "Production") targets the production services.

const certificates = activeEnvironment.certificates
const endpointHost = activeEnvironment.endpointHost

const magdaConfig = {
  identificatie: activeEnvironment.identificatie,
  xsdsRoot: path.resolve(process.cwd(), 'XSDs'),
} as const

// MAGDA exposes one endpoint per service. The path always follows the
// `{MethodName}Dienst-02.00/soap/WebService` convention.
const getSoapEndpoint = (methodName: string): string =>
  `${endpointHost}/${methodName}Dienst-02.00/soap/WebService`

const readCertificate = (relativePath: string): Buffer =>
  fs.readFileSync(path.resolve(relativePath))

let httpsAgent: https.Agent | undefined
let wsdlRequest: AxiosInstance | undefined

const getHttpsAgent = (): https.Agent => {
  if (!httpsAgent) {
    httpsAgent = new https.Agent({
      key: readCertificate(certificates.privateKeyPath),
      cert: readCertificate(certificates.publicCertificatePath),
      ca: readCertificate(certificates.caPath),
      rejectUnauthorized: false,
    })
  }
  return httpsAgent
}

const getRequestTransport = (): AxiosInstance => {
  if (!wsdlRequest) {
    wsdlRequest = axios.create({ httpsAgent: getHttpsAgent() })
  }
  return wsdlRequest
}

export type SoapMethod<Inhoud> = (verzoek: Verzoek<Inhoud>) => Promise<GeefAntwoord>

export const buildVerzoek = <Inhoud>(
  naam: string,
  versie: string,
  referte: string,
  inhoud: Inhoud,
): Verzoek<Inhoud> => {
  const now = new Date()
  const iso = now.toISOString()
  const context = {
    Naam: naam,
    Versie: versie,
    Bericht: {
      Type: 'VRAAG' as const,
      Tijdstip: {
        Datum: iso.slice(0, 10),
        Tijd: iso.slice(11, 19),
      },
      Afzender: {
        Identificatie: magdaConfig.identificatie,
        Referte: referte,
      },
    },
  }

  return {
    Verzoek: {
      Context: context,
      Vragen: {
        Vraag: {
          Referte: referte,
          Inhoud: inhoud,
        },
      },
    },
  }
}

export const createSoapService = async <Inhoud>(
  wsdlPath: string,
  methodName: string,
  namespace: string,
): Promise<SoapMethod<Inhoud>> => {
  const client = await soap.createClientAsync(
    path.join(magdaConfig.xsdsRoot, wsdlPath),
    {
      request: getRequestTransport(),
      overrideRootElement: {
        namespace: 'myns',
        xmlnsAttributes: [{ name: 'xmlns:myns', value: namespace }],
      },
    },
  )

  // Point the client at the environment-specific endpoint, overriding the
  // (test) address baked into the local WSDL files.
  client.setEndpoint(getSoapEndpoint(methodName))

  client.setSecurity(
    new soap.WSSecurityCert(
      readCertificate(certificates.privateKeyPath),
      readCertificate(certificates.publicCertificatePath),
      '',
    ),
  )

  const invoke = (client as any)[`${methodName}Async`]
  if (!invoke) {
    throw new Error(`SOAP method "${methodName}" not found in WSDL: ${wsdlPath}`)
  }

  return async (verzoek: Verzoek<Inhoud>): Promise<GeefAntwoord> => {
    const [result] = await invoke(verzoek)
    return result as GeefAntwoord
  }
}
