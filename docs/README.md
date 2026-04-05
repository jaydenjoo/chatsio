# nextjs

쇼핑몰의 품을 ai가 인용할수있게 jsom파일정리하는 솔루션

## Prerequisites
- Node.js >= 20 (`.nvmrc` 참조)
- pnpm >= 9 (or npm)

## Installation
```bash
cd /Users/jayden/project/nextjs
pnpm install
pnpm dev
```

## Project Structure
```
nextjs/
├── .claude/
│   ├── CLAUDE.md       # Project rules (auto-loaded)
│   └── rules/          # Project-specific rules
├── docs/
│   ├── PROGRESS.md     # Session journal
│   ├── ARCHITECTURE.md # System design
│   └── learnings.md    # Error patterns
├── src/                # Source code
└── package.json
```

## Commands
| Command | Description |
|---------|-------------|
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm test` | Run tests |
| `pnpm lint` | Lint code |
| `pnpm type-check` | Type checking |

## Security Level: 🟡 보통 (외부API/대외비)

---
Generated from template on 2026-04-05
