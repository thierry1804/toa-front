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

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirmation requise'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

export const permitSchema = z.object({
  titre: z.string().min(1, 'Le titre est requis').max(255),
  description: z.string().min(1, 'La description est requise'),
  expired_at: z.string().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type PermitFormData = z.infer<typeof permitSchema>
