import * as os from 'os';
import { workerData } from 'worker_threads';
import { getWorkersCount, getSharedData } from '../worker.utils';

jest.mock('os');
jest.mock('worker_threads', () => ({
  parentPort: {
    postMessage: jest.fn(),
  },
  workerData: { sharedData: {} },
}));

describe('getWorkersCount', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return number of available CPU cores minus inviolable threads count when threads count is 0', () => {
    const mockCpusLength = 4;
    jest.spyOn(os, 'cpus').mockReturnValueOnce({ length: mockCpusLength } as any);

    const result = getWorkersCount(0, 1);

    expect(result).toBe(mockCpusLength - 1);
    expect(os.cpus).toHaveBeenCalledTimes(1);
  });

  it('should return threads count when it is greater than 0', () => {
    const mockCpusLength = 4;
    jest.spyOn(os, 'cpus').mockReturnValueOnce({ length: mockCpusLength } as any);

    const result = getWorkersCount(2, 1);

    expect(result).toBe(2);
    expect(os.cpus).not.toHaveBeenCalled();
  });

  it('should return number of available CPU cores minus inviolable threads count when threads count is NaN', () => {
    jest.spyOn(os, 'cpus').mockReturnValueOnce({ length: 4 } as any);
    const result = getWorkersCount(NaN, 1);

    expect(result).toBe(3);
    expect(os.cpus).toHaveBeenCalled();
  });
});

describe('getSharedData', () => {
  it('should return the shared data from workerData', () => {
    const mockSharedData = { key: 'value' };
    (workerData as any).sharedData = mockSharedData;

    const result = getSharedData();

    expect(result).toBe(mockSharedData);
  });
});
