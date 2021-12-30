import process = require('process')

import core = require('@actions/core')
import github = require('@actions/github')

import { GroupedRules, LabelAction, parseConfig } from './config'
import { Octokit, getExistingLabels, createLabels, getRepos, renameLabels, deleteLabels } from './github'

type Inputs = {
  githubToken: string
  configPath: string
}

const getInputs = () => {
  const githubToken = core.getInput('github-token') || process.env.GITHUB_TOKEN || ''
  const configPath = core.getInput('rules-path') || process.env.RULES_PATH || ''

  return { githubToken, configPath }
}

const validateInputs = ({ githubToken, configPath }: Inputs) => {
  if (!githubToken) {
    throw new Error('GitHub token is required')
  }

  if (!configPath) {
    throw new Error('Config path is required')
  }
}

const applyRules = async (octokit: Octokit, rules: GroupedRules, repos: string[]) => {
  for (const { repoPatterns, actions } of rules) {
    const matchedRepos = repos.filter((repo) => repoPatterns.some((pattern) => new RegExp(pattern).test(repo)))
    for (const repo of matchedRepos) {
      core.info(`Applying rules to ${repo}`)
      // eslint-disable-next-line no-await-in-loop
      const existingLabels = await getExistingLabels(octokit, repo)
      // eslint-disable-next-line no-await-in-loop
      await createLabels(octokit, actions[LabelAction.CREATE], repo, existingLabels)
      // eslint-disable-next-line no-await-in-loop
      await renameLabels(octokit, actions[LabelAction.RENAME], repo, existingLabels)
      // eslint-disable-next-line no-await-in-loop
      await deleteLabels(octokit, actions[LabelAction.DELETE], repo, existingLabels)
    }
  }
}

const run = async () => {
  try {
    const inputs = getInputs()
    validateInputs(inputs)
    const { githubToken, configPath } = inputs

    const rules = await parseConfig(configPath)
    const octokit = github.getOctokit(githubToken)
    const repos = await getRepos(octokit)

    await applyRules(octokit, rules, repos)
  } catch (error) {
    const err = error as Error
    core.setFailed(err.message)
  }
}

run()
