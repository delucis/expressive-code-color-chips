import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { ExpressiveCodeEngine } from '@expressive-code/core';
import { toHtml, toText } from '@expressive-code/core/hast';
import { pluginColorChips } from '../dist/index.js';

async function render(code, options = {}) {
	const engine = new ExpressiveCodeEngine({
		plugins: [pluginColorChips({ languages: ['text'], ...options })],
	});
	return engine.render({ code, language: 'text', meta: '' });
}

function countChips(html) {
	return html.match(/class="ec-css-color-chip"/g)?.length ?? 0;
}

describe('escape marker', () => {
	test('suppresses an individual hexadecimal color without rendering the marker', async () => {
		const result = await render('visible #0570b0 hidden \\#2db572', { escapeMarker: '\\' });
		const html = toHtml(result.renderedGroupAst);

		assert.equal(countChips(html), 1);
		assert.match(html, /--ec-css-color-chip: #0570b0/);
		assert.doesNotMatch(html, /--ec-css-color-chip: #2db572/);
		assert.equal(toText(result.renderedGroupAst), 'visible #0570b0 hidden #2db572');
	});

	test('suppresses named colors and multiple colors on one line', async () => {
		const result = await render('\\salmon \\#2db572 blue', { escapeMarker: '\\' });
		const html = toHtml(result.renderedGroupAst);

		assert.equal(countChips(html), 1);
		assert.match(html, /--ec-css-color-chip: blue/);
		assert.equal(toText(result.renderedGroupAst), 'salmon #2db572 blue');
	});

	test('preserves markers that do not immediately precede a color', async () => {
		const result = await render('path\\segment \\not-a-color #2db572', { escapeMarker: '\\' });
		const html = toHtml(result.renderedGroupAst);

		assert.equal(countChips(html), 1);
		assert.equal(toText(result.renderedGroupAst), 'path\\segment \\not-a-color #2db572');
	});

	test('supports custom multi-character markers', async () => {
		const result = await render('plain #0570b0 hidden !#!#2db572', {
			escapeMarker: '!#!',
		});
		const html = toHtml(result.renderedGroupAst);

		assert.equal(countChips(html), 1);
		assert.equal(toText(result.renderedGroupAst), 'plain #0570b0 hidden #2db572');
	});

	test('only removes markers in enabled languages', async () => {
		const engine = new ExpressiveCodeEngine({
			plugins: [pluginColorChips({ languages: ['css'], escapeMarker: '\\' })],
		});
		const result = await engine.render({ code: '\\#2db572', language: 'text', meta: '' });

		assert.equal(countChips(toHtml(result.renderedGroupAst)), 0);
		assert.equal(toText(result.renderedGroupAst), '\\#2db572');
	});

	test('does not change behavior unless an escape marker is configured', async () => {
		const result = await render('\\#2db572');

		assert.equal(countChips(toHtml(result.renderedGroupAst)), 1);
		assert.equal(toText(result.renderedGroupAst), '\\#2db572');
	});

	test('rejects an empty escape marker', () => {
		assert.throws(() => pluginColorChips({ escapeMarker: '' }), /cannot be empty/);
	});
});
