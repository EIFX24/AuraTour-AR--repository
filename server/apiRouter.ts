import { Router, Request, Response } from 'express';
import { getGeminiClient } from './geminiClient.ts';
import { Type } from '@google/genai';

export const apiRouter = Router();

export interface LandmarkHotspot {
  id: string;
  title: string;
  description: string;
  xPercent: number; // 0 - 100% on image
  yPercent: number; // 0 - 100% on image
  cameraFocus: 'wide' | 'crown' | 'base' | 'arch' | 'detail';
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface NarrationSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  hotspotId?: string;
}

export interface LandmarkAnalysisResult {
  name: string;
  nativeName?: string;
  city: string;
  country: string;
  coordinates?: { lat: number; lng: number };
  architecturalStyle: string;
  builtYear: string;
  architect: string;
  summary: string;
  hotspots: LandmarkHotspot[];
  fastFacts: string[];
  historicalHighlights: {
    era: string;
    description: string;
  }[];
  hiddenSecrets: {
    title: string;
    story: string;
  }[];
  groundedSources: GroundingSource[];
  searchQueries: string[];
  narration: {
    script: string;
    segments: NarrationSegment[];
    audioBase64?: string;
    audioMimeType?: string;
    voiceName?: string;
  };
}

// Clean base64 image strings
function sanitizeBase64(raw: string): { data: string; mimeType: string } {
  let mimeType = 'image/jpeg';
  let data = raw;

  if (raw.startsWith('data:')) {
    const matches = raw.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1];
      data = matches[2];
    } else {
      const commaIdx = raw.indexOf(',');
      if (commaIdx !== -1) {
        data = raw.slice(commaIdx + 1);
      }
    }
  }

  return { data, mimeType };
}

