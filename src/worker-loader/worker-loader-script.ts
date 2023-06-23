import async from 'async';
import { workerData, parentPort } from 'worker_threads';
import { WorkerMessage, WorkerMessageName } from '../worker-message';
import { WorkerData } from '../worker.types';
import { Worker } from '../worker';
import { getWorkerLoader } from './worker-loader.utils';
import { WorkerLoader } from './worker-loader';

let worker: Worker;
let workerLoader: WorkerLoader;

/**
 * Sets up the worker loader with the specified path and optional shared data.
 *
 * @param {string} path - The path to the worker.
 * @param {string} dependenciesPath - The path to the worker dependencies.
 * @param {unknown} [sharedData] - Optional shared data.
 * @returns {Promise<WorkerLoader>} A promise that resolves with the worker loader.
 */
export const setupWorkerLoader = async (
  path: string,
  dependenciesPath?: string,
  sharedData?: unknown
) => {
  workerLoader = getWorkerLoader(path, dependenciesPath);
  await workerLoader.setup(sharedData);

  return workerLoader;
};

/**
 * Loads a worker based on the provided message and pointer.
 *
 * @param {WorkerMessage} message - The worker message.
 * @param {string} pointer - The pointer to the worker.
 * @returns {Promise<Worker>} A promise that resolves with the loaded worker.
 */
export const loadWorker = async (message: WorkerMessage, pointer: string) => {
  const { data } = <WorkerMessage<string>>message;
  worker = await workerLoader.load(data || pointer);
  return worker;
};

/**
 * Clears the currently loaded worker.
 */
export const clearWorker = () => {
  worker = null;
};

/**
 * Retrieves the currently loaded worker.
 *
 * @returns {Worker} The currently loaded worker.
 */
export const getWorker = () => {
  return worker;
};

/**
 * Handles the worker message.
 *
 * @param {WorkerMessage} message - The worker message.
 * @returns {Promise<void>} A promise that resolves when the message handling is complete.
 */
export const messageHandler = async (message: WorkerMessage) => {
  const { pointer, sharedData, options } = workerData as WorkerData;
  const { workerLoaderPath, workerLoaderDependenciesPath } = options || {};
  if (message.name === WorkerMessageName.Setup) {
    /**
     * Handles the 'Setup' message sent to initialize the worker loader and set up shared data.
     * If successful, a 'SetupComplete' message is sent back to the parent thread;
     * otherwise, a 'SetupFailure' message with the error is sent.
     */
    try {
      await setupWorkerLoader(workerLoaderPath, workerLoaderDependenciesPath, sharedData);
      parentPort.postMessage(WorkerMessage.setupComplete(message.workerId));
    } catch (error) {
      parentPort.postMessage(WorkerMessage.setupFailure(message.workerId, error));
    }
  } else if (message.name === WorkerMessageName.Load) {
    /**
     * Handles the 'Load' message sent to load a worker based on the provided pointer.
     * If successful, a 'LoadComplete' message is sent back to the parent thread;
     * otherwise, a 'LoadFailure' message with the error is sent.
     */
    try {
      await loadWorker(message, pointer);
      parentPort.postMessage(WorkerMessage.loadComplete(message.workerId));
    } catch (error) {
      parentPort.postMessage(WorkerMessage.loadFailure(message.workerId, error));
    }
  } else if (message.name === WorkerMessageName.Dispose) {
    /**
     * Handles the 'Dispose' message sent to clear the currently loaded worker.
     * A 'DisposeComplete' message is sent back to the parent thread.
     */
    try {
      clearWorker();
      parentPort.postMessage(WorkerMessage.disposeComplete(message.workerId));
    } catch (error) {
      parentPort.postMessage(WorkerMessage.disposeFailure(message.workerId, error));
    }
  } else if (message.name === WorkerMessageName.RunTask) {
    /**
     * Handles the 'RunTask' message sent to execute a task on the currently loaded worker.
     * The associated task data is passed to the `run` method of the worker.
     */
    getWorker().run(message.data);
  }
};

const queue = async.queue(messageHandler);

/**
 * Event listener for the 'message' event on the parent port.
 *
 * @param {WorkerMessage} message - The worker message.
 */
parentPort.on('message', (message: WorkerMessage) => {
  queue.push(message);
});
