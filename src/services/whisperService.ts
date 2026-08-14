// Uses whisper.rn, which wraps whisper.cpp and runs fully on-device
// (no network call). Install:
//   npm install whisper.rn react-native-audio-recorder-player
//
// The ggml model (tiny/base) must be bundled with the app or
// downloaded on first launch. Tiny (~75MB) is plenty for short
// command-style utterances like task reminders.

import { initWhisper, WhisperContext } from 'whisper.rn';
import RNFS from 'react-native-fs';

class WhisperService {
  private context: WhisperContext | null = null;

  async init(): Promise<void> {
    if (this.context) return;

    // Point this at your bundled/downloaded model file.
    const modelPath = `${RNFS.DocumentDirectoryPath}/ggml-tiny.bin`;

    this.context = await initWhisper({
      filePath: modelPath,
    });
  }

  /**
   * Transcribes a recorded audio file (WAV, 16kHz mono recommended)
   * and returns the plain text transcript.
   */
  async transcribe(audioFilePath: string): Promise<string> {
    if (!this.context) {
      await this.init();
    }

    const { promise } = this.context!.transcribe(audioFilePath, {
      language: 'en',
    });

    const result = await promise;
    return result.result.trim();
  }

  getNextRecordingPath(): string {
    const filename = `recording_${Date.now()}.wav`;
    return `${RNFS.CachesDirectoryPath}/${filename}`;
  }
}

export default new WhisperService();
