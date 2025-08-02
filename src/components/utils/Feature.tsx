// src/components/utils/Feature.tsx
import { FEATURES } from "@/config/features.prod"

type FeatureProps = {
  name: keyof typeof FEATURES
  children: React.ReactNode
}

export const Feature = ({ name, children }: FeatureProps) => {
  return FEATURES[name] ? <>{children}</> : null
}