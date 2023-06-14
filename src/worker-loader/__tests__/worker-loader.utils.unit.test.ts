import { buildPath, getWorkerLoader } from '../worker-loader.utils';
import path from 'path';
import tsNode from 'ts-node';
import { WorkerLoader } from '../worker-loader';
import { existsSync } from 'fs';
import { InvalidPathError } from '../../worker.errors';

jest.mock('path', () => ({
  resolve: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

jest.mock('ts-node', () => ({
  register: jest.fn(),
}));

describe('buildPath', () => {
  let cwdSpy: jest.SpyInstance;

  beforeEach(() => {
    cwdSpy = jest.spyOn(process, 'cwd');
  });

  afterEach(() => {
    jest.clearAllMocks();
    cwdSpy.mockRestore();
  });

  it('should call ts-node register and resolve path from src if file is .ts', () => {
    const filePath = 'file.ts';
    cwdSpy.mockReturnValue('/root');
    (path.resolve as jest.Mock).mockReturnValue(`/root/src/${filePath}`);
    buildPath(filePath);
    expect(tsNode.register).toHaveBeenCalled();
    expect(path.resolve).toHaveBeenCalledWith('/root', 'src', filePath);
  });

  it('should resolve path from build if file is .js', () => {
    const filePath = 'file.js';
    cwdSpy.mockReturnValue('/root');
    (path.resolve as jest.Mock).mockReturnValue(`/root/build/${filePath}`);
    buildPath(filePath);
    expect(tsNode.register).not.toHaveBeenCalled();
    expect(path.resolve).toHaveBeenCalledWith('/root', 'build', filePath);
  });

  it('should resolve path from build and append .js if file has no extension', () => {
    const filePath = 'file';
    cwdSpy.mockReturnValue('/root');
    (path.resolve as jest.Mock).mockReturnValue(`/root/build/${filePath}.js`);
    buildPath(filePath);
    expect(tsNode.register).not.toHaveBeenCalled();
    expect(path.resolve).toHaveBeenCalledWith('/root', 'build', `${filePath}.js`);
  });
});

describe('getWorkerLoader', () => {
  const filePath = 'worker.js';
  const loaderPath = '/build/worker.js';
  let cwdSpy: jest.SpyInstance;

  beforeEach(() => {
    cwdSpy = jest.spyOn(process, 'cwd');
    (existsSync as jest.Mock).mockReturnValue(true);
    jest.doMock(loaderPath, () => ({ default: WorkerLoader }), { virtual: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
    cwdSpy.mockRestore();
  });

  it('should return WorkerLoader instance if file exists', () => {
    const filePath = 'worker.js';
    cwdSpy.mockReturnValue('/build');
    (path.resolve as jest.Mock).mockReturnValue(`/build/${filePath}`);
    const workerLoader = getWorkerLoader(filePath);
    expect(existsSync).toHaveBeenCalledWith(loaderPath);
    expect(workerLoader).toBeInstanceOf(WorkerLoader);
  });

  it('should throw InvalidPathError if file does not exist', () => {
    (existsSync as jest.Mock).mockReturnValue(false);
    expect(() => getWorkerLoader(filePath)).toThrow(InvalidPathError);
    expect(existsSync).toHaveBeenCalledWith(loaderPath);
  });
});