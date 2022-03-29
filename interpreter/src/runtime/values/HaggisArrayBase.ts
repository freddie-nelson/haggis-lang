import HaggisValue from "./HaggisValue";
import HaggisInteger from "./HaggisInteger";
import RuntimeError from "../RuntimeError";
import Token from "../../scanning/Token";

export default class HaggisArrayBase {
  protected readonly items: HaggisValue[];

  constructor(items: HaggisValue[]) {
    this.items = items;
  }

  length(): HaggisInteger {
    return new HaggisInteger(this.items.length);
  }

  get(index: HaggisInteger, token: Token) {
    if (index.value >= this.items.length)
      throw new RuntimeError(token, `Attempted to read outside array bounds.`);

    return this.items[index.value];
  }

  set(index: HaggisInteger, value: HaggisValue, token: Token) {
    if (index.value >= this.items.length)
      throw new RuntimeError(token, `Attempted to write outside array bounds.`);

    this.items[index.value] = value;
  }
}
