import core = require('@actions/core')
import github = require('@actions/github')
import { Repository, User, Label } from '@octokit/graphql-schema'

import { ConfigLabel } from './config'
import { queries } from './queries'

export type Octokit = ReturnType<typeof github.getOctokit>

export const getRepos = async (octokit: Octokit) => {
  const repos = []
  let result
  let cursor
  do {
    result = await octokit.graphql<{
      viewer: User
    }>(queries.repositories, { cursor })
    cursor = result.viewer.repositories.pageInfo.endCursor

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    repos.push(...result.viewer.repositories!.nodes!.map((repo) => repo!.nameWithOwner))
  } while (result.viewer.repositories.pageInfo.hasNextPage)

  return repos
}

export const getRepoOwnerAndName = (repo: string) => {
  const [owner, name] = repo.split('/')

  return { owner, name }
}

export const getExistingLabels = async (octokit: Octokit, repo: string) => {
  const labels = new Map<string, Label>()
  let result
  let cursor

  const { owner, name } = getRepoOwnerAndName(repo)
  do {
    result = await octokit.graphql<{
      repository: Repository
    }>(queries.labels, { cursor, owner, name })

    cursor = result.repository.labels?.pageInfo.endCursor

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const currentLabels = result.repository.labels!.nodes! as Label[]
    currentLabels.forEach((label) => {
      labels.set(label.name, label)
    })
  } while (result.repository.labels?.pageInfo.hasNextPage)

  return labels
}

export const createLabels = async (
  octokit: Octokit,
  labels: ConfigLabel[],
  repo: string,
  existingLabels: Map<string, Label>,
) => {
  const toCreate = labels.filter(({ name }) => !existingLabels.has(name))
  const toUpdate = labels.filter(({ name }) => existingLabels.has(name))

  const { owner, name: repoName } = getRepoOwnerAndName(repo)

  for (const label of toCreate) {
    core.info(`Creating label '${label.name}' in repo ${repo}`)
    await octokit.rest.issues.createLabel({
      owner,
      repo: repoName,
      name: label.name,
      color: label.color,
      description: label.description,
    })
  }

  for (const label of toUpdate) {
    core.info(`Updating label '${label.name}' in repo ${repo}`)
    await octokit.rest.issues.updateLabel({
      owner,
      repo: repoName,
      name: label.name,
      color: label.color,
      description: label.description,
    })
  }
}

export const deleteLabels = async (
  octokit: Octokit,
  labels: ConfigLabel[],
  repo: string,
  existingLabels: Map<string, Label>,
) => {
  const toDelete = labels.filter(({ name }) => existingLabels.has(name))
  const notFound = labels.filter(({ name }) => !existingLabels.has(name))

  const { owner, name: repoName } = getRepoOwnerAndName(repo)

  for (const label of toDelete) {
    core.info(`Deleting label '${label.name}' in repo ${repo}`)
    await octokit.rest.issues.deleteLabel({
      owner,
      repo: repoName,
      name: label.name,
    })
  }

  for (const label of notFound) {
    core.info(`Skipping deletion of label '${label.name}' in repo ${repo}, as it does not exist`)
  }
}

export const renameLabels = async (
  octokit: Octokit,
  labels: ConfigLabel[],
  repo: string,
  existingLabels: Map<string, Label>,
) => {
  const toRename = labels.filter((label) => existingLabels.has(label.rename_from as string))
  const notFound = labels.filter((label) => !existingLabels.has(label.rename_from as string))

  const { owner, name: repoName } = getRepoOwnerAndName(repo)

  for (const label of toRename) {
    core.info(`Renaming label from '${label.rename_from}' to '${label.name}' in repo ${repo}`)
    await octokit.rest.issues.updateLabel({
      owner,
      repo: repoName,
      name: label.rename_from as string,
      new_name: label.name,
      color: label.color,
      description: label.description,
    })
  }

  for (const label of notFound) {
    core.info(
      `Skipping renaming of label '${label.rename_from}' to '${label.name}' in repo ${repo}, as it does not exist`,
    )
  }
}
