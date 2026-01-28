import { ReactNode } from "react";

export interface FeatureProps {
  title: string;
  description: string;
  icon: ReactNode;
  span?: string; // Class for grid span
}

export interface PricingTier {
  name: string;
  price: number;
  yearlyPrice: number;
  description: string;
  features: { text: string; tooltip: string; icon?: ReactNode }[];
  isPopular?: boolean;
  highlightColor?: string;
}

export interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  avatar: string;
  stars: number;
}

export interface FaqItem {
  question: string;
  answer: string;
}