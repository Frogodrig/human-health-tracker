"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Flame, 
  Droplets, 
  Leaf, 
  Star, 
  Sparkles,
  Crown,
  Heart,
  Shield
} from "lucide-react";
import type { ProductData } from "@/types";

interface FoodCardProps {
  product: ProductData;
  onAddToMeal?: () => void;
  className?: string;
}

// Determine card rarity based on nutrition quality
function getCardRarity(product: ProductData): {
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  score: number;
} {
  let score = 0;
  
  // Nutri-Score weighting (if available)
  if (product.nutriGrade) {
    const gradeScores = { A: 20, B: 15, C: 10, D: 5 };
    score += gradeScores[product.nutriGrade] || 0;
  }
  
  // Protein content (good for muscles!)
  if (product.protein && product.protein > 0) {
    score += Math.min(product.protein * 2, 20); // Max 20 points
  }
  
  // Fiber content (good for digestion)
  if (product.fiber && product.fiber > 0) {
    score += Math.min(product.fiber * 3, 15); // Max 15 points
  }
  
  // Penalty for high sodium
  if (product.sodium && product.sodium > 500) {
    score -= 10;
  }
  
  // Penalty for high saturated fat
  if (product.saturatedFat && product.saturatedFat > 5) {
    score -= 5;
  }
  
  // Bonus for low sugar
  if (product.sugars !== undefined && product.sugars < 5) {
    score += 10;
  }
  
  // Bonus for being verified
  if (product.verified) {
    score += 5;
  }
  
  score = Math.max(0, score); // Ensure non-negative
  
  if (score >= 50) return { rarity: "legendary", score };
  if (score >= 35) return { rarity: "epic", score };
  if (score >= 20) return { rarity: "rare", score };
  if (score >= 10) return { rarity: "uncommon", score };
  return { rarity: "common", score };
}

// Get rarity colors and effects
function getRarityStyles(rarity: string) {
  switch (rarity) {
    case "legendary":
      return {
        background: "linear-gradient(135deg, #FFD700, #FFA500, #FF6B35, #FFD700)",
        border: "border-yellow-400",
        glow: "shadow-yellow-500/50",
        holo: "holo-legendary",
        icon: Crown,
        iconColor: "text-yellow-300",
        badgeColor: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
      };
    case "epic":
      return {
        background: "linear-gradient(135deg, #9333EA, #C084FC, #E879F9, #9333EA)",
        border: "border-purple-400",
        glow: "shadow-purple-500/50",
        holo: "holo-epic", 
        icon: Star,
        iconColor: "text-purple-300",
        badgeColor: "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
      };
    case "rare":
      return {
        background: "linear-gradient(135deg, #3B82F6, #60A5FA, #93C5FD, #3B82F6)",
        border: "border-blue-400",
        glow: "shadow-blue-500/50",
        holo: "holo-rare",
        icon: Sparkles,
        iconColor: "text-blue-300",
        badgeColor: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
      };
    case "uncommon":
      return {
        background: "linear-gradient(135deg, #10B981, #34D399, #6EE7B7, #10B981)",
        border: "border-green-400",
        glow: "shadow-green-500/50",
        holo: "holo-uncommon",
        icon: Leaf,
        iconColor: "text-green-300",
        badgeColor: "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
      };
    default: // common
      return {
        background: "linear-gradient(135deg, #6B7280, #9CA3AF, #D1D5DB, #6B7280)",
        border: "border-gray-400",
        glow: "shadow-gray-500/50",
        holo: "holo-common",
        icon: Shield,
        iconColor: "text-gray-300",
        badgeColor: "bg-gradient-to-r from-gray-500 to-slate-500 text-white"
      };
  }
}

