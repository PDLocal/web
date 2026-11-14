import { type Route } from './+types/privacy.ts'

export const meta: Route.MetaFunction = () => [
	{ title: 'Privacy Policy | PD Local' },
]

export default function PrivacyRoute() {
	return (
		<main className="container py-16">
			{/* DRAFT — NOT LEGAL ADVICE. NEEDS ATTORNEY REVIEW BEFORE LAUNCH. */}
			<h1 className="text-h3">Privacy Policy (Draft)</h1>
			<div className="text-body-md text-muted-foreground mt-6 max-w-2xl space-y-4">
				<p>
					PD Local is in a very early, pre-launch stage. Right now, here is
					everything we collect:
				</p>
				<ul className="list-disc space-y-2 pl-6">
					<li>
						<strong>Waitlist signup information.</strong> If you join our
						waitlist, we store the name and email address you provide so we can
						let you know when PD Local launches.
					</li>
					<li>
						<strong>A theme-preference cookie.</strong> If you choose a light or
						dark appearance, we remember that choice in a cookie on your device.
					</li>
					<li>
						<strong>Standard server logs.</strong> Like most websites, our
						server automatically logs basic technical information (such as IP
						address and request timing) for security and reliability.
					</li>
				</ul>
				<p>
					We will never sell your information, and we don't run ads. This policy
					will be expanded and reviewed by an attorney before PD Local fully
					launches.
				</p>
			</div>
		</main>
	)
}
