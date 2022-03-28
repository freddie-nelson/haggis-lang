import HaggisString from "../values/HaggisString";
import HaggisValue from "../values/HaggisValue";

export interface InputDevice<T extends HaggisValue> {
  recieve(): Promise<T>;
}

export interface OutputDevice<T extends HaggisValue> {
  send(value: T): Promise<void>;
}

export interface FileHandler extends InputDevice<HaggisString>, OutputDevice<HaggisString> {
  create(value: HaggisString): Promise<void>;
  open(value: HaggisString): Promise<void>;
  close(value: HaggisString): Promise<void>;
}

export interface IODevices {
  [index: string]: InputDevice<HaggisValue> | OutputDevice<HaggisValue> | FileHandler;

  DISPLAY: OutputDevice<HaggisString>;
  KEYBOARD: InputDevice<HaggisString>;
  fileHandler: FileHandler;
}
