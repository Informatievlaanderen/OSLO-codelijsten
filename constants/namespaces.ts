import { DataFactory } from 'rdf-data-factory'

const factory = new DataFactory()

enum Prefixes {
  reorg = 'http://www.w3.org/ns/regorg#',
  org = 'http://www.w3.org/ns/org#',
  organisatie = 'https://data.vlaanderen.be/ns/organisatie#',
  locn = 'http://www.w3.org/ns/locn#',
  adres = 'https://data.vlaanderen.be/ns/adres#',
}

export type Namespace2 = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [T in keyof typeof Prefixes]: Function
}

const vocab = (): Namespace2 => {
  const namespaces: any = {}
  for (const prefix in Prefixes) {
    const expansion = <string>(<any>Prefixes)[prefix]
    namespaces[prefix] = (localName = '') =>
      factory.namedNode(expansion + localName)
  }

  return <Namespace2>namespaces
}

export const ns2 = vocab()
