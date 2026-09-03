export interface SoapEnvironmentConfig {
  certificates: {
    privateKeyPath: string
    publicCertificatePath: string
    caPath: string
  }
  identificatie: string
  endpointHost: string
}

export type Vlag = '0' | '1'

export interface Tijdstip {
  Datum: string
  Tijd: string
}

export interface Afzender {
  Identificatie: string
  Referte: string
}

export interface Bericht {
  Type: 'VRAAG'
  Tijdstip: Tijdstip
  Afzender: Afzender
}

export interface Context {
  Naam: string
  Versie: string
  Bericht: Bericht
}

export interface Vraag<Inhoud> {
  Referte: string
  Inhoud: Inhoud
}

export interface Verzoek<Inhoud> {
  Verzoek: {
    Context: Context
    Vragen: {
      Vraag: Vraag<Inhoud>
    }
  }
}

export type UitzonderingType = 'FOUT' | 'WAARSCHUWING' | 'INFORMATIE'

export interface Uitzondering {
  Identificatie: string
  Type: UitzonderingType
  Diagnose: string
}

export interface Uitzonderingen {
  Uitzondering: Uitzondering | Uitzondering[]
}

export interface Repliek {
  Context: Context
  Antwoorden?: {
    Antwoord: {
      Referte: string
      Inhoud?: unknown
      Uitzonderingen?: Uitzonderingen
    }
  }
  Uitzonderingen?: Uitzonderingen
}

export interface GeefAntwoord {
  Repliek: Repliek
}
