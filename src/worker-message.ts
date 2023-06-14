/**
 * Represents the JSON object for an error.
 * @typedef {Object} ErrorJson
 * @property {string} [name] - The name of the error.
 * @property {string} [message] - The error message.
 * @property {string} [stack] - The error stack trace.
 * @property {unknown} [key] - Additional key-value pairs for custom error properties.
 */
export type ErrorJson = {
  name?: string;
  message?: string;
  stack?: string;
  [key: string]: unknown;
};

/**
 * Represents the content of a worker message.
 * @typedef {Object} WorkerMessageContent
 * @template DataType - The type of data in the worker message.
 * @property {number} workerId - The ID of the worker.
 * @property {string} type - The type of the worker message.
 * @property {string} name - The name of the worker message.
 * @property {DataType} [data] - The data contained in the worker message.
 * @property {ErrorJson} [error] - The error information if the worker message is an error message.
 */
export type WorkerMessageContent<DataType = unknown> = {
  workerId: number;
  type: string;
  name: string;
  data?: DataType;
  error?: ErrorJson;
};

/**
 * Represents a handler function for worker messages.
 * @typedef {function} WorkerMessageHandler
 * @param {WorkerMessage} message - The worker message.
 */
export type WorkerMessageHandler = (message: WorkerMessage) => void;

/**
 * Represents a worker message.
 * @class WorkerMessage
 * @template DataType - The type of data in the worker message.
 */
export class WorkerMessage<DataType = unknown> {
  /**
   * Creates a worker message with the specified content.
   * @param {WorkerMessageContent} content - The content of the worker message.
   * @returns {WorkerMessage} The created worker message.
   */
  public static create<DataType = unknown>({
    workerId,
    type,
    name,
    data,
    error,
  }: WorkerMessageContent<DataType>) {
    let errorJson: ErrorJson;
    if (error) {
      const { message, stack, name: errorName, ...rest } = error;
      errorJson = {
        message,
        stack,
        name: errorName,
        ...rest,
      };
    }

    return new WorkerMessage<DataType>(workerId, type, name, data, errorJson);
  }

  /**
   * Creates a setup worker message for the specified worker ID.
   * @param {number} workerId - The ID of the worker.
   * @returns {WorkerMessage} The setup worker message.
   */
  public static setup(workerId: number) {
    return new WorkerMessage(workerId, WorkerMessageType.System, WorkerMessageName.Setup);
  }

