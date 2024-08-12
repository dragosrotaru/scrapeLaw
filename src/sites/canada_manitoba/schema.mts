import { z } from 'zod';

export const schema = z.object({
  name: z.string(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  fax: z.string().nullable(),
  email: z.string().email().nullable(),
  firm: z.string().nullable(),
  status: z.string(),
  callDate: z.string().nullable(),
  disciplined: z.string().url().nullable(),
});