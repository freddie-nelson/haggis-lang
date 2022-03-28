import { createInterface } from "readline";
import HaggisString from "../../values/HaggisString";
import { InputDevice } from "../IODevices";

const reader = createInterface({
  input: process.stdin,
});

export default <InputDevice<HaggisString>>{
  async recieve(): Promise<HaggisString> {
    const input: string = await new Promise((resolve) => {
      reader.on("line", (line) => {
        if (line === null) {
          resolve("");
        }

        resolve(line);
      });
    });

    return new HaggisString(input);
  },
};
