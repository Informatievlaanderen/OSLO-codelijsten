import { QueryEngine } from '@comunica/query-sparql'
import {
  BEDRIJVENTERREIN_LIST_QUERY,
  BEDRIJVENTERREINPERCEEL_LIST_QUERY,
  BEHEERDEBEDRIJVENZONE_LIST_QUERY,
  ONTWIKKELBAREBEDRIJVENZONE_LIST_QUERY,
  CONCEPT_LABEL_QUERY,
  BEDRIJVENTERREIN_URI_BASE,
  BEDRIJVENTERREINPERCEEL_URI_BASE,
  BEHEERDEBEDRIJVENZONE_URI_BASE,
  ONTWIKKELBAREBEDRIJVENZONE_URI_BASE,
  GENID_URI_BASE,
} from '~/constants/bedrijventerrein.constants'
import type {
  Bedrijventerrein,
  Bedrijventerreinperceel,
  BeheerdeBedrijvenzone,
  OntwikkelbareBedrijvenzone,
  BedrijventerreinListItem,
  BedrijventerreinperceelListItem,
  BeheerdeBedrijvenzoneListItem,
  OntwikkelbareBedrijvenzoneListItem,
  BedrijventerreinperceelRef,
  GenidResource,
  GenidTriple,
  GenidReverseReference,
} from '~/types/bedrijventerrein'

const queryEngine = new QueryEngine()


const executeQuery = async (query: string): Promise<any[]> => {
  const bindings: any[] = []
  const sources = [getSparqlEndpoint()]

  const bindingsStream = await queryEngine.queryBindings(query, {
    sources,
    noCache: true,
  })

  for await (const binding of bindingsStream) {
    bindings.push(binding)
  }

  return bindings
}

/**
 * Query all triples for a given URI: SELECT * WHERE { <uri> ?p ?o }
 * Returns a Map of predicate -> array of values (with type info).
 */
const fetchAllTriples = async (
  uri: string,
): Promise<Map<string, { value: string; type: string }[]>> => {
  const query = `SELECT ?p ?o WHERE { <${uri}> ?p ?o . }`
  const bindings = await executeQuery(query)
  const map = new Map<string, { value: string; type: string }[]>()

  for (const b of bindings) {
    const p = b.get('p')?.value ?? ''
    const o = b.get('o')
    if (!p || !o) continue
    const entry = { value: o.value ?? '', type: o.termType ?? 'literal' }
    if (!map.has(p)) map.set(p, [])
    map.get(p)!.push(entry)
  }

  return map
}

const getConceptLabel = async (uri: string): Promise<string | null> => {
  try {
    // Try skos:prefLabel / rdfs:label first
    const result = await executeQuery(CONCEPT_LABEL_QUERY(uri))
    if (result.length > 0) {
      return result[0].get('label')?.value ?? null
    }
    // Try regorg:legalName for organisations
    const orgQuery = `SELECT ?label WHERE { <${uri}> <http://www.w3.org/ns/regorg#legalName> ?label . } LIMIT 1`
    const orgResult = await executeQuery(orgQuery)
    if (orgResult.length > 0) {
      return orgResult[0].get('label')?.value ?? null
    }
    return null
  } catch {
    return null
  }
}

export const getSparqlEndpoint = (): string => {
  const config = useRuntimeConfig()
  return (config.public.BEDRIJVENTERREIN_SPARQL_ENDPOINT as string) ??
    'https://bedrijventerreinen.vlaanderen.be/sparql/'
}

