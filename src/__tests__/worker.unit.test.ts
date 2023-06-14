import { parentPort, threadId } from 'worker_threads';
import { Worker, TaskResolved, TaskRejected, TaskProgress } from '../worker';
import { WorkerMessage } from '../worker-message';

jest.mock('worker_threads', () => ({
  parentPort: {
    postMessage: jest.fn(),
  },
  threadId: 1,
}));

describe('Worker', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should have the correct thread id', () => {
    const worker = new Worker();
    expect(worker.id).toBe(threadId);
  });

  it('should send a task resolved message when calling resolve', () => {
    const worker = new Worker();
    const data = 'resolved data';
    const expectedMessage = WorkerMessage.taskResolved(threadId, data).toJson();

    const result = worker.resolve(data);

    expect(parentPort.postMessage).toHaveBeenCalledWith(expectedMessage);
    expect(result).toBe('task_resolved');
  });

  it('should send a task rejected message when calling reject', () => {
    const worker = new Worker();
    const error = new Error('Some error');
    const expectedMessage = WorkerMessage.taskRejected(threadId, error).toJson();

    const result = worker.reject(error);

    expect(parentPort.postMessage).toHaveBeenCalledWith(expectedMessage);
    expect(result).toBe('task_rejected');
  });

  it('should send a task progress message when calling progress', () => {
    const worker = new Worker();
    const data = 'progress data';
    const expectedMessage = WorkerMessage.taskProgress(threadId, data).toJson();

    const result = worker.progress(data);

    expect(parentPort.postMessage).toHaveBeenCalledWith(expectedMessage);
    expect(result).toBe('task_progress');
  });
});
