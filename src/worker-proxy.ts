import { Worker } from 'worker_threads';
import {
  WorkerMessage,
  WorkerMessageContent,
  WorkerMessageName,
  WorkerMessageType,
} from './worker-message';
import { WorkerProxyOptions } from './worker.types';

/**
 * Represents a proxy for a worker thread.
 */
export class WorkerProxy {
  private _pointer: string;
  private worker: Worker;

  /**
   * Constructs a new WorkerProxy instance.
   * @param {unknown} sharedData - The shared data to be passed to the worker.
   * @param {WorkerProxyOptions} options - The options for the worker proxy.
   */
  constructor(sharedData: unknown, options: WorkerProxyOptions) {
    /**
     * The underlying worker object.
     * @type {Worker}
     */
    this.worker = new Worker(`${__dirname}/worker-loader/worker-loader-script`, {
      workerData: { sharedData, options },
    });
  }

  /**
   * The ID of the worker thread.
   * @type {number}
   */
  public get id(): number {
    return this.worker.threadId;
  }

  /**
   * The pointer value of the worker.
   * @type {string}
   */
  public get pointer(): string {
    return this._pointer;
  }

  /**
   * Sets up the worker by sending a setup message and waiting for completion.
   * @returns {Promise<void>} A promise that resolves when the setup is complete.
   */
  public async setup(): Promise<void> {
    const { worker } = this;
    worker.removeAllListeners();
    return new Promise((resolveSetup, rejectSetup) => {
      worker.on('message', (content: WorkerMessageContent) => {
        const { type, name, data } = content;
        if (
          type === WorkerMessageType.System &&
          name === WorkerMessageName.SetupComplete
        ) {
          worker.removeAllListeners();
          resolveSetup();
        } else if (
          type === WorkerMessageType.System &&
          name === WorkerMessageName.SetupFailure
        ) {
          worker.removeAllListeners();
          rejectSetup(data);
        }
      });
      worker.postMessage(WorkerMessage.setup(worker.threadId).toJson());
    });
  }

  /**
   * Loads a specific resource in the worker.
   * @param {string} pointer - The pointer value of the resource.
   * @returns {Promise<void>} A promise that resolves when the resource is loaded.
   */
  public async load(pointer: string): Promise<void> {
    this._pointer = pointer;
    const { worker } = this;
    worker.removeAllListeners();
    return new Promise((resolveLoad, rejectLoad) => {
      worker.on('message', (content: WorkerMessageContent) => {
        const { type, name, data } = content;
        if (
          type === WorkerMessageType.System &&
          name === WorkerMessageName.LoadComplete
        ) {
          worker.removeAllListeners();
          resolveLoad();
        } else if (
          type === WorkerMessageType.System &&
          name === WorkerMessageName.LoadFailure
        ) {
          worker.removeAllListeners();
          rejectLoad(data);
        }
      });
      worker.postMessage(WorkerMessage.load(worker.threadId, pointer).toJson());
    });
  }

  /**
   * Disposes the worker by sending a dispose message and waiting for completion.
   * @returns {Promise<void>} A promise that resolves when the worker is disposed.
   */
  public async dispose(): Promise<void> {
    const { worker } = this;
    worker.removeAllListeners();
    return new Promise((resolveDispose, rejectDispose) => {
      worker.on('message', (content: WorkerMessageContent) => {
        const { type, name, data } = content;
        if (
          type === WorkerMessageType.System &&
          name === WorkerMessageName.DisposeComplete
        ) {
          worker.removeAllListeners();
          resolveDispose();
        } else if (
          type === WorkerMessageType.System &&
          name === WorkerMessageName.DisposeFailure
        ) {
          worker.removeAllListeners();
          rejectDispose(data);
        }
      });
      worker.postMessage(WorkerMessage.dispose(worker.threadId).toJson());
    });
  }

  /**
   * Runs a task in the worker.
   * @param {unknown} data - The task data to be sent to the worker.
   */
  public run<DataType = unknown>(data?: DataType): void {
    const { worker } = this;
    worker.postMessage(WorkerMessage.runTask(worker.threadId, data).toJson());
  }

  /**
   * Registers a message handler for non-system messages received from the worker.
   * @param {Function} handler - The message handler function.
   */
  public onMessage(handler: (message: WorkerMessage) => Promise<void>) {
    this.worker.on('message', (content: WorkerMessageContent) => {
      if (content.type !== WorkerMessageType.System) {
        handler(WorkerMessage.create(content)).catch(error =>
          console.log(
            `worker:${this.worker.threadId} | ${new Date().toISOString()} ::`,
            error
          )
        );
      }
    });
  }

  /**
   * Registers an error handler for errors occurring on the worker.
   * @param {Function} handler - The error handler function.
   */
  public onError(handler: (workerId: number, error: Error) => void) {
    this.worker.on('error', error => handler(this.worker.threadId, error));
  }

  /**
   * Registers an exit handler for the worker's exit event.
   * @param {Function} handler - The exit handler function.
   */
  public onExit(handler: (workerId: number, code: number) => void) {
    this.worker.on('exit', code => handler(this.worker.threadId, code));
  }

  /**
   * Removes the worker by terminating it and returns the exit code.
   * @returns {Promise<number>} A promise that resolves with the worker's exit code.
   */
  public async remove(): Promise<number> {
    const code = await this.worker.terminate();
    return code;
  }
}