// ---- Namespace helpers ----
const NS = {
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
  skosPrefLabel: 'http://www.w3.org/2004/02/skos/core#prefLabel',
  skosAltLabel: 'http://www.w3.org/2004/02/skos/core#altLabel',
  admsIdentifier: 'http://www.w3.org/ns/adms#identifier',
  dctIsPartOf: 'http://purl.org/dc/terms/isPartOf',
  dctHasPart: 'http://purl.org/dc/terms/hasPart',
  dctRelation: 'http://purl.org/dc/terms/relation',
  perceelOppervlakte: 'https://data.vlaanderen.be/ns/perceel#oppervlakte',
  perceelGeometrie: 'https://data.vlaanderen.be/ns/perceel#geometrie',
  perceelGeometrieAlt: 'http://data.vlaanderen.be/ns/perceel#geometrie',
  perceelType: 'https://data.vlaanderen.be/ns/perceel#RuimtelijkeEenheid.type',
  perceelTypeAlt: 'http://data.vlaanderen.be/ns/perceel#RuimtelijkeEenheid.type',
  perceelGeldigheid: 'https://data.vlaanderen.be/ns/perceel#geldigheidsperiode',
  perceelGeldigheidAlt: 'http://data.vlaanderen.be/ns/perceel#geldigheidsperiode',
  btBeschikbareKavels: 'https://data.vlaanderen.be/ns/bedrijventerrein#beschikbareKavels',
  btBeschikbareOppervlakte: 'https://data.vlaanderen.be/ns/bedrijventerrein#beschikbareOppervlakte',
  btHomepageAanbieding: 'https://data.vlaanderen.be/ns/bedrijventerrein#homepageAanbieding',
  btBebouwing: 'https://data.vlaanderen.be/ns/bedrijventerrein#bebouwing',
  btBeschikbaarheid: 'https://data.vlaanderen.be/ns/bedrijventerrein#beschikbaarheid',
  btInGebruik: 'https://data.vlaanderen.be/ns/bedrijventerrein#inGebruik',
  btAanbieder: 'https://data.vlaanderen.be/ns/bedrijventerrein#aanbieder',
  btBeperking: 'https://data.vlaanderen.be/ns/bedrijventerrein#beperking',
  btFunctie: 'https://data.vlaanderen.be/ns/bedrijventerrein#functie',
  btAanspreekpunt: 'https://data.vlaanderen.be/ns/bedrijventerrein#aanspreekpunt',
  btJuridischeHandhaver: 'https://data.vlaanderen.be/ns/bedrijventerrein#juridischeHandhaver',
  btDigitaleBeheerder: 'https://data.vlaanderen.be/ns/bedrijventerrein#digitalebeheerder',
  btOntwikkelbareBedrijvenzones: 'https://data.vlaanderen.be/ns/bedrijventerrein#ontwikkelbareBedrijvenzones',
  btOntwikkelaar: 'https://data.vlaanderen.be/ns/bedrijventerrein#ontwikkelaar',
  btStatusOntwikkeling: 'https://data.vlaanderen.be/ns/bedrijventerrein#statusOntwikkeling',
  btVoorzieneUitgifte: 'https://data.vlaanderen.be/ns/bedrijventerrein#voorzieneUitgifte',
  foafHomepage: 'http://xmlns.com/foaf/0.1/homepage',
}

const firstUri = (map: Map<string, { value: string; type: string }[]>, key: string): string | undefined => {
  const vals = map.get(key)
  return vals?.find(v => v.type === 'uri' || v.type === 'NamedNode')?.value
}

const firstLiteral = (map: Map<string, { value: string; type: string }[]>, key: string): string | undefined => {
  const vals = map.get(key)
  return vals?.find(v => v.type === 'literal' || v.type === 'Literal')?.value
}

const allUris = (map: Map<string, { value: string; type: string }[]>, key: string): string[] => {
  const vals = map.get(key)
  if (!vals) return []
  return vals.filter(v => v.type === 'uri' || v.type === 'NamedNode').map(v => v.value)
}

/**
 * Convert absolute bedrijventerrein URIs to relative doc paths.
 * e.g. https://bedrijventerrein.vlaanderen.be/doc/.well-known/genid/geometrie/abc -> /doc/.well-known/genid/geometrie/abc
 */
const toRelativeUri = (uri: string | undefined): string | undefined => {
  if (!uri) return uri
  // Genid doc URIs
  if (uri.startsWith(GENID_URI_BASE)) {
    return `/doc/.well-known/genid/${uri.replace(GENID_URI_BASE, '')}`
  }
  // Literal genid refs: .well-known-genid-identifier-abc... -> /doc/.well-known/genid/identifier/abc...
  if (uri.startsWith('.well-known-genid-')) {
    const parts = uri.replace('.well-known-genid-', '').split('-')
    const type = parts[0]
    const hash = parts.slice(1).join('-')
    return `/doc/.well-known/genid/${type}/${hash}`
  }
  // Entity URIs
  for (const { base, prefix } of [
    { base: BEDRIJVENTERREIN_URI_BASE, prefix: 'bedrijventerrein' },
    { base: BEDRIJVENTERREINPERCEEL_URI_BASE, prefix: 'bedrijventerreinperceel' },
    { base: BEHEERDEBEDRIJVENZONE_URI_BASE, prefix: 'beheerdebedrijvenzone' },
    { base: ONTWIKKELBAREBEDRIJVENZONE_URI_BASE, prefix: 'ontwikkelbarebedrijvenzone' },
  ]) {
    if (uri.startsWith(base)) {
      return `/doc/${prefix}/${uri.replace(base, '')}`
    }
  }
  return uri
}

