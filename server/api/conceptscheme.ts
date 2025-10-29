import datasetConfig from '~/dataset.json'
import type { DatasetConfig } from '~/types/conceptScheme'

export default defineEventHandler((): DatasetConfig => {
  return datasetConfig as DatasetConfig
})
