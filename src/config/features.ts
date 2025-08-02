// Conditional import based on environment mode
import { FEATURES as DEV_FEATURES } from './features.dev';
import { FEATURES as PROD_FEATURES } from './features.prod';

// Export the appropriate FEATURES object based on the current mode
export const FEATURES = import.meta.env.MODE === 'production' ? PROD_FEATURES : DEV_FEATURES;