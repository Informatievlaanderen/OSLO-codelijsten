import type { Workplace } from '~/types/workplace'

export interface Contributor {
  firstName: string,
  lastName: string,
  email: string,
  workplace: Workplace
}
