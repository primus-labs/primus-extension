export const formatAddress = function (str:string) {
  const startS = str.substr(0, 6)
  const endS = str.substr(-4)
  return `${startS}...${endS}`
}
