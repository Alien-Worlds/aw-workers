/* eslint-disable @typescript-eslint/no-var-requires */

import { existsSync } from 'fs';
import path from 'path';
import { InvalidPathError } from '../worker.errors';
import { DefaultWorkerLoader, WorkerLoader } from './worker-loader';
import { WorkerLoaderDependencies } from './worker-loader.types';
import { MissingClassError } from './worker-loader.errors';

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
export const getWorkerLoader = (
  path: string,
  dependenciesPath?: string,
  className?: string
): WorkerLoader => {
  if (path) {
    const loaderPath = buildPath(path);
    if (existsSync(loaderPath) === false) {
      throw new InvalidPathError(loaderPath);
    }

    const required = require(loaderPath);
    const keys = Object.keys(required || {});
    if (!required || keys.length === 0) {
      throw new MissingClassError(loaderPath);
    }

    let WorkerLoaderClass;
    if (required.default) {
      WorkerLoaderClass = required.default;
    } else {
      if (keys.length > 1 && !className) {
        console.warn(
          `The file "${loaderPath}" contains many exported resources. No class name is given and the expected class is not "default" so the first export in the list ${keys[0]} will be used.`
        );
        WorkerLoaderClass = required[keys[0]];
      } else if (className) {
        WorkerLoaderClass = required[className];
      } else {
        WorkerLoaderClass = required[keys[0]];
      }
    }
    return new WorkerLoaderClass(dependenciesPath) as WorkerLoader;
  }

  return new DefaultWorkerLoader(dependenciesPath);
};

/**
 * Retrieves the worker loader dependencies instance based on the provided path.
 *
 * @param {string} path - The path to the worker loader file.
 * @param {string} className - (Optional) The name of the worker loader dependencies class.
 * @returns {WorkerLoaderDependencies} - The worker loader dependencies instance.
 * @throws {InvalidPathError} - If the specified file path does not exist.
 */
export const getWorkerLoaderDependencies = <DependenciesType = WorkerLoaderDependencies>(
  path: string,
  className?: string
): DependenciesType => {
  const loaderPath = buildPath(path);
  if (existsSync(loaderPath) === false) {
    throw new InvalidPathError(loaderPath);
  }
  const required = require(loaderPath);
  const keys = Object.keys(required || {});
  if (!required || keys.length === 0) {
    throw new MissingClassError(loaderPath);
  }

  let WorkerLoaderDependenciesClass;
  if (required.default) {
    WorkerLoaderDependenciesClass = required.default;
  } else {
    if (keys.length > 1 && !className) {
      console.warn(
        `The file "${loaderPath}" contains many exported resources. No class name is given and the expected class is not "default" so the first export in the list ${keys[0]} will be used.`
      );
      WorkerLoaderDependenciesClass = required[keys[0]];
    } else if (className) {
      WorkerLoaderDependenciesClass = required[className];
    } else {
      WorkerLoaderDependenciesClass = required[keys[0]];
    }
  }
  return new WorkerLoaderDependenciesClass() as DependenciesType;
};

/**
 * Tests if provided path is valid.
 *
 * @param {string} value - The path to the file.
 * @returns {boolean}
 */
export const testPath = (value: string): boolean => {
  if (value) {
    const path = buildPath(value);
    return existsSync(path);
  }

  return false;
};
