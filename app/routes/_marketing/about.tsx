import { type Route } from './+types/about.ts'

export const meta: Route.MetaFunction = () => [{ title: 'About | PD Local' }]

export default function AboutRoute() {
	return (
		<main className="container py-16">
			<h1 className="text-h3">About PD Local</h1>
			{/* PLACEHOLDER — replace with real founder voice/story */}
			<p className="text-body-md text-muted-foreground mt-6 max-w-2xl">
				PD Local is being built by people who've watched someone they love
				navigate Parkinson's and wished there was one place — not ten — to find
				real information and people who get it. We're not a hospital, a drug
				company, or a research institution. We're neighbors, building the thing
				we wished existed.
			</p>
		</main>
	)
}
