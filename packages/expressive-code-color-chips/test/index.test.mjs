import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { ExpressiveCodeEngine } from '@expressive-code/core';
import { toHtml } from '@expressive-code/core/hast';
import { pluginColorChips } from '../dist/index.js';

async function render(code) {
	const engine = new ExpressiveCodeEngine({
		plugins: [pluginColorChips({ languages: ['metro'] })],
	});
	const result = await engine.render({ code, language: 'metro', meta: '' });
	return toHtml(result.renderedGroupAst);
}

function countChips(html) {
	return html.match(/class="ec-css-color-chip"/g)?.length ?? 0;
}

describe('named colors', () => {
	test('annotates standalone color keywords', async () => {
		const html = await render('color: salmon; border-color: darkred;');

		assert.equal(countChips(html), 2);
		assert.match(html, /--ec-css-color-chip: salmon/);
		assert.match(html, /--ec-css-color-chip: darkred/);
	});

	test('does not annotate color keywords inside identifiers', async () => {
		const html = await render('star_salmon salmon_star darkredValue red-500');

		assert.equal(countChips(html), 0);
	});

	test('continues to annotate other color syntaxes beside identifiers', async () => {
		const html = await render(
			'%%metro line: star_salmon | Aligner: STAR, Quantification: RSEM | #2db572'
		);

		assert.equal(countChips(html), 1);
		assert.match(html, /--ec-css-color-chip: #2db572/);
	});
});
