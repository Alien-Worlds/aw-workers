# Workers

Welcome to the Workers package - a part of the Alien Worlds project, an open-source project. Workers is a package built on the node.js `workers_threads` module, enabling scripts to run in parallel.

## Dependencies

- [async](https://github.com/caolan/async)

## Table of Contents

- [Description](#description)
- [Components](#components)
  - [Worker](#worker)
  - [WorkerLoader](#workerloader)
  - [WorkerPool](#workerpool)
    - [Properties](#properties)
    - [Methods](#methods)
- [Get Started](#get-started)
- [Create Worker](#create-worker)
- [Create WorkerLoader](#create-workerloader)
- [Use Worker Dependencies](#use-worker-dependencies)
- [Use Worker Pool](#use-worker-pool)
- [Contributing](#contributing)
- [License](#license)



## Description

The Workers package enables efficient use of multi-threading via the `worker_threads` module of Node.js. Each worker's code is stored in separate TypeScript files which are then loaded using the worker loader. A worker pool manages all the workers and orchestrates the execution of ordered tasks in the pool.

Workers run in-memory, hence enabling saving data as native types and making them available to other workers in the pool. The communication between the worker and the pool is done via messages. This package has defined the necessary messages for the proper operation of the entire process.

Workers can be loaded dynamically in `worker-loader-script`, but that's not the only script that can be externally specified. You can also specify the worker loader path and loader dependencies. Hence, workers can be used for various purposes without needing to modify the base components.

## Components

### Worker

`Worker` is the base class for all processes loaded by the pools. It consists of basic methods, the only one that needs to be overridden is `run()`. A `Worker` has access to `sharedData` which is a shared data container.

A worker operates similarly to a Promise with `progress`, `resolve` and `reject` methods used to communicate with the pool and denote the current work state of a given worker. These methods can pass the appropriate data, facilitating work progress information, and must be called on success or error. Failure to invoke these methods after the completion of work, will result in the worker remaining in the used pool, preventing further task assignment.

### WorkerLoader

`WorkerLoader` is a container that creates `Worker` instances and transfers needed dependencies. Hence, dependencies are not generated with every worker creation - they all use the same. `DefaultWorkerLoader` includes the necessary implementations of the `load` and `setup` methods. However, if your workers require additional settings for specialized operations, you can create your own worker loader and pass its path in the worker pool options.

### WorkerPool

`WorkerPool` is used for creating, managing and deleting workers on demand. In the worker pool options, you can specify the maximum number of threads and the number of threads that cannot be used (to safeguard against the exhaustion of all threads without knowing their count).

On creation of a worker pool, you can also transfer predefined data in the `sharedData` storage area. Additionally, you can specify the worker loader in which the `Worker` instance and loader dependencies are created. If not specified, a default will be assigned, requiring the path to the worker file each time `getWorker()` is called.

#### Properties:

- `workerMaxCount`: The maximum number of workers in the pool.
- `workerLoaderPath`: The path to the worker loader script.
- `workerLoaderDependenciesPath`: The path to the worker loader dependencies.
- `availableWorkers`: A list of available worker proxies.
- `activeWorkersByPid`: A map of active workers by their process IDs.
- `sharedData`: Shared data passed to each worker.
- `workerReleaseHandler`: The handler function for releasing a worker.

#### Methods:

- `static async create(options: WorkerPoolOptions)`: A static asynchronous function that creates a new instance of the WorkerPool class.
- `async setup(options: WorkerPoolOptions)`: Sets up the worker pool by creating and initializing the worker proxies.
- `get workerCount()`: Returns the number of workers in the pool.
- `private async createWorker()`: An asynchronous function that creates a worker instance.
- `async getWorker(pointer?: string)`: Retrieves an available worker from the pool, or returns `null` if no worker is available.
- `async releaseWorker(id: number, data?: unknown)`: Releases a worker back to the pool.
- `removeWorkers()`: Removes all workers from the pool.
- `hasAvailableWorker()`: Checks if there is an available worker in the pool. Returns `true` if an available worker exists, `false` otherwise.
- `hasActiveWorkers()`: Checks if there are active workers in the pool. Returns `true` if active workers exist, `false` otherwise.
- `countAvailableWorkers()`: Returns the number of available workers in the pool.
- `countActiveWorkers()`: Returns the number of active workers in the pool.
- `onWorkerRelease(handler: WorkerReleaseHandler)`: Registers a handler for the worker release event.

Please refer to the method documentation for more details on how to use each method and the parameters they accept.


## Get Started

To install the `@alien-worlds/aw-workers` package, use the following command:

```bash
yarn add @alien-worlds/aw-workers
```

## Create Worker

When creating a worker class, the first basic thing you need to remember is to use **default** export or have only one export in the worker file. You also need to know that you can pass data to the worker, but only in the form of native objects. If you pass class instances, they will not contain methods because this data is sent as a message to the thread. Also remember that at the end of the job you have to call resolve rub reject to fire the worker. Just like Promise


```typescript
export default class YourWorker extends Worker<YourSharedData> {
  // constructor is only required when you use custom worker loader and you pass extra data to the worker
  constructor(private dependencies: YourDependencies) {
    super();
    // ...
  }
  // In short, this is the method called when you call "run" on worker from the pool.
  // Remember that you can only pass native type argument
  public async run(data: unknown): Promise<void> {
    try {
      //...
      this.resolve({ ... });
    } catch (error) {
      this.reject(error);
    }
  }
}
```

## Create WorkerLoader

In normal/simple cases, you don't need to set custom worker loader or loader dependencies. We do this only if the worker needs to use 3rd party components and which should not be instantiated every time the worker is started.

```typescript
// An example of a worker loader that creates loads a specific worker from a given path.

export default class CustomWorkerLoader extends DefaultWorkerLoader<CustomSharedData, CustomWorkerLoaderDependencies> {
  protected workers: WorkerContainer;

  public async setup(sharedData: CustomSharedData): Promise<void> {
    const { workersPath } = sharedData;

    await super.setup(sharedData, workersPath);
    
    // some additional setup work
  }

  // this WorkerLoader will load 
  public async load(pointer: string): Promise<Worker> {
    const {
      dependencies: { ...some, workersPath },
    } = this;
    const { sharedData } = this;
    const workerClasses = await import(workersPath);
    const worker: Worker = new workerClasses[pointer](
      {
        ...some,
        ...
      },
      sharedData
    ) as Worker;
    return worker;
  }
}
```

## Use Worker Dependencies

**It is not required to create a WorkerLoaderDependencies.** This mechanism was introduced specifically for the benefit of one of the components of the Alien Worlds open source project. All the operations we perform here can also be performed in your custom worker loader itself. It all depends on the concept of your project.
However, when creating WorkerLoaderDependencies you must remember that the class should have the initialize method. In it, you create all the necessary components that will be publicly available to the environment, i.e. worker loader and later passed to the worker.


```typescript
export class YourWorkerLoaderDependencies extends WorkerLoaderDependencies {
  public componentA: ComponentA;
  public componentB: ComponentB;
  public componentC: ComponentC;
  ...
  public async initialize(...args: unknown[]): Promise<void> {
    const [requiredForA, requiredForB, requiredForC, ...] = args;
    this.compoentA = await createComponentA(requiredForA);
    this.compoentB = await createComponentB(requiredForB);
    this.compoentC = await createComponentC(requiredForC);
    ...
  }
}

```

## Use Worker Pool

The use of WorkerPool is limited to calling a worker at the right moment according to the logic of your application and reacting to actions coming from the worker. Remember to release a worker from service and return him to the pool after each work done or not done


```typescript
// configure worker pool
const workerPool = await WorkerPool.create({
  threadsCount: 4, // or use inviolableThreadsCount
  sharedData: { ... },
  workerLoaderPath: '/path/to/your/worker-loader', // if not passed default will be used
  workerLoaderDependenciesPath: '/path/to/your/worker-loader/dependencies' // optional
});
workerPool.onWorkerRelease(() => {
  // Called when a worker is returned to the pool
});
// if you won't provide your custom workerLoaderPath you will have to pass path to the worker script
// eg. workerPool.getWorker('path/to/the/worker');
const worker = await workerPool.getWorker();

if (worker) {
  worker.onMessage(message => {
    if (message.isTaskResolved()) {
      // remember to release the worker
      workerPool.releaseWorker(message.workerId);
      // ...
    } else if (message.isTaskRejected()) {
      // remember to release the worker
      workerPool.releaseWorker(message.workerId);
      // ...
    } else if (message.isTaskProgress()) {
      // handle work in progress...
    }
  });
  // handle error
  worker.onError((id, error) => {
    workerPool.releaseWorker(id);
  });
  // run worker
  worker.run({ ... });
}
```

## Contributing

We welcome contributions from the community. Before contributing, please read through the existing issues on this repository to prevent duplicate submissions. New feature requests and bug reports can be submitted as an issue. If you would like to contribute code, please open a pull request.

## License

This project is licensed under the terms of the MIT license. For more information, refer to the [LICENSE](./LICENSE) file.

