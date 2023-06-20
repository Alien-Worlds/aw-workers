export type WorkerLoaderClass = new (...args: never[]) => void;
export type WorkerLoaderDependenciesClass = new (...args: never[]) => void;
export type WorkerConstructorArgs = { [key: string]: unknown };

export abstract class WorkerLoaderDependencies {
  public abstract initialize(...args: unknown[]): Promise<void>;
}
