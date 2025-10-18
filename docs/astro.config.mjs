// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://delucis.github.io',
	base: '/expressive-code-color-chips',
	integrations: [
		starlight({
			title: 'Expressive Code Color Chips',
			description:
				'CSS color preview plugin for Expressive Code. Display a small sample of each CSS color in your code examples.',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/delucis/expressive-code-color-chips',
				},
			],
			sidebar: ['getting-started', 'configuration'],
			customCss: ['./src/styles.css'],
			head: [
				{
					tag: 'meta',
					attrs: {
						property: 'og:image',
						content: 'https://delucis.github.io/expressive-code-color-chips/og.png',
					},
				},
			],
		}),
	],
});
