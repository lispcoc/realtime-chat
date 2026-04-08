
export const intToColorCode = (num: number) => {
  return '#' + num.toString(16).padStart(6, '0')
}

export const colorCodeToInt = (code: string) => {
  const shorthandRegex = /^#?([a-fA-F\d]+)$/i;
  const result = shorthandRegex.exec(code) || []
  if (result.length > 1) {
    return parseInt(result[1], 16)
  }
  return 0
}