  /**
   * Creates a setup complete worker message for the specified worker ID.
   * @param {number} workerId - The ID of the worker.
   * @returns {WorkerMessage} The setup complete worker message.
   */
  public static setupComplete(workerId: number) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.System,
      WorkerMessageName.SetupComplete
    );
  }

  /**
   * Creates a setup failure worker message for the specified worker ID and error.
   * @param {number} workerId - The ID of the worker.
   * @param {Error} error - The error information.
   * @returns {WorkerMessage} The setup failure worker message.
   */
  public static setupFailure(workerId: number, error: Error) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.System,
      WorkerMessageName.SetupFailure,
      error,
      <ErrorJson>error
    );
  }

  /**
   * Creates a load worker message for the specified worker ID.
   * @param {number} workerId - The ID of the worker.
   * @param {string} pointer - worker script path or name.
   * @returns {WorkerMessage} The load worker message.
   */
  public static load(workerId: number, pointer: string) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.System,
      WorkerMessageName.Load,
      pointer
    );
  }

  /**
   * Creates a load complete worker message for the specified worker ID.
   * @param {number} workerId - The ID of the worker.
   * @returns {WorkerMessage} The load complete worker message.
   */
  public static loadComplete(workerId: number) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.System,
      WorkerMessageName.LoadComplete
    );
  }

  /**
   * Creates a load failure worker message for the specified worker ID and error.
   * @param {number} workerId - The ID of the worker.
   * @param {Error} error - The error information.
   * @returns {WorkerMessage} The load failure worker message.
   */
  public static loadFailure(workerId: number, error: Error) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.System,
      WorkerMessageName.LoadFailure,
      error,
      <ErrorJson>error
    );
  }

  /**
   * Creates a dispose worker message for the specified worker ID.
   * @param {number} workerId - The ID of the worker.
   * @param {string} pointer - worker script path or name.
   * @returns {WorkerMessage} The dispose worker message.
   */
  public static dispose(workerId: number) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.System,
      WorkerMessageName.Dispose
    );
  }

  /**
   * Creates a dispose complete worker message for the specified worker ID.
   * @param {number} workerId - The ID of the worker.
   * @returns {WorkerMessage} The dispose complete worker message.
   */
  public static disposeComplete(workerId: number) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.System,
      WorkerMessageName.DisposeComplete
    );
  }

  /**
   * Creates a dispose failure worker message for the specified worker ID and error.
   * @param {number} workerId - The ID of the worker.
   * @param {Error} error - The error information.
   * @returns {WorkerMessage} The dispose failure worker message.
   */
  public static disposeFailure(workerId: number, error: Error) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.System,
      WorkerMessageName.DisposeFailure,
      error,
      <ErrorJson>error
    );
  }

  /**
   * Creates a task execution worker message for the specified worker ID and error.
   * @param {number} workerId - The ID of the worker.
   * @param {DataType} value - task arguments.
   * @returns {WorkerMessage}
   */
  public static runTask<DataType = unknown>(workerId: number, value?: DataType) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.Info,
      WorkerMessageName.RunTask,
      value
    );
  }

  /**
   * Creates a task use worker message for the specified worker ID and error.
   * @param {number} workerId - The ID of the worker.
   * @param {DataType} value - value to use.
   * @returns {WorkerMessage}
   */
  public static use<DataType = unknown>(workerId: number, value: DataType) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.Info,
      WorkerMessageName.PassData,
      value
    );
  }

  /**
   * Creates a task resolved worker message for the specified worker ID and error.
   * @param {number} workerId - The ID of the worker.
   * @param {DataType} value - result value.
   * @returns {WorkerMessage}
   */
  public static taskResolved<DataType = unknown>(workerId: number, value?: DataType) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.Info,
      WorkerMessageName.TaskResolved,
      value
    );
  }

  /**
   * Creates a task rejected worker message for the specified worker ID and error.
   * @param {number} workerId - The ID of the worker.
   * @param {Error} error
   * @returns {WorkerMessage}
   */
  public static taskRejected(workerId: number, error: Error) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.Error,
      WorkerMessageName.TaskRejected,
      null,
      <ErrorJson>error
    );
  }

  /**
   * Creates a task in progress worker message for the specified worker ID and error.
   * @param {number} workerId - The ID of the worker.
   * @param {DataType} value - result value.
   * @returns {WorkerMessage}
   */
  public static taskProgress<DataType = unknown>(workerId: number, value?: DataType) {
    return new WorkerMessage(
      workerId,
      WorkerMessageType.Info,
      WorkerMessageName.TaskProgress,
      value
    );
  }

  /**
   * Creates a new instance of the WorkerMessage class.
   * @param {number} workerId - The ID of the worker.
   * @param {string} type - The type of the worker message.
   * @param {string} name - The name of the worker message.
   * @param {DataType} [data] - The data contained in the worker message.
   * @param {ErrorJson} [error] - The error information if the worker message is an error message.
   */
  private constructor(
    public readonly workerId: number,
    public readonly type: string,
    public readonly name: string,
    public readonly data?: DataType,
    public readonly error?: ErrorJson
  ) {}

  /**
   * Checks if the worker message represents a task resolved message.
   * @returns {boolean} True if the worker message is a task resolved message, false otherwise.
   */
  public isTaskResolved(): boolean {
    return this.name === WorkerMessageName.TaskResolved;
  }

  /**
   * Checks if the worker message represents a task rejected message.
   * @returns {boolean} True if the worker message is a task rejected message, false otherwise.
   */
  public isTaskRejected(): boolean {
    return this.name === WorkerMessageName.TaskRejected;
  }

  /**
   * Checks if the worker message represents a task progress message.
   * @returns {boolean} True if the worker message is a task progress message, false otherwise.
   */
  public isTaskProgress(): boolean {
    return this.name === WorkerMessageName.TaskProgress;
  }

  /**
   * Converts the worker message to a JSON object.
   * @returns {Object} The JSON representation of the worker message.
   */
  public toJson(): object {
    const { workerId, type, name, data, error } = this;
    let errorJson = {};
    if (error) {
      const { message, stack, name: errorName, ...rest } = error;
      errorJson = {
        message,
        stack,
        name: errorName,
        ...rest,
      };
    }
    return {
      workerId,
      type,
      name,
      data,
      error: errorJson,
    };
  }
}

/**
 * Represents the types of worker messages.
 * @enum {string}
 */
export enum WorkerMessageType {
  Error = 'error',
  Info = 'info',
  Warning = 'warning',
  Task = 'task',
  System = 'system',
}

/**
 * Represents the names of worker messages.
 * @enum {string}
 */
export enum WorkerMessageName {
  Setup = 'setup',
  SetupComplete = 'setup_complete',
  SetupFailure = 'setup_failure',
  Load = 'load',
  LoadComplete = 'load_complete',
  LoadFailure = 'load_failure',
  Dispose = 'dispose',
  DisposeComplete = 'dispose_complete',
  DisposeFailure = 'dispose_failure',
  RunTask = 'run_task',
  PassData = 'pass_data',
  DataPassed = 'data_passed',
  TaskResolved = 'task_resolved',
  TaskRejected = 'task_rejected',
  TaskProgress = 'task_progress',
}
