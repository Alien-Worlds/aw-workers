/* eslint-disable @typescript-eslint/no-var-requires */

import { existsSync } from 'fs';
import path from 'path';
import { InvalidPathError } from '../worker.errors';
import { DefaultWorkerLoader, WorkerLoader } from './worker-loader';
import { WorkerLoaderDependencies } from './worker-loader.types';

/**
 * Builds the absolute file path based on the given relative file path.
 * If the file path ends with '.ts', it registers 'ts-node' and resolves the file path from the 'src' directory.
 * If the file path ends with '.js' or doesn't have an extension, it resolves the file path from the 'build' directory.
 * @param {string} filePath - The relative file path.
 * @returns {string} - The absolute file path.
 */
export const buildPath = (filePath: string): string => {
  if (filePath.endsWith('.ts')) {
    require('ts-node').register();
    return path.resolve(process.cwd(), 'src', `${filePath}`);
  } else {
    return path.resolve(
      process.cwd(),
      'build',
      `${filePath}${filePath.endsWith('.js') ? '' : '.js'}`
    );
  }
};

/**
 * Retrieves the worker loader instance based on the provided path.
 * If the path is specified, it builds the absolute path and checks if the file exists.
 * If the file does not exist, it throws an InvalidPathError.
 * If the file exists, it loads the module and creates an instance of the exported class as the worker loader.
 * If the path is not specified, it returns an instance of the DefaultWorkerLoader.
 * @param {string} path - The path to the worker loader file.
 * @returns {WorkerLoader} - The worker loader instance.
 * @throws {InvalidPathError} - If the specified file path does not exist.
 */
export const getWorkerLoader = (path: string): WorkerLoader => {
  if (path) {
    const loaderPath = buildPath(path);
    if (existsSync(loaderPath) === false) {
      throw new InvalidPathError(loaderPath);
    }
    const WorkerLoaderClass = require(loaderPath).default;
    return new WorkerLoaderClass() as WorkerLoader;
  }

  return new DefaultWorkerLoader();
};

/**
 * Retrieves the worker loader dependencies instance based on the provided path.
 *
 * @param {string} path - The path to the worker loader file.
 * @returns {WorkerLoaderDependencies} - The worker loader dependencies instance.
 * @throws {InvalidPathError} - If the specified file path does not exist.
 */
export const getWorkerLoaderDependencies = (path: string): WorkerLoaderDependencies => {
  const loaderPath = buildPath(path);
  if (existsSync(loaderPath) === false) {
    throw new InvalidPathError(loaderPath);
  }
  const WorkerLoaderDependenciesClass = require(loaderPath).default;
  return new WorkerLoaderDependenciesClass() as WorkerLoaderDependencies;
};
