const NOTE_BORDER_COLORS = [
  'border-l-lime-400',
  'border-l-sky-400',
  'border-l-violet-400',
  'border-l-amber-400',
  'border-l-rose-400',
  'border-l-teal-400',
  'border-l-orange-400',
  'border-l-indigo-400',
] as const

export function getNoteBorderColor(noteId: string) {
  const hash = noteId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return NOTE_BORDER_COLORS[hash % NOTE_BORDER_COLORS.length]
}
