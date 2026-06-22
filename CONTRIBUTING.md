# Contributing to DMR

## Development setup

```bash
git clone https://github.com/elmokirk/dynamic-model-routing
cd dynamic-model-routing
pnpm install
pnpm test       # 10 unit tests
pnpm bench      # 30-prompt accuracy benchmark
pnpm build      # compile src/ → dist/
```

## Making changes

### Changing routing rules

Edit `DEFAULT_CONFIG.rules` in [`src/types.ts`](./src/types.ts), then:

```bash
pnpm bench   # verify accuracy held at 100%
pnpm test    # verify all 10 unit tests still pass
```

Both must pass before opening a PR.

### Adding a feature

1. Open an issue first to discuss — routing behaviour changes affect all users
2. Write tests in `tests/router.test.ts` before implementing
3. Run `pnpm test` + `pnpm bench` — both must pass
4. Update the relevant section of `README.md` if the feature is user-visible

### Fixing a bug

1. Add a failing test that reproduces the bug
2. Fix the bug
3. Confirm the test passes and no existing tests regressed

## Commit style

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add word-count threshold routing
fix: tilde bypass not working when prompt has leading whitespace
docs: add effort level table to README
chore: bump tsx to 4.20
```

## Pull request checklist

- [ ] `pnpm test` passes (10/10)
- [ ] `pnpm bench` passes (≥ 80% accuracy, ideally 100%)
- [ ] `pnpm build` succeeds
- [ ] README updated if behaviour changed
- [ ] No absolute paths committed in any file

## What we won't merge

- Changes that add external runtime dependencies beyond `@anthropic-ai/sdk`
- Routing rules that reduce benchmark accuracy below 95%
- Auto-writing of `settings.json` from the hook (hook is advisory-only by design)
