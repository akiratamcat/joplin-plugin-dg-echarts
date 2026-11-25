# dg-echarts 1.0.1 test note

Manual test note for 1.0.1 (`release-1.0.1-manual-tests.ja.md`). The URLs use
`example.com`; with 1.0.1, the note must make no request to it.

## 1. url() in colours (no request; the bars and the background are not painted)

```echarts
{
  "backgroundColor": "url(https://example.com/bg.png)",
  "title": { "text": "Title", "textStyle": { "color": "url(https://example.com/t.png)" } },
  "xAxis": { "type": "category", "data": ["a", "b"] },
  "yAxis": {},
  "series": [{
    "type": "bar", "data": [1, 2],
    "itemStyle": { "color": "url(https://example.com/c.png)", "borderColor": "url(https://example.com/b.png)", "borderWidth": 2 }
  }]
}
```

## 2. CSS in an emphasis colour (no request; no hover highlight)

```echarts
{
  "xAxis": { "type": "category", "data": ["a", "b"] },
  "yAxis": {},
  "series": [{
    "type": "bar", "data": [2, 1],
    "emphasis": { "itemStyle": { "color": "red;}svg{background-image:image-set(\"https://example.com/i.png\" 1x)}.a{fill:red" } }
  }]
}
```

## 3. url() in an emphasis colour (no request on hover; no hover highlight)

```echarts
{
  "xAxis": { "type": "category", "data": ["a", "b"] },
  "yAxis": {},
  "series": [{
    "type": "bar", "data": [2, 1],
    "emphasis": { "itemStyle": { "color": "url(https://example.com/e.png)" } }
  }]
}
```

## 4. Ordinary emphasis colour and a gradient (hover turns a bar red)

```echarts
{
  "xAxis": { "type": "category", "data": ["a", "b"] },
  "yAxis": {},
  "series": [{
    "type": "bar", "data": [2, 1],
    "itemStyle": { "color": { "type": "linear", "x": 0, "y": 0, "x2": 0, "y2": 1, "colorStops": [{ "offset": 0, "color": "#5470c6" }, { "offset": 1, "color": "#91cc75" }] } },
    "emphasis": { "itemStyle": { "color": "#ee6666" } }
  }]
}
```

## 5. JSON error without a position in the message (line 4)

```echarts
{
  "xAxis": { "type": "category", "data": ["a", "b"] },
  "yAxis": {},
  "series": [{ "type": "bar", "data": [1, 2,] }]
}
```
