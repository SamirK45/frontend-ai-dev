import { WebContainer } from '@webcontainer/api';

// Call only once
let webcontainerInstance = null;

export const getWebContainer = async () => {
  if (webcontainerInstance === null) {
    try {
      webcontainerInstance = await WebContainer.boot();
    } catch (error) {
      console.error(
        "Failed to boot WebContainer. Ensure your server sends the required headers:\n" +
        "  Cross-Origin-Embedder-Policy: require-corp\n" +
        "  Cross-Origin-Opener-Policy: same-origin\n",
        error
      );
      return null;
    }
  }
  return webcontainerInstance;
};