// components/PetIcons.tsx
// Shared pet icon set used across the site.
// All icons are filled SVGs at 32×32 viewBox, colored via currentColor.

type IconProps = { className?: string };

export const DogIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    {/* floppy left ear */}
    <ellipse cx="7" cy="13" rx="4" ry="6" transform="rotate(-15 7 13)" />
    {/* floppy right ear */}
    <ellipse cx="25" cy="13" rx="4" ry="6" transform="rotate(15 25 13)" />
    {/* head */}
    <ellipse cx="16" cy="16" rx="10" ry="9" />
    {/* snout highlight */}
    <ellipse cx="16" cy="21" rx="5" ry="3.5" fill="white" fillOpacity="0.3" />
    {/* nose */}
    <ellipse cx="16" cy="19.5" rx="2.2" ry="1.5" fill="white" fillOpacity="0.65" />
    {/* eyes */}
    <circle cx="12" cy="14.5" r="1.5" fill="white" fillOpacity="0.9" />
    <circle cx="20" cy="14.5" r="1.5" fill="white" fillOpacity="0.9" />
    {/* pupils */}
    <circle cx="12.3" cy="14.8" r="0.6" fill="currentColor" fillOpacity="0.45" />
    <circle cx="20.3" cy="14.8" r="0.6" fill="currentColor" fillOpacity="0.45" />
  </svg>
);

export const CatIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    {/* pointy left ear */}
    <polygon points="5,15 9,4 14,13" />
    {/* pointy right ear */}
    <polygon points="27,15 23,4 18,13" />
    {/* head */}
    <ellipse cx="16" cy="18" rx="11" ry="10" />
    {/* eyes */}
    <ellipse cx="11.5" cy="16" rx="2" ry="2.5" fill="white" fillOpacity="0.9" />
    <ellipse cx="20.5" cy="16" rx="2" ry="2.5" fill="white" fillOpacity="0.9" />
    {/* slit pupils */}
    <ellipse cx="11.5" cy="16" rx="0.65" ry="2" fill="currentColor" fillOpacity="0.45" />
    <ellipse cx="20.5" cy="16" rx="0.65" ry="2" fill="currentColor" fillOpacity="0.45" />
    {/* nose */}
    <polygon points="16,20.5 14.5,22 17.5,22" fill="white" fillOpacity="0.65" />
    {/* whisker dots */}
    <circle cx="10" cy="21.5" r="0.8" fill="white" fillOpacity="0.45" />
    <circle cx="22" cy="21.5" r="0.8" fill="white" fillOpacity="0.45" />
  </svg>
);

export const BirdIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    {/* body */}
    <ellipse cx="15" cy="21" rx="9" ry="7.5" />
    {/* head */}
    <circle cx="22" cy="11" r="5.5" />
    {/* wing */}
    <path d="M7 19 Q1 13 5 8 Q9 14 13 17 Z" fillOpacity="0.55" />
    {/* tail feathers */}
    <path d="M6 25 Q2 29 4 31 Q8 27 10 25 Z" fillOpacity="0.65" />
    <path d="M10 26 Q8 30 10 31 Q13 28 13 26 Z" fillOpacity="0.5" />
    {/* beak */}
    <polygon points="27,9.5 31,11 27,12.5" fill="white" fillOpacity="0.75" />
    {/* eye */}
    <circle cx="24" cy="10" r="1.6" fill="white" fillOpacity="0.9" />
    <circle cx="24.4" cy="10.2" r="0.65" fill="currentColor" fillOpacity="0.45" />
    {/* crest */}
    <path d="M22 5.5 Q24 3 26 4 Q24 5 23 6 Z" fillOpacity="0.6" />
  </svg>
);

export const ExoticIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    {/* body */}
    <ellipse cx="16" cy="18" rx="5" ry="7.5" />
    {/* head — wider triangular gecko shape */}
    <path d="M10 9 Q16 4 22 9 Q20 13 16 13 Q12 13 10 9 Z" />
    {/* tail curves left */}
    <path d="M16 25.5 Q12 29 9 30 Q13 27 15 25 Z" />
    {/* front-left leg */}
    <path d="M11 15 Q5 13 3 10 Q7 13 11 16 Z" />
    {/* front-right leg */}
    <path d="M21 15 Q27 13 29 10 Q25 13 21 16 Z" />
    {/* back-left leg */}
    <path d="M11 22 Q4 23 2 26 Q7 23 12 23 Z" />
    {/* back-right leg */}
    <path d="M21 22 Q28 23 30 26 Q25 23 20 23 Z" />
    {/* eyes */}
    <circle cx="13" cy="8.5" r="1.4" fill="white" fillOpacity="0.9" />
    <circle cx="19" cy="8.5" r="1.4" fill="white" fillOpacity="0.9" />
    <circle cx="13.3" cy="8.8" r="0.55" fill="currentColor" fillOpacity="0.45" />
    <circle cx="19.3" cy="8.8" r="0.55" fill="currentColor" fillOpacity="0.45" />
    {/* spine dots */}
    <circle cx="16" cy="15" r="0.7" fill="white" fillOpacity="0.3" />
    <circle cx="16" cy="18" r="0.7" fill="white" fillOpacity="0.3" />
    <circle cx="16" cy="21" r="0.7" fill="white" fillOpacity="0.3" />
  </svg>
);

export const AllPetsIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    {/* 4 paw prints arranged in a 2×2 grid */}
    {/* top-left paw — pad */}
    <ellipse cx="8.5" cy="14" rx="2.8" ry="2.2" />
    {/* top-left toes */}
    <circle cx="5.5" cy="11" r="1.3" />
    <circle cx="8.5" cy="10.2" r="1.3" />
    <circle cx="11.5" cy="11" r="1.3" />

    {/* top-right paw */}
    <ellipse cx="23.5" cy="14" rx="2.8" ry="2.2" />
    <circle cx="20.5" cy="11" r="1.3" />
    <circle cx="23.5" cy="10.2" r="1.3" />
    <circle cx="26.5" cy="11" r="1.3" />

    {/* bottom-left paw */}
    <ellipse cx="8.5" cy="23" rx="2.8" ry="2.2" />
    <circle cx="5.5" cy="20" r="1.3" />
    <circle cx="8.5" cy="19.2" r="1.3" />
    <circle cx="11.5" cy="20" r="1.3" />

    {/* bottom-right paw */}
    <ellipse cx="23.5" cy="23" rx="2.8" ry="2.2" />
    <circle cx="20.5" cy="20" r="1.3" />
    <circle cx="23.5" cy="19.2" r="1.3" />
    <circle cx="26.5" cy="20" r="1.3" />
  </svg>
);

// Convenience map for dynamic lookup
export const PetIconMap = {
  dog: DogIcon,
  cat: CatIcon,
  bird: BirdIcon,
  exotic: ExoticIcon,
  all: AllPetsIcon,
} as const;

export type PetType = keyof typeof PetIconMap;
