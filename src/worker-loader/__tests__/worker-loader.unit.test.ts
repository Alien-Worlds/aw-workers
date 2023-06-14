import { buildPath } from '../worker-loader.utils';
import fs, { existsSync } from 'fs';
import { UndefinedPointerError } from '../worker-loader.errors';
import { DefaultWorkerLoader } from '../worker-loader';
import { Worker } from '../../worker';

jest.mock('../worker-loader.utils', () => ({
  buildPath: jest.fn(),
}));

jest.mock('../worker-loader.errors', () => ({
  UndefinedPointerError: jest.fn(),
}));

describe('DefaultWorkerLoader', () => {
  const WorkerClass = class extends Worker {};

  let existsSyncSpy: jest.SpyInstance;
  let loader: DefaultWorkerLoader;

  beforeEach(() => {
    loader = new DefaultWorkerLoader();
    (buildPath as jest.Mock).mockReturnValue('/build/worker.js');
    existsSyncSpy = jest.spyOn(fs, 'existsSync');
    jest.doMock('/build/worker.js', () => ({ default: WorkerClass }), { virtual: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (existsSyncSpy) existsSyncSpy.mockRestore();
  });

  it('should setup sharedData', async () => {
    const sharedData = { data: 'test' };
    await loader.setup(sharedData);
    expect((loader as any).sharedData).toEqual(sharedData);
  });

  it('should load Worker from file if it exists', async () => {
    existsSyncSpy.mockReturnValue(true);
    const worker = await loader.load('worker.js');
    expect(buildPath).toHaveBeenCalledWith('worker.js');
    expect(existsSync).toHaveBeenCalledWith('/build/worker.js');
    expect(worker).toBeInstanceOf(WorkerClass);
  });

  it('should load Worker from bindings if file does not exist', async () => {
    existsSyncSpy.mockReturnValue(false);
    loader.bindings.set('worker', WorkerClass);
    const worker = await loader.load('worker');
    expect(buildPath).toHaveBeenCalledWith('worker');
    expect(existsSync).toHaveBeenCalledWith('/build/worker.js');
    expect(worker).toBeInstanceOf(WorkerClass);
  });

  it('should throw UndefinedPointerError if pointer is not defined', async () => {
    expect.assertions(1);
    try {
      await loader.load(null);
    } catch (e) {
      expect(e).toBeInstanceOf(UndefinedPointerError);
    }
  });

  it('should throw Error if Worker is not found', async () => {
    await expect(loader.load('worker')).rejects.toThrow(
      'A valid path to a worker was not specified or a worker was not assigned to the given name worker'
    );
  });
});
