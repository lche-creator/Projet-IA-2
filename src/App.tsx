/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Send, Image as ImageIcon, Newspaper, Monitor, Layout, Loader2, Sparkles, AlertCircle } from 'lucide-react';

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type MediaStyle = 'billboard' | 'newspaper' | 'social';

interface GeneratedVisual {
  url: string;
  type: MediaStyle;
  prompt: string;
}

export default function App() {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [visuals, setVisuals] = useState<GeneratedVisual[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generatePrompts = async (productDesc: string) => {
    const prompt = `Vous êtes un expert en publicité. À partir de la description du produit suivante: "${productDesc}", générez 3 prompts détaillés pour une IA de génération d'images. 
    IMPORTANT: Aucun humain ne doit apparaître sur les visuels. Le produit doit être le seul sujet ou au centre de l'attention.
    Assurez une cohérence parfaite de l'apparence du produit entre les trois.

    Les trois supports sont:
    1. Billboard (Panneau d'affichage extérieur): Format large, environnement urbain ou autoroute, ciel dégagé, éclairage publicitaire.
    2. Newspaper (Publicité dans un journal): Format portrait ou paysage, noir et blanc ou couleurs légèrement désaturées, grain de papier, texture de presse.
    3. Social Media (Post Instagram/TikTok): Format carré, moderne, éclairage studio propre, esthétique épurée, minimaliste.

    Répondez uniquement en JSON avec les clés: billboard, newspaper, social.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (err) {
      console.error("Error generating prompts:", err);
      throw new Error("Erreur lors de la création des concepts publicitaires.");
    }
  };

  const generateImageForStyle = async (prompt: string, type: MediaStyle): Promise<string> => {
    const aspectRatioMap: Record<MediaStyle, "16:9" | "3:4" | "1:1"> = {
      billboard: "16:9",
      newspaper: "3:4",
      social: "1:1"
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', // Nano Banana
        contents: {
          parts: [{ text: prompt + " -- No people, no humans, professional product photography" }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatioMap[type],
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("Aucune image générée.");
    } catch (err) {
      console.error(`Error generating image for ${type}:`, err);
      throw new Error(`Erreur lors de la génération de l'image (${type}).`);
    }
  };

  const handleGenerate = async () => {
    if (!description.trim()) return;

    setIsGenerating(true);
    setError(null);
    setVisuals([]);

    try {
      const prompts = await generatePrompts(description);
      
      const billboardUrl = await generateImageForStyle(prompts.billboard, 'billboard');
      const newspaperUrl = await generateImageForStyle(prompts.newspaper, 'newspaper');
      const socialUrl = await generateImageForStyle(prompts.social, 'social');

      setVisuals([
        { url: billboardUrl, type: 'billboard', prompt: prompts.billboard },
        { url: newspaperUrl, type: 'newspaper', prompt: prompts.newspaper },
        { url: socialUrl, type: 'social', prompt: prompts.social }
      ]);
    } catch (err: any) {
      setError(err.message || "Une erreur inattendue est survenue.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-sans selection:bg-[#5A5A40] selection:text-white">
      {/* Header */}
      <header className="border-b border-[#1A1A1A]/10 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Création de visuels</h1>
          </div>
          <div className="text-xs font-medium uppercase tracking-widest opacity-40 hidden sm:block">
            Powered by Nano Banana
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Sidebar - Controls */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#1A1A1A]/5">
              <h2 className="text-lg font-medium mb-6 flex items-center gap-2">
                <Layout className="w-5 h-5 opacity-60" />
                Détails du Produit
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider opacity-50 px-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez votre produit (ex: Une bouteille de parfum minimaliste en verre dépoli avec un bouchon en bois...)"
                    className="w-full h-40 bg-[#F5F5F0] border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#5A5A40] transition-all resize-none"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerate}
                  disabled={isGenerating || !description.trim()}
                  className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-medium flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg shadow-[#1A1A1A]/20"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Générer les visuels
                    </>
                  )}
                </motion.button>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-red-50 text-red-700 rounded-2xl text-xs flex items-start gap-3 border border-red-100"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </motion.div>
              )}
            </div>

            <div className="bg-[#5A5A40] rounded-3xl p-8 text-white">
              <h3 className="text-sm font-semibold uppercase tracking-widest mb-4 opacity-70">
                Instructions
              </h3>
              <ul className="space-y-4 text-sm opacity-90">
                <li className="flex gap-3 text-white/80">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] shrink-0">1</span>
                  Décrivez votre produit précisément.
                </li>
                <li className="flex gap-3 text-white/80">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] shrink-0">2</span>
                  L'IA générera 3 concepts publicitaires cohérents.
                </li>
                <li className="flex gap-3 text-white/80">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] shrink-0">3</span>
                  Aucun humain ne sera inclus dans les visuels.
                </li>
              </ul>
            </div>
          </div>

          {/* Main Area - Results */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {visuals.length > 0 ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-12"
                >
                  {/* Billboard Section */}
                  <VisualCard 
                    title="Panneau d'affichage" 
                    subtitle="Capturez l'attention dans l'espace public" 
                    visual={visuals.find(v => v.type === 'billboard')!} 
                    icon={<ImageIcon className="w-6 h-6" />}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Newspaper Section */}
                    <VisualCard 
                      title="Presse Écrite" 
                      subtitle="L'élégance du papier journal" 
                      visual={visuals.find(v => v.type === 'newspaper')!} 
                      icon={<Newspaper className="w-6 h-6" />}
                    />

                    {/* Social Media Section */}
                    <VisualCard 
                      title="Réseaux Sociaux" 
                      subtitle="Moderne et engageant" 
                      visual={visuals.find(v => v.type === 'social')!} 
                      icon={<Monitor className="w-6 h-6" />}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-[#1A1A1A]/10 rounded-[40px] bg-white/40"
                >
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6">
                    <Layout className="w-10 h-10 opacity-20" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Prêt à créer ?</h3>
                  <p className="text-sm opacity-50 max-w-sm">
                    Décrivez votre produit à gauche pour générer vos visuels publicitaires sur-mesure.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-[#1A1A1A]/5 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-30 font-medium">
          © 2026 Création de Visuels • Design for Excellence
        </p>
      </footer>
    </div>
  );
}

function VisualCard({ title, subtitle, visual, icon }: { title: string, subtitle: string, visual: GeneratedVisual, icon: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative"
    >
      <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-[#1A1A1A]/5 transition-all hover:shadow-xl hover:shadow-[#1A1A1A]/5">
        <div className="p-8 pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-3">
              <span className="p-2 bg-[#F5F5F0] rounded-xl text-[#5A5A40]">
                {icon}
              </span>
              {title}
            </h3>
            <p className="text-xs opacity-50 mt-1">{subtitle}</p>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest bg-[#F5F5F0] px-3 py-1.5 rounded-full opacity-60">
            {visual.type === 'billboard' ? '16:9' : visual.type === 'newspaper' ? '3:4' : '1:1'}
          </div>
        </div>
        
        <div className="p-4 pt-2">
          <div className="relative aspect-[1.78] rounded-[32px] overflow-hidden bg-[#F5F5F0]">
            {visual.type === 'newspaper' ? (
              <div className="absolute inset-0 aspect-[0.75] mx-auto overflow-hidden rounded-[32px]">
                 <img 
                  src={visual.url} 
                  alt={title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : visual.type === 'social' ? (
              <div className="absolute inset-0 aspect-square mx-auto overflow-hidden rounded-[32px]">
                 <img 
                  src={visual.url} 
                  alt={title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <img 
                src={visual.url} 
                alt={title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        </div>

        <div className="px-8 py-6 bg-[#F5F5F0]/30 border-t border-[#1A1A1A]/5">
           <details className="cursor-pointer group/details">
              <summary className="text-[10px] uppercase font-bold tracking-widest opacity-30 group-hover/details:opacity-60 transition-opacity list-none flex items-center gap-2">
                Voir le concept
                <Sparkles className="w-3 h-3" />
              </summary>
              <p className="mt-3 text-xs italic leading-relaxed opacity-70">
                "{visual.prompt}"
              </p>
           </details>
        </div>
      </div>
    </motion.div>
  );
}