export const getBedrijventerrein = async (
  id: string,
): Promise<Bedrijventerrein | null> => {
  try {
    const uri = `${BEDRIJVENTERREIN_URI_BASE}${id}`
    const triples = await fetchAllTriples(uri)

    if (triples.size === 0) return null

    const name = firstLiteral(triples, NS.skosPrefLabel) ?? id
    const beschikbareKavelsRaw = firstLiteral(triples, NS.btBeschikbareKavels)

    // Get percelen via reverse lookup: ?perceel dct:isPartOf <thisBedrijventerrein>
    const partsQuery = `
      PREFIX dct: <http://purl.org/dc/terms/>
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

      SELECT ?perceel ?label WHERE {
        ?perceel dct:isPartOf <${uri}> .
        OPTIONAL { ?perceel skos:prefLabel ?label . }
      }
    `
    const partsBindings = await executeQuery(partsQuery)
    const percelenMap = new Map<string, BedrijventerreinperceelRef>()
    for (const pb of partsBindings) {
      const pUri = (pb as any).get('perceel')?.value ?? ''
      let refId: string
      if (pUri.startsWith(BEDRIJVENTERREINPERCEEL_URI_BASE)) {
        refId = `bedrijventerreinperceel/${pUri.replace(BEDRIJVENTERREINPERCEEL_URI_BASE, '')}`
      } else if (pUri.startsWith(BEHEERDEBEDRIJVENZONE_URI_BASE)) {
        refId = `beheerdebedrijvenzone/${pUri.replace(BEHEERDEBEDRIJVENZONE_URI_BASE, '')}`
      } else {
        continue
      }
      if (percelenMap.has(refId)) continue
      percelenMap.set(refId, {
        id: refId,
        uri: pUri,
        label: (pb as any).get('label')?.value ?? refId,
      })
    }
    const percelen: BedrijventerreinperceelRef[] = Array.from(percelenMap.values())

    return {
      id,
      uri,
      name,
      alternativeName: firstLiteral(triples, NS.skosAltLabel),
      beschikbareKavels:
        beschikbareKavelsRaw === '1' || beschikbareKavelsRaw === 'true',
      beschikbareOppervlakte: toRelativeUri(firstUri(triples, NS.btBeschikbareOppervlakte)),
      oppervlakte: toRelativeUri(firstUri(triples, NS.perceelOppervlakte)),
      geometrie: toRelativeUri(firstUri(triples, NS.perceelGeometrie) ?? firstUri(triples, NS.perceelGeometrieAlt)),
      identificator: toRelativeUri(firstUri(triples, NS.admsIdentifier)),
      type: toRelativeUri(firstUri(triples, NS.perceelType) ?? firstUri(triples, NS.perceelTypeAlt)),
      geldigheidsperiode: toRelativeUri(firstUri(triples, NS.perceelGeldigheid) ?? firstUri(triples, NS.perceelGeldigheidAlt)),
      percelen,
      source: getSparqlEndpoint(),
    }
  } catch (error) {
    console.error('Error fetching bedrijventerrein:', error)
    return null
  }
}

export const getBedrijventerreinList = async (): Promise<
  BedrijventerreinListItem[]
> => {
  try {
    const bindings = await executeQuery(BEDRIJVENTERREIN_LIST_QUERY)
    const seen = new Set<string>()
    const items: BedrijventerreinListItem[] = []

    for (const b of bindings) {
      const uri = b.get('subject')?.value ?? ''
      const lastSegment = uri.split('/').pop() ?? ''
      if (seen.has(lastSegment)) continue
      seen.add(lastSegment)
      items.push({
        id: lastSegment,
        uri,
        name: b.get('name')?.value,
      })
    }

    return items
  } catch (error) {
    console.error('Error fetching bedrijventerrein list:', error)
    return []
  }
}

