import { IODevices } from "../IODevices";
import display from "./display";
import fileHandler from "./fileHandler";
import keyboard from "./keyboard";

export default <IODevices>{
  DISPLAY: display,
  KEYBOARD: keyboard,
  fileHandler: fileHandler,
};
