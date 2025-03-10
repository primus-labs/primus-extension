import { db } from '@/config/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';

// Define interface for handle mapping
export interface HandleMapping {
  tiktokHandle: string;
  xiaohongshuHandle: string;
  xiaohongshuUserId?: string; // Adding userId field
  createdAt: Timestamp;
}

/**
 * Save a mapping between TikTok and Xiaohongshu handles to Firestore
 * @param tiktokHandle TikTok username/handle
 * @param xiaohongshuHandle Xiaohongshu username/handle
 * @param xiaohongshuUserId Optional Xiaohongshu user ID for direct profile access
 * @returns The document ID of the saved mapping
 */
export const saveHandleMapping = async (
  tiktokHandle: string, 
  xiaohongshuHandle: string,
  xiaohongshuUserId?: string
): Promise<string> => {
  try {
    const handleMappingCollection = collection(db, 'handleMappings');
    
    // Create mapping object with timestamp
    const mapping: HandleMapping = {
      tiktokHandle,
      xiaohongshuHandle,
      ...(xiaohongshuUserId && { xiaohongshuUserId }), // Add userId if provided
      createdAt: Timestamp.now()
    };
    
    // Add document to Firestore
    const docRef = await addDoc(handleMappingCollection, mapping);
    console.log('Handle mapping saved with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error saving handle mapping:', error);
    throw error;
  }
};

/**
 * Search for a Xiaohongshu handle by TikTok handle
 * @param tiktokHandle TikTok username/handle to search for
 * @returns The handle mapping if found, or null if not found
 */
export const findXiaohongshuByTiktok = async (tiktokHandle: string): Promise<HandleMapping | null> => {
  try {
    const handleMappingCollection = collection(db, 'handleMappings');
    
    // Create a query to find mappings with the given TikTok handle
    const q = query(
      handleMappingCollection, 
      where('tiktokHandle', '==', tiktokHandle)
    );
    
    // Execute the query
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No handle mapping found for TikTok handle:', tiktokHandle);
      return null;
    }
    
    // Find the most recent mapping manually after getting results
    let mostRecent: HandleMapping | null = null;
    let mostRecentTimestamp = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as HandleMapping;
      const timestamp = data.createdAt.toMillis();
      
      if (!mostRecent || timestamp > mostRecentTimestamp) {
        // Include the userId if available
        mostRecent = {
          tiktokHandle: data.tiktokHandle,
          xiaohongshuHandle: data.xiaohongshuHandle,
          createdAt: data.createdAt,
          ...(data.xiaohongshuUserId && { xiaohongshuUserId: data.xiaohongshuUserId })
        };
        mostRecentTimestamp = timestamp;
      }
    });
    
    console.log('Found Xiaohongshu mapping:', mostRecent);
    return mostRecent;
  } catch (error) {
    console.error('Error finding Xiaohongshu handle:', error);
    throw error;
  }
};

/**
 * Get all handle mappings
 * @param limit Number of mappings to return (default: 100)
 * @returns Array of handle mappings
 */
export const getAllHandleMappings = async (resultsLimit: number = 100): Promise<HandleMapping[]> => {
  try {
    const handleMappingCollection = collection(db, 'handleMappings');
    
    // Create a simple query without ordering to avoid index requirements
    const q = query(
      handleMappingCollection
    );
    
    // Execute the query
    const querySnapshot = await getDocs(q);
    
    // Map the documents to HandleMapping objects
    const mappings = querySnapshot.docs.map(doc => ({
      ...doc.data() as HandleMapping,
      createdAt: doc.data().createdAt as Timestamp
    }));
    
    // Sort manually by createdAt (descending)
    mappings.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    
    // Return only up to the limit
    return mappings.slice(0, resultsLimit);
  } catch (error) {
    console.error('Error getting handle mappings:', error);
    throw error;
  }
};

/**
 * Check if a mapping between specific TikTok and Xiaohongshu handles already exists
 * @param tiktokHandle TikTok username/handle
 * @param xiaohongshuHandle Xiaohongshu username/handle
 * @returns True if mapping exists, false otherwise
 */
export const doesMappingExist = async (tiktokHandle: string, xiaohongshuHandle: string): Promise<boolean> => {
  try {
    const handleMappingCollection = collection(db, 'handleMappings');
    
    // First check for exact match of both handles
    const exactMatchQuery = query(
      handleMappingCollection, 
      where('tiktokHandle', '==', tiktokHandle),
      where('xiaohongshuHandle', '==', xiaohongshuHandle)
    );
    
    const querySnapshot = await getDocs(exactMatchQuery);
    
    // If we found any results, this mapping already exists
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if mapping exists:', error);
    // Return false in case of error, to allow attempted save
    return false;
  }
}; 