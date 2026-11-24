# dg-echarts stage 1 (MVP) test note

Paste this note into Joplin. Each heading says what to expect. The tags in
brackets are read by the rendering test (tests/render/render.test.ts):
[chart] a chart is drawn, [error] an error box, [note] a note under the block.

## 1. Bar chart with Japanese labels [chart]

```echarts
{
  "title": { "text": "月別の売上（全角と半角 ABC123 の混在）" },
  "xAxis": { "type": "category", "data": ["一月", "二月", "三月", "四月", "May（５月）", "六月"] },
  "yAxis": { "name": "売上高（千円）" },
  "series": [{ "type": "bar", "data": [120, 200, 150, 80, 70, 110], "label": { "show": true, "position": "top" } }]
}
```

## 2. The same chart in YAML, with comments [chart]

```echarts
# Sales per month
title: { text: 月別の売上 (YAML) }
xAxis: { type: category, data: [一月, 二月, 三月] }
yAxis: {}
series:
  - type: line
    data: [120, 200, 150]
```

## 3. Pie chart with Chinese, Korean and Japanese [chart]

```echarts
{
  "title": { "text": "中文 / 한국어 / 日本語", "left": "center" },
  "legend": { "top": "bottom" },
  "series": [{ "type": "pie", "radius": "55%", "data": [
    { "name": "北京市", "value": 30 }, { "name": "서울특별시", "value": 25 },
    { "name": "東京都千代田区", "value": 20 }, { "name": "ASCII only", "value": 10 }
  ] }]
}
```

## 4. Time axis: month names in the Joplin language [chart]

```echarts
{
  "xAxis": { "type": "time" },
  "yAxis": {},
  "series": [{ "type": "line", "data": [["2026-01-01", 1], ["2026-04-01", 3], ["2026-07-01", 2], ["2026-12-01", 4]] }]
}
```

## 5. theme=light (on a dark page: white background inside the chart) [chart]

```echarts theme=light
{
  "title": { "text": "theme=light" },
  "xAxis": { "type": "category", "data": ["a", "b", "c"] },
  "yAxis": {},
  "series": [{ "type": "line", "data": [1, 3, 2] }]
}
```

## 6. theme=dark (on a light page and in PDF: dark background; grid lines visible) [chart]

```echarts theme=dark
{
  "title": { "text": "theme=dark" },
  "xAxis": { "type": "category", "data": ["a", "b", "c"] },
  "yAxis": {},
  "series": [{ "type": "bar", "data": [1, 3, 2] }]
}
```

## 7. Force layout graph with edgeLength (same layout every time) [chart]

```echarts height=300
{
  "series": [{ "type": "graph", "layout": "force", "force": { "repulsion": 200, "edgeLength": 120 }, "label": { "show": true },
    "data": [{ "name": "n1" }, { "name": "n2" }, { "name": "n3" }, { "name": "n4" }],
    "links": [{ "source": "n1", "target": "n2" }, { "source": "n2", "target": "n3" }, { "source": "n3", "target": "n4" }, { "source": "n4", "target": "n1" }] }]
}
```

## 8. Labels inside bars (PDF export: copying "120" gives "120") [chart]

```echarts
{
  "xAxis": { "type": "category", "data": ["A", "B"] },
  "yAxis": {},
  "series": [{ "type": "bar", "data": [120, 200], "label": { "show": true, "position": "inside" } }]
}
```

## 9. Narrow chart, width=400, align=left [chart]

```echarts width=400 height=250 align=left
{
  "title": { "text": "width=400" },
  "xAxis": { "type": "category", "data": ["a", "b", "c"] },
  "yAxis": {},
  "series": [{ "type": "line", "data": [1, 3, 2] }]
}
```

## 10. Wide chart, width=1600 (shrinks to the pane) [chart]

```echarts width=1600 height=300
{
  "title": { "text": "width=1600" },
  "xAxis": { "type": "category", "data": ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"] },
  "yAxis": {},
  "series": [{ "type": "bar", "data": [5, 7, 3, 9, 4, 6, 8, 2, 7, 5, 6, 9] }]
}
```

## 11. Radar, gauge and funnel [chart]

```echarts
{
  "radar": { "center": ["20%", "50%"], "radius": "35%", "indicator": [{ "name": "A", "max": 5 }, { "name": "B", "max": 5 }, { "name": "C", "max": 5 }] },
  "series": [
    { "type": "radar", "data": [{ "value": [4, 2, 3] }] },
    { "type": "gauge", "center": ["50%", "55%"], "radius": "35%", "data": [{ "value": 72 }] },
    { "type": "funnel", "left": "68%", "width": "28%", "data": [{ "name": "a", "value": 3 }, { "name": "b", "value": 2 }, { "name": "c", "value": 1 }] }
  ]
}
```

## 12. Tooltip and toolbox are removed silently [chart]

```echarts
{
  "tooltip": { "trigger": "axis" },
  "toolbox": { "feature": { "saveAsImage": {} } },
  "xAxis": { "type": "category", "data": ["a", "b"] },
  "yAxis": {},
  "series": [{ "type": "bar", "data": [1, 2] }]
}
```

## 13. External image: removed, with a note (no network access) [chart] [note]

```echarts
{
  "xAxis": { "type": "category", "data": ["a", "b"] },
  "yAxis": {},
  "series": [{ "type": "scatter", "symbolSize": 30, "symbol": "image://https://example.com/icon.png", "data": [1, 2] }]
}
```

## 14. Malicious text: shown as plain text, nothing happens [chart]

```echarts
{
  "title": { "text": "<img src=x onerror=alert(1)>" },
  "xAxis": { "type": "category", "data": ["<script>alert(2)</script>"] },
  "yAxis": {},
  "series": [{ "type": "bar", "data": [1] }]
}
```

## 15. JSON syntax error: line 3 and an excerpt [error]

```echarts
{
  "xAxis": { "type": "category" },
  "yAxis": {},,
  "series": []
}
```

## 16. YAML syntax error [error]

```echarts
xAxis: { type: category, data: [a, b }
yAxis: {}
```

## 17. Bar chart without axes: an error, not a crash [error]

```echarts
{ "series": [{ "type": "bar", "data": [1, 2] }] }
```

## 18. Unknown chart type: a note, nothing drawn [note]

```echarts
{ "series": [{ "type": "nosuchchart", "data": [1, 2] }] }
```

## 19. A map: not supported [error]

```echarts
{ "geo": { "map": "world" }, "series": [] }
```

## 20. Not an object [error]

```echarts
[1, 2, 3]
```

## 21. An ordinary JSON block stays a code block

```json
{ "series": [{ "type": "bar", "data": [1, 2] }] }
```