export const getBedrijventerreinperceel = async (
  id: string,
): Promise<Bedrijventerreinperceel | null> => {
  try {
    const uri = `${BEDRIJVENTERREINPERCEEL_URI_BASE}${id}`
    const triples = await fetchAllTriples(uri)

    if (triples.size === 0) return null

    const beschikbaarheidUri = firstUri(triples, NS.btBeschikbaarheid)
    const inGebruikUri = firstUri(triples, NS.btInGebruik)
    const isPartOfUri = firstUri(triples, NS.dctIsPartOf)

    const [beschikbaarheidLabel, inGebruikLabel, isPartOfLabel] =
      await Promise.all([
        beschikbaarheidUri ? getConceptLabel(beschikbaarheidUri) : null,
        inGebruikUri ? getConceptLabel(inGebruikUri) : null,
        isPartOfUri ? getConceptLabel(isPartOfUri) : null,
      ])

    const beperkingUris = allUris(triples, NS.btBeperking)
    const zoneUris = allUris(triples, NS.dctRelation)

    const zoneLabels = await Promise.all(
      zoneUris.map((zUri: string) => getConceptLabel(zUri)),
    )

    const beheerdeBedrijvenzonesMap = new Map<string, { id: string; uri: string; label?: string }>()
    zoneUris.forEach((zUri: string, i: number) => {
      let id: string
      if (zUri.startsWith(BEHEERDEBEDRIJVENZONE_URI_BASE)) {
        id = `beheerdebedrijvenzone/${zUri.replace(BEHEERDEBEDRIJVENZONE_URI_BASE, '')}`
      } else if (zUri.startsWith(ONTWIKKELBAREBEDRIJVENZONE_URI_BASE)) {
        id = `ontwikkelbarebedrijvenzone/${zUri.replace(ONTWIKKELBAREBEDRIJVENZONE_URI_BASE, '')}`
      } else {
        id = zUri
      }
      if (!beheerdeBedrijvenzonesMap.has(id)) {
        beheerdeBedrijvenzonesMap.set(id, {
          id,
          uri: zUri,
          label: zoneLabels[i] ?? undefined,
        })
      }
    })
    const beheerdeBedrijvenzones = Array.from(beheerdeBedrijvenzonesMap.values())

    const ontwikkelbareUris = allUris(triples, NS.btOntwikkelbareBedrijvenzones)
    const ontwikkelbareLabels = await Promise.all(
      ontwikkelbareUris.map((uri: string) => getConceptLabel(uri)),
    )
    const ontwikkelbareBedrijvenzonesMap = new Map<string, { id: string; uri: string; label?: string }>()
    ontwikkelbareUris.forEach((uri: string, i: number) => {
      let id: string
      if (uri.startsWith(ONTWIKKELBAREBEDRIJVENZONE_URI_BASE)) {
        id = `ontwikkelbarebedrijvenzone/${uri.replace(ONTWIKKELBAREBEDRIJVENZONE_URI_BASE, '')}`
      } else if (uri.startsWith(BEHEERDEBEDRIJVENZONE_URI_BASE)) {
        id = `beheerdebedrijvenzone/${uri.replace(BEHEERDEBEDRIJVENZONE_URI_BASE, '')}`
      } else {
        id = uri
      }
      if (!ontwikkelbareBedrijvenzonesMap.has(id)) {
        ontwikkelbareBedrijvenzonesMap.set(id, {
          id,
          uri,
          label: ontwikkelbareLabels[i] ?? undefined,
        })
      }
    })
    const ontwikkelbareBedrijvenzones = Array.from(ontwikkelbareBedrijvenzonesMap.values())

    return {
      id,
      uri,
      homepageAanbieding: firstLiteral(triples, NS.btHomepageAanbieding),
      bebouwing: firstLiteral(triples, NS.btBebouwing),
      beschikbaarheid: beschikbaarheidUri,
      beschikbaarheidLabel: beschikbaarheidLabel ?? undefined,
      inGebruik: inGebruikUri,
      inGebruikLabel: inGebruikLabel ?? undefined,
      aanbieder: firstLiteral(triples, NS.btAanbieder),
      beperking: beperkingUris,
      functie: firstLiteral(triples, NS.btFunctie),
      geometrie: toRelativeUri(firstUri(triples, NS.perceelGeometrie) ?? firstUri(triples, NS.perceelGeometrieAlt)),
      identificator: toRelativeUri(firstUri(triples, NS.admsIdentifier)),
      oppervlakte: toRelativeUri(firstUri(triples, NS.perceelOppervlakte)),
      type: toRelativeUri(firstUri(triples, NS.perceelType) ?? firstUri(triples, NS.perceelTypeAlt)),
      geldigheidsperiode: toRelativeUri(firstUri(triples, NS.perceelGeldigheid) ?? firstUri(triples, NS.perceelGeldigheidAlt)),
      isDeelVan: toRelativeUri(isPartOfUri),
      isDeelVanLabel: isPartOfLabel ?? undefined,
      beheerdeBedrijvenzones,
      ontwikkelbareBedrijvenzones,
      source: getSparqlEndpoint(),
    }
  } catch (error) {
    console.error('Error fetching bedrijventerreinperceel:', error)
    return null
  }
}

