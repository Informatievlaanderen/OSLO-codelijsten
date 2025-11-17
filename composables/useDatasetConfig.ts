import type { DatasetConfig, ConceptSchemeConfig } from '~/types/conceptScheme'

export const useDatasetConfig = () => {
  const config = useState<DatasetConfig | null>('conceptschemes', () => null)

  const fetchConfig = async () => {
    if (config.value) {
      return config.value
    }

    try {
      const response = await $fetch<DatasetConfig>(
        import.meta.env.VITE_DATASET_CONFIG_URL!,
      )

      // Parse the response if it's a string since Github raw URLs return strings
      const data =
        typeof response === 'string' ? JSON.parse(response) : response

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
    return data?.conceptSchemes.find(
      (scheme: ConceptSchemeConfig) => scheme.key === key,
    )
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
