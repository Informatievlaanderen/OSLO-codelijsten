export interface Bedrijventerrein {
  id: string
  uri: string
  name: string
  alternativeName?: string
  beschikbareKavels?: boolean
  beschikbareOppervlakte?: string
  oppervlakte?: string
  geometrie?: string
  identificator?: string
  type?: string
  geldigheidsperiode?: string
  percelen?: BedrijventerreinperceelRef[]
  source: string
}

export interface BedrijventerreinperceelRef {
  id: string
  uri: string
  label?: string
}

export interface Bedrijventerreinperceel {
  id: string
  uri: string
  homepageAanbieding?: string
  bebouwing?: string
  beschikbaarheid?: string
  beschikbaarheidLabel?: string
  inGebruik?: string
  inGebruikLabel?: string
  aanbieder?: string
  beperking?: string[]
  functie?: string
  geometrie?: string
  identificator?: string
  oppervlakte?: string
  type?: string
  geldigheidsperiode?: string
  isDeelVan?: string
  isDeelVanLabel?: string
  beheerdeBedrijvenzones?: BeheerdeBedrijvenzoneRef[]
  ontwikkelbareBedrijvenzones?: BeheerdeBedrijvenzoneRef[]
  source: string
}

export interface BeheerdeBedrijvenzoneRef {
  id: string
  uri: string
  label?: string
}

export interface BeheerdeBedrijvenzone {
  id: string
  uri: string
  name: string
  subsidie?: string
  aanspreekpunt?: string
  digitaleBeheerder?: string
  juridischeHandhaver?: string
  bedrijventerrein?: string
  bedrijventerreinLabel?: string
  geometrie?: string
  identificator?: string
  oppervlakte?: string
  type?: string
  geldigheidsperiode?: string
  percelen?: BedrijventerreinperceelRef[]
  source: string
}

export interface BedrijventerreinList {
  items: BedrijventerreinListItem[]
  totalCount: number
}

export interface BedrijventerreinListItem {
  id: string
  uri: string
  name?: string
}

export interface BedrijventerreinperceelList {
  items: BedrijventerreinperceelListItem[]
  totalCount: number
}

export interface BedrijventerreinperceelListItem {
  id: string
  uri: string
}

export interface BeheerdeBedrijvenzoneList {
  items: BeheerdeBedrijvenzoneListItem[]
  totalCount: number
}

export interface BeheerdeBedrijvenzoneListItem {
  id: string
  uri: string
  name?: string
}

export interface OntwikkelbareBedrijvenzone {
  id: string
  uri: string
  name: string
  homepage?: string
  voorzieneUitgifte?: string
  ontwikkelaar?: string
  ontwikkelaarLabel?: string
  statusOntwikkeling?: string
  statusOntwikkelingLabel?: string
  bedrijventerrein?: string
  bedrijventerreinLabel?: string
  geometrie?: string
  identificator?: string
  oppervlakte?: string
  type?: string
  geldigheidsperiode?: string
  percelen?: BedrijventerreinperceelRef[]
  source: string
}

export interface OntwikkelbareBedrijvenzoneList {
  items: OntwikkelbareBedrijvenzoneListItem[]
  totalCount: number
}

export interface OntwikkelbareBedrijvenzoneListItem {
  id: string
  uri: string
  name?: string
}

export interface GenidResource {
  uri: string
  type: string
  typeLabel: string
  triples: GenidTriple[]
  reverseReferences: GenidReverseReference[]
  source: string
}

export interface GenidTriple {
  predicate: string
  predicateLabel: string
  value: string
  valueType: 'uri' | 'literal'
}

export interface GenidReverseReference {
  predicate: string
  predicateLabel: string
  subjectUri: string
  subjectId: string
  subjectLabel: string
  subjectType: string
}
