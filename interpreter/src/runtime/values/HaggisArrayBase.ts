import HaggisValue from "./HaggisValue";
import HaggisInteger from "./HaggisInteger";

export default class HaggisArrayBase {
  protected readonly items: HaggisValue[];

  constructor(items: HaggisValue[]) {
    this.items = items;
  }

  length(): HaggisInteger {
    return new HaggisInteger(this.items.length);
  }

  get(index: HaggisInteger) {
    return this.items[index.value];
  }

  set(index: HaggisInteger, value: HaggisValue) {
    this.items[index.value] = value;
  }
}
