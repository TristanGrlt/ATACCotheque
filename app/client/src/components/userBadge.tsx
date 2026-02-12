import { Badge } from "@/components/ui/badge"

type UserBadgeProps = {
  text: string
  color: string
}

export function UserBadge({ text, color }: UserBadgeProps) {
  return (
    <Badge variant="outline"
      style={{
        borderColor: color,
        backgroundColor: `${color}25`,
      }}
    >
      {text}
    </Badge>
  )
}
