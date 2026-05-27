export const getFriendlyFirebaseError = (error: any): string => {
  if (!error) return 'An unknown error occurred.';
  
  const code = error.code || '';
  const message = error.message || String(error);

  if (code === 'storage/object-not-found' || message.includes('object-not-found')) {
    return 'File not found or upload not completed.';
  }
  if (code === 'firestore/failed-precondition' || message.includes('failed-precondition')) {
    return 'Database index required. Please contact support.';
  }
  if (code.includes('permission-denied') || message.includes('permission')) {
    return 'You do not have permission to perform this action.';
  }
  if (code === 'unavailable' || message.includes('network')) {
    return 'Network issue. Please check your connection and try again.';
  }
  
  return message;
};

export const logError = (context: string, error: any) => {
  console.error(`[ERROR] [${context}]:`, error);
  // Future: Add Crashlytics logging here
};

export const logWarning = (context: string, message: string) => {
  console.warn(`[WARN] [${context}]:`, message);
};
