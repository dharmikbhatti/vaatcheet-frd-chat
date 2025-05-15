import Image from "next/image"

interface LogoLoaderProps {
  size?: "sm" | "md" | "lg"
  variant?: "icon" | "full"
  showText?: boolean
}

export function LogoLoader({ size = "md", variant = "icon", showText = false }: LogoLoaderProps) {
  const sizes = {
    sm: { width: 60, height: variant === "icon" ? 60 : 90 },
    md: { width: 80, height: variant === "icon" ? 80 : 120 },
    lg: { width: 120, height: variant === "icon" ? 120 : 180 },
  }

  const { width, height } = sizes[size]
  const logoSrc = variant === "icon" ? "/images/logo-icon.png" : "/images/logo-full.png"

  return (
    <div className="flex flex-col items-center justify-center logo-animation">
      <div className="relative logo-pulse">
        <Image src={logoSrc || "/placeholder.svg"} alt="VaatCheet Logo" width={width} height={height} priority />
      </div>
      {variant === "icon" && showText && <h2 className={`font-bold text-2xl mt-3`}>VaatCheet</h2>}
    </div>
  )
}
