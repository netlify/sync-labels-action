[![Build](https://github.com/netlify/sync-labels-action/workflows/Build/badge.svg)](https://github.com/netlify/sync-labels-action/actions)

# sync-labels-action

## Usage

1. Create a rules file under `.github/labeler.yml`.

Use this example as a reference:

```yaml
- {
    repoPatterns: ['netlify/sync-labels-action'],
    labels:
      [
        { name: 'type: project', description: 'Describes a top level project issue', color: 'FBCA04' },
        { name: 'type: initiative', action: delete },
        { name: 'type: chore', color: '0E8A16', action: 'rename', rename_from: 'chore' },
      ],
  }
```

2. Create a workflow file under `.github/workflows/sync-labels.yml`.

Use this example as a reference:

```yaml
name: Sync Labels
on:
  push:
    branches: [main]
    paths:
      - '.github/labeler.yml'
      - '.github/workflows/sync-labels.yml'

jobs:
  sync-label:
    runs-on: ubuntu-latest
    steps:
      - name: Git checkout
        uses: actions/checkout@v2
      - uses: netlify/sync-labels-action@v1
        with:
          # GitHub token with access to organization repositories.
          # The default GitHub actions token is scoped to the repo the workflow runs in
          github-token: ${{ secrets.PERSONAL_ACCESS_TOKEN }}
          # optional, defaults to '.github/labeler.yml'
          rules-path: .github/labeler.yml
```

## Contributors

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for instructions on how to set up and work on this repository. Thanks
for contributing!
