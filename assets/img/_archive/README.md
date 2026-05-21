# Archived images — not part of Drop 001

These three source prints were originally part of the Drop 001 mock but were cut from the final collection:

- `Hand_Back.jpeg` — Liquid Hand Portal
- `Eye_Back.jpeg`  — Third Eye Flower (note: had a "Fenoy Wear" generation typo)
- `Snake_Back.jpeg` — Serpent & Shroom

They're kept here in case any of them comes back in Drop 002. **Nothing in the published site references them.**

## Cleanup of locally-generated variants

If you ran `npm run optimize` while those masters were still in `products/`, delete the generated variants from the repo root:

```bash
npm run clean:images
# or preview: npm run clean:images -- --dry-run
```

To bring any back into the drop later: move the file from `_archive/` to `../products/` and re-run `optimize-images.mjs`.
