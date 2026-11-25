# dg-echarts 1.0.2 test note

Manual test note for 1.0.2 (`release-1.0.2-manual-tests.ja.md`). The URLs use
`example.com`; with 1.0.2, the note must make no request to it.

## 1. CSS added to the title's font family (no request; the title is drawn)

```echarts
{
  "title": { "text": "Font family", "textStyle": { "fontFamily": "sans-serif;mask-image:image-set('https://example.com/f.png' 1x)" } },
  "xAxis": { "type": "category", "data": ["a", "b"] },
  "yAxis": {},
  "series": [{ "type": "bar", "data": [1, 2] }]
}
```

## 2. CSS added to the labels' font weight (no request; the labels are drawn)

```echarts
{
  "xAxis": { "type": "category", "data": ["a", "b"] },
  "yAxis": {},
  "series": [{
    "type": "bar", "data": [1, 2],
    "label": { "show": true, "fontWeight": "bold;mask-image:image-set('https://example.com/w.png' 1x)" }
  }]
}
```

## 3. CSS added to rich text and the global font style (no request)

```echarts
{
  "textStyle": { "fontStyle": "italic;cursor:image-set('https://example.com/c.png' 1x),auto" },
  "xAxis": { "type": "category", "data": ["a", "b"] },
  "yAxis": {},
  "series": [{
    "type": "bar", "data": [1, 2],
    "label": { "show": true, "formatter": "{r|{c}}", "rich": { "r": { "fontFamily": "serif;mask-image:image-set('https://example.com/r.png' 1x)" } } }
  }]
}
```

## 4. Ordinary fonts (bold serif title, italic labels)

```echarts
{
  "title": { "text": "Ordinary fonts", "textStyle": { "fontFamily": "'Times New Roman', serif", "fontWeight": "bold" } },
  "xAxis": { "type": "category", "data": ["a", "b"] },
  "yAxis": {},
  "series": [{ "type": "bar", "data": [1, 2], "label": { "show": true, "fontStyle": "italic" } }]
}
```
