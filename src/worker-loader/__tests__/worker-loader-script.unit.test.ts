import { getWorkerLoader } from '../worker-loader.utils';
import { DefaultWorkerLoader } from '../worker-loader';

import { parentPort, workerData } from 'worker_threads';
import { WorkerMessage, WorkerMessageName } from '../../worker-message';
import async from 'async';
import { loadWorker, messageHandler, setupWorkerLoader } from '../worker-loader-script';
import * as MockedLoaderScript from '../worker-loader-script';
import { EventEmitter } from 'events';
import { Worker } from '../../worker';

jest.mock('worker_threads', () => ({
  parentPort: {
    postMessage: jest.fn(),
    on: jest.fn(),
  },
  workerData: { sharedData: {} },
}));

jest.mock('async');
jest.mock('../worker-loader.utils');
jest.mock('../../worker-message');

describe('messageHandler', () => {
  const workerId = 12;
  const pointer = 'testPointer';
  const sharedData = {};
  const options = {
    workerLoaderPath: 'testPath',
    workerLoaderDependenciesPath: 'testPath',
  };
  let workerLoader: DefaultWorkerLoader;
  let queue: any;
  let worker: Worker;

  beforeEach(() => {
    worker = {
      run: jest.fn().mockImplementation((...args) => {
        console.log('worker.run called with', args);
        return true;
      }),
    } as any;
    workerLoader = {
      load: jest.fn().mockResolvedValue(worker),
      setup: jest.fn(),
    } as any;
    (getWorkerLoader as jest.Mock).mockReturnValue(workerLoader);
    workerData.pointer = pointer;
    workerData.sharedData = sharedData;
    workerData.options = options;
    (WorkerMessage.setupComplete as jest.Mock).mockReturnValue({ workerId });
    (WorkerMessage.setupFailure as jest.Mock).mockReturnValue({ workerId });
    (WorkerMessage.loadComplete as jest.Mock).mockReturnValue({ workerId });
    (WorkerMessage.loadFailure as jest.Mock).mockReturnValue({ workerId });
    (WorkerMessage.disposeComplete as jest.Mock).mockReturnValue({ workerId });
    (WorkerMessage.disposeFailure as jest.Mock).mockReturnValue({ workerId });
    queue = { push: jest.fn() };
    (async.queue as jest.Mock).mockReturnValue(queue);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should setup workerLoader and send setupComplete message', async () => {
    await messageHandler({ name: WorkerMessageName.Setup, workerId } as any);
    expect(getWorkerLoader).toHaveBeenCalledWith(
      options?.workerLoaderPath,
      options?.workerLoaderDependenciesPath
    );
    expect(workerLoader.setup).toHaveBeenCalledWith(sharedData);
    expect(parentPort.postMessage).toHaveBeenCalledWith({ workerId });
  });

  it('should load worker and send loadComplete message', async () => {
    const data = 'testData';

    await messageHandler({ name: WorkerMessageName.Setup, workerId } as any);
    await messageHandler({ name: WorkerMessageName.Load, workerId, data } as any);

    expect(workerLoader.load).toHaveBeenCalledWith(data);
    expect(parentPort.postMessage).toHaveBeenCalledWith({ workerId });
  });

  it('should handle load failure and send loadFailure message', async () => {
    const error = new Error('Load error');

    (workerLoader.load as jest.Mock).mockRejectedValue(error);
    await setupWorkerLoader('');
    await messageHandler({ name: WorkerMessageName.Load, workerId } as any);

    expect(workerLoader.load).toHaveBeenCalledWith(pointer);
    expect(parentPort.postMessage).toHaveBeenCalledWith(
      WorkerMessage.loadFailure(workerId, error)
    );
  });

  it('should dispose worker and send disposeComplete message', async () => {
    await messageHandler({ name: WorkerMessageName.Setup, workerId } as any);
    await messageHandler({ name: WorkerMessageName.Dispose, workerId } as any);

    expect(parentPort.postMessage).toHaveBeenCalledWith({ workerId });
  });

  it('should handle dispose failure and send disposeFailure message', async () => {
    const error = new Error('Dispose error');
    await messageHandler({ name: WorkerMessageName.Dispose, workerId } as any);

    expect(parentPort.postMessage).toHaveBeenCalledWith(
      WorkerMessage.disposeFailure(workerId, error)
    );
  });

  it('should run worker task', async () => {
    const data = 'testData';
    jest.spyOn(MockedLoaderScript, 'getWorker').mockReturnValue(worker);
    await messageHandler({ name: WorkerMessageName.Load, workerId, data } as any);
    await messageHandler({ name: WorkerMessageName.RunTask, workerId, data } as any);
    expect(worker.run).toBeCalledWith(data);
  });
});
