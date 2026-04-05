// useDateMyFormat.js
import { computed, unref } from 'vue'

/**
 * @param {Date | string | number | Ref} date - The date source
 * @param {string} format
 // * @param {string} zone - IANA Timezone (e.g., 'America/New_York')
 * @param {Intl.DateTimeFormatOptions} options - Formatting options
 */
export function useDateMyFormat(
  date: Date | string | number | Ref,
  // zone: string = 'America/New_York',
  options: Intl.DateTimeFormatOptions = {},
) {
  console.log('date', date)
  // console.log('zone', zone)
  return computed(() => {
    // unref allows us to pass in reactive refs or plain values
    const d = unref(date)
    if (!d) return ''

    const dateObj = d instanceof Date ? d : new Date(d)

    const year = dateObj.getUTCFullYear() != new Date().getUTCFullYear() ? 'numeric' : undefined

    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        timeZoneName: 'short',
        year: year,
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        // dateStyle: 'medium',
        // timeStyle: 'short',
        // ...options,
      }).format(dateObj)
    } catch (e) {
      console.error('Invalid timezone or date provided to useDateMyFormat: ' + e)
      return ''
    }
  })
}