export const getBedrijventerreinperceelList = async (): Promise<
  BedrijventerreinperceelListItem[]
> => {
  try {
    const bindings = await executeQuery(BEDRIJVENTERREINPERCEEL_LIST_QUERY)
    const seen = new Set<string>()
    const items: BedrijventerreinperceelListItem[] = []

    for (const b of bindings) {
      const uri = b.get('subject')?.value ?? ''
      const id = `bedrijventerreinperceel/${uri.replace(BEDRIJVENTERREINPERCEEL_URI_BASE, '')}`
      if (seen.has(id)) continue
      seen.add(id)
      items.push({ id, uri })
    }

    return items
  } catch (error) {
    console.error('Error fetching bedrijventerreinperceel list:', error)
    return []
  }
}

export const getBeheerdeBedrijvenzone = async (
  id: string,
): Promise<BeheerdeBedrijvenzone | null> => {
  try {
    const uri = `${BEHEERDEBEDRIJVENZONE_URI_BASE}${id}`
    const triples = await fetchAllTriples(uri)

    if (triples.size === 0) return null

    const isPartOfUri = firstUri(triples, NS.dctIsPartOf)
    const isPartOfLabel = isPartOfUri ? await getConceptLabel(isPartOfUri) : null

    // Get percelen via dct:relation
    const perceelUris = allUris(triples, NS.dctRelation)
    const percelenMap = new Map<string, BedrijventerreinperceelRef>()
    for (const pUri of perceelUris) {
      const perceelId = `bedrijventerreinperceel/${pUri.replace(BEDRIJVENTERREINPERCEEL_URI_BASE, '')}`
      if (!perceelId || percelenMap.has(perceelId)) continue
      const label = await getConceptLabel(pUri)
      percelenMap.set(perceelId, { id: perceelId, uri: pUri, label: label ?? perceelId })
    }
    const percelen: BedrijventerreinperceelRef[] = Array.from(percelenMap.values())

    return {
      id,
      uri,
      name: firstLiteral(triples, NS.skosPrefLabel) ?? id,
      aanspreekpunt: toRelativeUri(firstUri(triples, NS.btAanspreekpunt)),
      juridischeHandhaver: toRelativeUri(firstUri(triples, NS.btJuridischeHandhaver)),
      digitaleBeheerder: toRelativeUri(firstUri(triples, NS.btDigitaleBeheerder)),
      bedrijventerrein: toRelativeUri(isPartOfUri),
      bedrijventerreinLabel: isPartOfLabel ?? undefined,
      geometrie: toRelativeUri(firstUri(triples, NS.perceelGeometrie) ?? firstUri(triples, NS.perceelGeometrieAlt)),
      identificator: toRelativeUri(firstUri(triples, NS.admsIdentifier)),
      oppervlakte: toRelativeUri(firstUri(triples, NS.perceelOppervlakte)),
      type: toRelativeUri(firstUri(triples, NS.perceelType) ?? firstUri(triples, NS.perceelTypeAlt)),
      geldigheidsperiode: toRelativeUri(firstUri(triples, NS.perceelGeldigheid) ?? firstUri(triples, NS.perceelGeldigheidAlt)),
      percelen,
      source: getSparqlEndpoint(),
    }
  } catch (error) {
    console.error('Error fetching beheerdebedrijvenzone:', error)
    return null
  }
}

