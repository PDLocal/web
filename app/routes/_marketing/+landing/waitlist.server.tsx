import { parseWithZod } from '@conform-to/zod'
import * as E from '@react-email/components'
import { data, type ActionFunctionArgs } from 'react-router'
import { prisma } from '#app/utils/db.server.ts'
import { sendEmail, upsertResendContact } from '#app/utils/email.server.ts'
import { checkHoneypot } from '#app/utils/honeypot.server.ts'
import { createToastHeaders } from '#app/utils/toast.server.ts'
import { ContactSchema } from './waitlist-schema.ts'

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	await checkHoneypot(formData)
	const submission = parseWithZod(formData, { schema: ContactSchema })

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { email, firstName, lastName } = submission.value

	const existingContact = await prisma.contact.findUnique({
		where: { email },
	})

	if (existingContact) {
		await prisma.contact.update({
			where: { email },
			data: { firstName, lastName },
		})
		void upsertResendContact({ email, firstName, lastName }).catch((e) =>
			console.error('Resend upsert failed:', e),
		)
		const toastHeaders = await createToastHeaders({
			title: `Welcome back, ${firstName}!`,
			description: `Your email was already on the list — we updated your name.`,
			type: 'success',
		})
		return data({ result: submission.reply() }, { headers: toastHeaders })
	}

	await prisma.contact.create({ data: { email, firstName, lastName } })
	void upsertResendContact({ email, firstName, lastName }).catch((e) =>
		console.error('Resend upsert failed:', e),
	)
	void sendEmail({
		to: email,
		subject: `You're on the PD Local waitlist`,
		react: <WaitlistWelcomeEmail firstName={firstName} />,
	}).catch((e) => console.error('Waitlist welcome email failed:', e))

	const toastHeaders = await createToastHeaders({
		title: `You're on the list, ${firstName}!`,
		description: `We'll let you know the moment PD Local opens.`,
		type: 'success',
	})
	return data({ result: submission.reply() }, { headers: toastHeaders })
}

function WaitlistWelcomeEmail({ firstName }: { firstName: string }) {
	return (
		<E.Html lang="en" dir="ltr">
			<E.Container>
				<p>
					<E.Text>Hi {firstName},</E.Text>
				</p>
				<p>
					<E.Text>
						You're on the PD Local waitlist. We're building a free place for
						people living with Parkinson's — and the people who care for them —
						to find real information, support, and each other.
					</E.Text>
				</p>
				<p>
					<E.Text>
						We'll let you know the moment things open up. In the meantime, if
						you ever just want to talk to a human, reply to this email.
					</E.Text>
				</p>
			</E.Container>
		</E.Html>
	)
}
