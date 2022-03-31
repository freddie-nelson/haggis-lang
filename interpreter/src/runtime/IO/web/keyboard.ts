import Haggis from "../../../Haggis";
import HaggisString from "../../values/HaggisString";
import { InputDevice } from "../IODevices";

export default <InputDevice<HaggisString>>{
  async receive(): Promise<HaggisString> {
    return new HaggisString(await Haggis.readline());
  },
};
