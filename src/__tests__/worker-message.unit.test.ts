import { WorkerMessage, WorkerMessageName, WorkerMessageType } from '../worker-message';

describe('WorkerMessage', () => {
  describe('use', () => {
    it('should create a use worker message for the specified worker ID and value', () => {
      const workerId = 1;
      const value = 'Data value';

      const message = WorkerMessage.use(workerId, value);

      expect(message.workerId).toBe(workerId);
      expect(message.type).toBe(WorkerMessageType.Info);
      expect(message.name).toBe(WorkerMessageName.PassData);
      expect(message.data).toBe(value);
    });
  });

  describe('load', () => {
    it('should create a load worker message for the specified worker ID and pointer', () => {
      const workerId = 1;
      const pointer = 'Data pointer';

      const message = WorkerMessage.load(workerId, pointer);

      expect(message.workerId).toBe(workerId);
      expect(message.type).toBe(WorkerMessageType.System);
      expect(message.name).toBe(WorkerMessageName.Load);
      expect(message.data).toBe(pointer);
    });
  });

  describe('loadComplete', () => {
    it('should create a load complete worker message for the specified worker ID', () => {
      const workerId = 1;

      const message = WorkerMessage.loadComplete(workerId);

      expect(message.workerId).toBe(workerId);
      expect(message.type).toBe(WorkerMessageType.System);
      expect(message.name).toBe(WorkerMessageName.LoadComplete);
    });
  });

  describe('loadFailure', () => {
    it('should create a load failure worker message for the specified worker ID and error', () => {
      const workerId = 1;
      const error = new Error('Load failed');

      const message = WorkerMessage.loadFailure(workerId, error);

      expect(message.workerId).toBe(workerId);
      expect(message.type).toBe(WorkerMessageType.System);
      expect(message.name).toBe(WorkerMessageName.LoadFailure);
      expect(message.error).toBeTruthy();
    });
  });

  describe('dispose', () => {
    it('should create a dispose worker message for the specified worker ID', () => {
      const workerId = 1;

      const message = WorkerMessage.dispose(workerId);

      expect(message.workerId).toBe(workerId);
      expect(message.type).toBe(WorkerMessageType.System);
      expect(message.name).toBe(WorkerMessageName.Dispose);
    });
  });

  describe('disposeComplete', () => {
    it('should create a dispose complete worker message for the specified worker ID', () => {
      const workerId = 1;

      const message = WorkerMessage.disposeComplete(workerId);

      expect(message.workerId).toBe(workerId);
      expect(message.type).toBe(WorkerMessageType.System);
      expect(message.name).toBe(WorkerMessageName.DisposeComplete);
    });
  });

  describe('disposeFailure', () => {
    it('should create a dispose failure worker message for the specified worker ID and error', () => {
      const workerId = 1;
      const error = new Error('Dispose failed');

      const message = WorkerMessage.disposeFailure(workerId, error);

      expect(message.workerId).toBe(workerId);
      expect(message.type).toBe(WorkerMessageType.System);
      expect(message.name).toBe(WorkerMessageName.DisposeFailure);
      expect(message.error).toBeTruthy();
    });
  });

  describe('taskResolved', () => {
    it('should create a task resolved worker message for the specified worker ID and value', () => {
      const workerId = 1;
      const value = 'Data value';

      const message = WorkerMessage.taskResolved(workerId, value);

      expect(message.workerId).toBe(workerId);
      expect(message.type).toBe(WorkerMessageType.Info);
      expect(message.name).toBe(WorkerMessageName.TaskResolved);
      expect(message.data).toBe(value);
    });
  });

  describe('taskRejected', () => {
    it('should create a task rejected worker message for the specified worker ID and error', () => {
      const workerId = 1;
      const error = new Error('Task rejected');

      const message = WorkerMessage.taskRejected(workerId, error);

      expect(message.workerId).toBe(workerId);
      expect(message.type).toBe(WorkerMessageType.Error);
      expect(message.name).toBe(WorkerMessageName.TaskRejected);
      expect(message.error).toBeTruthy();
    });
  });

  describe('taskProgress', () => {
    it('should create a task progress worker message for the specified worker ID and value', () => {
      const workerId = 1;
      const value = 'Progress value';

      const message = WorkerMessage.taskProgress(workerId, value);

      expect(message.workerId).toBe(workerId);
      expect(message.type).toBe(WorkerMessageType.Info);
      expect(message.name).toBe(WorkerMessageName.TaskProgress);
      expect(message.data).toBe(value);
    });
  });

  describe('create', () => {
    it('should create a worker message with the specified content', () => {
      const content = {
        workerId: 1,
        type: WorkerMessageType.Info,
        name: WorkerMessageName.RunTask,
        data: 'Task data',
      };

      const message = WorkerMessage.create(content);

      expect(message.workerId).toBe(content.workerId);
      expect(message.type).toBe(content.type);
      expect(message.name).toBe(content.name);
      expect(message.data).toBe(content.data);
      expect(message.error).toBeFalsy();
    });
  });

  describe('setup', () => {
    it('should create a setup worker message for the specified worker ID', () => {
      const workerId = 1;

      const message = WorkerMessage.setup(workerId);

      expect(message.workerId).toBe(workerId);
      expect(message.type).toBe(WorkerMessageType.System);
      expect(message.name).toBe(WorkerMessageName.Setup);
    });
  });

  describe('setupComplete', () => {
    it('should create a setup complete worker message for the specified worker ID', () => {
      const workerId = 1;

      const message = WorkerMessage.setupComplete(workerId);

      expect(message.workerId).toBe(workerId);
      expect(message.type).toBe(WorkerMessageType.System);
      expect(message.name).toBe(WorkerMessageName.SetupComplete);
    });
  });

  describe('setupFailure', () => {
    it('should create a setup failure worker message for the specified worker ID and error', () => {
      const workerId = 1;
      const error = new Error('Setup failed');

      const message = WorkerMessage.setupFailure(workerId, error);

      expect(message.workerId).toBe(workerId);
      expect(message.type).toBe(WorkerMessageType.System);
      expect(message.name).toBe(WorkerMessageName.SetupFailure);
      expect(message.error).toBeTruthy();
    });
  });

  describe('isTaskResolved', () => {
    it('should return true if the worker message represents a task resolved message', () => {
      const message = WorkerMessage.taskResolved(1);
      const result = message.isTaskResolved();

      expect(result).toBe(true);
    });

    it('should return false if the worker message does not represent a task resolved message', () => {
      const message = WorkerMessage.runTask(1, {});
      const result = message.isTaskResolved();

      expect(result).toBe(false);
    });
  });

  describe('isTaskRejected', () => {
    it('should return true if the worker message represents a task rejected message', () => {
      const message = WorkerMessage.taskRejected(1, new Error());
      const result = message.isTaskRejected();

      expect(result).toBe(true);
    });

    it('should return false if the worker message does not represent a task rejected message', () => {
      const message = WorkerMessage.runTask(1);
      const result = message.isTaskRejected();

      expect(result).toBe(false);
    });
  });

  describe('isTaskProgress', () => {
    it('should return true if the worker message represents a task progress message', () => {
      const message = WorkerMessage.taskProgress(1);
      const result = message.isTaskProgress();

      expect(result).toBe(true);
    });

    it('should return false if the worker message does not represent a task progress message', () => {
      const message = WorkerMessage.runTask(1);
      const result = message.isTaskProgress();

      expect(result).toBe(false);
    });
  });

  describe('toJson', () => {
    it('should convert the worker message to a JSON object', () => {
      const message = WorkerMessage.runTask(1, 'Task data');
      const json = message.toJson();

      expect(json).toEqual({
        workerId: message.workerId,
        type: message.type,
        name: message.name,
        data: message.data,
        error: {},
      });
    });
  });
});
