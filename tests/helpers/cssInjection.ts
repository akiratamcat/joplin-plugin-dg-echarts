// SPDX-License-Identifier: MIT
// Test helpers: every series sample with CSS that loads an external URL put
// into the string style options ECharts writes into the SVG (colours, fonts,
// dash types, cursors...), in three forms (1.0.2, design 12):
// - "url":       a CSS url() as the whole value
// - "attr":      a declaration added after ";" (style attributes)
// - "rule":      a rule added after "}" (<style> elements)
// Each place gets its own URL, so a failing test names the option.
import { SAMPLES } from './samples';

export type InjectionForm = 'url' | 'attr' | 'rule';
export const INJECTION_FORMS: InjectionForm[] = ['url', 'attr', 'rule'];

const STYLE_KEYS = ['color', 'borderColor', 'shadowColor', 'borderType', 'fontFamily', 'fontStyle', 'fontWeight', 'textBorderColor', 'textShadowColor', 'backgroundColor'];
const LINE_KEYS = ['color', 'type', 'shadowColor', 'cap', 'join'];

function payload(form: InjectionForm, place: string): string {
	const url = `https://example.com/${place}.png`;
	if (form === 'url') return `url(${url})`;
	if (form === 'attr') return `red;mask-image:image-set('${url}' 1x);cursor:image-set('${url}' 1x),auto`;
	return `red;}svg{mask-image:image-set('${url}' 1x)}.x{fill:red`;
}

function styles(form: InjectionForm, place: string, keys = STYLE_KEYS): Record<string, string> {
	const out: Record<string, string> = {};
	for (const k of keys) out[k] = payload(form, `${place}.${k}`);
	return out;
}

/** The option of `type` with injected style options. */
export function injectedOption(type: string, form: InjectionForm): Record<string, unknown> {
	const base = JSON.parse(JSON.stringify(SAMPLES[type])) as Record<string, unknown>;
	const p = (place: string) => `${type}.${place}`;
	const series = (Array.isArray(base.series) ? base.series : [base.series]) as Record<string, unknown>[];
	for (const s of series) {
		const parts = {
			itemStyle: styles(form, p('itemStyle')),
			lineStyle: styles(form, p('lineStyle'), LINE_KEYS),
			areaStyle: styles(form, p('areaStyle'), ['color', 'shadowColor']),
			label: { show: true, ...styles(form, p('label')), formatter: '{r|x} {c}', rich: { r: styles(form, p('label.rich')) } },
			labelLine: { show: true, lineStyle: styles(form, p('labelLine'), LINE_KEYS) },
		};
		Object.assign(s, parts, {
			cursor: payload(form, p('cursor')),
			emphasis: { itemStyle: styles(form, p('emphasis.itemStyle')), label: styles(form, p('emphasis.label')), lineStyle: styles(form, p('emphasis.lineStyle'), LINE_KEYS) },
			blur: { itemStyle: styles(form, p('blur.itemStyle')) },
			select: { itemStyle: styles(form, p('select.itemStyle')) },
		});
	}
	const axis = (name: string, value: unknown) => {
		if (!value || typeof value !== 'object') return value;
		const list = Array.isArray(value) ? value : [value];
		for (const a of list as Record<string, unknown>[]) {
			Object.assign(a, {
				name: 'A', nameTextStyle: styles(form, p(`${name}.nameTextStyle`)),
				axisLabel: styles(form, p(`${name}.axisLabel`)),
				axisLine: { lineStyle: styles(form, p(`${name}.axisLine`), LINE_KEYS) },
				splitLine: { show: true, lineStyle: styles(form, p(`${name}.splitLine`), LINE_KEYS) },
			});
		}
		return value;
	};
	axis('xAxis', base.xAxis);
	axis('yAxis', base.yAxis);
	return {
		...base,
		backgroundColor: payload(form, p('backgroundColor')),
		color: [payload(form, p('palette'))],
		textStyle: styles(form, p('textStyle')),
		title: { text: 'T', subtext: 'S', textStyle: styles(form, p('title.textStyle')), subtextStyle: styles(form, p('title.subtextStyle')), ...styles(form, p('title'), ['backgroundColor', 'borderColor', 'shadowColor']) },
		legend: { show: true, textStyle: styles(form, p('legend.textStyle')), ...styles(form, p('legend'), ['backgroundColor', 'borderColor', 'inactiveColor']) },
	};
}
