export class SearchValidationError extends Error {
  public constructor() {
    super("Use a project description of 500 characters or fewer.");
    this.name = "SearchValidationError";
  }
}
