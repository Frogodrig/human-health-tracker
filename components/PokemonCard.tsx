import React, { useRef, useEffect, useState } from "react";
import "./pokemon-card.css";
import type { ProductData } from "@/types/index";
import Image from "next/image";

// Map Nutri-Score to rarity class for new effects
const nutriScoreToRarity: Record<string, string> = {
  A: "pokemon--radiant",
  B: "pokemon--holofoil",
  C: "pokemon--reverse-holo",
  D: "pokemon--common",
  E: "pokemon--common", // or "pokemon--uncommon" if you want to split
};

const PokemonCard: React.FC<{
  product: ProductData;
  badges?: string[];
  footer?: React.ReactNode;
}> = ({ product, badges, footer }) => {
  // Ultra-rare randomizer (1 in 100,000 chance)
  const [isUltraRare, setIsUltraRare] = useState(false);
  useEffect(() => {
    if (Math.floor(Math.random() * 100000) === 0) setIsUltraRare(true);
  }, []);

  const nutriGrade = (product.nutriGrade || "D").toUpperCase();
  // Use secret-rare if ultra-rare, else map Nutri-Score
  const rarityClass = isUltraRare
    ? "pokemon--secret-rare"
    : nutriScoreToRarity[nutriGrade] || nutriScoreToRarity.D;
  const cardRef = useRef<HTMLDivElement>(null);
  // Add refs to track if transition should be enabled
  const [isTransitioning, setIsTransitioning] = useState(false);
  const resetTimeout = useRef<NodeJS.Timeout | null>(null);
  // Add a ref for glare position
  const [glare, setGlare] = useState({ x: 50, y: 50 });
  const holoPillarRef = useRef<HTMLDivElement>(null);
  const vmaxParallaxRef = useRef<HTMLDivElement>(null);
  const metallicShineRef = useRef<HTMLDivElement>(null);

  // Add a utility to pick a random metallic chevron color for common cards
  const chevronColors = [
    "linear-gradient(135deg, #ffd700 0%, #fffbe6 100%)", // Gold
    "linear-gradient(135deg, #b0c4de 0%, #f8f8ff 100%)", // Silver
    "linear-gradient(135deg, #7fd8ff 0%, #b6e0fe 100%)", // Blue
    "linear-gradient(135deg, #a8ff78 0%, #78ffd6 100%)", // Green
    "linear-gradient(135deg, #ffb6c1 0%, #ffe1f6 100%)", // Pink
  ];
  const [chevronColor] = useState(
    () => chevronColors[Math.floor(Math.random() * chevronColors.length)]
  );

  // Improved 3D tilt effect handlers with parallax holofoil
  const handlePointerMove = (
    e: React.MouseEvent | { clientX: number; clientY: number }
  ) => {
    const card = cardRef.current;
    if (!card) return;
    setIsTransitioning(false);
    if (resetTimeout.current) {
      clearTimeout(resetTimeout.current);
      resetTimeout.current = null;
    }
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    // Centered at 0,0; max tilt 12deg, scale up slightly
    const rotateX = (y - 0.5) * 16;
    const rotateY = (x - 0.5) * 16;
    card.style.transform = `perspective(900px) rotateX(${-rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04,1.04,1)`;
    // Parallax holofoil/shine (subtle range)
    const holo = card.querySelector(
      ".pokemon-card__holo"
    ) as HTMLElement | null;
    if (holo) {
      holo.style.transition =
        "background-position 0.5s cubic-bezier(.4,1.6,.6,1)";
      const posX = 45 + x * 10;
      const posY = 45 + y * 10;
      holo.style.backgroundPosition = `${posX}% ${posY}%`;
    }
    const shine = card.querySelector(
      ".pokemon-card__shine"
    ) as HTMLElement | null;
    if (shine) {
      shine.style.transition =
        "background-position 0.5s cubic-bezier(.4,1.6,.6,1)";
      const posX = 45 + x * 10;
      const posY = 45 + y * 10;
      shine.style.backgroundPosition = `${posX}% ${posY}%`;
    }
    // Parallax for holo-pillar
    if (holoPillarRef.current) {
      const posX = 40 + x * 20;
      holoPillarRef.current.style.backgroundPosition = `${posX}% 50%`;
    }
    // VMAX background parallax for common cards
    if (vmaxParallaxRef.current) {
      const posX = 40 + x * 20;
      const posY = 40 + y * 20;
      vmaxParallaxRef.current.style.backgroundPosition = `${posX}% ${posY}%`;
    }
    // Metallic shine parallax for common cards
    if (metallicShineRef.current) {
      const shineX = Math.round(x * 100);
      const shineY = Math.round(y * 100);
      metallicShineRef.current.style.setProperty("--shine-x", `${shineX}%`);
      metallicShineRef.current.style.setProperty("--shine-y", `${shineY}%`);
    }
    card.style.transition = "transform 0.5s cubic-bezier(.4,1.6,.6,1)";
    // Set glare position as CSS variables
    const glareX = Math.round(x * 100);
    const glareY = Math.round(y * 100);
    card.style.setProperty("--glare-x", `${glareX}%`);
    card.style.setProperty("--glare-y", `${glareY}%`);
    setGlare({ x: glareX, y: glareY });
  };

  const handlePointerLeave = () => {
    if (resetTimeout.current) {
      clearTimeout(resetTimeout.current);
    }
    resetTimeout.current = setTimeout(() => {
      const card = cardRef.current;
      if (!card) return;
      setIsTransitioning(true);
      card.style.transition = "transform 1.2s cubic-bezier(.4,1.6,.6,1)";
      card.style.transform =
        "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
      const holo = card.querySelector(
        ".pokemon-card__holo"
      ) as HTMLElement | null;
      if (holo) {
        holo.style.transition =
          "background-position 1.2s cubic-bezier(.4,1.6,.6,1)";
        holo.style.backgroundPosition = "50% 50%";
      }
      const shine = card.querySelector(
        ".pokemon-card__shine"
      ) as HTMLElement | null;
      if (shine) {
        shine.style.transition =
          "background-position 1.2s cubic-bezier(.4,1.6,.6,1)";
        shine.style.backgroundPosition = "50% 50%";
      }
      // Reset glare to center
      card.style.setProperty("--glare-x", "50%");
      card.style.setProperty("--glare-y", "50%");
      setGlare({ x: 50, y: 50 });
      // Reset VMAX parallax for common cards
      if (vmaxParallaxRef.current) {
        vmaxParallaxRef.current.style.transition =
          "background-position 1.2s cubic-bezier(.4,1.6,.6,1)";
        vmaxParallaxRef.current.style.backgroundPosition = "50% 50%";
      }
      // Reset metallic shine for common cards
      if (metallicShineRef.current) {
        metallicShineRef.current.style.setProperty("--shine-x", "50%");
        metallicShineRef.current.style.setProperty("--shine-y", "50%");
      }
    }, 500); // 1 second delay before reset
  };

  useEffect(() => {
    return () => {
      if (resetTimeout.current) {
        clearTimeout(resetTimeout.current);
      }
    };
  }, []);

  // Helper: check for missing info
  const missingInfo: string[] = [];
  if (!product.name) missingInfo.push("Product name");
  if (!product.imageUrl) missingInfo.push("Product image");
  if (!product.serving || !product.serving.size || !product.serving.unit)
    missingInfo.push("Serving size");
  // Macro nutrients: calories, protein, carbohydrates, fat
  const macroKeys = ["calories", "protein", "carbohydrates", "fat"];
  const missingMacros = macroKeys.filter(
    (k) => product[k as keyof typeof product] == null
  );
  if (missingMacros.length > 0) missingInfo.push("Macro nutrients");

  const cardClass = `pokemon-card ${rarityClass} ${
    isUltraRare ? "pokemon--ultra-rare" : ""
  }`;
  const ariaLabel = `Pokemon style nutrition card, Nutri-Score ${nutriGrade}${
    isUltraRare ? ", ultra-rare!" : ""
  }`;

  const cardStyle: React.CSSProperties & { [key: `--${string}`]: string } = {
    willChange: "transform",
    transition: isTransitioning
      ? "transform 1.2s cubic-bezier(.4,1.6,.6,1)"
      : "transform 0.5s cubic-bezier(.4,1.6,.6,1)",
    "--glare-x": `${glare.x}%`,
    "--glare-y": `${glare.y}%`,
    ...(rarityClass === "pokemon--common" && {
      "--common-metallic-gradient": chevronColor,
    }),
  };

  return (
    <div
      ref={cardRef}
      className={cardClass}
      aria-label={ariaLabel}
      tabIndex={0}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerUp={handlePointerLeave}
      onBlur={handlePointerLeave}
      style={cardStyle}
    >
      {/* Layered border for depth */}
      <div className="pokemon-card__border" />
      {/* Holofoil effect */}
      <div className="pokemon-card__holo" />
      {/* Shine effect */}
      <div className="pokemon-card__shine" />
      {/* Glare effect */}
      <div className="pokemon-card__glare" />
      {/* VMAX background parallax for common cards */}
      {rarityClass === "pokemon--common" && (
        <div
          ref={vmaxParallaxRef}
          className="pokemon-card__vmax-parallax"
          aria-hidden="true"
        />
      )}
      {/* Metallic shine effect for common cards */}
      {rarityClass === "pokemon--common" && (
        <div
          ref={metallicShineRef}
          className="pokemon-card__metallic-shine"
          aria-hidden="true"
        />
      )}
      {/* Incomplete info warning */}
      {missingInfo.length > 0 && (
        <div className="pokemon-card__warning">
          Incomplete info:\n{missingInfo.join(", ")}
        </div>
      )}
      {/* Nutri-Score badge at top right if available */}
      {product.nutriGrade && (
        <div
          className={`pokemon-card__nutri-badge pokemon-card__nutri-badge--${product.nutriGrade}`}
          title={`Nutri-Score: ${product.nutriGrade}`}
          aria-label={`Nutri-Score: ${product.nutriGrade}`}
        >
          {product.nutriGrade}
        </div>
      )}
      {/* Image area with foil overlay */}
      <div className="pokemon-card__image">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name || "Product image"}
            width={240}
            height={140}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              borderRadius: "1rem",
              background: "rgba(255,255,255,0.08)",
            }}
          />
        ) : null}
        {/* Holofoil pillar effect for holofoil rarity */}
        {rarityClass === "pokemon--holofoil" && (
          <div
            ref={holoPillarRef}
            className="pokemon-card__holo-pillar"
            aria-hidden="true"
          />
        )}
        {/* Sparkle effect for radiant rarity */}
        {rarityClass === "pokemon--radiant" && (
          <div className="pokemon-card__sparkle" aria-hidden="true" />
        )}
        {/* Remove chevron foil for common cards */}
        <div className="pokemon-card__foil" />
      </div>
      {/* Card content (badges, stats, etc.) */}
      <div className="pokemon-card__content">
        {/* Name at top */}
        {product.name && (
          <h2
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: "1.2rem",
              textAlign: "center",
              wordBreak: "break-word",
            }}
          >
            {product.name}
          </h2>
        )}
        {/* Serving size badge under name */}
        {product.serving && product.serving.size && product.serving.unit && (
          <div className="pokemon-card__serving-badge">
            Serving: {product.serving.size} {product.serving.unit}
          </div>
        )}
        {/* Only show badges if passed as prop */}
        {Array.isArray(badges) && badges.length > 0 && (
          <div className="pokemon-card__badges">
            {badges.map((badge: string, i: number) => (
              <span key={i}>{badge}</span>
            ))}
          </div>
        )}
        {/* Only show macro stats if at least one is present and not 0 */}
        {(product.calories ||
          product.protein ||
          product.carbohydrates ||
          product.fat) && (
          <div className="pokemon-card__stats">
            {product.calories != null && product.calories !== 0 && (
              <span className="pokemon-card__stat-badge pokemon-card__stat-badge--calories">
                <span
                  className="pokemon-card__stat-icon"
                  role="img"
                  aria-label="Calories"
                >
                  🔥
                </span>
                {product.calories} kcal
              </span>
            )}
            {product.protein != null && product.protein !== 0 && (
              <span className="pokemon-card__stat-badge pokemon-card__stat-badge--protein">
                <span
                  className="pokemon-card__stat-icon"
                  role="img"
                  aria-label="Protein"
                >
                  💪
                </span>
                {product.protein}g Protein
              </span>
            )}
            {product.carbohydrates != null && product.carbohydrates !== 0 && (
              <span className="pokemon-card__stat-badge pokemon-card__stat-badge--carbs">
                <span
                  className="pokemon-card__stat-icon"
                  role="img"
                  aria-label="Carbs"
                >
                  🍞
                </span>
                {product.carbohydrates}g Carbs
              </span>
            )}
            {product.fat != null && product.fat !== 0 && (
              <span className="pokemon-card__stat-badge pokemon-card__stat-badge--fat">
                <span
                  className="pokemon-card__stat-icon"
                  role="img"
                  aria-label="Fat"
                >
                  🥑
                </span>
                {product.fat}g Fat
              </span>
            )}
          </div>
        )}
        {/* Footer/info if passed as prop */}
        {footer && <div className="pokemon-card__footer">{footer}</div>}
      </div>
    </div>
  );
};

export default PokemonCard;
