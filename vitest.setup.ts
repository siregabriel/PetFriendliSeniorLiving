import { config } from 'dotenv';
import path from 'path';
import '@testing-library/jest-dom';

// Load environment variables from .env.local
config({ path: path.resolve(__dirname, '.env.local') });

// Required for React 19 + @testing-library/react to flush state updates in tests
// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
