import Haggis from "Haggis";
import HaggisValue from "../../values/HaggisValue";
import { OutputDevice } from "../IODevices";

export default <OutputDevice<HaggisValue>>{
  async send(value) {
    Haggis.log(value.toString().jsString() + "\n");
  },
};