// Landmark recognition + Grounded History + Narration Generation
apiRouter.post('/analyze-landmark', async (req: Request, res: Response) => {
  try {
    const { imageBase64, userHint, selectedVoice = 'Kore' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 data in request body' });
    }

    const { data: cleanData, mimeType } = sanitizeBase64(imageBase64);
    const ai = getGeminiClient();

    // Step 1: Visual Landmark Identification
    // Try gemini-4-argon first as requested, with graceful fallback to gemini-3.8-flash
    let visionResponseText = '';
    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: cleanData,
      },
    };

    const visionPrompt = `You are an elite urban architectural AI and computer-vision photo tourism engine.
Analyze this urban photograph:
1. Identify the specific landmark or urban monument in the image (or the urban scene/city center if not a single monument).
${userHint ? `User context/hint: "${userHint}"` : ''}
2. Provide precise coordinates on where key architectural parts are situated within this specific image framing (as xPercent 0-100 from left, yPercent 0-100 from top).
3. Return a clean, valid JSON object with the following schema:
{
  "name": "Official Landmark Name",
  "nativeName": "Local language name if applicable",
  "city": "City name",
  "country": "Country name",
  "coordinates": { "lat": 48.8584, "lng": 2.2945 },
  "architecturalStyle": "Architectural classification (e.g. French Neo-Gothic, Flavian Roman, Beaux-Arts)",
  "builtYear": "Year or era completed/opened",
  "architect": "Architect or lead builder/ruler",
  "summary": "Captivating 2-sentence overview of its global significance",
  "hotspots": [
    {
      "id": "h1",
      "title": "Spire / Dome / Keystone",
      "description": "Specific architectural detail at this coordinate in the photo",
      "xPercent": 50,
      "yPercent": 25,
      "cameraFocus": "crown"
    },
    {
      "id": "h2",
      "title": "Main Facade / Archway",
      "description": "What to look for here",
      "xPercent": 50,
      "yPercent": 60,
      "cameraFocus": "arch"
    },
    {
      "id": "h3",
      "title": "Foundation / Plaza",
      "description": "Ground level significance",
      "xPercent": 50,
      "yPercent": 85,
      "cameraFocus": "base"
    }
  ],
  "fastFacts": [
    "Fact 1 (e.g. Dimensions or structural stats)",
    "Fact 2 (e.g. Materials or engineering feats)",
    "Fact 3 (e.g. Annual visitors or UNESCO date)"
  ]
}
Return strictly the JSON object.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: {
          parts: [imagePart, { text: visionPrompt }],
        },
        config: {
          responseMimeType: 'application/json',
        },
      });
      visionResponseText = response.text || '';
    } catch (argonErr: any) {
      console.warn('gemini-4-argon call failed, falling back to gemini-3.8-flash:', argonErr?.message || argonErr);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [imagePart, { text: visionPrompt }],
        },
        config: {
          responseMimeType: 'application/json',
        },
      });
      visionResponseText = fallbackResponse.text || '';
    }

    let parsedVision: any = {};
    try {
      parsedVision = JSON.parse(visionResponseText);
    } catch (e) {
      console.error('Failed to parse vision response as JSON:', visionResponseText);
      parsedVision = {
        name: 'Iconic City Landmark',
        city: 'Global Metropolis',
        country: 'World',
        architecturalStyle: 'Historic Architecture',
        builtYear: 'Historical Era',
        architect: 'Master Craftsmen',
        summary: 'A breathtaking monument captured during an urban expedition.',
        hotspots: [
          { id: 'h1', title: 'Architectural Crest', description: 'Prominent structural upper section', xPercent: 50, yPercent: 30, cameraFocus: 'crown' },
          { id: 'h2', title: 'Main Elevation', description: 'Central facade detailing', xPercent: 50, yPercent: 65, cameraFocus: 'arch' },
        ],
        fastFacts: ['Visited by millions each year', 'Major cultural epicenter'],
      };
    }

    const landmarkName = parsedVision.name || 'Famous Landmark';
    const landmarkCity = parsedVision.city || 'City';
    const landmarkCountry = parsedVision.country || '';

    // Step 2: Google Search Grounding for Up-to-date History & Secrets
    // We MUST use gemini-3.8-flash with googleSearch tool
    const searchPrompt = `Perform a comprehensive grounded historical and cultural search about "${landmarkName}" located in ${landmarkCity}, ${landmarkCountry}.
Find:
1. Deep verified history: 3 major historical milestones (e.g. founding/construction, pivotal historical events, modern restoration/preservation).
2. 2 lesser-known secrets, urban legends, or fascinating structural mysteries tourists often overlook.
3. Current verified visitor status or interesting recent discoveries.
4. An AR documentary narration script (spoken length: ~25 seconds, roughly 60-75 words). It should feel like a cinematic National Geographic / BBC AR documentary voiceover, introducing the viewer to the landmark with vivid imagery and dramatic storytelling. Format the narration into 3 distinct chronological or thematic segments with estimated timing.

Return a valid JSON object matching this structure:
{
  "historicalHighlights": [
    { "era": "e.g. 1889 Construction", "description": "Compelling story of how it was built..." },
    { "era": "e.g. Wartime Resilience", "description": "Key event in the 20th century..." },
    { "era": "e.g. 21st Century Milestone", "description": "Recent preservation or modern role..." }
  ],
  "hiddenSecrets": [
    { "title": "The Secret Apartment / Mystery Feature", "story": "Fascinating story..." },
    { "title": "Optical Illusion / Hidden Inscription", "story": "Fascinating story..." }
  ],
  "narration": {
    "script": "Alex: Look closely at the towering arches before you. <breath> Constructed over a century ago...",
    "segments": [
      {
        "id": "seg1",
        "startTime": 0,
        "endTime": 8,
        "text": "First part of the narration spoken here...",
        "hotspotId": "h1"
      },
      {
        "id": "seg2",
        "startTime": 8,
        "endTime": 16,
        "text": "Second part highlighting the middle details...",
        "hotspotId": "h2"
      },
      {
        "id": "seg3",
        "startTime": 16,
        "endTime": 25,
        "text": "Concluding inspiring thought on its legacy...",
        "hotspotId": "h3"
      }
    ]
  }
}
Return strictly the JSON object.`;

    let groundedResponseText = '';
    let groundedSources: GroundingSource[] = [];
    let searchQueries: string[] = [];

    try {
      const searchRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: searchPrompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      groundedResponseText = searchRes.text || '';

      // Extract search grounding metadata
      const candidate = searchRes.candidates?.[0];
      const metadata = (candidate as any)?.groundingMetadata;
      if (metadata) {
        if (metadata.webSearchQueries && Array.isArray(metadata.webSearchQueries)) {
          searchQueries = metadata.webSearchQueries;
        }

        if (metadata.groundingChunks && Array.isArray(metadata.groundingChunks)) {
          for (const chunk of metadata.groundingChunks) {
            if (chunk.web?.uri) {
              groundedSources.push({
                title: chunk.web.title || chunk.web.uri,
                url: chunk.web.uri,
              });
            }
          }
        }
      }
    } catch (searchErr: any) {
      console.warn('Search grounding error, using fallback prompt:', searchErr?.message || searchErr);
      const fallbackSearch = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: searchPrompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      groundedResponseText = fallbackSearch.text || '';
    }

    let parsedGrounded: any = {};
    try {
      // Clean possible markdown code fences
      const cleaned = groundedResponseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedGrounded = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse search grounded json:', groundedResponseText);
      parsedGrounded = {
        historicalHighlights: [
          { era: 'Original Inception', description: `Conceived as a triumph of engineering in ${landmarkCity}.` },
          { era: 'Cultural Transformation', description: 'Evolved into an unmistakable global symbol and meeting place.' },
        ],
        hiddenSecrets: [
          { title: 'Acoustic & Structural Marvels', story: 'Engineered with hidden architectural tolerances still celebrated today.' },
        ],
        narration: {
          script: `Welcome to ${landmarkName}. Standing in the heart of ${landmarkCity}, this landmark has witnessed centuries of human triumph. Every arch and beam holds an untold story.`,
          segments: [
            { id: 'seg1', startTime: 0, endTime: 8, text: `Welcome to ${landmarkName}. Standing in the heart of ${landmarkCity}.`, hotspotId: 'h1' },
            { id: 'seg2', startTime: 8, endTime: 16, text: 'This monument has witnessed generations of cultural triumphs.', hotspotId: 'h2' },
            { id: 'seg3', startTime: 16, endTime: 24, text: 'Every stone and beam holds a fascinating story for curious travelers.', hotspotId: 'h3' },
          ],
        },
      };
    }

    // Step 3: Audio Narration via gemini-3.8-flash-tts
    const narrationScript = parsedGrounded.narration?.script ||
      `Behold ${landmarkName}, towering proudly in ${landmarkCity}. Built in ${parsedVision.builtYear || 'history'}, it remains one of the world's greatest wonders.`;

    // Clean narration text for TTS (remove speaker prefix like "Alex:" or vocal tags that might be read out if unformatted)
    const cleanTTSPrompt = narrationScript.replace(/^[A-Za-z]+:\s*/, '').trim();

    let audioBase64: string | undefined = undefined;
    let audioMimeType = 'audio/wav';

    try {
      const ttsResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanTTSPrompt,
                speechMetadata: {
                  style: 'Captivating, natural AR documentary narrator with enthusiasm and crisp articulation',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice || 'Kore' },
            },
          },
        },
      });

      audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (ttsErr: any) {
      console.warn('gemini-3.8-flash-tts error, trying gemini-3.8-flash-lite-tts:', ttsErr?.message || ttsErr);
      try {
        const fallbackTTS = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: cleanTTSPrompt,
                  speechMetadata: {
                    style: 'Engaging, friendly museum audio guide',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: selectedVoice || 'Kore' },
              },
            },
          },
        });
        audioBase64 = fallbackTTS.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      } catch (liteErr: any) {
        console.warn('TTS fallback also unavailable:', liteErr?.message || liteErr);
      }
    }

    // Map segments to valid hotspots
    const hotspots: LandmarkHotspot[] = parsedVision.hotspots || [];
    const segments: NarrationSegment[] = (parsedGrounded.narration?.segments || []).map((seg: any, idx: number) => {
      const targetHotspot = hotspots[idx % hotspots.length];
      return {
        id: seg.id || `seg-${idx}`,
        startTime: typeof seg.startTime === 'number' ? seg.startTime : idx * 7,
        endTime: typeof seg.endTime === 'number' ? seg.endTime : (idx + 1) * 7,
        text: seg.text || '',
        hotspotId: seg.hotspotId || targetHotspot?.id,
      };
    });

    const result: LandmarkAnalysisResult = {
      name: parsedVision.name || 'Iconic Landmark',
      nativeName: parsedVision.nativeName,
      city: parsedVision.city || 'City',
      country: parsedVision.country || 'World',
      coordinates: parsedVision.coordinates,
      architecturalStyle: parsedVision.architecturalStyle || 'Notable Architecture',
      builtYear: parsedVision.builtYear || 'Historical',
      architect: parsedVision.architect || 'Master Builders',
      summary: parsedVision.summary || 'A renowned landmark and architectural jewel.',
      hotspots: hotspots.length > 0 ? hotspots : [
        { id: 'h1', title: 'Main Elevation', description: 'Central structural focal point', xPercent: 50, yPercent: 40, cameraFocus: 'arch' },
      ],
      fastFacts: parsedVision.fastFacts || [],
      historicalHighlights: parsedGrounded.historicalHighlights || [],
      hiddenSecrets: parsedGrounded.hiddenSecrets || [],
      groundedSources: groundedSources.slice(0, 6),
      searchQueries: searchQueries.slice(0, 5),
      narration: {
        script: cleanTTSPrompt,
        segments: segments,
        audioBase64: audioBase64,
        audioMimeType: audioMimeType,
        voiceName: selectedVoice,
      },
    };

    return res.json(result);
  } catch (error: any) {
    console.error('Error analyzing landmark:', error);
    return res.status(500).json({
      error: 'Failed to complete landmark analysis',
      message: error?.message || String(error),
    });
  }
});

