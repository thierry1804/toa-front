import { z } from 'zod'

export const emailSchema = z.string().email('Email invalide')

export const passwordSchema = z
  .string()
  .min(8, 'Minimum 8 caractères')
  .max(128, 'Maximum 128 caractères')

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const permitSchema = z.object({
  titre: z.string().min(1, 'Le titre est requis').max(255),
  description: z.string().min(1, 'La description est requise'),
  expired_at: z.string().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type PermitFormData = z.infer<typeof permitSchema>
