// SPDX-License-Identifier: MIT
// Third-party software bundled in the plugin package (design 20.2, 20.4),
// shown on the settings screen (a drop-down list at the bottom) so that users
// can see it in Joplin. scripts/check-licenses.mjs checks that the versions
// match vendor/echarts/SOURCE.md and the installed packages. The full license
// texts are in THIRD_PARTY_NOTICES.md (also inside the .jpl).

export interface ThirdPartyComponent {
	/** Option value in the settings screen list. */
	id: string;
	name: string;
	version: string;
	license: string;
	url: string;
}

export const THIRD_PARTY: ThirdPartyComponent[] = [
	{ id: 'echarts', name: 'Apache ECharts', version: '6.1.0', license: 'Apache-2.0', url: 'https://echarts.apache.org/' },
	{ id: 'd3', name: 'Parts of d3', version: 'in ECharts 6.1.0', license: 'BSD-3-Clause', url: 'https://github.com/d3/d3' },
	{ id: 'zrender', name: 'ZRender', version: '6.1.0', license: 'BSD-3-Clause', url: 'https://github.com/ecomfe/zrender' },
	{ id: 'tslib', name: 'tslib', version: '2.3.0', license: '0BSD', url: 'https://github.com/microsoft/tslib' },
	{ id: 'dompurify', name: 'DOMPurify', version: '3.4.17', license: 'Apache-2.0', url: 'https://github.com/cure53/DOMPurify' },
	{ id: 'regenerator-runtime', name: 'regenerator-runtime', version: 'in DOMPurify 3.4.17', license: 'MIT', url: 'https://github.com/facebook/regenerator' },
	{ id: 'yaml', name: 'YAML (yaml)', version: '2.9.1', license: 'ISC', url: 'https://eemeli.org/yaml/' },
];

/** One line for a component: "Apache ECharts 6.1.0 - Apache-2.0 - https://echarts.apache.org/". */
export function thirdPartyLine(c: ThirdPartyComponent): string {
	return `${c.name} ${c.version} - ${c.license} - ${c.url}`;
}
