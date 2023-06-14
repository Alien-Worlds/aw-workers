import { WorkerContainer } from '../worker-container';
import { WorkerClass } from '../worker.types';

describe('WorkerContainer', () => {
  let workerContainer: WorkerContainer;

  beforeEach(() => {
    workerContainer = new WorkerContainer();
  });

  describe('bind', () => {
    test('should bind a worker class to a label', () => {
      const workerClass: WorkerClass<number> =
        jest.fn() as unknown as WorkerClass<number>;
      const label = 'MyWorker';
      workerContainer.bind(label, workerClass);

      expect(workerContainer['bindings'].get(label)).toBe(workerClass);
    });
  });

  describe('get', () => {
    test('should retrieve the worker class associated with the label', () => {
      const workerClass: WorkerClass<number> =
        jest.fn() as unknown as WorkerClass<number>;
      const label = 'MyWorker';
      workerContainer.bind(label, workerClass);

      const result = workerContainer.get(label);

      expect(result).toBe(workerClass);
    });
  });
});
