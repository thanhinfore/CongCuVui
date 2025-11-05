export const ERROR_NOT_LOADED = new Error("FFmpeg is not loaded, call `await ffmpeg.load()` first");
export const ERROR_TERMINATED = new Error("called FFmpeg.terminate()");
export const ERROR_IMPORT_FAILURE = new Error("failed to import ffmpeg-core.js");
