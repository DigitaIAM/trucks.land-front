export function timeAgo(value: Date | string) {
  // console.log('date', date)
  // console.log('date type', typeof date)
  let date: Date
  if (typeof value === 'string') {
    date = new Date(value)
  } else {
    date = value
  }
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 5) return 'now'
  if (diffInSeconds < 90) return 'about a minute ago'
  if (diffInSeconds < 3600) return Math.floor(diffInSeconds / 60) + ' minutes ago'
  if (diffInSeconds < 86400) return 'Today at ' + date.getHours() + ':' + date.getMinutes()
  if (diffInSeconds < 172800) return 'Yesterday at ' + date.getHours() + ':' + date.getMinutes()
  if (date.getFullYear() === now.getFullYear())
    return (
      date.toLocaleString('default', { month: 'long' }) +
      ' at ' +
      date.getHours() +
      ':' +
      date.getMinutes()
    )

  return date.toLocaleString('default', { month: 'long' }) + ' ' + date.getFullYear()
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
