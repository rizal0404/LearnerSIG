import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Frame, Page } from 'playwright';

export type TranscriptCue = {
  startSeconds: number | null;
  endSeconds: number | null;
  text: string;
};

export type VideoTranscript = {
  extractedAt: string;
  status: 'found' | 'not-found';
  source: 'text-track' | 'track-src' | 'visible-transcript' | 'none';
  language: string | null;
  cueCount: number;
  text: string;
  cues: TranscriptCue[];
  filePath: string | null;
};

type RawTranscript = Omit<VideoTranscript, 'extractedAt' | 'filePath'>;

export async function extractVideoTranscript(page: Page, outputDirectory: string, videoIndex: number, videoTitle: string): Promise<VideoTranscript> {
  const rawTranscript = await readTranscriptFromPage(page);
  const extractedAt = new Date().toISOString();

  if (rawTranscript.status === 'not-found') {
    return {
      ...rawTranscript,
      extractedAt,
      filePath: null
    };
  }

  await mkdir(outputDirectory, { recursive: true });
  const filePath = join(outputDirectory, `${String(videoIndex).padStart(2, '0')}-${toSafeFileName(videoTitle)}.txt`);
  await writeFile(filePath, formatTranscript(rawTranscript, videoIndex, videoTitle, extractedAt), 'utf8');

  return {
    ...rawTranscript,
    extractedAt,
    filePath
  };
}

async function readTranscriptFromPage(page: Page): Promise<RawTranscript> {
  for (const frame of page.frames()) {
    const transcript = await readTranscriptFromFrame(frame);
    if (transcript.status === 'found') {
      return transcript;
    }
  }

  return {
    status: 'not-found',
    source: 'none',
    language: null,
    cueCount: 0,
    text: '',
    cues: []
  };
}

async function readTranscriptFromFrame(frame: Frame): Promise<RawTranscript> {
  return await frame.evaluate(`(async () => {
    const normalizeText = (value) => (value || '').replace(/\\s+/g, ' ').trim();
    const toSeconds = (value) => Number.isFinite(value) ? Number(value) : null;
    const uniqueCues = (cues) => {
      const seen = new Set();
      return cues.filter((cue) => {
        const key = [cue.startSeconds, cue.endSeconds, cue.text].join('|');
        if (!cue.text || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };
    const build = (source, language, cues) => {
      const cleanedCues = uniqueCues(cues);
      return {
        status: cleanedCues.length > 0 ? 'found' : 'not-found',
        source: cleanedCues.length > 0 ? source : 'none',
        language: language || null,
        cueCount: cleanedCues.length,
        text: cleanedCues.map((cue) => cue.text).join('\\n'),
        cues: cleanedCues
      };
    };

    const video = [...document.querySelectorAll('video')].find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    if (video) {
      for (const track of [...video.textTracks]) {
        track.mode = 'hidden';
        const cues = [...(track.cues || [])].map((cue) => ({
          startSeconds: toSeconds(cue.startTime),
          endSeconds: toSeconds(cue.endTime),
          text: normalizeText(cue.text)
        }));
        const transcript = build('text-track', track.language || track.label, cues);
        if (transcript.status === 'found') return transcript;
      }

      for (const trackElement of [...video.querySelectorAll('track[src]')]) {
        const sourceUrl = new URL(trackElement.getAttribute('src'), document.baseURI).href;
        try {
          const response = await fetch(sourceUrl, { credentials: 'include' });
          if (!response.ok) continue;
          const body = await response.text();
          const cues = parseVtt(body);
          const transcript = build('track-src', trackElement.srclang || trackElement.label, cues);
          if (transcript.status === 'found') return transcript;
        } catch {
          // Ignore inaccessible subtitle files and continue with other fallbacks.
        }
      }
    }

    const transcriptElement = [...document.querySelectorAll('[class*=transcript i], [id*=transcript i], [class*=subtitle i], [id*=subtitle i], [class*=caption i], [id*=caption i]')]
      .find((element) => normalizeText(element.textContent).length > 40);

    if (transcriptElement) {
      const lines = normalizeText(transcriptElement.textContent).split(/(?<=[.!?])\\s+/).filter(Boolean);
      return build('visible-transcript', null, lines.map((text) => ({ startSeconds: null, endSeconds: null, text })));
    }

    return build('none', null, []);

    function parseVtt(value) {
      return value
        .replace(/^WEBVTT.*$/m, '')
        .split(/\\n\\s*\\n/g)
        .map((block) => {
          const lines = block.split(/\\r?\\n/).map((line) => line.trim()).filter(Boolean);
          const timingIndex = lines.findIndex((line) => line.includes('-->'));
          if (timingIndex < 0) return null;
          const [start, end] = lines[timingIndex].split('-->').map((part) => part.trim().split(/\\s+/)[0]);
          const text = normalizeText(lines.slice(timingIndex + 1).join(' ').replace(/<[^>]+>/g, ''));
          return {
            startSeconds: parseTimestamp(start),
            endSeconds: parseTimestamp(end),
            text
          };
        })
        .filter(Boolean);
    }

    function parseTimestamp(value) {
      const match = value.match(/(?:(\\d+):)?(\\d{2}):(\\d{2})[.,](\\d{3})/);
      if (!match) return null;
      const hours = Number(match[1] || 0);
      const minutes = Number(match[2]);
      const seconds = Number(match[3]);
      const milliseconds = Number(match[4]);
      return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
    }
  })()`) as RawTranscript;
}

function formatTranscript(transcript: RawTranscript, videoIndex: number, videoTitle: string, extractedAt: string): string {
  const header = [
    `Video #${videoIndex}: ${videoTitle}`,
    `Extracted at: ${extractedAt}`,
    `Source: ${transcript.source}`,
    `Language: ${transcript.language ?? 'unknown'}`,
    `Cue count: ${transcript.cueCount}`,
    ''
  ];

  return `${header.join('\n')}${transcript.cues.map(formatCue).join('\n')}\n`;
}

function formatCue(cue: TranscriptCue): string {
  if (cue.startSeconds === null || cue.endSeconds === null) {
    return cue.text;
  }

  return `[${formatSeconds(cue.startSeconds)} - ${formatSeconds(cue.endSeconds)}] ${cue.text}`;
}

function formatSeconds(value: number): string {
  const totalSeconds = Math.floor(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

function toSafeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'video';
}
