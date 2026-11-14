import { z } from 'zod'
import { EmailSchema } from '#app/utils/user-validation.ts'

export const ContactSchema = z.object({
	firstName: z
		.string({ required_error: 'First name is required' })
		.trim()
		.min(1, 'First name is required')
		.max(50, 'First name is too long'),
	lastName: z.string().trim().max(50, 'Last name is too long').optional(),
	email: EmailSchema,
})
