import { invariant } from '@epic-web/invariant'
import { faker } from '@faker-js/faker'
import { prisma } from '#app/utils/db.server.ts'
import { readEmail } from '#tests/mocks/utils.ts'
import { expect, test as base } from '#tests/playwright-utils.ts'

const test = base.extend<{
	getWaitlistData(): { firstName: string; email: string }
}>({
	getWaitlistData: async ({}, use) => {
		const waitlistData = {
			firstName: faker.person.firstName(),
			email: faker.internet.email().toLowerCase(),
		}
		await use(() => waitlistData)
		await prisma.contact.deleteMany({ where: { email: waitlistData.email } })
	},
})

test('joins the waitlist from the homepage', async ({
	page,
	navigate,
	getWaitlistData,
}) => {
	const waitlistData = getWaitlistData()

	await navigate('/')

	await page
		.getByRole('textbox', { name: /first name/i })
		.fill(waitlistData.firstName)
	await page.getByRole('textbox', { name: /email/i }).fill(waitlistData.email)

	await page.getByRole('button', { name: /join|sign up|submit/i }).click()

	await expect(page.getByText(/on the list/i)).toBeVisible()

	const contact = await prisma.contact.findUnique({
		where: { email: waitlistData.email },
	})
	invariant(contact, 'Contact was not created')
	expect(contact.firstName).toBe(waitlistData.firstName)

	const email = await readEmail(waitlistData.email)
	invariant(email, 'Welcome email not found')
	expect(email.subject).toMatch(/waitlist/i)
	expect(email.from).toBe('hello@pdlocal.org')
})
