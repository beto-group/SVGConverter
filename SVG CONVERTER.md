---
cssclasses:
  - svg-converter
---

```datacorejsx
const { View } = await dc.require(dc.resolvePath("SVG CONVERTER/src/index.jsx"));
return View({ folderPath: dc.resolvePath("SVG CONVERTER") });
```
