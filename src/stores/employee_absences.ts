import { acceptHMRUpdate, defineStore } from 'pinia'

export interface EmployeeAbsences extends EmployeeAbsenceCreate {
  id: number
  created_at: string
  created_by: number
}

export interface EmployeeAbsenceCreate {
  employee: number
  start_date: string
  end_date: string
  absence_type: string
  note: string
}

export interface EmployeeAbsenceUpdate {
  employee?: number
  start_date?: string
  end_date?: string
  absence_type?: string
  note?: string
}

export const useEmployeeAbsencesStore = defineStore('employee_absences', () => {
  async function createAbsence(payload: EmployeeAbsenceCreate) {
    const { data, error } = await supabase.from('employee_absences').insert([payload]).select()

    if (error) throw error
    console.log('error', error)
    return data[0] as EmployeeAbsences
  }

  async function updateAbsence(id: number, payload: EmployeeAbsenceUpdate) {
    const response = await supabase.from('employee_absences').update(payload).eq('id', id).select()

    if (response.status != 200) {
      console.log('error', response)
      throw 'unexpended response status: ' + response.status
    }
  }

  async function resolve(id: number | null) {
    if (id) {
      const response = await supabase.from('employee_absences').select().eq('id', id).maybeSingle()

      if (response.status == 200) {
        return response.data as EmployeeAbsences
      } else {
        console.log('error', response)
        throw 'unexpended response status: ' + response.status
      }
    } else {
      return null
    }
  }

  return { resolve, createAbsence, updateAbsence }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEmployeeAbsencesStore, import.meta.hot))
}
