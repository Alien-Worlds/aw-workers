import { Worker } from 'worker_threads';
import { WorkerProxy } from '../worker-proxy';
import {
  WorkerMessage,
  WorkerMessageContent,
  WorkerMessageName,
  WorkerMessageType,
} from '../worker-message';

jest.mock('worker_threads', () => {
  const mockPostMessage = jest.fn();
  const mockWorker = {
    threadId: 123,
    removeAllListeners: jest.fn(),
    on: jest.fn(),
    postMessage: mockPostMessage,
  };

  return {
    Worker: jest.fn().mockImplementation(() => mockWorker),
  };
});

describe('WorkerProxy', () => {
  let mockWorker: Worker;
  let workerProxy: WorkerProxy;

  beforeEach(() => {
    mockWorker = new Worker('') as any;
    workerProxy = new WorkerProxy('sharedData', {});
    (workerProxy as any).worker = mockWorker;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setup', () => {
    it('should resolve the promise on successful setup', async () => {
      const setupPromise = workerProxy.setup();
      const mockMessageContent = {
        type: WorkerMessageType.System,
        name: WorkerMessageName.SetupComplete,
        data: null,
      };

      const messageHandler = (mockWorker as any).on.mock.calls[0][1];
      messageHandler(mockMessageContent);

      await expect(setupPromise).resolves.toBeUndefined();
      expect(mockWorker.removeAllListeners).toHaveBeenCalledTimes(2);
      expect(mockWorker.postMessage).toHaveBeenCalledWith(expect.anything());
    });

    it('should reject the promise on setup failure', async () => {
      const setupPromise = workerProxy.setup();
      const mockErrorMessage = 'Failed to setup';
      const mockMessageContent = {
        type: WorkerMessageType.System,
        name: WorkerMessageName.SetupFailure,
        data: mockErrorMessage,
      };

      const messageHandler = (mockWorker as any).on.mock.calls[0][1];
      messageHandler(mockMessageContent);

      await expect(setupPromise).rejects.toEqual(mockErrorMessage);
      expect(mockWorker.removeAllListeners).toHaveBeenCalledTimes(2);
      expect(mockWorker.postMessage).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe('load', () => {
    it('should resolve the promise on successful load', async () => {
      const loadPromise = workerProxy.load('pointer');
      const mockMessageContent = {
        type: WorkerMessageType.System,
        name: WorkerMessageName.LoadComplete,
        data: null,
      };

      const messageHandler = (mockWorker as any).on.mock.calls[0][1];
      messageHandler(mockMessageContent);

      await expect(loadPromise).resolves.toBeUndefined();
      expect(mockWorker.removeAllListeners).toHaveBeenCalledTimes(2);
      expect(mockWorker.postMessage).toHaveBeenCalledWith(expect.anything());
    });

    it('should reject the promise on load failure', async () => {
      const loadPromise = workerProxy.load('pointer');
      const mockErrorMessage = 'Failed to load';
      const mockMessageContent = {
        type: WorkerMessageType.System,
        name: WorkerMessageName.LoadFailure,
        data: mockErrorMessage,
      };

      const messageHandler = (mockWorker as any).on.mock.calls[0][1];
      messageHandler(mockMessageContent);

      await expect(loadPromise).rejects.toEqual(mockErrorMessage);
      expect(mockWorker.removeAllListeners).toHaveBeenCalledTimes(2);
      expect(mockWorker.postMessage).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe('dispose', () => {
    it('should resolve the promise on successful disposal', async () => {
      const disposePromise = workerProxy.dispose();
      const mockMessageContent = {
        type: WorkerMessageType.System,
        name: WorkerMessageName.DisposeComplete,
        data: null,
      };

      const messageHandler = (mockWorker as any).on.mock.calls[0][1];
      messageHandler(mockMessageContent);

      await expect(disposePromise).resolves.toBeUndefined();
      expect(mockWorker.removeAllListeners).toHaveBeenCalledTimes(2);
      expect(mockWorker.postMessage).toHaveBeenCalledWith(expect.anything());
    });

    it('should reject the promise on disposal failure', async () => {
      const disposePromise = workerProxy.dispose();
      const mockErrorMessage = 'Failed to dispose';
      const mockMessageContent = {
        type: WorkerMessageType.System,
        name: WorkerMessageName.DisposeFailure,
        data: mockErrorMessage,
      };

      const messageHandler = (mockWorker as any).on.mock.calls[0][1];
      messageHandler(mockMessageContent);

      await expect(disposePromise).rejects.toEqual(mockErrorMessage);
      expect(mockWorker.removeAllListeners).toHaveBeenCalledTimes(2);
      expect(mockWorker.postMessage).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe('run', () => {
    it('should send the task to the worker', () => {
      const testData = { someData: 'example' };
      workerProxy.run(testData);

      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        WorkerMessage.runTask(workerProxy.id, testData).toJson()
      );
    });
  });

  describe('onMessage', () => {
    it('should invoke the handler when a non-system message is received', async () => {
      const mockHandler = jest.fn();
      const testData = { someData: 'example' };
      const mockMessageContent = {
        type: WorkerMessageType.Task,
        name: 'SomeMessage',
        data: testData,
      } as any;
      mockHandler.mockResolvedValue(WorkerMessage.create(mockMessageContent));

      workerProxy.onMessage(mockHandler);

      const messageHandler = (mockWorker as any).on.mock.calls[0][1];
      messageHandler(mockMessageContent);

      expect(mockHandler).toHaveBeenCalledWith(WorkerMessage.create(mockMessageContent));
    });

    it('should not invoke the handler when a system message is received', async () => {
      const mockHandler = jest.fn();
      const mockMessageContent = {
        type: WorkerMessageType.System,
        name: WorkerMessageName.SetupComplete,
        data: null,
      };

      workerProxy.onMessage(mockHandler);

      const messageHandler = (mockWorker as any).on.mock.calls[0][1];
      messageHandler(mockMessageContent);

      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('onError', () => {
    it('should invoke the handler when an error occurs on the worker', () => {
      const mockErrorHandler = jest.fn();
      const testError = new Error('Test error');

      workerProxy.onError(mockErrorHandler);

      const errorHandler = (mockWorker as any).on.mock.calls.find(
        ([event]) => event === 'error'
      )[1];
      errorHandler(testError);

      expect(mockErrorHandler).toHaveBeenCalledWith(workerProxy.id, testError);
    });
  });

  describe('onExit', () => {
    it('should invoke the handler when the worker exits', () => {
      const mockExitHandler = jest.fn();
      const testExitCode = 0;

      workerProxy.onExit(mockExitHandler);

      const exitHandler = (mockWorker as any).on.mock.calls.find(
        ([event]) => event === 'exit'
      )[1];
      exitHandler(testExitCode);

      expect(mockExitHandler).toHaveBeenCalledWith(workerProxy.id, testExitCode);
    });
  });
});
