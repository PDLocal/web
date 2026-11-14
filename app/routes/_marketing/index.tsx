import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import * as React from 'react'
import { Form } from 'react-router'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { ErrorList, Field } from '#app/components/forms.tsx'
import { buttonVariants } from '#app/components/ui/button.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { useIsPending } from '#app/utils/misc.tsx'
import { ContactSchema } from './+landing/waitlist.server.tsx'
import { type Route } from './+types/index.ts'

export { action } from './+landing/waitlist.server.tsx'

export const meta: Route.MetaFunction = () => [
	{ title: `PD Local — You're not doing this alone` },
	{
		name: 'description',
		content: `Free support and community for people with Parkinson's and their caregivers.`,
	},
]

export default function Index({ actionData }: Route.ComponentProps) {
	return (
		<main>
			<Hero />
			<Encouragement />
			<About />
			<Articles />
			<Resources />
			<WaitlistSignup actionData={actionData} />
			<Disclaimer />
		</main>
	)
}

function Section({
	className,
	children,
	...props
}: React.ComponentProps<'section'>) {
	return (
		<section className={`container py-16 ${className ?? ''}`} {...props}>
			{children}
		</section>
	)
}

function Hero() {
	return (
		<Section className="text-center">
			{/* PLACEHOLDER COPY — on-topic but not final; a content creator will replace this. */}
			<h1 className="text-h2 sm:text-h1">You're not doing this alone.</h1>
			<p className="text-body-lg text-muted-foreground mx-auto mt-6 max-w-2xl">
				PD Local is a free place for people living with Parkinson's — and the
				people who care for them — to find support, real information, and each
				other.
			</p>
			<a
				href="#waitlist"
				className={`${buttonVariants({ size: 'lg' })} focus-visible:ring-ring mt-10 inline-block focus-visible:ring-2 focus-visible:ring-offset-2`}
			>
				Join the Waitlist
			</a>
		</Section>
	)
}

function Encouragement() {
	const blurbs = [
		'You know your body better than any chart.',
		'Asking for help is not giving up.',
		'Every day you show up is a win — even the hard ones.',
		'Caregivers need care too.',
	]
	return (
		<Section className="bg-secondary/40">
			{/* PLACEHOLDER COPY — on-topic but not final; a content creator will replace this. */}
			<ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{blurbs.map((blurb) => (
					<li
						key={blurb}
						className="bg-card text-card-foreground rounded-lg p-6 text-center shadow-sm"
					>
						<p className="text-body-md">{blurb}</p>
					</li>
				))}
			</ul>
		</Section>
	)
}

function About() {
	return (
		<Section>
			{/* PLACEHOLDER COPY — on-topic but not final; a content creator will replace this. */}
			<div className="mx-auto max-w-2xl text-center">
				<h2 className="text-h4 sm:text-h3">Get to know us</h2>
				<p className="text-body-md text-muted-foreground mt-6">
					PD Local is being built by people who've watched someone they love
					navigate Parkinson's and wished there was one place — not ten — to
					find real information and people who get it. We're not a hospital, a
					drug company, or a research institution. We're neighbors, building the
					thing we wished existed.
				</p>
			</div>
		</Section>
	)
}

function Articles() {
	const articles = [
		'Newly diagnosed? Start here.',
		'Talking to your doctor about medication timing.',
		"A caregiver's guide to the first hard conversation.",
	]
	return (
		<Section className="bg-secondary/40">
			{/* PLACEHOLDER COPY — on-topic but not final; a content creator will replace this. */}
			<h2 className="text-h4 sm:text-h3 text-center">Articles</h2>
			<ul className="mx-auto mt-8 grid max-w-4xl gap-6 sm:grid-cols-3">
				{articles.map((title) => (
					<div
						key={title}
						className="bg-card text-card-foreground flex flex-col gap-3 rounded-lg p-6 shadow-sm"
					>
						<span className="text-muted-foreground text-body-2xs font-semibold tracking-wide uppercase">
							Coming soon
						</span>
						<p className="text-body-sm">{title}</p>
					</div>
				))}
			</ul>
		</Section>
	)
}

function Resources() {
	const resources = [
		{ name: 'Parkinson’s Foundation', href: 'https://www.parkinson.org' },
		{
			name: 'Michael J. Fox Foundation',
			href: 'https://www.michaeljfox.org',
		},
	]
	return (
		<Section>
			<h2 className="text-h4 sm:text-h3 text-center">Public resources</h2>
			<ul className="mx-auto mt-8 flex max-w-xl flex-col gap-4">
				{resources.map((resource) => (
					<li key={resource.href}>
						<a
							href={resource.href}
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary focus-visible:ring-ring text-body-md block rounded-md px-2 py-2 underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
						>
							{resource.name}
						</a>
					</li>
				))}
			</ul>
		</Section>
	)
}

function WaitlistSignup({
	actionData,
}: {
	actionData: Route.ComponentProps['actionData']
}) {
	const isPending = useIsPending()
	const [form, fields] = useForm({
		id: 'waitlist-form',
		constraint: getZodConstraint(ContactSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ContactSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<Section id="waitlist" className="bg-secondary/40">
			<div className="mx-auto max-w-sm min-w-full sm:min-w-[368px]">
				<div className="text-center">
					<h2 className="text-h4 sm:text-h3">Waitlist Signup</h2>
					<p className="text-body-sm text-muted-foreground mt-3">
						We'll never share your email. No spam — just a note when we launch,
						and maybe some encouragement along the way.
					</p>
				</div>
				<Form method="POST" className="mt-8" {...getFormProps(form)}>
					<HoneypotInputs />
					<Field
						labelProps={{ children: 'First Name' }}
						inputProps={{
							...getInputProps(fields.firstName, { type: 'text' }),
							autoComplete: 'given-name',
							className: 'h-12',
						}}
						errors={fields.firstName.errors}
					/>
					<Field
						labelProps={{ children: 'Last Name' }}
						inputProps={{
							...getInputProps(fields.lastName, { type: 'text' }),
							autoComplete: 'family-name',
							className: 'h-12',
						}}
						errors={fields.lastName.errors}
					/>
					<Field
						labelProps={{ children: 'Email' }}
						inputProps={{
							...getInputProps(fields.email, { type: 'email' }),
							autoComplete: 'email',
							className: 'h-12',
						}}
						errors={fields.email.errors}
					/>
					<ErrorList errors={form.errors} id={form.errorId} />
					<StatusButton
						className="w-full"
						status={isPending ? 'pending' : (form.status ?? 'idle')}
						type="submit"
						disabled={isPending}
					>
						Join the Waitlist
					</StatusButton>
				</Form>
			</div>
		</Section>
	)
}

function Disclaimer() {
	return (
		<Section className="py-10">
			{/* NEEDS LEGAL REVIEW */}
			<p className="text-body-2xs text-muted-foreground mx-auto max-w-2xl text-center">
				PD Local is a peer support and information community. We are not a
				medical provider, and nothing here is medical advice. Always talk to
				your doctor or care team about your treatment.
			</p>
		</Section>
	)
}