// Re-generate TTS narration with a different voice
apiRouter.post('/synthesize-speech', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'Kore' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Missing text parameter' });
    }

    const ai = getGeminiClient();

    let audioBase64: string | undefined = undefined;
    try {
      const ttsResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text,
                speechMetadata: {
                  style: 'Cinematic, engaging AR documentary narrator with clear diction',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (err: any) {
      console.warn('gemini-3.8-flash-tts failed, using gemini-3.8-flash-lite-tts:', err?.message);
      const fallback = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [{ text: text }],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });
      audioBase64 = fallback.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    }

    if (!audioBase64) {
      return res.status(500).json({ error: 'No audio returned from TTS model' });
    }

    return res.json({
      audioBase64,
      mimeType: 'audio/wav',
      voice,
    });
  } catch (error: any) {
    console.error('TTS error:', error);
    return res.status(500).json({ error: 'TTS generation failed', message: error?.message });
  }
});

// Interactive Question Answering grounded via Google Search
apiRouter.post('/ask-guide', async (req: Request, res: Response) => {
  try {
    const { landmarkName, city, question } = req.body;
    if (!landmarkName || !question) {
      return res.status(400).json({ error: 'Missing landmarkName or question' });
    }

    const ai = getGeminiClient();
    const prompt = `You are the resident AR travel guide for ${landmarkName} in ${city || 'the city'}.
The tourist asks: "${question}".
Using Google Search grounding, give an accurate, fascinating, and helpful answer (2-3 short paragraphs). Include verified historical facts, visiting advice, or structural trivia.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const answer = response.text || 'Information currently unavailable.';
    const candidate = response.candidates?.[0];
    const metadata = (candidate as any)?.groundingMetadata;

    const sources: GroundingSource[] = [];
    if (metadata?.groundingChunks) {
      for (const chunk of metadata.groundingChunks) {
        if (chunk.web?.uri) {
          sources.push({
            title: chunk.web.title || chunk.web.uri,
            url: chunk.web.uri,
          });
        }
      }
    }

    return res.json({
      answer,
      sources: sources.slice(0, 4),
      queries: metadata?.webSearchQueries || [],
    });
  } catch (error: any) {
    console.error('Error answering guide question:', error);
    return res.status(500).json({ error: 'Failed to query guide', message: error?.message });
  }
});
