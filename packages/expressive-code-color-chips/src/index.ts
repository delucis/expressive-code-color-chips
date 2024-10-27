import {
	type AnnotationBaseOptions,
	type AnnotationRenderOptions,
	definePlugin,
	ExpressiveCodeAnnotation,
	ExpressiveCodeLine,
	PluginStyleSettings,
} from '@expressive-code/core';
import { h } from '@expressive-code/core/hast';
import { colors } from './colorRegEx';

const chipClass = 'ec-css-color-chip';
const localColorVariable = '--ec-css-color-chip';
/** Language tags where CSS color annotations should apply. */
const cssDialects = new Set(['css', 'scss', 'sass', 'less', 'stylus']);

/** Adds an annotation to a CSS color, which will display that color as a chip next to it. */
class CssColorAnnotation extends ExpressiveCodeAnnotation {
	/** CSS color being annotated */
	color: string;

	constructor(opts: AnnotationBaseOptions & { color: string }) {
		super(opts);
		this.color = opts.color;
	}

	render({ nodesToTransform }: AnnotationRenderOptions) {
		return nodesToTransform.map((node) => {
			return h(`span.${chipClass}`, { style: `${localColorVariable}: ${this.color}` }, node);
		});
	}
}

/** Match all CSS comments in a line, including trailing unclosed comments or leading comments. */
const commentRegEx = /(?:^[^*]*\*\/)?\/\*[^*]*(?:\*\/)?/gi;

/**
 * Process a code block line and annotate any colors found.
 */
function annotateLine(line: ExpressiveCodeLine) {
	/** An array of character positions that are inside comments. */
	const commentPositions = [...line.text.matchAll(commentRegEx)]
		// Convert each match to an array of indexes for characters in that range.
		.flatMap((match) => Array.from(match[0]).map((_, i) => match.index + i));
	[
		// Colors expressed with explicit color syntax.
		...line.text.matchAll(colors.programmatic),
		// Colors expressed with a named keyword, e.g. “blue” or “Canvas”.
		...[...line.text.matchAll(colors.named)].filter(
			(match) => !commentPositions.includes(match.index)
		),
	]
		// Sort matches in reverse order by start position in the line (i.e. last match first).
		.sort((a, b) => b.index - a.index)
		// Annotate each match.
		.forEach((match) => {
			const color = match[0];
			const columnStart = match.index;
			const columnEnd = columnStart + color.length;
			line.addAnnotation(
				new CssColorAnnotation({
					color,
					inlineRange: { columnStart, columnEnd },
				})
			);
		});
}

/**
 * Expressive Code plugin that adds a small preview of each CSS color in your code examples.
 */
export function pluginColorChips() {
	return definePlugin({
		name: 'ColorChips',
		hooks: {
			postprocessAnalyzedCode({ codeBlock }) {
				if (cssDialects.has(codeBlock.language)) {
					codeBlock.getLines().forEach((line) => annotateLine(line));
				}
			},
		},
		styleSettings: new PluginStyleSettings({
			defaultValues: {
				colorChips: {
					size: '1.2em',
					borderWidth: '1px',
					borderRadius: '50%',
					borderColor: ({ theme }) => theme.fg,
					transparencyShadeOne: ['#777', '#fff'],
					transparencyShadeTwo: ['#000', '#bbb'],
				},
			},
		}),
		baseStyles({ cssVar }) {
			const a = cssVar('colorChips.transparencyShadeOne');
			const b = cssVar('colorChips.transparencyShadeTwo');
			return `
			.${chipClass}::before {
				content: "";
				display: inline-block;
				box-sizing: border-box;
				width: ${cssVar('colorChips.size')};
				height: ${cssVar('colorChips.size')};
				margin-inline-end: 0.25em;
				vertical-align: text-bottom;
				background:
					linear-gradient(var(${localColorVariable}), var(${localColorVariable})),
					conic-gradient(${b} 25%, ${a} 25%, ${a} 50%, ${b} 50%, ${b} 75%, ${a} 75%);
				border-width: ${cssVar('colorChips.borderWidth')};
				border-style: solid;
				border-color: ${cssVar('colorChips.borderColor')};
				border-radius: ${cssVar('colorChips.borderRadius')};
			}
			`;
		},
	});
}

interface ColorChipsStyleSettings {
	/** The size of each color chip. Default: `"1.2em"` */
	size: string;
	/** The width of the border around each color chip. Default: `"1px"` */
	borderWidth: string;
	/** The roundness of each color chip. Default: `"50%"` */
	borderRadius: string;
	/** The color of the border around each chip. Default: `({ theme }) => theme.fg` */
	borderColor: string;
	/** The first of two shades used in the checkerboard background for transparent colors. Default: `["#777", "#fff"]` */
	transparencyShadeOne: string;
	/** The second of two shades used in the checkerboard background for transparent colors. Default: `["#000", "#bbb"]` */
	transparencyShadeTwo: string;
}

declare module '@expressive-code/core' {
	export interface StyleSettings {
		/** Style overrides for the CSS color chips plugin. */
		colorChips: ColorChipsStyleSettings;
	}
}
