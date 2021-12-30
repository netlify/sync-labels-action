// eslint-disable-next-line ava/no-ignored-test-files
import test from 'ava'

import { parseConfig } from '../src/config'

test('Parses config', async (t) => {
  const config = await parseConfig(`${__dirname}/fixtures/sample-config.yml`)

  t.deepEqual(config, [
    {
      repoPatterns: ['netlify/sync-labels-action'],
      actions: {
        create: [
          {
            name: 'type: project',
            description: 'Describes a top level project issue',
            color: 'FBCA04',
          },
        ],
        rename: [
          {
            name: 'type: chore',
            color: '0E8A16',
            rename_from: 'chore',
          },
        ],
        delete: [{ name: 'type: initiative' }],
      },
    },
  ])
})
