import { type Route } from './+types/support.ts'

export const meta: Route.MetaFunction = () => [{ title: 'Support | PD Local' }]

export default function SupportRoute() {
	return (
		<main className="container py-16">
			<h1 className="text-h3">Need help right now?</h1>
			<p className="text-body-md mt-6 max-w-2xl">
				If you or someone you love is in crisis, call or text{' '}
				<strong>988</strong> (Suicide &amp; Crisis Lifeline) — available 24/7.
			</p>
			<p className="text-body-md text-muted-foreground mt-4 max-w-2xl">
				Have a question about PD Local itself? Email us at{' '}
				<a href="mailto:hello@pdlocal.org" className="text-primary underline">
					hello@pdlocal.org
				</a>
				.
			</p>
		</main>
	)
}
