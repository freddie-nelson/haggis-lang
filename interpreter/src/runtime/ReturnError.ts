import HaggisValue from "./values/HaggisValue";

export default class ReturnError extends Error {
  readonly value: HaggisValue;

  constructor(value: HaggisValue) {
    super();

    this.value = value;
  }
}
