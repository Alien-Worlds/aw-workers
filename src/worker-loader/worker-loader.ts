/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { existsSync } from 'fs';
import { Worker } from '../worker';
import { buildPath, getWorkerLoaderDependencies } from './worker-loader.utils';
import { WorkerClass } from '../worker.types';
import { WorkerConstructorArgs, WorkerLoaderDependencies } from './worker-loader.types';
import { UndefinedPointerError } from './worker-loader.errors';

/**
 * Represents a worker loader.
 *
 * @template SharedDataType - The type of shared data.
 */
export abstract class WorkerLoader<
  SharedDataType = unknown,
  DependenciesType = WorkerLoaderDependencies
> {
  /**
   * A worker loader dependencies.
   */
  public abstract dependencies: DependenciesType;

  /**
   * A map of worker bindings.
   */
  public abstract bindings: Map<string, WorkerClass>;

  /**
   * Sets up the worker loader with shared data and additional arguments.
   *
   * @param {SharedDataType} sharedData - The shared data.
   * @param {...unknown[]} args - Additional arguments.
   * @returns {Promise<void>} A promise that resolves when the setup is complete.
   */
  public abstract setup(sharedData: SharedDataType, ...args: unknown[]): Promise<void>;

  /**
   * Loads a worker based on the given pointer.
   *
   * @param {string} pointer - The pointer to the worker.
   * @param {WorkerConstructorArgs} [workerConstructorArgs] - Additional arguments for the worker constructor.
   * @returns {Promise<Worker>} A promise that resolves with the loaded worker.
   */
  public abstract load(
    pointer: string,
    workerConstructorArgs?: WorkerConstructorArgs
  ): Promise<Worker>;
}

/**
 * Represents a default worker loader.
 *
 * @template SharedDataType - The type of shared data.
 */
export class DefaultWorkerLoader<
  SharedDataType = unknown,
  DependenciesType = WorkerLoaderDependencies
> implements WorkerLoader<SharedDataType, DependenciesType>
{
  /**
   * A worker loader dependencies.
   */
  public dependencies: DependenciesType;

  /**
   * A map of worker bindings.
   */
  public bindings: Map<string, WorkerClass> = new Map();
  protected sharedData: SharedDataType;

  constructor(protected dependenciesPointer?: string) {
    if (dependenciesPointer) {
      this.dependencies = getWorkerLoaderDependencies(dependenciesPointer);
    }
  }

  /**
   * Sets up the default worker loader with shared data and additional arguments.
   *
   * @param {SharedDataType} sharedData - The shared data.
   * @param {...unknown[]} args - Additional arguments.
   * @returns {Promise<void>} A promise that resolves when the setup is complete.
   */
  public async setup(sharedData: SharedDataType, ...args: unknown[]): Promise<void> {
    this.sharedData = sharedData;
    // if they are dependencies, initialize them for further use
    if (this.dependencies) {
      await (this.dependencies as WorkerLoaderDependencies).initialize(...args);
    }
  }

  /**
   * Loads a worker based on the given pointer.
   *
   * @param {string} pointer - The pointer to the worker.
   * @param {WorkerConstructorArgs} [workerConstructorArgs] - Additional arguments for the worker constructor.
   * @returns {Promise<Worker>} A promise that resolves with the loaded worker.
   * @throws {UndefinedPointerError} If the pointer is undefined.
   * @throws {Error} If a valid worker path or binding is not found.
   */
  public async load(
    pointer: string,
    workerConstructorArgs?: WorkerConstructorArgs
  ): Promise<Worker> {
    let WorkerClass;

    if (!pointer) {
      throw new UndefinedPointerError();
    }

    const filePath = buildPath(pointer);
    if (existsSync(filePath)) {
      WorkerClass = require(filePath).default;
    } else if (this.bindings.has(pointer)) {
      WorkerClass = this.bindings.get(pointer);
    } else {
      throw new Error(
        `A valid path to a worker was not specified or a worker was not assigned to the given name ${pointer}`
      );
    }

    const worker = new WorkerClass(workerConstructorArgs) as Worker;
    return worker;
  }
}
