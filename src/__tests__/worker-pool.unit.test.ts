import { WorkerProxy } from '../worker-proxy';
import { WorkerPool } from '../worker-pool';
import { getWorkersCount } from '../worker.utils';

jest.mock('../worker-proxy', () => {
  return {
    WorkerProxy: jest.fn().mockImplementation(() => ({
      setup: jest.fn(),
      load: jest.fn(),
      dispose: jest.fn(),
      remove: jest.fn(),
    })),
  };
});

jest.mock('../worker.utils', () => {
  return {
    getWorkersCount: jest.fn(),
  };
});

describe('WorkerPool', () => {
  let workerPool: WorkerPool;
  let mockWorkerProxy: any;

  beforeEach(() => {
    mockWorkerProxy = new WorkerProxy({},{});
    (WorkerProxy as any).mockClear();
    (WorkerProxy as any).mockImplementation(() => mockWorkerProxy);

    workerPool = new WorkerPool();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setup', () => {
    it('should create and initialize the worker proxies', async () => {
      const options = {
        threadsCount: 4,
        inviolableThreadsCount: 1,
        sharedData: 'sharedData',
        workerLoaderPath: 'workerLoaderPath',
      };

      (getWorkersCount as any).mockReturnValue(3);

      await workerPool.setup(options);

      expect((workerPool as any).workerLoaderPath).toBe(options.workerLoaderPath);
      expect((workerPool as any).sharedData).toBe(options.sharedData);
      expect(workerPool.workerMaxCount).toBe(3);

      expect(WorkerProxy).toHaveBeenCalledTimes(3);
      expect(mockWorkerProxy.setup).toHaveBeenCalled();
      expect((workerPool as any).availableWorkers.length).toBe(3);
    });
  });

  describe('getWorker', () => {
    it('should return an available worker when there are fewer active workers than the maximum count', async () => {
      const pointer = 'pointer';
      (workerPool as any).availableWorkers = [mockWorkerProxy];
      workerPool.workerMaxCount = 3;

      const result = await workerPool.getWorker(pointer);

      expect(result).toBe(mockWorkerProxy);
      expect(mockWorkerProxy.load).toHaveBeenCalledWith(pointer);
      expect((workerPool as any).activeWorkersByPid.size).toBe(1);
      expect((workerPool as any).availableWorkers.length).toBe(0);
    });

    it('should return null when there are no available workers', async () => {
      (workerPool as any).availableWorkers = [];
      workerPool.workerMaxCount = 3;

      const result = await workerPool.getWorker();

      expect(result).toBeNull();
      expect(mockWorkerProxy.load).not.toHaveBeenCalled();
      expect((workerPool as any).activeWorkersByPid.size).toBe(0);
    });
  });

  describe('releaseWorker', () => {
    it('should release an active worker and invoke the worker release handler', async () => {
      const id = 123;
      const data = 'data';
      (workerPool as any).activeWorkersByPid.set(id, mockWorkerProxy);
      (workerPool as any).availableWorkers = [mockWorkerProxy];
      workerPool.workerMaxCount = 2;
      (workerPool as any).workerReleaseHandler = jest.fn();

      await workerPool.releaseWorker(id, data);

      expect(mockWorkerProxy.dispose).toHaveBeenCalled();
      expect((workerPool as any).activeWorkersByPid.size).toBe(0);
      expect((workerPool as any).availableWorkers.length).toBe(2);
      expect((workerPool as any).workerReleaseHandler).toHaveBeenCalledWith(id, data);
    });

    it('should log a message if no worker with the specified ID is found', async () => {
      const id = 123;
      const data = 'data';
      (workerPool as any).availableWorkers = [mockWorkerProxy];
      workerPool.workerMaxCount = 3;
      (workerPool as any).workerReleaseHandler = jest.fn();

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await workerPool.releaseWorker(id, data);

      expect(consoleSpy).toHaveBeenCalledWith(
        `No worker with the specified ID #${id} was found`
      );
      expect(mockWorkerProxy.dispose).not.toHaveBeenCalled();
      expect((workerPool as any).activeWorkersByPid.size).toBe(0);
      expect((workerPool as any).availableWorkers.length).toBe(1);
      expect((workerPool as any).workerReleaseHandler).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('removeWorkers', () => {
    it('should call remove on all active and available workers', () => {
      const activeWorker1 = { remove: jest.fn() };
      const activeWorker2 = { remove: jest.fn() };
      const availableWorker1 = { remove: jest.fn() };
      const availableWorker2 = { remove: jest.fn() };

      (workerPool as any).activeWorkersByPid = new Map([
        [1, activeWorker1],
        [2, activeWorker2],
      ]);
      (workerPool as any).availableWorkers = [availableWorker1, availableWorker2];

      workerPool.removeWorkers();

      expect(activeWorker1.remove).toHaveBeenCalled();
      expect(activeWorker2.remove).toHaveBeenCalled();
      expect(availableWorker1.remove).toHaveBeenCalled();
      expect(availableWorker2.remove).toHaveBeenCalled();
    });
  });

  describe('hasAvailableWorker', () => {
    it('should return true if there is an available worker', () => {
      workerPool.workerMaxCount = 3;
      (workerPool as any).activeWorkersByPid = new Map([[1, mockWorkerProxy]]);
      (workerPool as any).availableWorkers = [mockWorkerProxy];

      const result = workerPool.hasAvailableWorker();

      expect(result).toBe(true);
    });

    it('should return false if there are no available workers', () => {
      workerPool.workerMaxCount = 1;
      (workerPool as any).activeWorkersByPid = new Map([[1, mockWorkerProxy]]);
      (workerPool as any).availableWorkers = [];

      const result = workerPool.hasAvailableWorker();

      expect(result).toBe(false);
    });
  });

  describe('hasActiveWorkers', () => {
    it('should return true if there are active workers', () => {
      (workerPool as any).activeWorkersByPid = new Map([[1, mockWorkerProxy]]);

      const result = workerPool.hasActiveWorkers();

      expect(result).toBe(true);
    });

    it('should return false if there are no active workers', () => {
      (workerPool as any).activeWorkersByPid = new Map();

      const result = workerPool.hasActiveWorkers();

      expect(result).toBe(false);
    });
  });

  describe('countAvailableWorkers', () => {
    it('should return the number of available workers', () => {
      workerPool.workerMaxCount = 3;
      (workerPool as any).activeWorkersByPid = new Map([[1, mockWorkerProxy]]);
      (workerPool as any).availableWorkers = [mockWorkerProxy, mockWorkerProxy];

      const result = workerPool.countAvailableWorkers();

      expect(result).toBe(2);
    });
  });

  describe('countActiveWorkers', () => {
    it('should return the number of active workers', () => {
      (workerPool as any).activeWorkersByPid = new Map([
        [1, mockWorkerProxy],
        [2, mockWorkerProxy],
      ]);

      const result = workerPool.countActiveWorkers();

      expect(result).toBe(2);
    });
  });

  describe('onWorkerRelease', () => {
    it('should set the worker release handler', () => {
      const handler = jest.fn();

      workerPool.onWorkerRelease(handler);

      expect((workerPool as any).workerReleaseHandler).toBe(handler);
    });
  });
});
