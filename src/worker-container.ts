import { WorkerClass } from "./worker.types";

/**
 * Represents a container for managing worker classes.
 */
export class WorkerContainer {
  private bindings: Map<string, WorkerClass> = new Map();

  /**
   * Binds a worker class to a label in the container.
   * @template T - The type of the worker class.
   * @param {string} label - The label to bind the worker class to.
   * @param {WorkerClass<T>} workerClass - The worker class to bind.
   */
  bind<T = unknown>(label: string, workerClass: WorkerClass<T>): void {
    this.bindings.set(label, workerClass);
  }

  /**
   * Retrieves the worker class associated with the specified label.
   * @template T - The type of the worker class.
   * @param {string} label - The label of the worker class to retrieve.
   * @returns {WorkerClass<T>} - The worker class associated with the label.
   * @throws {Error} - If the specified label does not exist in the container.
   */
  get<T = unknown>(label: string): WorkerClass<T> {
    return this.bindings.get(label) as WorkerClass<T>;
  }
}
