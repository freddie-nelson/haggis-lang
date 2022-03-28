import HaggisString from "../../values/HaggisString";
import { OutputDevice } from "../IODevices";

export default <OutputDevice<HaggisString>>{
  async send(value) {
    console.log(value.jsString());
  },
};
