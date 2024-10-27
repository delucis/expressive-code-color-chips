import { defineEcConfig } from '@astrojs/starlight/expressive-code';
import { pluginColorChips } from 'expressive-code-color-chips';

export default defineEcConfig({
	plugins: [pluginColorChips()],
	styleOverrides: {
		colorChips: {
			// borderRadius: 0,
		},
	},
});
