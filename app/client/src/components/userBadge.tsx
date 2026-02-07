import { Badge } from "@/components/ui/badge"

type UserBadgeProps = {
  text: string
  color: string
}

const getLuminance = (hexColor: string): number => {
  const hex = hexColor.replace("#", "")
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000
}

const getTextColor = (bgColor: string): string => {
  const luminance = getLuminance(bgColor)
  return luminance > 155 ? "#000000" : "#ffffff"
}

export function UserBadge({ text, color }: UserBadgeProps) {
  return (
    <Badge
      style={{
        backgroundColor: color,
        color: getTextColor(color),
      }}
    >
      {text}
    </Badge>
  )
}
