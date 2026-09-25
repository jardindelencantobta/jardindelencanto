interface HeroLogoFallbackProps {
  variant?: "dark" | "light";
}

export function HeroLogoFallback({ variant = "dark" }: HeroLogoFallbackProps) {
  if (variant === "light") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#F5F0E8] to-[#EDE8DD]">
        <img
          src="/logo-jardin.png"
          alt="Jardín El Encanto"
          className="w-[55%] max-w-[220px] h-auto"
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-crema/10 via-[#1A1A1A] to-[#1A1A1A]">
      <img
        src="/logo-jardin.png"
        alt="Jardín El Encanto"
        className="w-[60%] max-w-[300px] h-auto"
        style={{ filter: "brightness(0) invert(1)", opacity: 0.9 }}
      />
    </div>
  );
}
