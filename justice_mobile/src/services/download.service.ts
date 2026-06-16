// PATH: src/services/download.service.ts
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Imports natifs uniquement sur mobile
let FileSystem: any = null;
let Sharing: any = null;
if (Platform.OS !== 'web') {
  FileSystem = require('expo-file-system');
  Sharing = require('expo-sharing');
}

const STORAGE_KEY = 'my_downloads_metadata';

export interface DownloadedItem {
  id: string;
  title: string;
  localUri: string;
  mimeType: string;
  downloadedAt: string;
}

// 1. Sauvegarder un fichier
export const downloadAndSave = async (url: string, title: string, id: string) => {
  try {
    // Sur web : ouvrir le fichier dans un nouvel onglet (le navigateur gère le téléchargement)
    if (Platform.OS === 'web') {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      const newItem: DownloadedItem = {
        id, title, localUri: url, mimeType: 'application/pdf',
        downloadedAt: new Date().toISOString(),
      };
      const currentList = await getDownloads();
      const newList = [newItem, ...currentList.filter(i => i.id !== id)];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newItem;
    }

    // Sur mobile : téléchargement via FileSystem
    const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const fileUri = (FileSystem.Paths.document.uri ?? '') + filename;
    const downloadRes = await FileSystem.downloadAsync(url, fileUri);

    if (downloadRes.status !== 200) throw new Error("Échec du téléchargement");

    const newItem: DownloadedItem = {
      id, title, localUri: downloadRes.uri, mimeType: 'application/pdf',
      downloadedAt: new Date().toISOString(),
    };

    const currentList = await getDownloads();
    const newList = [newItem, ...currentList.filter(i => i.id !== id)];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    return newItem;

  } catch (error) {
    console.error("Erreur downloadAndSave:", error);
    throw error;
  }
};

// 2. Récupérer la liste des téléchargements
export const getDownloads = async (): Promise<DownloadedItem[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    return [];
  }
};

// 3. Supprimer un téléchargement
export const deleteDownload = async (id: string) => {
  try {
    const list = await getDownloads();
    const item = list.find(i => i.id === id);
    if (item) {
      if (Platform.OS !== 'web') {
        await FileSystem.deleteAsync(item.localUri, { idempotent: true });
      }
      const newList = list.filter(i => i.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    }
  } catch (error) {
    console.error("Erreur suppression:", error);
  }
};

// 4. Ouvrir un fichier
export const openFile = async (localUri: string) => {
  if (Platform.OS === 'web') {
    window.open(localUri, '_blank');
    return;
  }
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(localUri);
  }
};
