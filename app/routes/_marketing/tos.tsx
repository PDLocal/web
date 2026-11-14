import { type Route } from './+types/tos.ts'

export const meta: Route.MetaFunction = () => [
	{ title: 'Terms of Service | PD Local' },
]

export default function TermsOfServiceRoute() {
	return (
		<main className="container py-16">
			{/* DRAFT — NOT LEGAL ADVICE. NEEDS ATTORNEY REVIEW BEFORE LAUNCH. */}
			<h1 className="text-h3">Terms of Service (Draft)</h1>
			<p className="text-body-md text-muted-foreground mt-6 max-w-2xl">
				PD Local is in a pre-launch, "Pre-MVP" state. There are no user accounts
				yet — this version of the site only collects waitlist signups. Full
				terms of service will be written and reviewed by an attorney before user
				accounts and community features launch.
			</p>
		</main>
	)
}
