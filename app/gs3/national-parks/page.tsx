import type { Metadata } from "next";
import NationalParksMap from "./NationalParksMap";

export const metadata: Metadata = {
  title: "National Parks & Tiger Reserves · Active Recall · UPSC Labs",
  description:
    "Interactive active-recall map of India's national parks, tiger reserves, wetlands, rivers and terrain for UPSC GS3 (Environment & Ecology). Work in progress — data provisional.",
};

export default function NationalParksPage() {
  return <NationalParksMap />;
}
