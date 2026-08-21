export interface InhoudGeefOndernemingVKBO {
  Ondernemingsnummer: string
}

export interface CriteriaVestigingen {
  Aanduiding: string
  Details?: string
}

export interface CriteriaGerelateerdeOndernemingen {
  Aanduiding: string
  Vestigingen?: string
}

export interface CriteriaOmschrijvingen {
  Aanduiding: string
}

export interface CriteriaDatums {
  Aanduiding?: string
}

export interface CriteriaGeefOnderneming {
  Ondernemingsnummer: string
  Basisgegevens: string
  Rechtstoestanden?: string
  Vestigingen?: CriteriaVestigingen
  Activiteiten?: string
  GerelateerdeOndernemingen?: CriteriaGerelateerdeOndernemingen
  ExterneIdentificaties?: string
  AmbtshalveDoorhalingen?: string
  Omschrijvingen?: CriteriaOmschrijvingen
  Datums?: CriteriaDatums
}

export interface InhoudGeefOnderneming {
  Criteria: CriteriaGeefOnderneming
}

export interface CriteriaOndernemingsnummer {
  Ondernemingsnummer: string
}

export interface InhoudOndernemingsnummerCriteria {
  Criteria: CriteriaOndernemingsnummer
}

// --- Onderneming SOAP response types ---

/** A SOAP value that may be a plain string or an object with `_` or `$value` */
export type SoapValue = string | { _?: string; $value?: string } | undefined

/** A SOAP code+description type like `{ Code: { $value: '2', attributes: { Beschrijving: 'Rechtspersoon' } } }` */
export interface SoapCodeType {
  Code?: {
    $value?: string
    attributes?: { Beschrijving?: string }
  }
  Omschrijving?: string
}

export interface GemeenteType {
  PostCode?: SoapValue
  NISCode?: SoapValue
  Naam?: SoapValue
}

export interface LandType {
  NISCode?: SoapValue
  ISOCode?: SoapValue
  Naam?: SoapValue
}

export interface PeriodeType {
  Begin?: SoapValue
  Einde?: SoapValue
}

export interface OndernemingType {
  Ondernemingsnummer?: SoapValue
  AuthentiekBron?: any
  OndernemingOfVestiging?: any
  StatusKBO?: SoapCodeType
  SoortOnderneming?: SoapCodeType
  MaatschappelijkeZetel?: MaatschappelijkeZetelType
  Namen?: NamenOndernemingType
  Adressen?: AdresOndernemingLijstType
  Start?: { Datum?: SoapValue }
  Inschrijving?: { Datum?: SoapValue }
  Afsluiting?: { Datum?: SoapValue }
  Stopzetting?: any
  Rechtsvormen?: RechtsvormLijstType
  Rechtstoestanden?: RechtstoestandLijstType
  Vestigingen?: VestigingLijstType
  Bankrekeningen?: any
  Functies?: any
  Activiteiten?: ActiviteitLijstType
  GerelateerdeOndernemingen?: any
  Hoedanigheden?: any
  ExterneIdentificaties?: any
  Bijhuis?: any
  AmbtshalveDoorhalingen?: AmbtshalveDoorhalingenLijstType
}

export interface VestigingLijstType {
  Vestiging?: VestigingType[] | VestigingType
}

export interface VestigingType {
  Vestigingsnummer?: SoapValue
  StatusKBO?: SoapCodeType
  MaatschappelijkeZetel?: MaatschappelijkeZetelType
  Namen?: NamenOndernemingType
  Adressen?: AdresOndernemingLijstType
  Afsluiting?: { Datum?: SoapValue }
  Stopzetting?: any
  attributes?: {
    DatumBegin?: SoapValue
    DatumEinde?: SoapValue
  }
}

export interface NamenOndernemingType {
  MaatschappelijkeNamen?: { MaatschappelijkeNaam?: NaamOndernemingType[] | NaamOndernemingType }
  AfgekorteNamen?: { AfgekorteNaam?: NaamOndernemingType[] | NaamOndernemingType }
  CommercieleNamen?: { CommercieleNaam?: NaamOndernemingType[] | NaamOndernemingType }
}

export interface NaamOndernemingType {
  Naam?: SoapValue
  Taalcode?: SoapValue
}

export interface MaatschappelijkeZetelType {
  Relatie?: any
  Ondernemingsnummer?: SoapValue
  Stopzetting?: any
}

export interface AdresOndernemingLijstType {
  Adres?: AdresOndernemingType[] | AdresOndernemingType
}

export interface ContactType {
  Telefoonnummer?: SoapValue
  Faxnummer?: SoapValue
  GSM?: SoapValue
  Email?: SoapValue
  Website?: SoapValue
}

// --- VKBO response type (GeefOndernemingVKBO) ---
export interface OndernemingVKBOType {
  Ondernemingsnummer?: SoapValue
  Contact?: ContactType
}

export interface DescriptieLijstType {
  Descriptie?: DescriptieType[] | DescriptieType
}

export interface DescriptieType {
  Adres?: AdresOndernemingBasisType
  Contact?: ContactType
  Taalcode?: SoapValue
  Aanvulling?: SoapValue
}

export interface AdresOndernemingBasisType {
  Straat?: StraatRR2_0Type
  Huisnummer?: SoapValue
  Busnummer?: SoapValue
  Gemeente?: GemeenteType
  Land?: LandType
}

export interface AdresOndernemingType {
  Straat?: StraatRR2_0Type
  Huisnummer?: SoapValue
  Busnummer?: SoapValue
  Gemeente?: GemeenteType
  Land?: LandType
  Type?: SoapCodeType
  Descripties?: DescriptieLijstType
  Doorhalingen?: AdresDoorhalingKBOLijstType
}

export interface StraatRR2_0Type {
  Code?: SoapCodeType
  Naam?: SoapValue
}

export interface AdresDoorhalingKBOLijstType {
  Doorhaling?: AdresDoorhalingKBOFullType[] | AdresDoorhalingKBOFullType
}

export interface AdresDoorhalingKBOFullType {
  Reden?: SoapCodeType
  Periode?: PeriodeType
}

export interface RechtsvormLijstType {
  Rechtsvorm?: RechtsvormExtentieType[] | RechtsvormExtentieType
}

export interface RechtsvormExtentieType {
  Code?: SoapCodeType
  Omschrijving?: string
}

export interface RechtstoestandLijstType {
  Rechtstoestand?: RechtstoestandExtentieType[] | RechtstoestandExtentieType
}

export interface RechtstoestandExtentieType {
  Code?: SoapCodeType
  Omschrijving?: string
}

export interface ActiviteitLijstType {
  Activiteit?: ActiviteitType[] | ActiviteitType
}

export interface ActiviteitType {
  Nace?: NaceExtentieType
  Type?: SoapCodeType
  Groep?: any
}

export interface NaceExtentieType {
  Code?: SoapCodeType
  Omschrijving?: string
  Versie?: SoapValue
}

export interface AmbtshalveDoorhalingenLijstType {
  AmbtshalveDoorhaling?: AmbtshalveDoorhalingKBOType[] | AmbtshalveDoorhalingKBOType
}

export interface AmbtshalveDoorhalingKBOType {
  Reden?: SoapCodeType
  Periode?: PeriodeType
}
