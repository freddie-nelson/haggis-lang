import { createInterface } from "readline";
import HaggisString from "../../values/HaggisString";
import { InputDevice } from "../IODevices";

const reader = createInterface({
  input: process.stdin,
});

export default <InputDevice<HaggisString>>{
  receive(): Promise<HaggisString> {
    reader.removeAllListeners("line");

    return new Promise((resolve) => {
      reader.on("line", (line) => {
        if (line === null) {
          resolve(new HaggisString(""));
        }

        resolve(new HaggisString(line));
      });
    });
  },
};
