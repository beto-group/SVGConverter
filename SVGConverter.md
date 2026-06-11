---
cssclasses:
  - svg-converter
---

```datacorejsx
const { View } = await dc.require(dc.resolvePath("SVGConverter/src/index.jsx"));
return View({ folderPath: dc.resolvePath("SVGConverter") });
```
