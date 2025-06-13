// utils/validateVideoDuration.ts

export const validateVideoDuration = async (
  file: File,
  maxSeconds: number
): Promise<boolean> => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration <= maxSeconds);
    };

    video.onerror = () => resolve(false); // Prevents hanging on broken files

    video.src = URL.createObjectURL(file);
  });
};
