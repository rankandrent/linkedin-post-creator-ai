/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Upload, Image as ImageIcon, Send, Loader2, Download, RefreshCw, Linkedin } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [logo, setLogo] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const refImageInputRef = useRef<HTMLInputElement>(null);

  const convertToPng = (dataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Failed to load image for conversion'));
      img.src = dataUrl;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'ref') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const pngDataUrl = await convertToPng(reader.result as string);
          if (type === 'logo') setLogo(pngDataUrl);
          else setRefImage(pngDataUrl);
        } catch (err) {
          console.error('Image conversion failed:', err);
          setError('Failed to process image. Please try a different file.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getImageData = (dataUrl: string | null) => {
    if (!dataUrl) return null;
    const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) return null;
    return {
      mimeType: match[1],
      data: match[2],
    };
  };

  const generatePost = async () => {
    if (!topic) {
      setError('Please enter a topic for your post.');
      return;
    }
    setError(null);
    setIsGenerating(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const parts: any[] = [
        { text: `Create a professional LinkedIn post image with the following layout and content:
        
        LAYOUT REQUIREMENTS:
        1. LOGO: Place the provided brand logo at the TOP-LEFT corner. Do NOT use it as a watermark.
        2. HASHTAGS: Place 2-3 relevant hashtags (e.g., #FinTech, #Business) in small pill-shaped boxes at the TOP-RIGHT corner.
        3. TITLE: A large, bold, high-impact title in the center-top area: "${topic}".
        4. BULLET POINTS: Below the title, include 3-4 professional bullet points related to the topic. Each bullet MUST start with a clean "up-right arrow" icon (↗).
        5. CALL TO ACTION (CTA): At the bottom, include a strong call to action text (e.g., "SAVE TIME. REDUCE STRESS. BOOST ACCURACY."). The text should be bold, all-caps, and professional. It should NOT be inside a solid colored box or bar. It should be transparent or have a very subtle, non-solid shape (like a light capsule outline) so it doesn't look like a clickable button. Use the brand color #2D64E3 for the text itself.
        6. BACKGROUND: Use a clean, white/off-white background with very subtle professional patterns (like thin grey waves or a light grid).
        
        STYLE:
        - Modern, minimalist, and high-end corporate aesthetic.
        - High contrast for readability.
        - Follow the visual style, colors, and essence of the provided reference image closely.
        
        The final output must be a single, perfectly composed professional image.` }
      ];

      const logoData = getImageData(logo);
      if (logoData) {
        parts.push({
          inlineData: {
            data: logoData.data,
            mimeType: logoData.mimeType
          }
        });
      }

      const refImageData = getImageData(refImage);
      if (refImageData) {
        parts.push({
          inlineData: {
            data: refImageData.data,
            mimeType: refImageData.mimeType
          }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        throw new Error('No image was generated. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `linkedin-post-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#F4F2EE] text-[#1D1D1D] font-sans selection:bg-[#2D64E3]/20">
      {/* Header */}
      <header className="bg-white border-b border-[#E0E0E0] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#2D64E3] p-1 rounded">
              <Linkedin className="w-5 h-5 text-white fill-current" />
            </div>
            <h1 className="font-semibold text-lg tracking-tight">Post Creator AI</h1>
          </div>
          <div className="text-xs font-medium text-[#666666] uppercase tracking-widest">
            Professional Tool
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 shadow-sm">
            <h2 className="text-[11px] font-bold text-[#666666] uppercase mb-6 tracking-[0.1em]">Configure Post</h2>
            
            <div className="space-y-6">
              {/* Topic Input */}
              <div>
                <label className="block text-[10px] font-black text-[#1D1D1D] mb-2 uppercase tracking-wider">Topic / Description</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Stop Bank Reconciliation Headaches"
                  className="w-full h-28 px-4 py-3 bg-[#F9FAFB] border border-[#E0E0E0] rounded-lg focus:ring-1 focus:ring-[#2D64E3] focus:border-[#2D64E3] outline-none transition-all resize-none text-sm font-medium"
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-[10px] font-black text-[#1D1D1D] mb-2 uppercase tracking-wider">Brand Logo (Optional)</label>
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  className={cn(
                    "relative h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group",
                    logo ? "border-[#2D64E3] bg-[#2D64E3]/5" : "border-[#E0E0E0] hover:border-[#2D64E3] hover:bg-[#F9FAFB]"
                  )}
                >
                  <input 
                    type="file" 
                    ref={logoInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'logo')}
                  />
                  {logo ? (
                    <img src={logo} alt="Logo" className="h-full w-full object-contain p-4" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-5 h-5 text-[#666666] mb-2" />
                      <span className="text-[10px] font-bold text-[#666666] uppercase tracking-tighter">Upload Logo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reference Image Upload */}
              <div>
                <label className="block text-[10px] font-black text-[#1D1D1D] mb-2 uppercase tracking-wider">Reference Style (Optional)</label>
                <div 
                  onClick={() => refImageInputRef.current?.click()}
                  className={cn(
                    "relative h-28 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group",
                    refImage ? "border-[#2D64E3] bg-[#2D64E3]/5" : "border-[#E0E0E0] hover:border-[#2D64E3] hover:bg-[#F9FAFB]"
                  )}
                >
                  <input 
                    type="file" 
                    ref={refImageInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'ref')}
                  />
                  {refImage ? (
                    <img src={refImage} alt="Reference" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <ImageIcon className="w-5 h-5 text-[#666666] mb-2" />
                      <span className="text-[10px] font-bold text-[#666666] uppercase tracking-tighter">Upload Reference Style</span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[10px] font-bold uppercase tracking-tight">
                  {error}
                </div>
              )}

              <button
                onClick={generatePost}
                disabled={isGenerating || !topic}
                style={{ backgroundColor: isGenerating || !topic ? '#E0E0E0' : '#2D64E3' }}
                className={cn(
                  "w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.97]",
                  isGenerating || !topic
                    ? "text-[#999999] cursor-not-allowed"
                    : "text-white hover:opacity-90 shadow-lg"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Generate Post Image
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden shadow-sm flex flex-col h-full min-h-[500px]">
            <div className="px-6 py-4 border-b border-[#E0E0E0] flex items-center justify-between bg-white">
              <h2 className="text-[11px] font-bold text-[#666666] uppercase tracking-[0.1em]">Preview</h2>
              {generatedImage && (
                <button 
                  onClick={downloadImage}
                  className="p-2 hover:bg-[#F4F2EE] rounded-full transition-colors text-[#2D64E3]"
                  title="Download Image"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center p-8 bg-[#F9FAFB]">
              {generatedImage ? (
                <div className="relative group max-w-full">
                  <img 
                    src={generatedImage} 
                    alt="Generated LinkedIn Post" 
                    className="rounded-lg shadow-2xl max-h-[600px] w-auto object-contain border border-[#E0E0E0]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none rounded-lg" />
                </div>
              ) : (
                <div className="text-center space-y-4 max-w-xs">
                  <div className="w-20 h-20 bg-[#F4F2EE] rounded-full flex items-center justify-center mx-auto">
                    <ImageIcon className="w-10 h-10 text-[#666666]/30" />
                  </div>
                  <div>
                    <p className="text-[#1D1D1D] font-medium">No image generated yet</p>
                    <p className="text-xs text-[#666666] mt-1">
                      Configure your post on the left and click generate to see the magic.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {isGenerating && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-20">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-[#2D64E3]/20 border-t-[#2D64E3] rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Linkedin className="w-6 h-6 text-[#2D64E3] fill-current" />
                  </div>
                </div>
                <p className="mt-4 text-sm font-semibold text-[#2D64E3] animate-pulse">Crafting your professional post...</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-8 text-center">
        <p className="text-xs text-[#666666]">
          Powered by Gemini 2.5 Flash Image • Professional Post Creator AI
        </p>
      </footer>
    </div>
  );
}