export function FoodCard({ product, onAddToMeal, className = "" }: FoodCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const { rarity, score } = getCardRarity(product);
  const styles = getRarityStyles(rarity);
  const IconComponent = styles.icon;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className={`relative ${className}`}>
      <style jsx>{`
        .holo-legendary {
          background: conic-gradient(from 0deg at ${mousePos.x}% ${mousePos.y}%, 
            #FFD700, #FFA500, #FF6B35, #FF1493, #9400D3, #0066FF, #00FF00, #FFFF00, #FFD700);
          background-size: 200% 200%;
          animation: legendary-shine 3s ease-in-out infinite;
        }
        
        .holo-epic {
          background: conic-gradient(from 45deg at ${mousePos.x}% ${mousePos.y}%, 
            #9333EA, #C084FC, #E879F9, #F472B6, #EC4899, #BE185D, #9333EA);
          background-size: 150% 150%;
          animation: epic-pulse 2.5s ease-in-out infinite;
        }
        
        .holo-rare {
          background: linear-gradient(45deg at ${mousePos.x}% ${mousePos.y}%, 
            #3B82F6, #60A5FA, #93C5FD, #DBEAFE, #93C5FD, #60A5FA, #3B82F6);
          background-size: 300% 300%;
          animation: rare-wave 2s ease-in-out infinite;
        }
        
        .holo-uncommon {
          background: radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, 
            #10B981, #34D399, #6EE7B7, #A7F3D0, #6EE7B7, #34D399, #10B981);
          background-size: 200% 200%;
          animation: uncommon-ripple 1.8s ease-in-out infinite;
        }
        
        .holo-common {
          background: linear-gradient(135deg, 
            #6B7280, #9CA3AF, #D1D5DB, #F3F4F6, #D1D5DB, #9CA3AF, #6B7280);
        }
        
        @keyframes legendary-shine {
          0%, 100% { 
            background-position: 0% 50%;
            filter: hue-rotate(0deg) brightness(1.2);
          }
          50% { 
            background-position: 100% 50%;
            filter: hue-rotate(30deg) brightness(1.5);
          }
        }
        
        @keyframes epic-pulse {
          0%, 100% { 
            background-position: 0% 50%;
            transform: scale(1);
          }
          50% { 
            background-position: 100% 50%;
            transform: scale(1.02);
          }
        }
        
        @keyframes rare-wave {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes uncommon-ripple {
          0%, 100% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
        }
        
        .card-tilt {
          transform: perspective(1000px) 
                     rotateX(${isHovered ? (mousePos.y - 50) * 0.1 : 0}deg) 
                     rotateY(${isHovered ? (mousePos.x - 50) * 0.1 : 0}deg);
          transition: transform 0.1s ease-out;
        }
      `}</style>
      
      <Card 
        className={`
          relative overflow-hidden p-6 cursor-pointer
          ${styles.border} border-2
          ${isHovered ? `shadow-2xl ${styles.glow}` : 'shadow-lg'}
          card-tilt transition-all duration-300
          bg-white/95 backdrop-blur-sm
        `}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Holographic overlay */}
        <div 
          className={`
            absolute inset-0 opacity-30 mix-blend-overlay
            ${styles.holo}
            ${isHovered ? 'opacity-60' : 'opacity-20'}
            transition-opacity duration-300
          `}
        />
        
        {/* Rarity badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <IconComponent className={`h-4 w-4 ${styles.iconColor}`} />
          <Badge className={`${styles.badgeColor} text-xs font-bold uppercase`}>
            {rarity}
          </Badge>
        </div>
        
        {/* Score badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="text-xs">
            Score: {score}
          </Badge>
        </div>

        {/* Card content */}
        <div className="relative z-10 space-y-4">
          {/* Product image area */}
          <div className="flex items-center justify-center h-32 bg-gradient-to-br from-white/50 to-gray-100/50 rounded-lg border">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="max-h-full max-w-full object-contain rounded"
              />
            ) : (
              <div className="text-6xl">🍎</div>
            )}
          </div>

          {/* Product info */}
          <div className="text-center space-y-2">
            <h3 className="font-bold text-lg text-gray-800 line-clamp-2">
              {product.name}
            </h3>
            {product.brand && (
              <p className="text-sm text-gray-600 font-medium">
                {product.brand}
              </p>
            )}
          </div>

          {/* Nutrition stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 bg-red-50 p-2 rounded">
              <Flame className="h-4 w-4 text-red-500" />
              <div>
                <div className="text-xs text-gray-600">Calories</div>
                <div className="font-bold text-red-600">
                  {product.calories || 0}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-blue-50 p-2 rounded">
              <Zap className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-xs text-gray-600">Protein</div>
                <div className="font-bold text-blue-600">
                  {product.protein || 0}g
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded">
              <Droplets className="h-4 w-4 text-yellow-500" />
              <div>
                <div className="text-xs text-gray-600">Carbs</div>
                <div className="font-bold text-yellow-600">
                  {product.carbohydrates || 0}g
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-purple-50 p-2 rounded">
              <Heart className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-xs text-gray-600">Fat</div>
                <div className="font-bold text-purple-600">
                  {product.fat || 0}g
                </div>
              </div>
            </div>
          </div>

          {/* Nutri-Grade */}
          {product.nutriGrade && (
            <div className="text-center">
              <Badge 
                className={`
                  ${product.nutriGrade === 'A' ? 'bg-green-500' : 
                    product.nutriGrade === 'B' ? 'bg-lime-500' :
                    product.nutriGrade === 'C' ? 'bg-yellow-500' :
                    'bg-red-500'} 
                  text-white text-lg font-bold px-3 py-1
                `}
              >
                Nutri-Score {product.nutriGrade}
              </Badge>
            </div>
          )}

          {/* Add to meal button */}
          {onAddToMeal && (
            <Button 
              onClick={onAddToMeal}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Add to Meal
            </Button>
          )}
        </div>

        {/* Sparkle effects for high-rarity cards */}
        {(rarity === 'legendary' || rarity === 'epic') && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`
                  absolute w-1 h-1 bg-white rounded-full
                  animate-ping opacity-75
                `}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// Grid component for displaying multiple food cards
interface FoodCardGridProps {
  products: ProductData[];
  onAddToMeal?: (product: ProductData) => void;
  className?: string;
}

export function FoodCardGrid({ products, onAddToMeal, className = "" }: FoodCardGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {products.map((product) => (
        <FoodCard
          key={product.id}
          product={product}
          onAddToMeal={() => onAddToMeal?.(product)}
        />
      ))}
    </div>
  );
}