export default class ReturnError extends Error {
  readonly value: Object;

  constructor(value: Object) {
    super();

    this.value = value;
  }
}
