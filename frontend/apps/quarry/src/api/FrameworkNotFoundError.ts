export class FrameworkNotFoundError extends Error {
  public constructor() { super("This framework is no longer available."); }
}
