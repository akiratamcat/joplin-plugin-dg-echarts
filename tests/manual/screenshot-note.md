# Quarterly report

Charts drawn by dg-echarts, from `echarts` code blocks in this note.

```echarts height=320
{
  "title": { "text": "Sales and profit by month" },
  "legend": { "bottom": 0 },
  "xAxis": { "type": "category", "data": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] },
  "yAxis": [{ "type": "value", "name": "Sales" }, { "type": "value", "name": "Profit" }],
  "series": [
    { "name": "Sales", "type": "bar", "data": [120, 200, 150, 180, 240, 210] },
    { "name": "Profit", "type": "line", "yAxisIndex": 1, "smooth": true, "data": [12, 30, 18, 25, 41, 33] }
  ]
}
```

```echarts width=800 height=300
# YAML works too
title: { text: Share by region, left: center }
legend: { bottom: 0 }
series:
  - type: pie
    radius: [35%, 65%]
    data:
      - { name: North, value: 40 }
      - { name: South, value: 25 }
      - { name: East, value: 20 }
      - { name: West, value: 15 }
```

```echarts height=300
{
  "title": { "text": "Team skills" },
  "radar": { "indicator": [
    { "name": "Design", "max": 5 }, { "name": "Code", "max": 5 }, { "name": "Test", "max": 5 },
    { "name": "Docs", "max": 5 }, { "name": "Support", "max": 5 }
  ] },
  "series": [{ "type": "radar", "data": [
    { "name": "Team A", "value": [4, 5, 3, 2, 4] },
    { "name": "Team B", "value": [3, 3, 5, 4, 3] }
  ] }]
}
```