export const getBeheerdeBedrijvenzoneList = async (): Promise<
  BeheerdeBedrijvenzoneListItem[]
> => {
  try {
    const bindings = await executeQuery(BEHEERDEBEDRIJVENZONE_LIST_QUERY)
    const seen = new Set<string>()
    const items: BeheerdeBedrijvenzoneListItem[] = []

    for (const b of bindings) {
      const uri = b.get('subject')?.value ?? ''
      const id = `beheerdebedrijvenzone/${uri.replace(BEHEERDEBEDRIJVENZONE_URI_BASE, '')}`
      if (seen.has(id)) continue
      seen.add(id)
      items.push({
        id,
        uri,
        name: b.get('name')?.value,
      })
    }

    return items
  } catch (error) {
    console.error('Error fetching beheerdebedrijvenzone list:', error)
    return []
  }
}

export const getGenidResource = async (
  type: string,
  hash: string,
): Promise<GenidResource | null> => {
  try {
    const uri = `${GENID_URI_BASE}${type}/${hash}`
    const triples = await fetchAllTriples(uri)

    if (triples.size === 0) return null

    const rdfType = firstUri(triples, NS.rdf) ?? ''
    const typeLabel = rdfType ? (await getConceptLabel(rdfType)) ?? rdfType : rdfType

    // Forward triples (skip rdf:type and blank nodes)
    const result: GenidTriple[] = []
    const seen = new Set<string>()
    for (const [predicate, values] of triples) {
      if (predicate === NS.rdf) continue
      const predicateLabel = await getConceptLabel(predicate)
      for (const v of values) {
        const key = `${predicate}|${v.value}`
        if (seen.has(key)) continue
        seen.add(key)
        // Skip blank nodes
        if (v.value.startsWith('nodeID://') || v.value.startsWith('bc_0_nodeID://')) continue
        const isUri = v.type === 'uri' || v.type === 'NamedNode'
        // Also resolve literal values that look like bedrijventerrein URIs or genid refs
        let value = v.value
        if (value.startsWith('https://bedrijventerrein.vlaanderen.be/') || value.startsWith('.well-known-genid-')) {
          value = toRelativeUri(value) ?? value
        }
        result.push({
          predicate,
          predicateLabel: predicateLabel ?? predicate,
          value,
          valueType: isUri ? 'uri' : 'literal',
        })
      }
    }

    // Reverse lookup: find all entities that reference this genid URI
    const reverseQuery = `
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

      SELECT ?subject ?pred ?subjectType WHERE {
        ?subject ?pred <${uri}> .
        OPTIONAL { ?subject a ?subjectType . }
      }
    `
    const reverseBindings = await executeQuery(reverseQuery)
    const reverseRefs: GenidReverseReference[] = []
    const seenRefs = new Set<string>()

    for (const b of reverseBindings) {
      const subjectUri = b.get('subject')?.value ?? ''
      const pred = b.get('pred')?.value ?? ''
      const subjectType = b.get('subjectType')?.value ?? ''

      const key = `${subjectUri}|${pred}`
      if (seenRefs.has(key)) continue
      seenRefs.add(key)

      const [predLabel, subjectLabel] = await Promise.all([
        getConceptLabel(pred),
        getConceptLabel(subjectUri),
      ])

      // Use toRelativeUri for both the subjectId and subjectUri
      const relativeUri = toRelativeUri(subjectUri) ?? subjectUri
      const subjectId = relativeUri.startsWith('/doc/') ? relativeUri.replace('/doc/', '') : ''

      reverseRefs.push({
        predicate: pred,
        predicateLabel: predLabel ?? pred,
        subjectUri: relativeUri,
        subjectId,
        subjectLabel: subjectLabel ?? subjectUri,
        subjectType,
      })
    }

    return {
      uri,
      type: rdfType,
      typeLabel,
      triples: result,
      reverseReferences: reverseRefs,
      source: getSparqlEndpoint(),
    }
  } catch (error) {
    console.error('Error fetching genid resource:', error)
    return null
  }
}

