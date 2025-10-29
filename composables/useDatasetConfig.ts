import type { DatasetConfig, ConceptSchemeConfig } from '~/types/conceptScheme'

export const useDatasetConfig = () => {
  const config = useState<DatasetConfig | null>('conceptschemes', () => null)

  const fetchConfig = async () => {
    if (config.value) {
      return config.value
    }

    try {
      const data = await $fetch<DatasetConfig>('/api/conceptscheme')
      config.value = data
      return data
    } catch (error) {
      console.error('Error fetching dataset config:', error)
      return null
    }
  }

  const getConceptSchemeByKey = async (
    key: string,
  ): Promise<ConceptSchemeConfig | undefined> => {
    const data = await fetchConfig()
    return data?.conceptSchemes.find((scheme) => scheme.key === key)
  }

  const getAllConceptSchemes = async (): Promise<ConceptSchemeConfig[]> => {
    const data = await fetchConfig()
    return data?.conceptSchemes ?? []
  }

  return {
    fetchConfig,
    getConceptSchemeByKey,
    getAllConceptSchemes,
  }
}
