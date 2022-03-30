import HaggisValue from "../../values/HaggisValue";
import { OutputDevice } from "../IODevices";

export default <OutputDevice<HaggisValue>>{
  async send(value) {
    console.log(value.toString().jsString());
  },
};
