import { promises as fs } from 'fs'

import Ajv from 'ajv'
import betterAjvErrors from 'better-ajv-errors'
import yaml from 'js-yaml'

import schema from './schema'

const ajv = new Ajv()
const validate = ajv.compile(schema)

const RepoAction = {
  CREATE: 'create',
  DELETE: 'delete',
} as const

export const LabelAction = {
  CREATE: 'create',
  DELETE: 'delete',
  RENAME: 'rename',
} as const

type LabelActions = typeof LabelAction[keyof typeof LabelAction]

export type ConfigLabel = {
  name: string
  description?: string
  color?: string
  action?: LabelActions
  // eslint-disable-next-line camelcase
  rename_from?: string
}

type Rules = {
  repoPatterns: string[]
  action?: typeof RepoAction[keyof typeof RepoAction]
  labels: ConfigLabel[]
}[]

export type GroupedRules = {
  repoPatterns: string[]
  actions: {
    [key in LabelActions]: ConfigLabel[]
  }
}[]

export const parseConfig = async (configPath: string): Promise<GroupedRules> => {
  const config = await fs.readFile(configPath, 'utf8')
  const parsedConfig = yaml.load(config)
  const valid = validate(parsedConfig)
  if (!valid) {
    const message = betterAjvErrors(schema, parsedConfig, validate.errors || [])
    console.log(message)
    throw new Error('Failed to validate config')
  }

  const rules = parsedConfig as Rules

  const grouped = {
    [LabelAction.CREATE]: [] as ConfigLabel[],
    [LabelAction.RENAME]: [] as ConfigLabel[],
    [LabelAction.DELETE]: [] as ConfigLabel[],
  }
  const normalized = rules.map((rule) => {
    const labelsWithDefaults = rule.labels.map((label) => ({
      ...label,
      action: label.action || rule.action || LabelAction.CREATE,
    }))

    const groupedLabels = labelsWithDefaults.reduce((acc, label) => {
      const { action, ...rest } = label
      const existing = acc[action]
      return {
        ...acc,
        [action]: [...existing, rest],
      }
    }, grouped)
    return {
      repoPatterns: rule.repoPatterns,
      actions: groupedLabels,
    }
  })

  return normalized
}
