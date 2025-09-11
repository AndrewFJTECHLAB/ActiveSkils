// types/express.d.ts
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    payload?: any; // or a specific type instead of `any`
  }
}
