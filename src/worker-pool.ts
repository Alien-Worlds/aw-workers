/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { WorkerProxy } from './worker-proxy';
import { WorkerPoolOptions } from './worker.types';
import { getWorkersCount } from './worker.utils';

type WorkerReleaseHandler = (id: number, data?: unknown) => Promise<void> | void;

/**
 * Represents a pool of worker threads.
 * @template WorkerType - The type of worker thread.
 */
export class WorkerPool<WorkerType = Worker> {
  /**
   * Creates a new instance of the WorkerPool class.
   * @param {WorkerPoolOptions} options - The options for the worker pool.
   * @returns {Promise<WorkerPool>} A promise that resolves to the created WorkerPool instance.
   */
  public static async create<WorkerType = Worker>(options: WorkerPoolOptions) {
    const pool = new WorkerPool<WorkerType>();
    await pool.setup(options);
    return pool;
  }

  /**
   * The maximum number of workers in the pool.
   */
  public workerMaxCount: number;

  /**
   * The path to the worker loader script.
   */
  private workerLoaderPath: string;
  /**
   * The list of available worker proxies.
   */
  private availableWorkers: WorkerProxy[] = [];
  /**
   * The map of active workers by process ID.
   */
  private activeWorkersByPid = new Map<number, WorkerProxy>();
  /**
   * The shared data to be passed to each worker.
   */
  private sharedData: unknown;
  /**
   * The handler function for releasing a worker.
   */
  private workerReleaseHandler: WorkerReleaseHandler;

  /**
   * Sets up the worker pool by creating and initializing the worker proxies.
   *
   * @param {WorkerPoolOptions} options - The options for the worker pool.
   * @returns {Promise<void>} A promise that resolves when the setup is complete.
   */
  public async setup(options: WorkerPoolOptions) {
    const { threadsCount, inviolableThreadsCount, sharedData, workerLoaderPath } =
      options;
    this.workerLoaderPath = workerLoaderPath;
    this.sharedData = sharedData;
    this.workerMaxCount =
      threadsCount > inviolableThreadsCount
        ? getWorkersCount(threadsCount, inviolableThreadsCount)
        : threadsCount;

    for (let i = 0; i < this.workerMaxCount; i++) {
      const worker = await this.createWorker();
      this.availableWorkers.push(worker);
    }
  }

  /**
   * The number of workers in the pool.
   * @type {number}
   * @readonly
   */
  public get workerCount() {
    return this.availableWorkers.length + this.activeWorkersByPid.size;
  }

  /**
   * Retrieves an available worker from the pool.
   * @param {string} [pointer] - The pointer value of the resource to be loaded by the worker.
   * @returns {Promise<WorkerType & WorkerProxy | null>} A promise that resolves to the worker instance, or null if no worker is available.
   */
  private async createWorker(): Promise<WorkerProxy> {
    const { sharedData, workerLoaderPath } = this;
    const proxy = new WorkerProxy(sharedData, { workerLoaderPath });
    await proxy.setup();
    return proxy;
  }

  /**
   * Retrieves an available worker from the pool.
   * @param {string} [pointer] - The pointer value of the resource to be loaded by the worker.
   * @returns {Promise<WorkerType & WorkerProxy | null>} A promise that resolves to the worker instance, or null if no worker is available.
   */
  public async getWorker(pointer?: string): Promise<WorkerType & WorkerProxy> {
    const { activeWorkersByPid, workerMaxCount, availableWorkers } = this;

    if (activeWorkersByPid.size < workerMaxCount) {
      // When workers are to run common or concrete process,
      // we use instance from the list (if there is any available)
      const worker = availableWorkers.shift();
      if (worker) {
        activeWorkersByPid.set(worker.id, worker);
        await worker.load(pointer);
        return worker as WorkerType & WorkerProxy;
      }
      return null;
    } else {
      return null;
    }
  }

  /**
   * Releases a worker back to the pool.
   * @param {number} id - The ID of the worker to be released.
   * @param {unknown} [data] - Additional data to be passed to the worker release handler.
   * @returns {Promise<void>} A promise that resolves when the worker is released.
   */
  public async releaseWorker(id: number, data?: unknown): Promise<void> {
    const { activeWorkersByPid, availableWorkers, workerMaxCount, workerReleaseHandler } =
      this;
    const worker = activeWorkersByPid.get(id);

    if (worker) {
      await worker.dispose();
      this.activeWorkersByPid.delete(id);
      if (availableWorkers.length < workerMaxCount) {
        availableWorkers.push(worker);
      }
      if (workerReleaseHandler) {
        await workerReleaseHandler(id, data);
      }
    } else {
      console.log(`No worker with the specified ID #${id} was found`);
    }
  }

  /**
   * Removes all workers from the pool.
   */
  public removeWorkers() {
    this.activeWorkersByPid.forEach(worker => worker.remove());
    this.availableWorkers.forEach(worker => worker.remove());
  }

  /**
   * Checks if there is an available worker in the pool.
   * @returns {boolean} True if there is an available worker, false otherwise.
   */
  public hasAvailableWorker(): boolean {
    return this.workerMaxCount - this.activeWorkersByPid.size > 0;
  }

  /**
   * Checks if there are active workers in the pool.
   * @returns {boolean} True if there are active workers, false otherwise.
   */
  public hasActiveWorkers(): boolean {
    return this.activeWorkersByPid.size > 0;
  }

  /**
   * Returns the number of available workers in the pool.
   * @returns {number} The number of available workers.
   */
  public countAvailableWorkers(): number {
    return this.workerMaxCount - this.activeWorkersByPid.size;
  }

  /**
   * Returns the number of active workers in the pool.
   * @returns {number} The number of active workers.
   */
  public countActiveWorkers(): number {
    return this.activeWorkersByPid.size;
  }

  /**
   * Registers a handler for the worker release event.
   * @param {WorkerReleaseHandler} handler - The handler function for releasing a worker.
   */
  public onWorkerRelease(handler: WorkerReleaseHandler): void {
    this.workerReleaseHandler = handler;
  }
}