export const getOntwikkelbareBedrijvenzone = async (
  id: string,
): Promise<OntwikkelbareBedrijvenzone | null> => {
  try {
    const uri = `${ONTWIKKELBAREBEDRIJVENZONE_URI_BASE}${id}`
    const triples = await fetchAllTriples(uri)

    if (triples.size === 0) return null

    const isPartOfUri = firstUri(triples, NS.dctIsPartOf)
    const isPartOfLabel = isPartOfUri ? await getConceptLabel(isPartOfUri) : null
    const ontwikkelaarUri = firstUri(triples, NS.btOntwikkelaar)
    const ontwikkelaarLabel = ontwikkelaarUri ? await getConceptLabel(ontwikkelaarUri) : null
    const statusUri = firstUri(triples, NS.btStatusOntwikkeling)
    const statusLabel = statusUri ? await getConceptLabel(statusUri) : null

    // Get percelen via reverse lookup: ?perceel dct:relation <thisZone>
    const partsQuery = `
      PREFIX dct: <http://purl.org/dc/terms/>
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

      SELECT ?perceel ?label WHERE {
        ?perceel dct:relation <${uri}> .
        OPTIONAL { ?perceel skos:prefLabel ?label . }
      }
    `
    const partsBindings = await executeQuery(partsQuery)
    const percelenMap = new Map<string, BedrijventerreinperceelRef>()
    for (const pb of partsBindings) {
      const pUri = (pb as any).get('perceel')?.value ?? ''
      const perceelId = `bedrijventerreinperceel/${pUri.replace(BEDRIJVENTERREINPERCEEL_URI_BASE, '')}`
      if (!perceelId || perceelId === pUri || percelenMap.has(perceelId)) continue
      percelenMap.set(perceelId, {
        id: perceelId,
        uri: pUri,
        label: (pb as any).get('label')?.value ?? perceelId,
      })
    }
    const percelen: BedrijventerreinperceelRef[] = Array.from(percelenMap.values())

    return {
      id,
      uri,
      name: firstLiteral(triples, NS.skosPrefLabel) ?? id,
      homepage: firstLiteral(triples, NS.foafHomepage),
      voorzieneUitgifte: firstLiteral(triples, NS.btVoorzieneUitgifte),
      ontwikkelaar: toRelativeUri(ontwikkelaarUri),
      ontwikkelaarLabel: ontwikkelaarLabel ?? undefined,
      statusOntwikkeling: statusUri,
      statusOntwikkelingLabel: statusLabel ?? undefined,
      bedrijventerrein: toRelativeUri(isPartOfUri),
      bedrijventerreinLabel: isPartOfLabel ?? undefined,
      geometrie: toRelativeUri(firstUri(triples, NS.perceelGeometrie) ?? firstUri(triples, NS.perceelGeometrieAlt)),
      identificator: toRelativeUri(firstUri(triples, NS.admsIdentifier)),
      oppervlakte: toRelativeUri(firstUri(triples, NS.perceelOppervlakte)),
      type: toRelativeUri(firstUri(triples, NS.perceelType) ?? firstUri(triples, NS.perceelTypeAlt)),
      geldigheidsperiode: toRelativeUri(firstUri(triples, NS.perceelGeldigheid) ?? firstUri(triples, NS.perceelGeldigheidAlt)),
      percelen,
      source: getSparqlEndpoint(),
    }
  } catch (error) {
    console.error('Error fetching ontwikkelbarebedrijvenzone:', error)
    return null
  }
}

export const getOntwikkelbareBedrijvenzoneList = async (): Promise<
  OntwikkelbareBedrijvenzoneListItem[]
> => {
  try {
    const bindings = await executeQuery(ONTWIKKELBAREBEDRIJVENZONE_LIST_QUERY)
    const seen = new Set<string>()
    const items: OntwikkelbareBedrijvenzoneListItem[] = []

    for (const b of bindings) {
      const uri = b.get('subject')?.value ?? ''
      const id = `ontwikkelbarebedrijvenzone/${uri.replace(ONTWIKKELBAREBEDRIJVENZONE_URI_BASE, '')}`
      if (seen.has(id)) continue
      seen.add(id)
      items.push({
        id,
        uri,
        name: b.get('name')?.value,
      })
    }

    return items
  } catch (error) {
    console.error('Error fetching ontwikkelbarebedrijvenzone list:', error)
    return []
  }
}
